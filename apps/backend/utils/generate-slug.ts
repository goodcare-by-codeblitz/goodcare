import { prisma } from '@repo/db';
import type { FastifyInstance } from 'fastify';
import { buildSuggestions, generateSlug } from './slug';

export function generateSlugSuggestions(app: FastifyInstance) {
    app.post("/org-slug/check", async (request, reply) => {
  const { organizationName } = request.body as { organizationName: string };

  const baseSlug = generateSlug(organizationName);

  const exists = await prisma.organization.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!exists) {
    return reply.send({ available: true, suggestedSlug: baseSlug });
  }

  // filter out suggestions that are already taken
  const suggestions = buildSuggestions(organizationName);
  const taken = await prisma.organization.findMany({
    where: { slug: { in: suggestions } },
    select: { slug: true },
  });
  const takenSet = new Set(taken.map(t => t.slug));
  const availableSuggestions = suggestions.filter(s => !takenSet.has(s));

  return reply.send({
    available: false,
    suggestedSlug: baseSlug,
    suggestions: availableSuggestions,
  });
});

}

export { generateSlug };
