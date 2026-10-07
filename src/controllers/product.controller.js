import { productService } from '../config/dependencies.js';

export class ProductController {
  async getAll(req, res, next) {
    try {
      const result = await productService.getAllProducts(req.query);
      return res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      return res.status(200).json({
        status: 'success',
        product
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newProduct = await productService.createProduct(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Producto creado exitosamente',
        product: newProduct
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedProduct = await productService.updateProduct(id, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Producto actualizado exitosamente',
        product: updatedProduct
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      return res.status(200).json({
        status: 'success',
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const productController = new ProductController();
