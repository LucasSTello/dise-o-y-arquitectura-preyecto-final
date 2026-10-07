import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del producto es obligatorio'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'La descripción del producto es obligatoria'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'El código del producto es obligatorio'],
      unique: true,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'El precio del producto es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    status: {
      type: Boolean,
      default: true
    },
    stock: {
      type: Number,
      required: [true, 'El stock del producto es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock debe ser un número entero'
      }
    },
    category: {
      type: String,
      required: [true, 'La categoría del producto es obligatoria'],
      trim: true
    },
    thumbnails: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

export const ProductModel = mongoose.model('Product', productSchema);
