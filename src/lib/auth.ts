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
        token.role = (user as any).role;
        token.teamIds = (user as any).teamIds;
        token.tenantId = (user as any).tenantId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        (session.user as any).isSuperAdmin =
          token.isSuperAdmin;

        (session.user as any).role =
          token.role;

        (session.user as any).teamIds =
          token.teamIds;

        (session.user as any).tenantId =
          token.tenantId;
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

  const tenantUser = user.tenants[0];

  // Todos los equipos que este usuario maneja EN ESE torneo
  // (antes era un solo teamId, ahora puede ser varios)
  const teamIds = tenantUser
    ? tenantUser.teams.map((tc) => tc.teamId)
    : [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
    role: tenantUser?.role ?? null,
    teamIds,
    tenantId: tenantUser?.tenantId ?? null,
  };
},
    }),
  ],
});