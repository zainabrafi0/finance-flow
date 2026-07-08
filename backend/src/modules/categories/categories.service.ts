import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    try {
      const created = new this.categoryModel({
        ...dto,
        userId: new Types.ObjectId(userId),
      });
      return await created.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Category with this name already exists.');
      }
      throw error;
    }
  }

  async findAllAccessible(userId: string): Promise<Category[]> {
    return this.categoryModel
      .find({
        $or: [{ userId: null }, { userId: new Types.ObjectId(userId) }],
      })
      .exec();
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.categoryModel
      .findOne({
        _id: new Types.ObjectId(id),
        $or: [{ userId: null }, { userId: new Types.ObjectId(userId) }],
      })
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found or inaccessible.');
    }
    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const updated = await this.categoryModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
        { $set: dto },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        'Category not found or you lack permission to edit it.',
      );
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const res = await this.categoryModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (res.deletedCount === 0) {
      throw new NotFoundException('Category not found or cannot be deleted.');
    }
    return { message: 'Category removed successfully' };
  }
}
