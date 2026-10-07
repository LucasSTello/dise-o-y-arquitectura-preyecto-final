import { HttpError } from '../utils/httpError.js';
import { CurrentUserDTO } from '../dto/current-user.dto.js';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUserById(id) {
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new HttpError(404, 'Usuario no encontrado');
    }
    return user;
  }

  async getUserDtoById(id) {
    const user = await this.getUserById(id);
    return new CurrentUserDTO(user);
  }

  async getUserByEmail(email) {
    return this.userRepository.getUserByEmail(email);
  }
}
