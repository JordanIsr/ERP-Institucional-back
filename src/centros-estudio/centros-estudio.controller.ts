import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CentrosEstudioService } from './centros-estudio.service';
import { CreateCentroEstudioDto } from './dto/create-centro-estudio.dto';
import { UpdateCentroEstudioDto } from './dto/update-centro-estudio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('centros-estudio')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CentrosEstudioController {
  constructor(private readonly centrosEstudioService: CentrosEstudioService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCentroEstudioDto) {
    return this.centrosEstudioService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll() {
    return this.centrosEstudioService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.centrosEstudioService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCentroEstudioDto) {
    return this.centrosEstudioService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.centrosEstudioService.remove(id);
  }
}
