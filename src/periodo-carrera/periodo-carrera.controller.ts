import {Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';

import { PeriodoCarreraService } from './periodo-carrera.service';
import { CreatePeriodoCarreraDto } from './dto/create-periodo-carrera.dto';
import { UpdatePeriodoCarreraDto } from './dto/update-periodo-carrera.dto';
import { EstadoPeriodoCarrera } from './entities/periodo-carrera.entity';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('periodo-carrera')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeriodoCarreraController {
  constructor(
    private readonly periodoCarreraService: PeriodoCarreraService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePeriodoCarreraDto) {
    return this.periodoCarreraService.create(dto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SECRETARIA,
    UserRole.ESTUDIANTE,
    UserRole.DOCENTE,
  )
  findAll(
    @Query('periodoId') periodoId?: string,
    @Query('carreraId') carreraId?: string,
    @Query('versionMallaId') versionMallaId?: string,
    @Query('estado') estado?: EstadoPeriodoCarrera,
  ) {
    return this.periodoCarreraService.findAll({
      periodoId,
      carreraId,
      versionMallaId,
      estado,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.periodoCarreraService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePeriodoCarreraDto,
  ) {
    return this.periodoCarreraService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.periodoCarreraService.remove(id);
  }
}
