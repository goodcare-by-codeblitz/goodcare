import { prisma } from '@repo/db';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { buildSuggestions, generateSlug } from './slug';

type OrgSlugCheckBody = {
	organizationName?: string;
	slug?: string;
};

export async function orgSlugCheckHandler(
	request: FastifyRequest<{ Body: OrgSlugCheckBody }>,
	reply: FastifyReply,
) {
	const organizationName = request.body?.organizationName?.trim();
	const slugInput = request.body?.slug?.trim();

	if (!organizationName && !slugInput) {
		return reply
			.status(400)
			.send({ error: 'organizationName or slug is required' });
	}

	const baseSlug = generateSlug(organizationName ?? slugInput ?? '');
	const candidateSlug = generateSlug(slugInput ?? baseSlug);

	const exists = await prisma.organization.findUnique({
		where: { slug: candidateSlug },
		select: { id: true },
	});

	if (!exists) {
		return reply.send({ available: true, suggestedSlug: candidateSlug });
	}

	// Filter out suggestions that are already taken.
	const suggestions = buildSuggestions(organizationName ?? slugInput ?? '');
	const taken = await prisma.organization.findMany({
		where: { slug: { in: suggestions } },
		select: { slug: true },
	});
	const takenSet = new Set(taken.map((t) => t.slug));
	const availableSuggestions = suggestions.filter((s) => !takenSet.has(s));

	return reply.send({
		available: false,
		suggestedSlug: candidateSlug,
		suggestions: availableSuggestions,
	});
}

export function generateSlugSuggestions(app: FastifyInstance) {
	app.post('/org-slug/check', orgSlugCheckHandler);
}

export { generateSlug };
