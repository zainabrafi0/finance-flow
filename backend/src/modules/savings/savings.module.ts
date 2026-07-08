import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
import {
  SavingsGoal,
  SavingsGoalSchema,
} from '../savings/schemas/savings-goal.schema'; // <-- Add Import
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavingsGoal.name, schema: SavingsGoalSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
})
export class SavingsModule {}
