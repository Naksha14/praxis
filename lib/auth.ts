// Add this line at the very top, before the imports
console.log("🔍 Checking DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ MISSING");
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        loginId: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔍 Login attempt for:", credentials?.loginId);
          
          if (!credentials?.loginId || !credentials?.password) {
            console.log("❌ Missing credentials");
            return null;
          }

          console.log("🔍 Looking up user in database...");
          const user = await prisma.user.findUnique({
            where: { loginId: credentials.loginId },
          });
          
          if (!user) {
            console.log("❌ User not found:", credentials.loginId);
            return null;
          }

          console.log("✅ User found:", user.loginId);
          console.log("🔍 Comparing password...");
          
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          
          if (!valid) {
            console.log("❌ Invalid password for:", credentials.loginId);
            return null;
          }

          console.log("✅ Login successful for:", credentials.loginId);
          return {
            id: user.id,
            loginId: user.loginId,
            name: user.name,
            role: user.role,
          } as any;
        } catch (error) {
          console.log("❌ Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.loginId = (user as any).loginId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).loginId = token.loginId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};