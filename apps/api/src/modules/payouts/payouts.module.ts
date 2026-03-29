import { Module }        from '@nestjs/common';
import { BullModule }    from '@nestjs/bull';

import { ComplianceModule }    from '../compliance/compliance.module';
import { FxModule }            from '../fx/fx.module';
import { PspModule }           from '../psp/psp.module';
import { PAYOUT_QUEUE }        from '../../queues/payout.queue';
import { PayoutsController }   from './payouts.controller';
import { PayoutsRepository }   from './payouts.repository';
import { PayoutsService }      from './payouts.service';
import { PayoutQueueProcessor } from '../../queues/payout.queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: PAYOUT_QUEUE }),
    FxModule,
    ComplianceModule,
    PspModule,
  ],
  controllers: [PayoutsController],
  providers:   [PayoutsService, PayoutsRepository, PayoutQueueProcessor],
  exports:     [PayoutsService],
})
export class PayoutsModule {}
