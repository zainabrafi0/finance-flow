import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<Wallet>) {}

  async create(
    userId: string,
    createWalletDto: CreateWalletDto,
  ): Promise<Wallet> {
    try {
      const createdWallet = new this.walletModel({
        ...createWalletDto,
        userId: new Types.ObjectId(userId),
      });
      return await createdWallet.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(
          'You already have a wallet with this name.',
        );
      }
      throw error;
    }
  }

  async findAllByUser(userId: string): Promise<Wallet[]> {
    return this.walletModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(userId: string, walletId: string): Promise<Wallet> {
    const wallet = await this.walletModel
      .findOne({
        _id: new Types.ObjectId(walletId),
        userId: new Types.ObjectId(userId), // Security check: must belong to user
      })
      .exec();

    if (!wallet) {
      throw new NotFoundException(`Wallet not found or does not belong to you`);
    }
    return wallet;
  }

  async update(
    userId: string,
    walletId: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<Wallet> {
    const updatedWallet = await this.walletModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(walletId),
          userId: new Types.ObjectId(userId),
        },
        { $set: updateWalletDto },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updatedWallet) {
      throw new NotFoundException(`Wallet not found or does not belong to you`);
    }
    return updatedWallet;
  }

  async remove(userId: string, walletId: string): Promise<{ message: string }> {
    const result = await this.walletModel
      .deleteOne({
        _id: new Types.ObjectId(walletId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Wallet not found or does not belong to you`);
    }

    return { message: 'Wallet deleted successfully' };
  }
}
