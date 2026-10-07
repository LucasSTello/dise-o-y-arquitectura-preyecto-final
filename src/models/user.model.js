import mongoose from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password.js';

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    last_name: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El formato del correo electrónico no es válido']
    },
    age: {
      type: Number,
      required: [true, 'La edad es obligatoria'],
      min: [18, 'La edad mínima requerida es 18 años'],
      validate: {
        validator: Number.isInteger,
        message: 'La edad debe ser un número entero'
      }
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'El rol debe ser user o admin'
      },
      default: 'user'
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart'
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
      default: null
    },
    resetPasswordUsedAt: {
      type: Date,
      select: false,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return comparePassword(candidatePassword, this.password);
};

const sanitizeUser = (doc, ret) => {
  delete ret.password;
  delete ret.resetPasswordTokenHash;
  delete ret.resetPasswordExpiresAt;
  delete ret.resetPasswordUsedAt;
  delete ret.__v;
  return ret;
};

userSchema.set('toJSON', { transform: sanitizeUser });
userSchema.set('toObject', { transform: sanitizeUser });

export const UserModel = mongoose.model('User', userSchema);
