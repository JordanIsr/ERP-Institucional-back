import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Docente } from '../docentes/entities/docente.entity';
import { UserRole } from '../auth/roles';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async crear(datos: {
    nombre: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    return this.dataSource.transaction(
      async (manager) => {
        const userRepository =
          manager.getRepository(User);

        const existe =
          await userRepository.findOne({
            where: {
              email: datos.email,
            },
          });

        if (existe) {
          throw new BadRequestException(
            'El correo ya está registrado.',
          );
        }

        const passwordCifrada =
          await bcrypt.hash(
            datos.password,
            10,
          );

        const nuevoUsuario =
          userRepository.create({
            nombre: datos.nombre,
            email: datos.email,
            password: passwordCifrada,
            role: datos.role,
          });

        const guardado =
          await userRepository.save(
            nuevoUsuario,
          );

        const {
          password,
          ...resultado
        } = guardado;

        return resultado;
      },
    );
  }

  async obtenerTodos() {
    const usuarios =
      await this.dataSource
        .getRepository(User)
        .find({
          order: {
            nombre: 'ASC',
          },
        });

    return usuarios.map(
      ({ password, ...usuario }) =>
        usuario,
    );
  }

  async obtenerUno(id: string) {
    const usuario =
      await this.dataSource
        .getRepository(User)
        .findOne({
          where: {
            id,
          },
        });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }

    const {
      password,
      ...resultado
    } = usuario;

    return resultado;
  }

  async actualizar(
    id: string,
    datos: Partial<User>,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const userRepository =
          manager.getRepository(User);

        const estudianteRepository =
          manager.getRepository(Estudiante);

        const docenteRepository =
          manager.getRepository(Docente);

        const usuario =
          await userRepository.findOne({
            where: {
              id,
            },
          });

        if (!usuario) {
          throw new NotFoundException(
            'Usuario no encontrado.',
          );
        }

        /*
         * Validar la ficha de estudiante
         * antes de cambiar el rol.
         */
        if (
          datos.role ===
            UserRole.ESTUDIANTE &&
          usuario.role !==
            UserRole.ESTUDIANTE
        ) {
          if (!usuario.cedula) {
            throw new BadRequestException(
              'No se puede asignar el rol ESTUDIANTE porque la cuenta no tiene una cédula registrada.',
            );
          }

          const estudiante =
            await estudianteRepository.findOne({
              where: {
                cedula: usuario.cedula,
              },
            });

          if (!estudiante) {
            throw new BadRequestException(
              'No se puede asignar el rol ESTUDIANTE porque el usuario no está registrado como estudiante.',
            );
          }

          if (
            estudiante.usuario &&
            estudiante.usuario.id !==
              usuario.id
          ) {
            throw new ConflictException(
              'La ficha del estudiante ya está vinculada con otra cuenta.',
            );
          }
        }

        /*
         * Validar la ficha de docente
         * antes de cambiar el rol.
         */
        if (
          datos.role ===
            UserRole.DOCENTE &&
          usuario.role !==
            UserRole.DOCENTE
        ) {
          if (!usuario.cedula) {
            throw new BadRequestException(
              'No se puede asignar el rol DOCENTE porque la cuenta no tiene una cédula registrada.',
            );
          }

          const docente =
            await docenteRepository.findOne({
              where: {
                cedula: usuario.cedula,
              },
            });

          if (!docente) {
            throw new BadRequestException(
              'No se puede asignar el rol DOCENTE porque no existe una ficha docente con esa cédula.',
            );
          }

          if (
            docente.usuario &&
            docente.usuario.id !==
              usuario.id
          ) {
            throw new ConflictException(
              'La ficha del docente ya está vinculada con otra cuenta.',
            );
          }
        }

        /*
         * Desvincular la ficha estudiantil
         * cuando abandona el rol estudiante.
         */
        if (
          usuario.role ===
            UserRole.ESTUDIANTE &&
          datos.role &&
          datos.role !==
            UserRole.ESTUDIANTE
        ) {
          const estudianteAnterior =
            await estudianteRepository.findOne({
              where: {
                usuario: {
                  id: usuario.id,
                },
              },
            });

          if (estudianteAnterior) {
            estudianteAnterior.usuario =
              null;

            await estudianteRepository.save(
              estudianteAnterior,
            );
          }
        }

        /*
         * Desvincular la ficha docente
         * cuando abandona el rol docente.
         */
        if (
          usuario.role ===
            UserRole.DOCENTE &&
          datos.role &&
          datos.role !==
            UserRole.DOCENTE
        ) {
          const docenteAnterior =
            await docenteRepository.findOne({
              where: {
                usuario: {
                  id: usuario.id,
                },
              },
            });

          if (docenteAnterior) {
            docenteAnterior.usuario = null;

            await docenteRepository.save(
              docenteAnterior,
            );
          }
        }

        if (datos.password) {
          datos.password =
            await bcrypt.hash(
              datos.password,
              10,
            );
        }

        Object.assign(
          usuario,
          datos,
        );

        const usuarioGuardado =
          await userRepository.save(
            usuario,
          );

        /*
         * Vincular únicamente la ficha
         * estudiantil.
         */
        if (
          usuarioGuardado.role ===
          UserRole.ESTUDIANTE
        ) {
          const estudiante =
            await estudianteRepository.findOne({
              where: {
                cedula:
                  usuarioGuardado.cedula,
              },
            });

          if (!estudiante) {
            throw new BadRequestException(
              'No se encontró la ficha del estudiante.',
            );
          }

          estudiante.usuario =
            usuarioGuardado;

          await estudianteRepository.save(
            estudiante,
          );
        }

        /*
         * Vincular únicamente la ficha
         * docente.
         *
         * Este bloque debe estar separado
         * del bloque de estudiante.
         */
        if (
          usuarioGuardado.role ===
          UserRole.DOCENTE
        ) {
          const docente =
            await docenteRepository.findOne({
              where: {
                cedula:
                  usuarioGuardado.cedula,
              },
            });

          if (!docente) {
            throw new BadRequestException(
              'No se encontró la ficha del docente.',
            );
          }

          docente.usuario =
            usuarioGuardado;

          await docenteRepository.save(
            docente,
          );
        }

        const {
          password,
          ...resultado
        } = usuarioGuardado;

        return resultado;
      },
    );
  }

  private generarPasswordTemporal():
    string {
    return Math.random()
      .toString(36)
      .slice(-8);
  }

  async resetearPassword(id: string) {
    const userRepository =
      this.dataSource.getRepository(User);

    const usuario =
      await userRepository.findOne({
        where: {
          id,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }

    const nuevaPassword =
      this.generarPasswordTemporal();

    usuario.password =
      await bcrypt.hash(
        nuevaPassword,
        10,
      );

    await userRepository.save(usuario);

    return {
      message:
        'Contraseña restablecida correctamente.',
      passwordTemporal:
        nuevaPassword,
    };
  }

  async desactivar(id: string) {
    const userRepository =
      this.dataSource.getRepository(User);

    const usuario =
      await userRepository.findOne({
        where: {
          id,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }

    usuario.isActive = false;

    await userRepository.save(
      usuario,
    );

    return {
      message:
        'Usuario desactivado correctamente.',
    };
  }
}