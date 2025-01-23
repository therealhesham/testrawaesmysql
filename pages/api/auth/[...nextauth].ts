//@ts-nocheck
//@ts-ignore
// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authenticateUser = async (email, password) => {
  // Here, you can replace this with your own user validation logic, e.g., querying a database
  console.log(email);
  const users = [
    {
      id: 1,
      email: "user@example.com",
      password: "password123",
      name: "John Doe",
    },
  ];

  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    return { email: user.email }; // User object to be saved in JWT session
  } else {
    return null; // Return null if user is not found
  }
};

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // console.log(credentials);
        const user = await authenticateUser(
          credentials.email,
          credentials.password
        );
        if (user) {
          return user; // Return user data if authentication is successful
        } else {
          return null; // Return null if authentication fails
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log(user);
        token.email = user.email;
      }
      console.log(token);
      return token; // Add user data to the token
    },
    async session({ session, token }) {
      session.user.email = token.email;
      return session; // Add token data to session
    },
  },
  secret: "sssasadss", // Use a secure environment variable for your secret
});
