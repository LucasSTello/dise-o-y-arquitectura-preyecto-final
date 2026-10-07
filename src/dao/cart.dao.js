import { CartModel } from '../models/cart.model.js';

export class CartDAO {
  async create(cartData) {
    const cart = new CartModel(cartData);
    return cart.save();
  }

  async findById(id, populate = true) {
    const query = CartModel.findById(id);
    if (populate) {
      query.populate('products.product');
    }
    return query.exec();
  }

  async findByUserId(userId, populate = true) {
    const query = CartModel.findOne({ user: userId });
    if (populate) {
      query.populate('products.product');
    }
    return query.exec();
  }

  async update(id, updateData) {
    return CartModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('products.product')
      .exec();
  }

  async delete(id) {
    return CartModel.findByIdAndDelete(id).exec();
  }
}
