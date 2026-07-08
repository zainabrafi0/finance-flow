import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet } from '../wallets/schemas/wallet.schema';
import {
  Transaction,
  TransactionType,
} from '../transactions/schemas/transaction.schema';
import { Budget } from '../budgets/schemas/budget.schema';
import { SavingsGoal } from '../savings/schemas/savings-goal.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AnalyticsService {
  private readonly ratesToPkr: Record<string, number> = {
    PKR: 1,
    USD: 278,
    EUR: 302,
    GBP: 352,
  };

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
    @InjectModel(SavingsGoal.name) private savingsGoalModel: Model<SavingsGoal>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async clearDashboardCache(userId: string) {
    const cacheKey = `dashboard_summary_${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  async getDashboardSummary(userId: string) {
    const cacheKey = `dashboard_summary_${userId}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const userObjectId = new Types.ObjectId(userId);

    // Calculate start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    // 1. Get Total Balance across all wallets
    const wallets = await this.walletModel
      .find({ userId: userObjectId })
      .exec();
    const walletCurrencyMap = new Map(
      wallets.map((wallet) => [
        wallet._id.toString(),
        wallet.currency?.toUpperCase() || 'PKR',
      ]),
    );
    const totalBalance = wallets.reduce(
      (sum, wallet) =>
        sum +
        wallet.balance * (this.ratesToPkr[wallet.currency?.toUpperCase()] ?? 1),
      0,
    );

    // 2. Get Income & Expenses for the current month in the standard PKR currency
    const monthlyTransactions = await this.transactionModel
      .find({
        userId: userObjectId,
        transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
        type: { $in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      })
      .exec();

    const income = monthlyTransactions
      .filter((transaction) => transaction.type === TransactionType.INCOME)
      .reduce((sum, transaction) => {
        const currency =
          walletCurrencyMap.get(transaction.walletId.toString()) || 'PKR';
        return sum + transaction.amount * (this.ratesToPkr[currency] ?? 1);
      }, 0);
    const expense = monthlyTransactions
      .filter((transaction) => transaction.type === TransactionType.EXPENSE)
      .reduce((sum, transaction) => {
        const currency =
          walletCurrencyMap.get(transaction.walletId.toString()) || 'PKR';
        return sum + transaction.amount * (this.ratesToPkr[currency] ?? 1);
      }, 0);

    // 3. Get Top 5 Recent Transactions
    const recentTransactions = await this.transactionModel
      .find({ userId: userObjectId })
      .sort({ transactionDate: -1 })
      .limit(5)
      .populate('categoryId', 'name icon color')
      .populate('walletId', 'name currency')
      .exec();

    // 4. Get active Budgets for the current month
    const activeBudgets = await this.budgetModel
      .find({ userId: userObjectId, month, year })
      .exec();
    const monthlyExpenses = monthlyTransactions.filter(
      (transaction) => transaction.type === TransactionType.EXPENSE,
    );
    const activeBudgetsWithSpent = activeBudgets.map((budget) => {
      const spent = monthlyExpenses
        .filter((transaction) => transaction.category === budget.category)
        .reduce((sum, transaction) => {
          const currency =
            walletCurrencyMap.get(transaction.walletId.toString()) || 'PKR';
          return sum + transaction.amount * (this.ratesToPkr[currency] ?? 1);
        }, 0);

      return {
        ...budget.toObject(),
        spent,
        utilizationPercentage:
          budget.limit > 0 ? (spent / budget.limit) * 100 : 0,
      };
    });

    // 5. Get top 3 Savings Goals closest to completion
    const savingsGoals = await this.savingsGoalModel
      .aggregate([
        { $match: { userId: userObjectId } },
        {
          $addFields: {
            completionPercentage: {
              $cond: [
                { $eq: ['$targetAmount', 0] },
                0,
                {
                  $multiply: [
                    { $divide: ['$currentAmount', '$targetAmount'] },
                    100,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { completionPercentage: -1 } },
        { $limit: 3 },
      ])
      .exec();

    const result = {
      overview: {
        totalBalance,
        monthlyIncome: income,
        monthlyExpense: expense,
      },
      recentTransactions,
      activeBudgets: activeBudgetsWithSpent,
      savingsGoals,
    };

    await this.cacheManager.set(cacheKey, result, 60000);

    return result;
  }
}
