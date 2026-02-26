export type RegisterBody = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
  slug: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type LoginResult = {
  userId: string;
  email: string;
  organization: {
    id: string;
    slug: string;
    name: string;
  };
};

export type RegisterResult = {
  organizationId: string;
  email: string;
  userId: string;
  chosenSlug: string;
};

export interface ISessionInput {
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ip: string;
}

export type RegisterInput = RegisterBody & { session: ISessionInput };
export type LoginInput = LoginBody & { session: ISessionInput };
