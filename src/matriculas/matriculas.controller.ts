import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { MatriculasService } from './matriculas.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { EstadoMatricula } from './entities/matricula.entity';
import { CreateMatriculaNuevaDto } from './dto/create-matricula-nueva.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('matriculas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatriculasController {
  constructor(
    private readonly matriculasService: MatriculasService,
  ) {}

  /*
   * Por ahora lo usa secretaría para estudiantes nuevos.
   * Después también será llamado automáticamente al aprobar una solicitud.
   */
  @Post()
  @Roles(UserRole.SECRETARIA)
  create(@Body() dto: CreateMatriculaDto) {
    return this.matriculasService.create(dto);
  }

  @Post('nueva')
@Roles(UserRole.SECRETARIA)
crearNueva(
  @Body() dto: CreateMatriculaNuevaDto,
) {
  return this.matriculasService
    .crearNuevaConEstudiante(dto);
}

  /*
   * Esta ruta debe estar antes de @Get(':id').
   */
  @Get('mias')
  @Roles(UserRole.ESTUDIANTE)
  misMatriculas(@Req() req: any) {
    return this.matriculasService.misMatriculas(
      req.user.sub,
    );
  }

  @Get('opciones-permitidas')
@Roles(UserRole.ESTUDIANTE)
opcionesPermitidas(
  @Req() req: any,
) {
  return this.matriculasService
    .opcionesPermitidas(req.user.sub);
}

  @Get('oferta-inicial')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  ofertaInicial() {
    return this.matriculasService.ofertaInicial();
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll(
    @Query('estudianteId') estudianteId?: string,
    @Query('periodoId') periodoId?: string,
    @Query('carreraId') carreraId?: string,
    @Query('paraleloId') paraleloId?: string,
    @Query('estado') estado?: EstadoMatricula,
  ) {
    return this.matriculasService.findAll({
      estudianteId,
      periodoId,
      carreraId,
      paraleloId,
      estado,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.matriculasService.findOne(id);
  }

  @Patch(':id/anular')
  @Roles(UserRole.SECRETARIA)
  anular(@Param('id') id: string) {
    return this.matriculasService.anular(id);
  }
}
