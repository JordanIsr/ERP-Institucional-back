import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './roles';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(userData: any) {
    const { email, password } = userData;

    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tu cuenta se encuentra desactivada.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
    };

    return {
      token: await this.jwtService.signAsync(payload),
      role: user.role,
      nombre: user.nombre,
    };
  }

  async register(userData: any) {
    const { nombre, email, password, cedula } = userData;

    const userExists = await this.userRepository.findOneBy({ email });
    if (userExists) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      nombre,
      email,
      password: hashedPassword,
      cedula,
      role: UserRole.USUARIO,
    });

    await this.userRepository.save(newUser);

    return { message: 'Usuario registrado exitosamente. Un administrador debe asignarte un rol.' };
  }
}