import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RecurringTransaction } from './schemas/recurring-transaction.schema';
import { Wallet } from '../wallets/schemas/wallet.schema';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

@Injectable()
export class RecurringService {
  constructor(
    @InjectModel(RecurringTransaction.name)
    private recurringModel: Model<RecurringTransaction>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
  ) {}

  async create(
    userId: string,
    dto: CreateRecurringDto,
  ): Promise<RecurringTransaction> {
    const wallet = await this.walletModel.findOne({
      _id: new Types.ObjectId(dto.walletId),
      userId: new Types.ObjectId(userId),
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    const created = new this.recurringModel({
      userId: new Types.ObjectId(userId),
      walletId: new Types.ObjectId(dto.walletId),
      type: dto.type,
      amount: dto.amount,
      category: dto.category,
      description: dto.description,
      frequency: dto.frequency,
      nextRunDate: new Date(dto.nextRunDate),
      isActive: true,
    });

    return created.save();
  }

  async findAll(userId: string): Promise<RecurringTransaction[]> {
    return this.recurringModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('walletId', 'name currency')
      .exec();
  }

  async findOne(userId: string, id: string): Promise<RecurringTransaction> {
    const item = await this.recurringModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .populate('walletId', 'name currency')
      .exec();
    if (!item) {
      throw new NotFoundException('Recurring transaction not found.');
    }
    return item;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecurringDto,
  ): Promise<RecurringTransaction> {
    const item = await this.recurringModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!item) {
      throw new NotFoundException('Recurring transaction not found.');
    }

    if (dto.walletId) {
      const wallet = await this.walletModel.findOne({
        _id: new Types.ObjectId(dto.walletId),
        userId: new Types.ObjectId(userId),
      });
      if (!wallet) {
        throw new NotFoundException('Wallet not found.');
      }
      item.walletId = new Types.ObjectId(dto.walletId);
    }

    if (dto.type) item.type = dto.type;
    if (dto.amount !== undefined) item.amount = dto.amount;
    if (dto.category) item.category = dto.category;
    if (dto.description) item.description = dto.description;
    if (dto.frequency) item.frequency = dto.frequency;
    if (dto.nextRunDate) item.nextRunDate = new Date(dto.nextRunDate);
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    return item.save();
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.recurringModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Recurring transaction not found.');
    }
  }
}
