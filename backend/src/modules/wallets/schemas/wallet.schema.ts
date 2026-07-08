import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 0 })
  balance!: number;

  @Prop({ default: 'USD', uppercase: true, minlength: 3, maxlength: 3 })
  currency!: string;

  @Prop({ type: String, default: 'Cash' })
  walletType?: string;

  @Prop({ type: String })
  accountSubType?: string;

  @Prop({ type: String })
  bankName?: string;

  @Prop({ type: String })
  accountNumber?: string;

  @Prop({ type: Number, default: 0 })
  creditLimit?: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Compound index to ensure a user cannot have two wallets with the exact same name
WalletSchema.index({ userId: 1, name: 1 }, { unique: true });
