import { ProductModel } from '../models/product.model.js';

export class ProductDAO {
  async findAll(filter = {}, options = {}) {
    const { limit = 10, page = 1, sort = {} } = options;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      ProductModel.countDocuments(filter).exec()
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findById(id) {
    return ProductModel.findById(id).exec();
  }

  async findByCode(code) {
    return ProductModel.findOne({ code }).exec();
  }

  async create(productData) {
    const product = new ProductModel(productData);
    return product.save();
  }

  async update(id, updateData) {
    return ProductModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  async delete(id) {
    return ProductModel.findByIdAndDelete(id).exec();
  }

  async decrementStockAtomic(id, quantity) {
    return ProductModel.findOneAndUpdate(
      {
        _id: id,
        stock: { $gte: quantity }
      },
      {
        $inc: { stock: -quantity }
      },
      {
        new: true
      }
    ).exec();
  }

  async incrementStockAtomic(id, quantity) {
    return ProductModel.findByIdAndUpdate(
      id,
      {
        $inc: { stock: quantity }
      },
      {
        new: true
      }
    ).exec();
  }
}
