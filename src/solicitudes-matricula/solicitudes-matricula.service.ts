import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudMatricula, EstadoSolicitud } from './entities/solicitud-matricula.entity';
import { CreateSolicitudMatriculaDto } from './dto/create-solicitud-matricula.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { EstudiantesService } from '../estudiantes/estudiantes.service';
import { PeriodoCarreraService } from '../periodo-carrera/periodo-carrera.service';
import { ParaleloService } from '../paralelos/paralelo.service';

@Injectable()
export class SolicitudesMatriculaService {
  constructor(
    @InjectRepository(SolicitudMatricula)
    private readonly repo: Repository<SolicitudMatricula>,
    private readonly estudiantesService: EstudiantesService,
    private readonly periodoCarreraService: PeriodoCarreraService,
    private readonly paraleloService: ParaleloService,
  ) {}

  private async getEstudianteDelUsuario(usuarioId: string) {
    const estudiante = await this.estudiantesService.findByUsuarioId(usuarioId);
    if (!estudiante) {
      throw new NotFoundException(
        'No existe una ficha de estudiante asociada a tu usuario. Acércate a secretaría para que te matriculen en el sistema.',
      );
    }
    return estudiante;
  }

  private async contarCuposOcupados(paraleloId: string) {
    return this.repo.count({
      where: { paralelo: { id: paraleloId }, estado: EstadoSolicitud.APROBADA },
    });
  }

  // ---------- ESTUDIANTE: crear su solicitud (1 vez por periodo) ----------
  async crear(
    usuarioId: string,
    dto: CreateSolicitudMatriculaDto,
    archivoCedulaUrl: string,
    archivoNoAdeudarUrl: string,
  ) {
    const estudiante = await this.getEstudianteDelUsuario(usuarioId);
    const periodoCarrera = await this.periodoCarreraService.findOne(dto.periodoCarreraId);
    const paralelo = await this.paraleloService.findOne(dto.paraleloId);

    if (paralelo.periodoCarrera.id !== periodoCarrera.id) {
      throw new BadRequestException(
        'El paralelo seleccionado no pertenece a la carrera/periodo indicado.',
      );
    }

    const yaExiste = await this.repo.findOne({
      where: {
        estudiante: { id: estudiante.id },
        periodoCarrera: { id: periodoCarrera.id },
      },
    });
    if (yaExiste) {
      throw new ConflictException(
        'Ya enviaste una solicitud de matrícula para este periodo. Si fue rechazada, debes reenviarla en lugar de crear una nueva.',
      );
    }

    const ocupados = await this.contarCuposOcupados(paralelo.id);
    if (ocupados >= paralelo.cupoMaximo) {
      throw new ConflictException(
        `El paralelo "${paralelo.nombre}" ya no tiene cupos disponibles (${ocupados}/${paralelo.cupoMaximo}).`,
      );
    }

    const nueva = this.repo.create({
      estudiante,
      periodoCarrera,
      paralelo,
      archivoCedulaUrl,
      archivoNoAdeudarUrl,
      estado: EstadoSolicitud.PENDIENTE,
      puedeReenviar: false,
    });

    return this.repo.save(nueva);
  }

  // ---------- ESTUDIANTE: reenviar tras un rechazo (candado de 1 sola vez) ----------
  async reenviar(
    usuarioId: string,
    solicitudId: string,
    archivoCedulaUrl: string | null,
    archivoNoAdeudarUrl: string | null,
  ) {
    const solicitud = await this.findOneOrFail(solicitudId);
    const estudiante = await this.getEstudianteDelUsuario(usuarioId);

    if (solicitud.estudiante.id !== estudiante.id) {
      throw new ForbiddenException('No puedes editar la solicitud de otro estudiante.');
    }
    if (solicitud.estado !== EstadoSolicitud.RECHAZADA || !solicitud.puedeReenviar) {
      throw new BadRequestException(
        'Esta solicitud no está disponible para reenvío en este momento.',
      );
    }

    if (archivoCedulaUrl) solicitud.archivoCedulaUrl = archivoCedulaUrl;
    if (archivoNoAdeudarUrl) solicitud.archivoNoAdeudarUrl = archivoNoAdeudarUrl;
    solicitud.estado = EstadoSolicitud.PENDIENTE;
    solicitud.puedeReenviar = false;
    solicitud.motivoRechazo = undefined;

    return this.repo.save(solicitud);
  }

  // ---------- ESTUDIANTE: ver sus propias solicitudes ----------
  misSolicitudes(usuarioId: string) {
    return this.getEstudianteDelUsuario(usuarioId).then((estudiante) =>
      this.repo.find({
        where: { estudiante: { id: estudiante.id } },
        order: { fechaEnvio: 'DESC' },
      }),
    );
  }

  // ---------- ESTUDIANTE: "Mi Matrícula" -> su solicitud APROBADA más reciente ----------
  async miMatriculaVigente(usuarioId: string) {
    const estudiante = await this.getEstudianteDelUsuario(usuarioId);
    const matricula = await this.repo.findOne({
      where: { estudiante: { id: estudiante.id }, estado: EstadoSolicitud.APROBADA },
      order: { fechaEnvio: 'DESC' },
    });
    if (!matricula) {
      throw new NotFoundException('Todavía no tienes una matrícula aprobada en ningún periodo.');
    }
    return matricula;
  }

  // ---------- SECRETARIA/ADMIN: listar con filtros ----------
 async findAll(filtros?: {
  periodoCarreraId?: string;
  carreraId?: string;
  periodoId?: string;
  paraleloId?: string;
  estado?: EstadoSolicitud;
  busqueda?: string;
}) {
  const qb = this.repo
    .createQueryBuilder('s')
    .leftJoinAndSelect('s.estudiante', 'estudiante')
    .leftJoinAndSelect('s.periodoCarrera', 'periodoCarrera')
    .leftJoinAndSelect('periodoCarrera.periodo', 'periodo')
    .leftJoinAndSelect('periodoCarrera.carrera', 'carrera')
    .leftJoinAndSelect('periodoCarrera.centroEstudio', 'centroEstudio')
    .leftJoinAndSelect('s.paralelo', 'paralelo')
    .leftJoinAndSelect('paralelo.nivel', 'nivel')
    .orderBy('s.fechaEnvio', 'DESC');

  if (filtros?.periodoCarreraId) {
    qb.andWhere('periodoCarrera.id = :periodoCarreraId', {
      periodoCarreraId: filtros.periodoCarreraId,
    });
  }

  if (filtros?.carreraId) {
    qb.andWhere('carrera.id = :carreraId', {
      carreraId: filtros.carreraId,
    });
  }

  if (filtros?.periodoId) {
    qb.andWhere('periodo.id = :periodoId', {
      periodoId: filtros.periodoId,
    });
  }

  if (filtros?.paraleloId) {
    qb.andWhere('paralelo.id = :paraleloId', {
      paraleloId: filtros.paraleloId,
    });
  }

  if (filtros?.estado) {
    qb.andWhere('s.estado = :estado', {
      estado: filtros.estado,
    });
  }

  if (filtros?.busqueda) {
    qb.andWhere(
      `(estudiante.cedula ILIKE :busqueda
        OR estudiante.nombres ILIKE :busqueda
        OR estudiante.apellidos ILIKE :busqueda)`,
      {
        busqueda: `%${filtros.busqueda}%`,
      },
    );
  }

  return qb.getMany();
}
  findPendientes() {
    return this.findAll({ estado: EstadoSolicitud.PENDIENTE });
  }

  async findOneOrFail(id: string) {
    const solicitud = await this.repo.findOne({ where: { id } });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud de matrícula con ID ${id} no encontrada.`);
    }
    return solicitud;
  }

  // ---------- SECRETARIA: aprobar ----------
  async aprobar(id: string) {
    const solicitud = await this.findOneOrFail(id);
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException('Solo se pueden aprobar solicitudes en estado PENDIENTE.');
    }

    const ocupados = await this.contarCuposOcupados(solicitud.paralelo.id);
    if (ocupados >= solicitud.paralelo.cupoMaximo) {
      throw new ConflictException(
        `No se puede aprobar: el paralelo "${solicitud.paralelo.nombre}" ya no tiene cupos disponibles.`,
      );
    }

    solicitud.estado = EstadoSolicitud.APROBADA;
    solicitud.puedeReenviar = false;
    solicitud.motivoRechazo = undefined;
    return this.repo.save(solicitud);
  }

  // ---------- SECRETARIA: rechazar (con motivo obligatorio) ----------
  async rechazar(id: string, dto: RechazarSolicitudDto) {
    const solicitud = await this.findOneOrFail(id);
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException('Solo se pueden rechazar solicitudes en estado PENDIENTE.');
    }

    solicitud.estado = EstadoSolicitud.RECHAZADA;
    solicitud.motivoRechazo = dto.motivoRechazo;
    solicitud.puedeReenviar = true;
    return this.repo.save(solicitud);
  }

  async obtenerEstudiantesParaNotas(filtros: {
  periodoCarreraId?: string;
  nivelId?: string;
  paraleloId?: string;
}) {
  const qb = this.repo
    .createQueryBuilder('solicitud')

    // Estudiante
    .innerJoinAndSelect(
      'solicitud.estudiante',
      'estudiante',
    )

    // Periodo + carrera
    .innerJoinAndSelect(
      'solicitud.periodoCarrera',
      'periodoCarrera',
    )

    .innerJoinAndSelect(
      'periodoCarrera.periodo',
      'periodo',
    )

    .innerJoinAndSelect(
      'periodoCarrera.carrera',
      'carrera',
    )

    // Paralelo + nivel
    .innerJoinAndSelect(
      'solicitud.paralelo',
      'paralelo',
    )

    .innerJoinAndSelect(
      'paralelo.nivel',
      'nivel',
    )

    // SOLO MATRÍCULAS APROBADAS
    .where('solicitud.estado = :estado', {
      estado: EstadoSolicitud.APROBADA,
    });

  if (filtros.periodoCarreraId) {
    qb.andWhere(
      'periodoCarrera.id = :periodoCarreraId',
      {
        periodoCarreraId: filtros.periodoCarreraId,
      },
    );
  }

  if (filtros.nivelId) {
    qb.andWhere(
      'nivel.id = :nivelId',
      {
        nivelId: filtros.nivelId,
      },
    );
  }

  if (filtros.paraleloId) {
    qb.andWhere(
      'paralelo.id = :paraleloId',
      {
        paraleloId: filtros.paraleloId,
      },
    );
  }

  const solicitudes = await qb
    .orderBy('estudiante.apellidos', 'ASC')
    .addOrderBy('estudiante.nombres', 'ASC')
    .getMany();

  return solicitudes.map((solicitud) => ({
    estudianteId: solicitud.estudiante.id,
    cedula: solicitud.estudiante.cedula,
    nombres: solicitud.estudiante.nombres,
    apellidos: solicitud.estudiante.apellidos,
    correo: solicitud.estudiante.correo,
    telefono: solicitud.estudiante.telefono,

    carrera: solicitud.periodoCarrera.carrera.nombre,
    carreraId: solicitud.periodoCarrera.carrera.id,

    periodo: solicitud.periodoCarrera.periodo.nombre,
    periodoId: solicitud.periodoCarrera.periodo.id,

    nivel: solicitud.paralelo.nivel.nombre,
    nivelId: solicitud.paralelo.nivel.id,

    paralelo: solicitud.paralelo.nombre,
    paraleloId: solicitud.paralelo.id,

    jornada: solicitud.periodoCarrera.jornada,
    
    solicitudId: solicitud.id,
  }));
}
}