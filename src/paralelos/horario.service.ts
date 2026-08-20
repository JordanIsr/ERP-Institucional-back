import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/horario.entity';
import { AsignaturaParalelo } from './entities/asignatura-paralelo.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepo: Repository<Horario>,
    @InjectRepository(AsignaturaParalelo)
    private readonly asignaturaParaleloRepo: Repository<AsignaturaParalelo>,
  ) {}

  private seTraslapan(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
    return inicioA < finB && inicioB < finA;
  }

  async crear(dto: CreateHorarioDto) {
    if (dto.horaInicio >= dto.horaFin) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin.');
    }

    const asignaturaParalelo = await this.asignaturaParaleloRepo.findOne({
      where: { id: dto.asignaturaParaleloId },
    });
    if (!asignaturaParalelo) {
      throw new NotFoundException('No se encontró la asignación de asignatura-paralelo.');
    }

    const horariosDelDia = await this.horarioRepo.find({
      where: { dia: dto.dia },
      relations: { asignaturaParalelo: { paralelo: { aula: true }, docente: true } },
    });

    for (const h of horariosDelDia) {
      const hayTraslape = this.seTraslapan(dto.horaInicio, dto.horaFin, h.horaInicio, h.horaFin);
      if (!hayTraslape) continue;

      if (h.asignaturaParalelo.docente.id === asignaturaParalelo.docente.id) {
        throw new ConflictException(
          `Choque de horario: el docente ya tiene clase el ${dto.dia} de ${h.horaInicio} a ${h.horaFin}.`,
        );
      }

      if (h.asignaturaParalelo.paralelo.id === asignaturaParalelo.paralelo.id) {
        throw new ConflictException(
          `Choque de horario: esta aula ya tiene clase el ${dto.dia} de ${h.horaInicio} a ${h.horaFin}.`,
        );
      }

      if (
        h.asignaturaParalelo.paralelo.aula.id === asignaturaParalelo.paralelo.aula.id &&
        h.asignaturaParalelo.paralelo.id !== asignaturaParalelo.paralelo.id
      ) {
        throw new ConflictException(
          `Choque de horario: el aula "${asignaturaParalelo.paralelo.aula.nombre}" ya está ocupada por el paralelo "${h.asignaturaParalelo.paralelo.nombre}" el ${dto.dia} de ${h.horaInicio} a ${h.horaFin}.`,
        );
      }
    }

    const nuevo = this.horarioRepo.create({ asignaturaParalelo, dia: dto.dia, horaInicio: dto.horaInicio, horaFin: dto.horaFin });
    return this.horarioRepo.save(nuevo);
  }

  listarPorParalelo(paraleloId: string) {
    return this.horarioRepo.find({
      where: { asignaturaParalelo: { paralelo: { id: paraleloId } } },
      relations: { asignaturaParalelo: { detalleMalla: { asignatura: true }, docente: true } },
      order: { dia: 'ASC', horaInicio: 'ASC' },
    });
  }

  listarPorDocente(docenteId: string) {
    return this.horarioRepo.find({
      where: { asignaturaParalelo: { docente: { id: docenteId } } },
      relations: { asignaturaParalelo: { detalleMalla: { asignatura: true }, paralelo: true } },
      order: { dia: 'ASC', horaInicio: 'ASC' },
    });
  }

  listarPorUsuarioDocente(usuarioId: string) {
    return this.horarioRepo
      .createQueryBuilder('horario')
      .leftJoinAndSelect('horario.asignaturaParalelo', 'asignacion')
      .leftJoinAndSelect('asignacion.docente', 'docente')
      .leftJoinAndSelect('docente.usuario', 'usuario')
      .leftJoinAndSelect('asignacion.detalleMalla', 'detalleMalla')
      .leftJoinAndSelect('detalleMalla.asignatura', 'asignatura')
      .leftJoinAndSelect('asignacion.paralelo', 'paralelo')
      .leftJoinAndSelect('paralelo.nivel', 'nivel')
      .leftJoinAndSelect('paralelo.aula', 'aula')
      .leftJoinAndSelect('paralelo.periodoCarrera', 'periodoCarrera')
      .leftJoinAndSelect('periodoCarrera.periodo', 'periodo')
      .leftJoinAndSelect('periodoCarrera.carrera', 'carrera')
      .where('usuario.id = :usuarioId', { usuarioId })
      .orderBy('periodo.fechaInicio', 'DESC')
      .addOrderBy('horario.dia', 'ASC')
      .addOrderBy('horario.horaInicio', 'ASC')
      .getMany();
  }

  async eliminar(id: string) {
    const horario = await this.horarioRepo.findOne({ where: { id } });
    if (!horario) throw new NotFoundException('Horario no encontrado.');
    await this.horarioRepo.remove(horario);
    return { message: 'Horario eliminado exitosamente.' };
  }
}
