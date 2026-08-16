import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AulaService } from './aula.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('aulas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  @Post()
  @Roles(UserRole.SECRETARIA)
  create(@Body() createAulaDto: CreateAulaDto) {
    return this.aulaService.create(createAulaDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll(@Query('soloActivos') soloActivos?: string) {
    const activos = soloActivos !== 'false';
    return this.aulaService.findAll(activos);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.aulaService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIA)
  update(@Param('id') id: string, @Body() updateAulaDto: UpdateAulaDto) {
    return this.aulaService.update(id, updateAulaDto);
  }

  @Delete(':id')
  @Roles(UserRole.SECRETARIA)
  remove(@Param('id') id: string) {
    return this.aulaService.remove(id);
  }
}