import type { ConnectionOptions } from 'bullmq';
import { Worker, type Job } from 'bullmq';
import { buildBaseAppUrl, buildOrgAppUrl } from '../../utils/app-url.js';
import { sendEmail } from '../../utils/send-email.js';
import { redisConnection } from '../lib/redis.js';
import { EMAIL_QUEUE_NAME, type EmailJobPayload } from './job-types.js';

// Exported for unit testing — no Redis connection needed to test this function.
export async function processEmailJob(job: Job<EmailJobPayload>): Promise<void> {
  const data = job.data;
  switch (data.type) {
    case 'welcome':
      await sendEmail(
        data.to,
        'Welcome to GoodCare',
        `Hi ${data.firstName}, your organisation "${data.organizationName}" is live at ${buildOrgAppUrl(data.slug, '/')}`,
      );
      break;
    case 'password_reset':
      {
        const params = new URLSearchParams({ token: data.resetToken });
        if (data.nextPath) {
          params.set('next', data.nextPath);
        }

        await sendEmail(
          data.to,
          'Reset your GoodCare password',
          `Reset your password using the link below (expires ${data.expiresAt.toISOString()}):\n\n${buildBaseAppUrl(`/reset-password?${params.toString()}`)}`,
        );
        break;
      }
    case 'invitation':
      await sendEmail(
        data.to,
        `You've been invited to ${data.organizationName} on GoodCare`,
        `Hi ${data.firstName}, you've been invited to join ${data.organizationName} on GoodCare.\n\nAccept your invitation here:\n${buildOrgAppUrl(data.slug, `/invite/accept?token=${data.inviteToken}`)}`,
      );
      break;
    default: {
      const _exhaustive: never = data; // TypeScript exhaustiveness check
      throw new Error(`Unknown email job type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// Called only by the Fastify plugin — not at module load time.
export function createEmailWorker(): Worker<EmailJobPayload> {
  return new Worker<EmailJobPayload>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redisConnection.duplicate() as unknown as ConnectionOptions,
    concurrency: 5,
  });
}
