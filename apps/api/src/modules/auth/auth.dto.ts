// apps/api/src/modules/auth/auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'partner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'mypassword123' })
  @IsString()
  @MinLength(8)
  password!: string;
}