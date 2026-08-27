import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.memberships = (user as any).memberships;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        (session.user as any).isSuperAdmin =
          token.isSuperAdmin;

        (session.user as any).memberships =
          token.memberships;
      }

      return session;
    },
  },

  providers: [
    Credentials({
      credentials: {
        identifier: {
          label: "Email o teléfono",
          type: "text",
        },

        password: {
          label: "Contraseña",
          type: "password",
        },
      },

async authorize(credentials) {
  if (!credentials?.identifier || !credentials?.password) {
    return null;
  }

  const identifier = String(credentials.identifier).trim().toLowerCase();
  const password = String(credentials.password);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier },
      ],
    },
    include: {
      tenants: {
        include: {
          tenant: true,
          teams: true, // TeamCaptain[] de cada TenantUser
        },
      },
    },
  });

  if (!user || !user.password) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return null;
  }

  // Una membership por CADA torneo/liga donde el usuario tiene
  // un TenantUser (antes solo se tomaba tenants[0] y se perdían
  // las demás ligas)
  const memberships = user.tenants.map((tu) => ({
    tenantId: tu.tenantId,
    tenantName: tu.tenant.name,
    role: tu.role,
    teamIds: tu.teams.map((tc) => tc.teamId),
  }));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    memberships,
  };
},
    }),
  ],
});