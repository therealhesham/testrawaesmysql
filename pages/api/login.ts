import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import cookie from "cookie";

const prisma = new PrismaClient();
// Secret key for JWT token signing
const JWT_SECRET = "your-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id, password } = req.body;
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password (if you want to validate the password)
    // const passwordMatch = await bcrypt.compare(password, user.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }

    // Create JWT token
    const token = jwt.sign(
      { username: user.username, role: user.role, picture: user.pictureurl },
      "rawaesecret",
      { expiresIn: "6h" } // Token expires in 6 hours
    );

    // Set JWT token as an HTTP-only cookie in the response
    res.setHeader(
      "Set-Cookie",
      "authToken=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict"
    );
    // Respond with success message
    res.status(200).json(token);
  } catch (e) {
    console.log(e);
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
