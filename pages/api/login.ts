import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// In-memory users database (for demonstration purposes)
const users = [
  {
    username: "testuser",
    password: "$2a$10$OgS3O6/7i7fXkQmDO6YbQO5Mmu2hBthbu/xFNn0cO1LwNKLY6Rzqu", // hashed password for 'password123'
  },
];
const prisma = new PrismaClient();
// Secret key for JWT token signing
const JWT_SECRET = "your-secret-key";

export default async function handler(req, res) {
  try {
    const { username, password } = req.body;
    // Find user by username
    console.log(username);
    const user = await prisma.user.findFirst({
      where: { username: "heshambadr" },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    // const passwordMatch = await bcrypt.compare(password, user.password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }

    // Create JWT token
    const token = jwt.sign(
      { username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Send token in response
    res.status(200).json({ token });
  } catch (e) {
    console.log(e);
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
