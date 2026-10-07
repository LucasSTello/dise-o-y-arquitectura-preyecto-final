import { UserModel } from '../models/user.model.js';

export class UserDAO {
  async create(userData) {
    const user = new UserModel(userData);
    return user.save();
  }

  async findById(id, selectFields = '') {
    const query = UserModel.findById(id);
    if (selectFields) {
      query.select(selectFields);
    }
    return query.exec();
  }

  async findByEmail(email, selectFields = '') {
    const query = UserModel.findOne({ email: email.toLowerCase().trim() });
    if (selectFields) {
      query.select(selectFields);
    }
    return query.exec();
  }

  async findByResetTokenHash(tokenHash, selectFields = '') {
    const query = UserModel.findOne({ resetPasswordTokenHash: tokenHash });
    if (selectFields) {
      query.select(selectFields);
    }
    return query.exec();
  }

  async update(id, updateData) {
    return UserModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  async delete(id) {
    return UserModel.findByIdAndDelete(id).exec();
  }
}
