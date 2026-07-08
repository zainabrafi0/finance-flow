import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(userData: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { hashedRefreshToken })
      .exec();
  }

  async updateProfile(
    userId: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      profilePictureUrl?: string | null;
      passwordHash?: string;
    },
  ): Promise<User | null> {
    const updatePayload: any = {};
    if (profileData.firstName !== undefined)
      updatePayload.firstName = profileData.firstName;
    if (profileData.lastName !== undefined)
      updatePayload.lastName = profileData.lastName;
    if (profileData.profilePictureUrl !== undefined)
      updatePayload.profilePictureUrl = profileData.profilePictureUrl;
    if (profileData.passwordHash !== undefined)
      updatePayload.passwordHash = profileData.passwordHash;

    return this.userModel
      .findByIdAndUpdate(userId, { $set: updatePayload }, { new: true })
      .exec();
  }
}
