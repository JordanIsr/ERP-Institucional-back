import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ParaleloService } from './paralelo.service';
import { CreateParaleloDto } from './dto/create-paralelo.dto';
import { UpdateParaleloDto } from './dto/update-paralelo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('paralelos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParaleloController {
  constructor(private readonly paraleloService: ParaleloService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateParaleloDto) {
    return this.paraleloService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findAll(
    @Query('periodoCarreraId') periodoCarreraId?: string,
    @Query('nivelId') nivelId?: string,
  ) {
    return this.paraleloService.findAll({ periodoCarreraId, nivelId });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARIA)
  findOne(@Param('id') id: string) {
    return this.paraleloService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateParaleloDto) {
    return this.paraleloService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.paraleloService.remove(id);
  }
}