import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BOTH = 'both',
}

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId!: Types.ObjectId | null; // Null means system default category, custom if userId present

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: CategoryType, default: CategoryType.EXPENSE })
  type!: CategoryType;

  @Prop({ default: 'tag' })
  icon!: string;

  @Prop({ default: '#3B82F6' })
  color!: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
