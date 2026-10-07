import { TicketModel } from '../models/ticket.model.js';

export class TicketDAO {
  async create(ticketData) {
    const ticket = new TicketModel(ticketData);
    return ticket.save();
  }

  async findById(id) {
    return TicketModel.findById(id).populate('purchaser', 'first_name last_name email').exec();
  }

  async findByCode(code) {
    return TicketModel.findOne({ code }).populate('purchaser', 'first_name last_name email').exec();
  }

  async findByPurchaserId(purchaserId) {
    return TicketModel.find({ purchaser: purchaserId }).sort({ purchase_datetime: -1 }).exec();
  }

  async findAll() {
    return TicketModel.find().sort({ purchase_datetime: -1 }).populate('purchaser', 'first_name last_name email').exec();
  }
}
