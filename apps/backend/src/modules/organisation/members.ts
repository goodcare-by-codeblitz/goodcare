import { prisma } from '@repo/db';
import type { FastifyInstance } from 'fastify';

export async function OrganisationMembersRoute(app: FastifyInstance) {
    app.post('/members', async (request, reply) => {
        const { organizationSlug } = request.params as { organizationSlug: string };
        const { firstName, lastName, email } = request.body as {
            firstName: string;
            lastName: string;
            email: string;
        };

        const organization = await prisma.organization.findUnique({
            where: { slug: organizationSlug },
            select: { id: true },
        });

        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        const existsingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true },
        });

        if (!existsingUser) {
            return reply.status(404).send({ error: 'User not found' });
        }

        await prisma.$transaction(async (tx) => {

            // Check if user already exists in the organization
            const existingOrgUser = await tx.organizationUser.findUnique({
                where: {
                    userId_organizationId: {
                        userId: existsingUser.id,
                        organizationId: organization.id,
                    },
                },
            });

            if (existingOrgUser) {
                return reply.status(400).send({ error: 'User already exists in this organization' });
            }

            // Create the user in the organization
            const user = await tx.user.upsert({
                where: { email: email.toLowerCase().trim() },
                update: {},
                create: {
                    email: email.toLowerCase().trim(),
                    firstName,
                    lastName,
                    passwordHash: '', // No password since this is an invite-only registration
                },
            });

            await tx.organizationUser.create({
                data: {
                    organizationId: organization.id,
                    userId: user.id,
                    status: 'ACTIVE',
                    invitedById: user.id, // Assuming the invitedBy is the same as the user for simplicity
                    joinedAt: new Date(),
                },
            });

            await tx.roleAssignment.create({
                data: {
                    userId: user.id,
                    roleId: (await tx.role.findFirst({ where: { name: 'Carer', scope: 'ORGANIZATION' } }))?.id!,
                    organizationId: organization.id,
                },
            });

            reply.send({ message: 'User registered successfully', user });

        });
    });

    app.get('/members', async (request, reply) => {
        const { organizationSlug } = request.params as { organizationSlug: string };

        const organization = await prisma.organization.findUnique({
            where: { slug: organizationSlug },
            select: { id: true },
        });

        if (!organization) {
            return reply.status(404).send({ error: 'Organization not found' });
        }

        const members = await prisma.organizationUser.findMany({
            where: { organizationId: organization.id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        reply.send({ members });
    });

    app.patch('/members/:userId', async (request, reply) => { 
        console.log('Update member endpoint hit');
    });

    app.delete('/members/:invite', async (request, reply) => {
        console.log('revoke invite endpoint hit');
    });
}