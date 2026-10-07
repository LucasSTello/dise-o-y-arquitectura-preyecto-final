import { HttpError } from '../utils/httpError.js';
import { generateToken } from '../utils/jwt.js';
import { CurrentUserDTO } from '../dto/current-user.dto.js';

export class AuthService {
  constructor(userRepository, cartRepository) {
    this.userRepository = userRepository;
    this.cartRepository = cartRepository;
  }

  async register(userData) {
    const { first_name, last_name, email, age, password } = userData;

    const existingUser = await this.userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new HttpError(409, 'El correo electrónico ya se encuentra registrado');
    }

    // El registro público siempre debe asignar role: 'user'
    const newUser = await this.userRepository.createUser({
      first_name,
      last_name,
      email,
      age,
      password,
      role: 'user'
    });

    // Cada usuario debe tener un único carrito asociado
    const newCart = await this.cartRepository.createCart({
      user: newUser._id,
      products: []
    });

    // Asociar carrito creado al usuario
    await this.userRepository.updateUser(newUser._id, { cart: newCart._id });

    return new CurrentUserDTO(newUser);
  }

  async login(email, password) {
    if (!email || !password) {
      throw new HttpError(400, 'El email y la contraseña son obligatorios');
    }

    const user = await this.userRepository.getUserByEmail(email, '+password');
    if (!user) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new HttpError(401, 'Credenciales inválidas');
    }

    const payload = {
      sub: user._id.toString(),
      role: user.role
    };

    const token = generateToken(payload);

    return {
      user: new CurrentUserDTO(user),
      token
    };
  }
}
