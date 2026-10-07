import { HttpError } from '../utils/httpError.js';

export class CartService {
  constructor(cartRepository, productRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  validateOwnership(cart, user) {
    const ownerId = cart.user._id ? cart.user._id.toString() : cart.user.toString();
    const requestUserId = user._id ? user._id.toString() : user.id;

    if (ownerId !== requestUserId && user.role !== 'admin') {
      throw new HttpError(403, 'Acceso denegado: no puedes interactuar con el carrito de otro usuario');
    }
  }

  async getCartById(cartId, user) {
    const cart = await this.cartRepository.getCartById(cartId);
    if (!cart) {
      throw new HttpError(404, `Carrito con id '${cartId}' no encontrado`);
    }

    this.validateOwnership(cart, user);
    return cart;
  }

  async addProductToCart(cartId, user, productId, quantity = 1) {
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new HttpError(400, 'La cantidad debe ser un número entero mayor a cero');
    }

    const cart = await this.cartRepository.getCartById(cartId, false);
    if (!cart) {
      throw new HttpError(404, `Carrito con id '${cartId}' no encontrado`);
    }

    this.validateOwnership(cart, user);

    const product = await this.productRepository.getProductById(productId);
    if (!product) {
      throw new HttpError(404, `Producto con id '${productId}' no encontrado`);
    }

    if (!product.status) {
      throw new HttpError(400, 'El producto no se encuentra disponible para la venta');
    }

    const existingItemIndex = cart.products.findIndex(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()) === productId.toString()
    );

    if (existingItemIndex >= 0) {
      cart.products[existingItemIndex].quantity += parsedQuantity;
    } else {
      cart.products.push({
        product: productId,
        quantity: parsedQuantity
      });
    }

    await cart.save();
    return this.cartRepository.getCartById(cartId, true);
  }

  async updateProductQuantity(cartId, user, productId, quantity) {
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new HttpError(400, 'La cantidad debe ser un número entero mayor a cero');
    }

    const cart = await this.cartRepository.getCartById(cartId, false);
    if (!cart) {
      throw new HttpError(404, `Carrito con id '${cartId}' no encontrado`);
    }

    this.validateOwnership(cart, user);

    const existingItemIndex = cart.products.findIndex(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()) === productId.toString()
    );

    if (existingItemIndex === -1) {
      throw new HttpError(404, 'El producto no existe dentro del carrito');
    }

    cart.products[existingItemIndex].quantity = parsedQuantity;
    await cart.save();

    return this.cartRepository.getCartById(cartId, true);
  }

  async removeProductFromCart(cartId, user, productId) {
    const cart = await this.cartRepository.getCartById(cartId, false);
    if (!cart) {
      throw new HttpError(404, `Carrito con id '${cartId}' no encontrado`);
    }

    this.validateOwnership(cart, user);

    const initialLength = cart.products.length;
    cart.products = cart.products.filter(
      (item) => (item.product._id ? item.product._id.toString() : item.product.toString()) !== productId.toString()
    );

    if (cart.products.length === initialLength) {
      throw new HttpError(404, 'El producto a eliminar no existe en el carrito');
    }

    await cart.save();
    return this.cartRepository.getCartById(cartId, true);
  }

  async clearCart(cartId, user) {
    const cart = await this.cartRepository.getCartById(cartId, false);
    if (!cart) {
      throw new HttpError(404, `Carrito con id '${cartId}' no encontrado`);
    }

    this.validateOwnership(cart, user);

    cart.products = [];
    await cart.save();

    return this.cartRepository.getCartById(cartId, true);
  }
}
