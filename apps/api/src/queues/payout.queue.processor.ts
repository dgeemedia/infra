import { Process, Processor } from '@nestjs/bull';
import { Logger }             from '@nestjs/common';
import { Job }                from 'bull';

import { PayoutsService } from '../modules/payouts/payouts.service';
import { WebhooksService } from '../modules/webhooks/webhooks.service';
import { PAYOUT_QUEUE }   from './payout.queue';

interface PayoutJobData {
  payoutId: string;
}

@Processor(PAYOUT_QUEUE)
export class PayoutQueueProcessor {
  private readonly logger = new Logger(PayoutQueueProcessor.name);

  constructor(
    private readonly payoutsService:  PayoutsService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Process('dispatch')
  async handleDispatch(job: Job<PayoutJobData>): Promise<void> {
    const { payoutId } = job.data;

    this.logger.log(
      `Processing payout ${payoutId} — attempt ${job.attemptsMade + 1}`,
    );

    try {
      // Dispatch to PSP — throws on failure (triggers BullMQ retry)
      await this.payoutsService.dispatch(payoutId);

      // Fire success webhook to partner
      await this.webhooksService.firePayoutEvent(payoutId, 'payout.delivered');

      this.logger.log(`Payout ${payoutId} dispatched and webhook fired`);
    } catch (error) {
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 5);

      if (isLastAttempt) {
        this.logger.error(
          `Payout ${payoutId} exhausted all retries — marking FAILED`,
          error,
        );
        // Fire failure webhook only on final attempt
        await this.webhooksService.firePayoutEvent(payoutId, 'payout.failed');
      } else {
        this.logger.warn(
          `Payout ${payoutId} attempt ${job.attemptsMade + 1} failed — will retry`,
        );
        // Fire processing webhook on first attempt only
        if (job.attemptsMade === 0) {
          await this.webhooksService.firePayoutEvent(payoutId, 'payout.processing');
        }
      }

      // Re-throw so BullMQ retries the job
      throw error;
    }
  }
}
