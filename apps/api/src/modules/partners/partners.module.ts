// apps/api/src/modules/partners/partners.module.ts
import { Module }               from '@nestjs/common';
import { AuthModule }           from '../auth/auth.module';
import { PrismaModule }         from '../../database/prisma.module';
import { PartnersService }      from './partners.service';
import { PartnersController }   from './partners.controller';
import { InterestController }   from './interest.controller';

@Module({
  imports:     [AuthModule, PrismaModule],
  providers:   [PartnersService],
  controllers: [PartnersController, InterestController],
  exports:     [PartnersService],
})
export class PartnersModule {}