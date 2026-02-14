import { prisma } from '@repo/db';
import type { FastifyInstance } from 'fastify';
import { hashPassword } from '../../utils/password-util';
import { generateSlug } from '../../utils/slug';

const options = {
    schema: {
        body: {
            type: 'object',
            properties: {
                firstName: { type: 'string', minLength: 1 },
                lastName: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
                organizationName: { type: 'string', minLength: 1 },
            },
            required: ['firstName', 'lastName', 'email', 'password', 'organizationName'],
        },
    },
};

export async function registerRoutes(app: FastifyInstance) {
    app.post('/register',options, async (request, reply) => {
        // TODO: Create a transaction to create a user and associated organization
        const { firstName, lastName, email, password, organizationName, slug } = request.body as {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
            organizationName: string;
            slug?: string;
        };

        const baseSlug = generateSlug(organizationName);
        const chosenSlug = generateSlug(slug ?? baseSlug);

        // get the platform superUser to use as the inviter for the first user
        const superUser = process.env.PLATFORM_SUPERUSER_EMAIL
            ? await prisma.user.findFirst({
                where: { email: process.env.PLATFORM_SUPERUSER_EMAIL },
            })
            : null;

        // Validate request body (schema)
        // Normalize email (lowercase/trim)
        // Start DB transaction
        try {
            const existingOrg = await prisma.organization.findUnique({
                where: { slug: chosenSlug },
                select: { id: true },
            });
            
            if (existingOrg) {
                return reply.status(400).send({ error: 'Organization slug already exists' });
            }

            await prisma.$transaction(async (tx) => {
            // Check if organization with the same slug already exists
            
                const organization = await tx.organization.create({
                    data: {
                        name: organizationName,
                        slug: chosenSlug,
                    },
                });

                const hashedPassword = await hashPassword(password);

                const user = await tx.user.upsert({
                    where: { email: email.toLowerCase().trim() },
                    update: {
                        passwordHash: hashedPassword,
                    },
                    create: {
                        email: email.toLowerCase().trim(),
                        passwordHash: hashedPassword,
                        firstName,
                        lastName
                    },
                });

                const adminRole = await tx.role.findFirst({ where: { name: 'Admin', scope: 'ORGANIZATION' } });

                if (!adminRole) {
                    throw new Error('Admin role not found');
                }

                await tx.roleAssignment.create({
                    data: {
                        userId: user.id,
                        roleId: adminRole.id,
                        organizationId: organization.id,
                    },
                });

                await tx.organizationUser.create({
                    data: {
                        organizationId: organization.id,
                        userId: user.id,
                        status: 'ACTIVE',
                        invitedById: superUser?.id ?? user.id,
                        joinedAt: new Date(),
                    },
                });

                return { organization, user };
                
            });
        
       } catch (error) {
        throw new Error(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
       }

        // TODO: Create verification token and/or payment intent
        // TODO: Send email (after commit)

        reply.send({ message: 'Registration successful', email, organizationName, slug: chosenSlug });
    });
};