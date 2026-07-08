import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Credenciales incorrectas');
  }

  // Ahora sí incluimos el rol en el payload del token
  const payload = {
    sub: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role,
  };

  return {
    token: await this.jwtService.signAsync(payload),
    // Devolvemos también el rol y nombre sueltos, útiles para que el frontend
    // los guarde en localStorage sin tener que decodificar el token
    role: user.role,
    nombre: user.nombre,
  };
}
  
  async register(userData: any) {
    const { nombre, email, password } = userData;

    // 1. Revisar si el correo ya existe en Postgres
    const userExists = await this.userRepository.findOneBy({ email });
    if (userExists) {
      throw new BadRequestException('El correo ya está registrado');
    }

    // 2. Encriptar la contraseña (¡Nunca se guardan en texto plano!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear la entidad del nuevo usuario
    const newUser = this.userRepository.create({
      nombre,
      email,
      password: hashedPassword,
    });

    // 4. Guardar en la base de datos
    await this.userRepository.save(newUser);

    return { message: 'Usuario registrado exitosamente' };
  }
}
