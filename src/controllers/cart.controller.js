import { cartService } from '../config/dependencies.js';

export class CartController {
  async getById(req, res, next) {
    try {
      const { cid } = req.params;
      const cart = await cartService.getCartById(cid, req.user);
      return res.status(200).json({
        status: 'success',
        cart
      });
    } catch (error) {
      return next(error);
    }
  }

  async addProduct(req, res, next) {
    try {
      const { cid, pid } = req.params;
      const quantity = req.body.quantity !== undefined ? req.body.quantity : 1;
      const updatedCart = await cartService.addProductToCart(cid, req.user, pid, quantity);
      return res.status(200).json({
        status: 'success',
        message: 'Producto agregado al carrito exitosamente',
        cart: updatedCart
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateQuantity(req, res, next) {
    try {
      const { cid, pid } = req.params;
      const { quantity } = req.body;
      const updatedCart = await cartService.updateProductQuantity(cid, req.user, pid, quantity);
      return res.status(200).json({
        status: 'success',
        message: 'Cantidad de producto actualizada exitosamente',
        cart: updatedCart
      });
    } catch (error) {
      return next(error);
    }
  }

  async removeProduct(req, res, next) {
    try {
      const { cid, pid } = req.params;
      const updatedCart = await cartService.removeProductFromCart(cid, req.user, pid);
      return res.status(200).json({
        status: 'success',
        message: 'Producto eliminado del carrito exitosamente',
        cart: updatedCart
      });
    } catch (error) {
      return next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const { cid } = req.params;
      const updatedCart = await cartService.clearCart(cid, req.user);
      return res.status(200).json({
        status: 'success',
        message: 'Carrito vaciado exitosamente',
        cart: updatedCart
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const cartController = new CartController();
