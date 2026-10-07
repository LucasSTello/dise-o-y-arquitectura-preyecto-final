import mongoose from 'mongoose';

const ticketProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio']
    },
    title: {
      type: String,
      required: [true, 'El título del producto es obligatorio']
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1']
    },
    unit_price: {
      type: Number,
      required: [true, 'El precio unitario histórico es obligatorio'],
      min: [0, 'El precio unitario no puede ser negativo']
    },
    subtotal: {
      type: Number,
      required: [true, 'El subtotal es obligatorio'],
      min: [0, 'El subtotal no puede ser negativo']
    }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'El código del ticket es obligatorio'],
      unique: true
    },
    purchase_datetime: {
      type: Date,
      default: Date.now,
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'El monto total es obligatorio'],
      min: [0, 'El monto total no puede ser negativo']
    },
    purchaser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El comprador (purchaser) es obligatorio']
    },
    products: {
      type: [ticketProductSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Un ticket debe contener al menos un producto'
      }
    }
  },
  {
    timestamps: true
  }
);

ticketSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export const TicketModel = mongoose.model('Ticket', ticketSchema);
