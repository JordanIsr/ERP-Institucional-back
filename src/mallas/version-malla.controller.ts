import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VersionMallaService } from './version-malla.service';
import { CreateVersionMallaDto } from './dto/create-version-malla.dto';
import { UpdateVersionMallaDto } from './dto/update-version-malla.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('versiones-malla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VersionMallaController {
  constructor(private readonly versionMallaService: VersionMallaService) {}

  @Post()
  @Roles(UserRole.SECRETARIA)
  create(@Body() dto: CreateVersionMallaDto) {
    return this.versionMallaService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll(@Query('carreraId') carreraId?: string) {
    return this.versionMallaService.findAll(carreraId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.versionMallaService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIA)
  update(@Param('id') id: string, @Body() dto: UpdateVersionMallaDto) {
    return this.versionMallaService.update(id, dto);
  }

  @Patch(':id/activar')
  @Roles(UserRole.SECRETARIA)
  activar(@Param('id') id: string) {
    return this.versionMallaService.activar(id);
  }

  @Delete(':id')
  @Roles(UserRole.SECRETARIA)
  remove(@Param('id') id: string) {
    return this.versionMallaService.remove(id);
  }
}