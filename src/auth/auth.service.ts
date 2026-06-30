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

    // 1. Buscamos si el usuario existe por su correo
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 2. Comparamos la contraseña que escribió con la encriptada en Postgres
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Si todo está bien, creamos el "pasaporte" (Payload) del usuario
    const payload = { sub: user.id, email: user.email, nombre: user.nombre };

    // 4. Firmamos y devolvemos el Token
    return {
      token: await this.jwtService.signAsync(payload),
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
