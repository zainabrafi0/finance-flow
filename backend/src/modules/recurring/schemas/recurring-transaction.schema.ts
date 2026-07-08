import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RecurringTransaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId: Types.ObjectId;

  @Prop({ required: true })
  type: string; // 'income' or 'expense'

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'] })
  frequency: string;

  @Prop({ required: true })
  nextRunDate: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const RecurringTransactionSchema =
  SchemaFactory.createForClass(RecurringTransaction);
