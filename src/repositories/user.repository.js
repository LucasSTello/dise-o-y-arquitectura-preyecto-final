export class UserRepository {
  constructor(userDao) {
    this.userDao = userDao;
  }

  async createUser(userData) {
    return this.userDao.create(userData);
  }

  async getUserById(id, selectFields = '') {
    return this.userDao.findById(id, selectFields);
  }

  async getUserByEmail(email, selectFields = '') {
    return this.userDao.findByEmail(email, selectFields);
  }

  async getUserByResetTokenHash(tokenHash, selectFields = '') {
    return this.userDao.findByResetTokenHash(tokenHash, selectFields);
  }

  async updateUser(id, updateData) {
    return this.userDao.update(id, updateData);
  }

  async deleteUser(id) {
    return this.userDao.delete(id);
  }
}
