import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { UserRole } from '../auth/roles';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Estudiante)
    private readonly estudianteRepository: Repository<Estudiante>,
  ) {}

  async crear(datos: { nombre: string; email: string; password: string; role: UserRole }) {
    const existe = await this.userRepository.findOneBy({ email: datos.email });
    if (existe) throw new BadRequestException('El correo ya está registrado');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(datos.password, salt);

    const nuevoUsuario = this.userRepository.create({
      nombre: datos.nombre,
      email: datos.email,
      password: hashedPassword,
      role: datos.role,
    });

    const guardado = await this.userRepository.save(nuevoUsuario);
    const { password, ...resultado } = guardado;
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

    if (datos.role === UserRole.ESTUDIANTE && usuario.role !== UserRole.ESTUDIANTE) {
      if (!usuario.cedula) {
        throw new BadRequestException(
          'Esta cuenta no tiene una cédula registrada, no se puede vincular automáticamente con ningún estudiante matriculado.',
        );
      }

      const estudiante = await this.estudianteRepository.findOne({
        where: { cedula: usuario.cedula },
        relations: { usuario: true },
      });

      if (!estudiante) {
        throw new BadRequestException(
          `No se encontró ningún estudiante matriculado con la cédula ${usuario.cedula}. Verifica que la secretaría haya registrado la matrícula primero.`,
        );
      }

      if (estudiante.usuario) {
        throw new ConflictException('Este estudiante ya tiene una cuenta vinculada a otro usuario.');
      }

      estudiante.usuario = usuario;
      await this.estudianteRepository.save(estudiante);
    }

    await this.userRepository.update(id, datos);
    return this.obtenerUno(id);
  }

  private generarPasswordTemporal(): string {
    return Math.random().toString(36).slice(-8);
  }

  async resetearPassword(id: string) {
    const usuario = await this.userRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const nuevaPassword = this.generarPasswordTemporal();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    await this.userRepository.update(id, { password: hashedPassword });
    return { message: 'Contraseña reseteada correctamente', passwordTemporal: nuevaPassword };
  }

  async desactivar(id: string) {
    const usuario = await this.userRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await this.userRepository.update(id, { isActive: false });
    return { message: 'Usuario desactivado correctamente' };
  }
}