import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RecurringTransaction } from './schemas/recurring-transaction.schema';
import { Wallet } from '../wallets/schemas/wallet.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';

@Injectable()
export class RecurringProcessor {
  private readonly logger = new Logger(RecurringProcessor.name);

  constructor(
    @InjectModel(RecurringTransaction.name)
    private recurringModel: Model<RecurringTransaction>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  // Runs every day at midnight to process due items
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Scanning for due recurring transactions...');
    const now = new Date();

    const dueItems = await this.recurringModel.find({
      nextRunDate: { $lte: now },
      isActive: true,
    });

    for (const item of dueItems) {
      try {
        const wallet = await this.walletModel.findById(item.walletId);
        if (!wallet) continue;

        // Apply business rules
        if (item.type === 'expense' && wallet.balance < item.amount) {
          this.logger.warn(
            `Skipping recurring item ${item._id}: Insufficient funds.`,
          );
          continue;
        }

        // Adjust wallet balance
        if (item.type === 'income') wallet.balance += item.amount;
        else wallet.balance -= item.amount;

        // Create the actual live transaction record
        const newTx = new this.transactionModel({
          userId: item.userId,
          walletId: item.walletId,
          type: item.type,
          amount: item.amount,
          category: item.category,
          description: `[Auto] ${item.description}`,
        });

        // Compute the next run date based on frequency
        const nextDate = new Date(item.nextRunDate);
        if (item.frequency === 'daily')
          nextDate.setDate(nextDate.getDate() + 1);
        else if (item.frequency === 'weekly')
          nextDate.setDate(nextDate.getDate() + 7);
        else if (item.frequency === 'monthly')
          nextDate.setMonth(nextDate.getMonth() + 1);

        item.nextRunDate = nextDate;

        await Promise.all([wallet.save(), newTx.save(), item.save()]);
        this.logger.log(
          `Successfully processed recurring transaction: ${item.description}`,
        );
      } catch (err) {
        this.logger.error(`Error processing recurring item ${item._id}`, err);
      }
    }
  }
}
