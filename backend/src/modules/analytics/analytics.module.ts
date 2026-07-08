import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

// Import Schemas from other modules
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';
import { Budget, BudgetSchema } from '../budgets/schemas/budget.schema';
import {
  SavingsGoal,
  SavingsGoalSchema,
} from '../savings/schemas/savings-goal.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Budget.name, schema: BudgetSchema },
      { name: SavingsGoal.name, schema: SavingsGoalSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
