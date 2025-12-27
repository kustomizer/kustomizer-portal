import { Service } from 'typedi';
import { UserRepository, User } from '../repositories/user.repository';

@Service()
export class UserService {
  constructor(private userRepository: UserRepository) { }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

