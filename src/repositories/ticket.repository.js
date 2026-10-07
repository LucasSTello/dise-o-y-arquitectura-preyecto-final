export class TicketRepository {
  constructor(ticketDao) {
    this.ticketDao = ticketDao;
  }

  async createTicket(ticketData) {
    return this.ticketDao.create(ticketData);
  }

  async getTicketById(id) {
    return this.ticketDao.findById(id);
  }

  async getTicketByCode(code) {
    return this.ticketDao.findByCode(code);
  }

  async getTicketsByPurchaserId(purchaserId) {
    return this.ticketDao.findByPurchaserId(purchaserId);
  }

  async getAllTickets() {
    return this.ticketDao.findAll();
  }
}
