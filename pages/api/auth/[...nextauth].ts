import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace this with your own authentication logic (e.g. checking against a DB)
        const user = { id: "1", name: "Test User", email: "test@example.com" }; // Dummy user for example

        if (user) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // This is where you attach data to the token (e.g., user info)
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      // This is where you can merge the JWT token data with the session
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    },
  },

  secret: "ssss", // make sure to set a JWT secret in your .env
});
