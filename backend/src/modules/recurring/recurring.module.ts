import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringService } from './recurring.service';
import { RecurringProcessor } from './recurring.processor';
import {
  RecurringTransaction,
  RecurringTransactionSchema,
} from './schemas/recurring-transaction.schema';
import { Wallet, WalletSchema } from '../wallets/schemas/wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';

import { RecurringController } from './recurring.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringTransaction.name, schema: RecurringTransactionSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringProcessor],
})
export class RecurringModule {}
