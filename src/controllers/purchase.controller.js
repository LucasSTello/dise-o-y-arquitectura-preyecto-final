import { purchaseService } from '../config/dependencies.js';

export class PurchaseController {
  async purchaseCart(req, res, next) {
    try {
      const { cid } = req.params;
      const result = await purchaseService.processPurchase(cid, req.user);
      return res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const purchaseController = new PurchaseController();
