import { ticketService } from '../config/dependencies.js';

export class TicketController {
  async getMyTickets(req, res, next) {
    try {
      const tickets = await ticketService.getTicketsByPurchaser(req.user._id);
      return res.status(200).json({
        status: 'success',
        tickets
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await ticketService.getTicketById(id, req.user);
      return res.status(200).json({
        status: 'success',
        ticket
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const tickets = await ticketService.getAllTickets();
      return res.status(200).json({
        status: 'success',
        tickets
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const ticketController = new TicketController();
