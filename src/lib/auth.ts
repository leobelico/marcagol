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

        token.organizationId =
          (user as any).memberships?.[0]?.organizationId;

        token.organizationName =
          (user as any).memberships?.[0]?.organizationName;
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

        (session.user as any).organizationId =
          token.organizationId;

        (session.user as any).organizationName =
          token.organizationName;
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
        )
          .trim()
          .toLowerCase();

        const password = String(
          credentials.password
        );

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
                tenant: {
                  include: {
                    organization: true,
                  },
                },

                teams: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const valid = await bcrypt.compare(
          password,
          user.password
        );

        if (!valid) {
          return null;
        }

        const memberships = user.tenants.map((tu) => ({
          tenantId: tu.tenantId,

          tenantName: tu.tenant.name,

          organizationId:
            tu.tenant.organizationId,

          organizationName:
            tu.tenant.organization?.name ?? null,

          role: tu.role,

          teamIds: tu.teams.map(
            (tc) => tc.teamId
          ),
        }));

        return {
          id: user.id,

          email: user.email,

          name: user.name,

          isSuperAdmin:
            user.isSuperAdmin,

          memberships,

          organizationId:
            memberships[0]?.organizationId,

          organizationName:
            memberships[0]?.organizationName,
        };
      },
    }),
  ],
});