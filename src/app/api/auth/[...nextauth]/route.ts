import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth({
  ...authOptions,
  logger: {
    error: (code, metadata) => {
      console.error("🚨 NextAuth Error:", code, metadata);
    },
    warn: (code) => {
      console.warn("⚠️ NextAuth Warning:", code);
    },
    debug: (code, metadata) => {
      console.log("🔍 NextAuth Debug:", code, metadata);
    },
  },
});

export { handler as GET, handler as POST };
