import { HttpError } from '../utils/httpError.js';

export class TicketService {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async getTicketById(ticketId, user) {
    const ticket = await this.ticketRepository.getTicketById(ticketId);
    if (!ticket) {
      throw new HttpError(404, `Ticket con id '${ticketId}' no encontrado`);
    }

    const purchaserId = ticket.purchaser._id ? ticket.purchaser._id.toString() : ticket.purchaser.toString();
    const currentUserId = user._id ? user._id.toString() : user.id;

    if (purchaserId !== currentUserId && user.role !== 'admin') {
      throw new HttpError(403, 'Acceso denegado: no puedes acceder a un ticket ajeno');
    }

    return ticket;
  }

  async getTicketsByPurchaser(userId) {
    return this.ticketRepository.getTicketsByPurchaserId(userId);
  }

  async getAllTickets() {
    return this.ticketRepository.getAllTickets();
  }
}
