import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true, index: true })
  walletId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', default: null })
  destinationWalletId!: Types.ObjectId | null; // Used for transfers

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, index: true })
  categoryId!: Types.ObjectId | null;

  @Prop({ default: 'Uncategorized', trim: true })
  category!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ required: true, min: 0.01 })
  amount!: number;

  @Prop({ default: null, min: 0.01 })
  destinationAmount!: number | null;

  @Prop({ default: 1 })
  exchangeRate!: number;

  @Prop({ type: String, enum: TransactionType, required: true })
  type!: TransactionType;

  @Prop({ default: Date.now })
  transactionDate!: Date;

  @Prop({ default: '' })
  note!: string;

  @Prop({ type: String, default: null })
  receiptUrl!: string | null;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, transactionDate: -1 });
