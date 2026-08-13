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
        token.teamId = (user as any).teamId;
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

        (session.user as any).teamId =
          token.teamId;

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
        if (
          
          !credentials?.identifier ||
          !credentials?.password
          
        ) {
          return null;
        }

        const identifier = String(
          credentials.identifier
        ).trim();

        const password = String(
          credentials.password
        );

        // Buscar por email O teléfono
 const user = await prisma.user.findFirst({
  where: {
    OR: [
      {
        email: identifier,
      },
      {
        phone: identifier,
      },
    ],
  },

  include: {
    tenants: true,
  },
});

console.log("AUTH DEBUG:", {
  identifier,
  userFound: !!user,
  userId: user?.id,
  isSuperAdmin: user?.isSuperAdmin,
  hasPassword: !!user?.password,
});

if (!user || !user.password) {
  return null;
}

const valid = await bcrypt.compare(
  password,
  user.password
);

console.log("AUTH PASSWORD VALID:", valid);

if (!valid) {
  return null;
}

        // Buscar la relación del usuario
        // con el torneo/equipo
        const tenantUser = user.tenants[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,

          isSuperAdmin: user.isSuperAdmin,

          role: tenantUser?.role ?? null,
          teamId: tenantUser?.teamId ?? null,
          tenantId: tenantUser?.tenantId ?? null,
        };
      },
    }),
  ],
});