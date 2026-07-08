import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  async log(data: {
    userId: string;
    action: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const logEntry = new this.auditLogModel({
      userId: new Types.ObjectId(data.userId),
      action: data.action,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
    return logEntry.save();
  }

  async findAllByUser(userId: string, limit = 50, skip = 0) {
    const [data, total] = await Promise.all([
      this.auditLogModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      this.auditLogModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
    ]);

    return { data, total, limit, skip };
  }
}
