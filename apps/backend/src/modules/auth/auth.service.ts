import '@fastify/jwt';
import { prisma } from "@repo/db";
import { hashPassword, verifyPassword } from "@repo/helpers";
import { generateSlug } from "../../../utils/generate-slug";
import type { LoginInput, LoginResult, RegisterInput, RegisterResult } from "./auth.types";


export async function registerService(input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();

  const baseSlug = generateSlug(input.organizationName);
  const chosenSlug = generateSlug(input.slug ?? baseSlug);

  const superUserEmail = process.env.PLATFORM_SUPERUSER_EMAIL?.toLowerCase().trim();

  const superUser = superUserEmail
    ? await prisma.user.findFirst({ where: { email: superUserEmail }, select: { id: true } })
    : null;

  try {
    const result = await prisma.$transaction(async (tx) => {

      const existingOrg = await tx.organization.findUnique({
        where: { slug: chosenSlug },
        select: { id: true },
      });

      if (existingOrg) {
        throw new Error("Organization slug already exists");
      }
      // create org first - rely on DB unique constraint on slug
      const organization = await tx.organization.create({
        data: { name: input.organizationName, slug: chosenSlug },
        select: { id: true, slug: true },
      });

      const hashedPassword = await hashPassword(input.password);

      const user = await tx.user.upsert({
        where: { email },
        update: { passwordHash: hashedPassword },
        create: {
          email,
          passwordHash: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        select: { id: true, email: true },
      });

      const adminRole = await tx.role.findFirst({
        where: { name: "Admin", scope: "ORGANIZATION" },
        select: { id: true },
      });

      if (!adminRole) throw new Error("Admin role not found");

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
          status: "ACTIVE",
          invitedById: superUser?.id ?? user.id,
          joinedAt: new Date(),
        },
      });

      await tx.session.create({
        data: {
          sessionId: input.session.sessionId,
          userId: user.id,
          refreshTokenHash: input.session.tokenHash,
          expiresAt: input.session.expiresAt,
          userAgent: input.session.userAgent,
          ip: input.session.ip,
        },


      });

      return { organizationId: organization.id, userId: user.id, email: user.email, chosenSlug: organization.slug };
    });

    return result;
  } catch (e) {
    // slug conflict (unique constraint)
    // if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    //   // assumes slug is unique on Organization
    //   throw new Error("Organization slug already exists");
    // }
    throw e;
  }
}

export async function loginService(input: LoginInput): Promise<LoginResult> {
  const email = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      organizationUsers: {
        select: {
          organization: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  await prisma.session.create({
    data: {
      sessionId: input.session.sessionId,
      userId: user.id,
      refreshTokenHash: input.session.tokenHash,
      expiresAt: input.session.expiresAt,
      userAgent: input.session.userAgent,
      ip: input.session.ip,
    },
   });

  return { userId: user.id, email: user.email, organization: user.organizationUsers[0]!.organization };
}

export async function logoutService(userId: string) {  
  await prisma.session.deleteMany({
    where: {
      userId,
    },
  });
}