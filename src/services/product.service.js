import { HttpError } from '../utils/httpError.js';

export class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async getAllProducts(query = {}) {
    const { limit = 10, page = 1, sort, category, status } = query;

    const filter = {};
    if (category) {
      filter.category = category;
    }
    if (status !== undefined) {
      filter.status = status === 'true' || status === true;
    }

    const sortOptions = {};
    if (sort === 'asc') {
      sortOptions.price = 1;
    } else if (sort === 'desc') {
      sortOptions.price = -1;
    }

    const options = {
      limit: Math.max(1, parseInt(limit, 10) || 10),
      page: Math.max(1, parseInt(page, 10) || 1),
      sort: sortOptions
    };

    return this.productRepository.getAllProducts(filter, options);
  }

  async getProductById(id) {
    const product = await this.productRepository.getProductById(id);
    if (!product) {
      throw new HttpError(404, `Producto con id '${id}' no encontrado`);
    }
    return product;
  }

  async createProduct(productData) {
    const existing = await this.productRepository.getProductByCode(productData.code);
    if (existing) {
      throw new HttpError(409, `Ya existe un producto con el código '${productData.code}'`);
    }

    return this.productRepository.createProduct(productData);
  }

  async updateProduct(id, updateData) {
    const existing = await this.productRepository.getProductById(id);
    if (!existing) {
      throw new HttpError(404, `Producto con id '${id}' no encontrado`);
    }

    if (updateData.code && updateData.code !== existing.code) {
      const duplicate = await this.productRepository.getProductByCode(updateData.code);
      if (duplicate) {
        throw new HttpError(409, `Ya existe un producto con el código '${updateData.code}'`);
      }
    }

    return this.productRepository.updateProduct(id, updateData);
  }

  async deleteProduct(id) {
    const existing = await this.productRepository.getProductById(id);
    if (!existing) {
      throw new HttpError(404, `Producto con id '${id}' no encontrado`);
    }

    return this.productRepository.deleteProduct(id);
  }
}
