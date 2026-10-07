import { HttpError } from '../utils/httpError.js';
import { generateTicketCode } from '../utils/code-generator.js';

export class PurchaseService {
  constructor(cartRepository, productRepository, ticketRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
    this.ticketRepository = ticketRepository;
  }

  async processPurchase(cartId, user) {
    const cart = await this.cartRepository.getCartById(cartId, false);
    if (!cart) {
      throw new HttpError(404, `Carrito con id '${cartId}' no encontrado`);
    }

    const ownerId = cart.user._id ? cart.user._id.toString() : cart.user.toString();
    const requestUserId = user._id ? user._id.toString() : user.id;

    if (ownerId !== requestUserId && user.role !== 'admin') {
      throw new HttpError(403, 'Acceso denegado: este carrito no te pertenece');
    }

    if (!cart.products || cart.products.length === 0) {
      throw new HttpError(400, 'El carrito está vacío, no se puede realizar la compra');
    }

    const purchasedProducts = [];
    const rejectedProducts = [];
    const remainingInCart = [];

    for (const item of cart.products) {
      const productId = item.product._id ? item.product._id.toString() : item.product.toString();
      const quantity = item.quantity;

      const realProduct = await this.productRepository.getProductById(productId);

      if (!realProduct || !realProduct.status) {
        rejectedProducts.push({
          product: productId,
          title: realProduct?.title || 'Producto desconocido',
          requestedQuantity: quantity,
          reason: !realProduct ? 'Producto no encontrado' : 'Producto inactivo para la venta'
        });
        remainingInCart.push(item);
        continue;
      }

      if (realProduct.stock < quantity) {
        rejectedProducts.push({
          product: productId,
          title: realProduct.title,
          requestedQuantity: quantity,
          availableStock: realProduct.stock,
          reason: 'Stock insuficiente'
        });
        remainingInCart.push(item);
        continue;
      }

      // Descuento atómico de stock: { _id: productId, stock: { $gte: quantity } }
      const updatedProduct = await this.productRepository.decrementStockAtomic(productId, quantity);

      if (!updatedProduct) {
        rejectedProducts.push({
          product: productId,
          title: realProduct.title,
          requestedQuantity: quantity,
          reason: 'Stock insuficiente durante la operación de compra concurrente'
        });
        remainingInCart.push(item);
        continue;
      }

      const unitPrice = updatedProduct.price;
      const subtotal = unitPrice * quantity;

      purchasedProducts.push({
        product: updatedProduct._id,
        title: updatedProduct.title,
        quantity,
        unit_price: unitPrice,
        subtotal
      });
    }

    // Si ningún producto pudo ser comprado: devolver HTTP 409 y conservar el carrito intacto
    if (purchasedProducts.length === 0) {
      throw new HttpError(
        409,
        'No se pudo completar la compra: ningún producto cuenta con stock suficiente',
        { rejected: rejectedProducts }
      );
    }

    // Calcular total acumulado de los productos comprados
    const amount = purchasedProducts.reduce((acc, curr) => acc + curr.subtotal, 0);

    // Generar código y persistir el Ticket
    const ticketCode = generateTicketCode();
    const ticket = await this.ticketRepository.createTicket({
      code: ticketCode,
      purchase_datetime: new Date(),
      amount,
      purchaser: user._id,
      products: purchasedProducts
    });

    // Actualizar el carrito: solo conserva los productos rechazados
    cart.products = remainingInCart;
    await cart.save();

    const isComplete = rejectedProducts.length === 0;

    return {
      status: isComplete ? 'complete' : 'partial',
      message: isComplete
        ? 'Compra completada exitosamente'
        : 'Compra parcial completada. Algunos productos sin stock suficiente permanecen en tu carrito.',
      ticket: {
        id: ticket._id,
        code: ticket.code,
        purchase_datetime: ticket.purchase_datetime,
        amount: ticket.amount,
        purchaser: ticket.purchaser,
        products: ticket.products
      },
      purchased: purchasedProducts,
      rejected: rejectedProducts,
      total: ticket.amount,
      code: ticket.code
    };
  }
}
