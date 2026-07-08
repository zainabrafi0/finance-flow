import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SavingsGoal extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  targetAmount!: number;

  @Prop({ default: 0, min: 0 })
  currentAmount!: number;

  @Prop({ required: true })
  targetDate!: Date;

  @Prop({ default: 'active', enum: ['active', 'completed'] })
  status!: string;
}

export const SavingsGoalSchema = SchemaFactory.createForClass(SavingsGoal);
