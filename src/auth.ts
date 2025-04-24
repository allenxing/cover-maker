import NextAuth from "next-auth";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "@/auth.config";
const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // 自定义登录页面
  // pages: {
  //   signIn: "/login",
  // },
  callbacks: {
    async session({ user, session }) {
      console.log("user", user);
      console.log("session", session);
      return session;
    },
  },
  ...authConfig,
});
