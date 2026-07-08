import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../auth/roles';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async crear(datos: { nombre: string; email: string; password: string; role: UserRole }) {
    const existe = await this.userRepository.findOneBy({ email: datos.email });
    if (existe) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(datos.password, salt);

    const nuevoUsuario = this.userRepository.create({
      nombre: datos.nombre,
      email: datos.email,
      password: hashedPassword,
      role: datos.role, // aquí SÍ se puede definir admin o secretaria
    });

    const guardado = await this.userRepository.save(nuevoUsuario);
    const { password, ...resultado } = guardado; // nunca devolver el hash
    return resultado;
  }

  async obtenerTodos() {
    const usuarios = await this.userRepository.find();
    return usuarios.map(({ password, ...resto }) => resto);
  }

  async obtenerUno(id: string) {
    const usuario = await this.userRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const { password, ...resto } = usuario;
    return resto;
  }

  async actualizar(id: string, datos: Partial<User>) {
    const usuario = await this.userRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (datos.password) {
      const salt = await bcrypt.genSalt(10);
      datos.password = await bcrypt.hash(datos.password, salt);
    }

    await this.userRepository.update(id, datos);
    return this.obtenerUno(id);
  }

  async desactivar(id: string) {
    const usuario = await this.userRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await this.userRepository.update(id, { isActive: false });
    return { message: 'Usuario desactivado correctamente' };
  }
}