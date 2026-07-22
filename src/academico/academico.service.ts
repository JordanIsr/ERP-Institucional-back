import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignatura } from './entities/asignatura.entity';
import { HistorialAcademico, EstadoAsignatura } from './entities/historial-academico.entity';
import { ComprobantePago, EstadoComprobante } from './entities/comprobante-pago.entity';

@Injectable()
export class AcademicoService {
  constructor(
    @InjectRepository(Asignatura)
    private readonly asignaturaRepo: Repository<Asignatura>,
    @InjectRepository(HistorialAcademico)
    private readonly historialRepo: Repository<HistorialAcademico>,
    @InjectRepository(ComprobantePago)
    private readonly comprobanteRepo: Repository<ComprobantePago>,
  ) {}

  // ---------- ASIGNATURAS ----------
  crearAsignatura(datos: Partial<Asignatura>) {
    const nueva = this.asignaturaRepo.create(datos);
    return this.asignaturaRepo.save(nueva);
  }

  listarAsignaturas() {
    return this.asignaturaRepo.find();
  }

  // ---------- HISTORIAL / NOTAS ----------
  async registrarNota(datos: { estudianteId: string; asignaturaId: string; nota: number }) {
    const asignatura = await this.asignaturaRepo.findOneBy({ id: datos.asignaturaId });
    if (!asignatura) throw new NotFoundException('Asignatura no encontrada');

    const registro = this.historialRepo.create({
      estudiante: { id: datos.estudianteId } as any,
      asignatura,
      nota: datos.nota,
      estado: datos.nota >= 7 ? EstadoAsignatura.APROBADA : EstadoAsignatura.REPROBADA, // ajusta el umbral si tu institución usa otra escala
    });

    return this.historialRepo.save(registro);
  }

  listarHistorialPorEstudiante(estudianteId: string) {
    return this.historialRepo.find({
      where: { estudiante: { id: estudianteId } },
      relations: {asignatura: true},
    });
  }

  async listarHistorialPorUsuario(usuarioId: string) {
  const historial = await this.historialRepo.find({
    where: { estudiante: { usuario: { id: usuarioId } } },
    relations: { asignatura: true },
  });

  return historial;
}

  listarComprobantesPendientes() {
  return this.comprobanteRepo.find({
    where: { estado: EstadoComprobante.PENDIENTE },
    relations: { estudiante: true },
    order: { fechaSubida: 'ASC' },
  });
}

  // ---------- COMPROBANTES DE PAGO ----------
  async subirComprobante(estudianteId: string, archivoUrl: string) {
    const comprobante = this.comprobanteRepo.create({
      estudiante: { id: estudianteId } as any,
      archivoUrl,
      estado: EstadoComprobante.PENDIENTE,
    });
    return this.comprobanteRepo.save(comprobante);
  }

  listarComprobantesPorEstudiante(estudianteId: string) {
    return this.comprobanteRepo.find({ where: { estudiante: { id: estudianteId } } });
  }

  async aprobarComprobante(id: string) {
    const comprobante = await this.comprobanteRepo.findOneBy({ id });
    if (!comprobante) throw new NotFoundException('Comprobante no encontrado');
    comprobante.estado = EstadoComprobante.VERIFICADO;
    return this.comprobanteRepo.save(comprobante);
  }

  async rechazarComprobante(id: string) {
    const comprobante = await this.comprobanteRepo.findOneBy({ id });
    if (!comprobante) throw new NotFoundException('Comprobante no encontrado');
    comprobante.estado = EstadoComprobante.RECHAZADO;
    return this.comprobanteRepo.save(comprobante);
  }

  // ---------- VALIDACIÓN CENTRAL (la usa EstudiantesService) ----------
  async puedeAprobarMatricula(estudianteId: string): Promise<void> {
    const materiasReprobadas = await this.historialRepo.count({
      where: { estudiante: { id: estudianteId }, estado: EstadoAsignatura.REPROBADA },
    });

    if (materiasReprobadas === 0) return; // no debe nada, puede aprobarse sin más

    const tieneComprobanteVerificado = await this.comprobanteRepo.findOne({
      where: { estudiante: { id: estudianteId }, estado: EstadoComprobante.VERIFICADO },
    });

    if (!tieneComprobanteVerificado) {
      throw new BadRequestException(
        'No se puede aprobar la matrícula: el estudiante tiene asignaturas reprobadas y no cuenta con un comprobante de pago verificado.',
      );
    }
  }
}