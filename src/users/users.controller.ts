import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  crear(@Body() datos: CreateUserDto) {
    return this.usersService.crear(datos);
  }

  @Get()
  obtenerTodos() {
    return this.usersService.obtenerTodos();
  }

  @Get(':id')
  obtenerUno(@Param('id') id: string) {
    return this.usersService.obtenerUno(id);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() datos: UpdateUserDto) {
    return this.usersService.actualizar(id, datos);
  }

  @Delete(':id')
  desactivar(@Param('id') id: string) {
    return this.usersService.desactivar(id);
  }

  @Patch(':id/resetear-password')
  resetearPassword(@Param('id') id: string) {
    return this.usersService.resetearPassword(id);
  }
}