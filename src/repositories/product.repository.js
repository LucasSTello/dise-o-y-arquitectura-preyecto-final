export class ProductRepository {
  constructor(productDao) {
    this.productDao = productDao;
  }

  async getAllProducts(filter = {}, options = {}) {
    return this.productDao.findAll(filter, options);
  }

  async getProductById(id) {
    return this.productDao.findById(id);
  }

  async getProductByCode(code) {
    return this.productDao.findByCode(code);
  }

  async createProduct(productData) {
    return this.productDao.create(productData);
  }

  async updateProduct(id, updateData) {
    return this.productDao.update(id, updateData);
  }

  async deleteProduct(id) {
    return this.productDao.delete(id);
  }

  async decrementStockAtomic(id, quantity) {
    return this.productDao.decrementStockAtomic(id, quantity);
  }

  async incrementStockAtomic(id, quantity) {
    return this.productDao.incrementStockAtomic(id, quantity);
  }
}
