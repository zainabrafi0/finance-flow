import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Budget extends Document {
  // We explicitly type this as Types.ObjectId for TypeScript
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  category!: string;

  @Prop({ required: true, min: 0 })
  limit!: number;

  @Prop({ required: true })
  month!: string; // e.g., '10' for October

  @Prop({ required: true })
  year!: number; // e.g., 2023
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
BudgetSchema.index(
  { userId: 1, category: 1, month: 1, year: 1 }
);
