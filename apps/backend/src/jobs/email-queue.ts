import type { ConnectionOptions } from 'bullmq';
import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis.js';
import {
  EMAIL_QUEUE_NAME,
  type EmailJobPayload,
  type InvitationEmailPayload,
  type PasswordResetEmailPayload,
  type WelcomeEmailPayload,
} from './job-types.js';

const emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
  connection: redisConnection.duplicate() as unknown as ConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export async function enqueueWelcomeEmail(
  payload: Omit<WelcomeEmailPayload, 'type'>,
): Promise<void> {
  await emailQueue.add('welcome' as string & {}, { type: 'welcome', ...payload });
}

export async function enqueuePasswordResetEmail(
  payload: Omit<PasswordResetEmailPayload, 'type'>,
): Promise<void> {
  await emailQueue.add('password_reset' as string & {}, { type: 'password_reset', ...payload });
}

export async function enqueueInvitationEmail(
  payload: Omit<InvitationEmailPayload, 'type'>,
): Promise<void> {
  await emailQueue.add('invitation' as string & {}, { type: 'invitation', ...payload });
}

export { emailQueue };
