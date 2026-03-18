import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { emailQueue } from './email-queue.js';
import { createEmailWorker } from './email-worker.js';

const emailWorkerPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const worker = createEmailWorker();

  worker.on('failed', (job, err) =>
    app.log.error({ jobId: job?.id, err }, 'Email job failed'),
  );
  worker.on('completed', (job) =>
    app.log.info({ jobId: job.id }, 'Email job completed'),
  );

  // Drains in-flight jobs before the process exits.
  app.addHook('onClose', async () => {
    await worker.close();
    await emailQueue.close();
  });
};

export default fp(emailWorkerPlugin, { name: 'email-worker', fastify: '5.x' });
