import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './roles';
import { RegisterDto } from './dto/register.dto';

const VERSION_POLITICA_PRIVACIDAD = '2026-08-19';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(userData: any) {
    const { email, password } = userData;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
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

  async register(userData: RegisterDto) {
    const {
      nombre,
      email,
      password,
      cedula,
      aceptaPoliticaPrivacidad,
    } = userData;

    if (!aceptaPoliticaPrivacidad) {
      throw new BadRequestException(
        'Debes aceptar la Política de Privacidad para registrarte.',
      );
    }

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
      aceptoPoliticaPrivacidad: true,
      fechaAceptacionPrivacidad: new Date(),
      versionPoliticaPrivacidad:
        VERSION_POLITICA_PRIVACIDAD,
    });

    await this.userRepository.save(newUser);

    return {
      message:
        'Usuario registrado exitosamente. Un administrador debe asignarte un rol.',
    };
  }
}
