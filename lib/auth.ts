import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "./firebase-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        await dbConnect();

        // 1. Google (Firebase) Authentication Flow
        if (credentials?.idToken) {
          try {
            const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
            if (!decodedToken.email) throw new Error("No email in Google record");

            let user = await User.findOne({ email: decodedToken.email.toLowerCase() });

            // Auto-provision a new 'tourist' user if they don't exist
            if (!user) {
              const randomPassword = await bcrypt.hash(Math.random().toString(36).substring(2), 10);
              user = await User.create({
                name: decodedToken.name || "Google User",
                email: decodedToken.email.toLowerCase(),
                password: randomPassword,
                role: "tourist",
              });
            }

            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          } catch (error) {
            console.error("Firebase Auth Error:", error);
            throw new Error("Invalid Google sign-in.");
          }
        }

        // 2. Standard Email/Password Authentication Flow
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string }).id = token.id as string;
        (session.user as { id: string; role: string }).role =
          token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
