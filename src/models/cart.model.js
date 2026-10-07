import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'La referencia al producto es obligatoria']
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad mínima es 1'],
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un número entero'
      }
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario propietario del carrito es obligatorio'],
      unique: true
    },
    products: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

cartSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export const CartModel = mongoose.model('Cart', cartSchema);
