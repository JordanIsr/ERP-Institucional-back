import { IsString, IsEmail, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../../auth/roles';

export class CreateUserDto {
  @IsString()
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole, { message: 'El rol proporcionado no es válido' })
  role!: UserRole;
}