import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AulaService } from './aula.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Controller('aulas')
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  @Post()
  create(@Body() createAulaDto: CreateAulaDto) {
    return this.aulaService.create(createAulaDto);
  }

  @Get()
  findAll(@Query('soloActivos') soloActivos?: string) {
    const activos = soloActivos !== 'false';
    return this.aulaService.findAll(activos);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aulaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAulaDto: UpdateAulaDto) {
    return this.aulaService.update(id, updateAulaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aulaService.remove(id);
  }
}