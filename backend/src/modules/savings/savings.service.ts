import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SavingsGoal } from './schemas/savings-goal.schema';
import { Wallet } from '../wallets/schemas/wallet.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { AddFundsDto } from './dto/add-funds.dto';

@Injectable()
export class SavingsService {
  constructor(
    @InjectModel(SavingsGoal.name) private goalModel: Model<SavingsGoal>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    const goal = new this.goalModel({
      ...createGoalDto,
      userId: new Types.ObjectId(userId),
    });
    return goal.save();
  }

  async findAll(userId: string) {
    return this.goalModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  // The critical double-entry logic
  async addFunds(userId: string, goalId: string, addFundsDto: AddFundsDto) {
    const { walletId, amount } = addFundsDto;

    // 1. Verify Wallet and Balance
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount)
      throw new BadRequestException(
        'Insufficient funds in the selected wallet',
      );

    // 2. Verify Goal
    const goal = await this.goalModel.findOne({
      _id: new Types.ObjectId(goalId),
      userId: new Types.ObjectId(userId),
    });
    if (!goal) throw new NotFoundException('Savings goal not found');

    // 3. Execute the Transaction (Deduct from Wallet, Add to Goal, Log Ledger)
    wallet.balance -= amount;
    goal.currentAmount += amount;
    if (goal.currentAmount >= goal.targetAmount) goal.status = 'completed';

    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      walletId: wallet._id,
      type: 'expense', // It leaves the liquid wallet
      amount: amount,
      category: 'Savings',
      description: `Deposit to Goal: ${goal.name}`,
    });

    // Save all changes
    await Promise.all([wallet.save(), goal.save(), transaction.save()]);

    return goal;
  }
}
