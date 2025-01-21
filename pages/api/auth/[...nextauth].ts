//@ts-ignore

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
//@ts-ignore
import mongoose from "mongoose";

// // export default db;
console.log("credentials")



export default NextAuth({
  pages: {
    
    signIn: '/example/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      //@ts-ignore
      async authorize(credentials: any,req) {


        // await db.connect();
console.log("credentials","credentials")
        // const user = await User.findOne({ email: credentials.email });

        // // Check if user exists
        // if (!user) {
        //   return null;
        // }

        // // Validate password
        // const isPasswordMatch = await isPasswordValid(
        //   "hesham",
        //   "hesham"
        // );

        // if (!isPasswordMatch) {
        //   return null;
        // }

        return {
          name: "hesham",
          email: "heshamahmedbadr@gmail.com"
        };
      },
    }),
  ],

  secret: process.env.SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 1 * 1 * 60 * 60, // 30 Days
  },
});
