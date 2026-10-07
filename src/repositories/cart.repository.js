export class CartRepository {
  constructor(cartDao) {
    this.cartDao = cartDao;
  }

  async createCart(cartData) {
    return this.cartDao.create(cartData);
  }

  async getCartById(id, populate = true) {
    return this.cartDao.findById(id, populate);
  }

  async getCartByUserId(userId, populate = true) {
    return this.cartDao.findByUserId(userId, populate);
  }

  async updateCart(id, updateData) {
    return this.cartDao.update(id, updateData);
  }

  async deleteCart(id) {
    return this.cartDao.delete(id);
  }
}
