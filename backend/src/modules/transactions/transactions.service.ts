import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionType } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Wallet } from '../wallets/schemas/wallet.schema';
import { User } from '../users/schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import 'multer';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private readonly ratesToPkr: Record<string, number> = {
    PKR: 1,
    USD: 278,
    EUR: 302,
    GBP: 352,
  };

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(User.name) private userModel: Model<User>,
    private cloudinaryService: CloudinaryService,
    private notificationsGateway: NotificationsGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private auditService: AuditService,
  ) {}

  // 1. Create a new transaction (Income, Expense, or Transfer)
  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    const userObjId = new Types.ObjectId(userId);
    const walletObjId = new Types.ObjectId(dto.walletId);

    // Verify wallet ownership and balance rules
    const wallet = await this.walletModel
      .findOne({ _id: walletObjId, userId: userObjId })
      .exec();
    if (!wallet)
      throw new NotFoundException('Source wallet not found or unauthorized.');

    if (dto.type === TransactionType.EXPENSE && wallet.balance < dto.amount) {
      throw new BadRequestException(
        'Cannot spend more than current wallet balance!',
      );
    }

    // Handle Transfer rules
    let destWallet: Wallet | null = null;
    let destinationAmount: number | null = null;
    let exchangeRate = 1;
    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.destinationWalletId)
        throw new BadRequestException(
          'Destination wallet is required for transfers.',
        );
      if (dto.walletId === dto.destinationWalletId)
        throw new BadRequestException('Cannot transfer to the same wallet.');

      destWallet = await this.walletModel
        .findOne({
          _id: new Types.ObjectId(dto.destinationWalletId),
          userId: userObjId,
        })
        .exec();
      if (!destWallet)
        throw new NotFoundException('Destination wallet not found.');
      if (wallet.balance < dto.amount)
        throw new BadRequestException('Insufficient balance for transfer.');

      const sourceRate = this.ratesToPkr[wallet.currency?.toUpperCase()] ?? 1;
      const destinationRate =
        this.ratesToPkr[destWallet.currency?.toUpperCase()] ?? 1;
      destinationAmount = Number(
        ((dto.amount * sourceRate) / destinationRate).toFixed(2),
      );
      exchangeRate = Number((destinationAmount / dto.amount).toFixed(6));
    }

    // Apply database balance updates automatically
    if (dto.type === TransactionType.INCOME) {
      wallet.balance += dto.amount;
    } else if (dto.type === TransactionType.EXPENSE) {
      wallet.balance -= dto.amount;
    } else if (dto.type === TransactionType.TRANSFER && destWallet) {
      wallet.balance -= dto.amount;
      destWallet.balance += destinationAmount ?? dto.amount;
      await destWallet.save();
    }
    await wallet.save();

    // Create Transaction Record
    const created = new this.transactionModel({
      userId: userObjId,
      walletId: walletObjId,
      destinationWalletId: dto.destinationWalletId
        ? new Types.ObjectId(dto.destinationWalletId)
        : null,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : null,
      category:
        dto.category ||
        (dto.type === TransactionType.TRANSFER ? 'Transfer' : 'Uncategorized'),
      description:
        dto.description ||
        dto.note ||
        (dto.type === TransactionType.TRANSFER
          ? 'Wallet-to-wallet transfer'
          : ''),
      amount: dto.amount,
      destinationAmount,
      exchangeRate,
      type: dto.type,
      transactionDate: dto.transactionDate
        ? new Date(dto.transactionDate)
        : new Date(),
      note: dto.note || dto.description || '',
    });

    const savedTx = await created.save();

    try {
      this.notificationsGateway.sendToUser(userId, 'balance_update', {
        walletId: wallet._id.toString(),
        newBalance: wallet.balance,
        transaction: savedTx,
      });

      if (dto.type === TransactionType.TRANSFER && destWallet) {
        this.notificationsGateway.sendToUser(userId, 'balance_update', {
          walletId: destWallet._id.toString(),
          newBalance: destWallet.balance,
          transaction: savedTx,
        });
      }
    } catch (wsErr) {
      this.logger.error('Failed to emit live balance update', wsErr);
    }

    try {
      if (dto.type === TransactionType.EXPENSE) {
        const txDate = dto.transactionDate
          ? new Date(dto.transactionDate)
          : new Date();
        const month = String(txDate.getMonth() + 1).padStart(2, '0');
        const year = txDate.getFullYear();

        const budget: any = await this.walletModel.db.model('Budget').findOne({
          userId: userObjId,
          category: dto.category,
          month,
          year,
        });

        if (budget) {
          const startDate = new Date(year, txDate.getMonth(), 1);
          const endDate = new Date(year, txDate.getMonth() + 1, 0, 23, 59, 59);

          const spentData = await this.transactionModel.aggregate([
            {
              $match: {
                userId: userObjId,
                type: 'expense',
                category: dto.category,
                transactionDate: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
              },
            },
          ]);

          const totalSpent = spentData[0]?.total || 0;
          const percent = (totalSpent / budget.limit) * 100;

          if (percent >= 100) {
            this.notificationsGateway.sendToUser(userId, 'budget_alert', {
              category: dto.category,
              limit: budget.limit,
              spent: totalSpent,
              message: `You have exceeded your monthly budget limit for ${dto.category}! (Spent ${totalSpent}/${budget.limit})`,
            });
          } else if (percent >= 80) {
            this.notificationsGateway.sendToUser(userId, 'budget_warning', {
              category: dto.category,
              limit: budget.limit,
              spent: totalSpent,
              message: `You have used ${Math.round(percent)}% of your monthly budget for ${dto.category}. (Spent ${totalSpent}/${budget.limit})`,
            });
          }
        }
      }
    } catch (budgetErr) {
      this.logger.error(
        'Failed to run budget alerts via WebSockets',
        budgetErr,
      );
    }

    await this.cacheManager.del(`dashboard_summary_${userId}`);
    await this.auditService.log({
      userId,
      action: 'transaction_create',
      details: `Created ${dto.type} transaction of ${dto.amount} in category ${dto.category || 'Transfer'}`,
    });
    return savedTx;
  }

  // 2. Get all transactions with optional filtering and pagination
  async findAllByUser(
    userId: string,
    query: {
      walletId?: string;
      categoryId?: string;
      category?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      skip?: number;
      limit?: number;
    },
  ) {
    const filter: any = { userId: new Types.ObjectId(userId) };

    // UPDATED: Check if the walletId matches either the sender (walletId) or the receiver (destinationWalletId)
    if (query.walletId) {
      const walletObjId = new Types.ObjectId(query.walletId);
      filter.$or = [
        { walletId: walletObjId },
        { destinationWalletId: walletObjId },
      ];
    }

    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.startDate || query.endDate) {
      filter.transactionDate = {};
      if (query.startDate) {
        const start = query.startDate.includes('T')
          ? query.startDate
          : `${query.startDate}T00:00:00.000Z`;
        filter.transactionDate.$gte = new Date(start);
      }
      if (query.endDate) {
        const end = query.endDate.includes('T')
          ? query.endDate
          : `${query.endDate}T23:59:59.999Z`;
        filter.transactionDate.$lte = new Date(end);
      }
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { description: searchRegex },
            { note: searchRegex },
            { category: searchRegex },
          ],
        },
      ];
    }

    const skip = query.skip ? Number(query.skip) : 0;
    const limit = query.limit ? Number(query.limit) : 20;

    const data = await this.transactionModel
      .find(filter)
      .sort({ transactionDate: -1 })
      .populate('walletId', 'name currency')
      .populate('destinationWalletId', 'name currency')
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.transactionModel.countDocuments(filter).exec();
    return { data, total, skip, limit };
  }

  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found.');

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches)
      throw new BadRequestException('Password confirmation failed.');

    const transaction = await this.transactionModel
      .findOne({
        _id: new Types.ObjectId(transactionId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!transaction) throw new NotFoundException('Transaction not found.');

    if (dto.category) transaction.category = dto.category;
    if (dto.description) {
      transaction.description = dto.description;
      transaction.note = dto.description;
    }

    await this.cacheManager.del(`dashboard_summary_${userId}`);
    return await transaction.save();
  }

  async remove(
    userId: string,
    transactionId: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found.');

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches)
      throw new BadRequestException('Password confirmation failed.');

    const transaction = await this.transactionModel
      .findOne({
        _id: new Types.ObjectId(transactionId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!transaction) throw new NotFoundException('Transaction not found.');

    const wallet = await this.walletModel
      .findOne({
        _id: transaction.walletId,
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (wallet) {
      if (transaction.type === TransactionType.INCOME)
        wallet.balance -= transaction.amount;
      if (transaction.type === TransactionType.EXPENSE)
        wallet.balance += transaction.amount;
      if (transaction.type === TransactionType.TRANSFER)
        wallet.balance += transaction.amount;
      await wallet.save();
    }

    if (
      transaction.type === TransactionType.TRANSFER &&
      transaction.destinationWalletId
    ) {
      const destinationWallet = await this.walletModel
        .findOne({
          _id: transaction.destinationWalletId,
          userId: new Types.ObjectId(userId),
        })
        .exec();
      if (destinationWallet) {
        destinationWallet.balance -=
          transaction.destinationAmount ?? transaction.amount;
        await destinationWallet.save();
      }
    }

    await transaction.deleteOne();
    await this.cacheManager.del(`dashboard_summary_${userId}`);
    await this.auditService.log({
      userId,
      action: 'transaction_delete',
      details: `Deleted transaction: ${transaction.description || 'Wallet transfer'} of ${transaction.amount} PKR`,
    });
    return { message: 'Transaction deleted successfully.' };
  }

  // 3. Upload a receipt image and link it to the transaction
  async uploadReceipt(
    userId: string,
    transactionId: string,
    file: Express.Multer.File,
  ): Promise<Transaction> {
    // Verify the transaction exists and belongs to the user
    const transaction = await this.transactionModel
      .findOne({
        _id: new Types.ObjectId(transactionId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found or unauthorized.');
    }

    // Upload the file to Cloudinary
    const uploadResult = await this.cloudinaryService
      .uploadFile(file)
      .catch(() => {
        throw new BadRequestException('Failed to upload image file.');
      });

    // Save the secure URL back to the database
    transaction.receiptUrl = uploadResult.secure_url;
    return await transaction.save();
  }
}
