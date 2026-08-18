import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';

import { CalificacionesService } from './calificaciones.service';
import { RegistrarNotaDto } from './dto/registrar-nota.dto';
import { CorregirNotaDto } from './dto/corregir-nota.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('calificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalificacionesController {
  constructor(
    private readonly service: CalificacionesService,
  ) {}

  @Get('mis-asignaturas')
  @Roles(UserRole.DOCENTE)
  misAsignaturas(@Req() req: any) {
    return this.service.misAsignaturas(req.user.sub);
  }

  @Get('asignaturas/:id/estudiantes')
  @Roles(
    UserRole.ADMIN,
    UserRole.SECRETARIA,
    UserRole.DOCENTE,
  )
  estudiantesPorAsignatura(
    @Param('id') asignaturaParaleloId: string,
    @Req() req: any,
  ) {
    return this.service.estudiantesPorAsignatura(
      asignaturaParaleloId,
      req.user.sub,
      req.user.role as UserRole,
    );
  }

  @Patch(':id/registrar')
  @Roles(UserRole.DOCENTE)
  registrarNota(
    @Param('id') detalleId: string,
    @Req() req: any,
    @Body() dto: RegistrarNotaDto,
  ) {
    return this.service.registrarNotaDocente(
      detalleId,
      req.user.sub,
      dto,
    );
  }

  @Patch(':id/corregir')
  @Roles(UserRole.SECRETARIA)
  corregirNota(
    @Param('id') detalleId: string,
    @Req() req: any,
    @Body() dto: CorregirNotaDto,
  ) {
    return this.service.corregirNota(
      detalleId,
      req.user.sub,
      dto,
    );
  }

  @Get(':id/correcciones')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  historialCorrecciones(
    @Param('id') detalleId: string,
  ) {
    return this.service.historialCorrecciones(
      detalleId,
    );
  }
}