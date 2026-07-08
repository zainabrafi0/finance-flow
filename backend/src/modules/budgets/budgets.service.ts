import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { Transaction } from '../transactions/schemas/transaction.schema';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async createOrUpdate(
    userId: string,
    createBudgetDto: CreateBudgetDto,
  ): Promise<Budget> {
    const { category, month, year, limit } = createBudgetDto;

    const budget = await this.budgetModel.create({
      userId: new Types.ObjectId(userId),
      category,
      month,
      year,
      limit,
    });
    return budget;
  }

  // This function powers the UI you requested!
  async getBudgetProgress(userId: string, month: string, year: number) {
    const budgets = await this.budgetModel.find({
      userId: new Types.ObjectId(userId),
      month,
      year,
    });

    // Construct date boundaries for the given month
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0, 23, 59, 59);

    // Aggregate transactions to calculate how much was actually spent
    const spentData = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          type: 'expense',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    // Map the aggregation back to a simple key-value object
    const spentMap = spentData.reduce((acc, curr) => {
      acc[curr._id] = curr.totalSpent;
      return acc;
    }, {});

    // Calculate totals and format for the frontend
    let totalBudget = 0;
    let totalSpent = 0;

    const categoryBudgets = budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      totalBudget += b.limit;
      totalSpent += spent;

      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        spent: spent,
        utilizationPercentage: b.limit > 0 ? (spent / b.limit) * 100 : 0,
      };
    });

    return {
      overview: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        totalUtilization:
          totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      },
      categories: categoryBudgets,
    };
  }

  async deleteBudget(userId: string, budgetId: string): Promise<any> {
    const result = await this.budgetModel.deleteOne({
      _id: new Types.ObjectId(budgetId),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Budget not found');
    }
    return { success: true };
  }
}
