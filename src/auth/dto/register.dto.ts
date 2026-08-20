import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(10, 10)
  @Matches(/^\d{10}$/, {
    message: 'La cédula debe contener exactamente 10 dígitos.',
  })
  cedula!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsBoolean()
  @Equals(true, {
    message: 'Debes aceptar la Política de Privacidad para registrarte.',
  })
  aceptaPoliticaPrivacidad!: boolean;
}
