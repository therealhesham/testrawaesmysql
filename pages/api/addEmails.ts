import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, department, userId } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    try {
      // Check if the email already exists
      const existingEmail = await prisma.emaillist.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check if the userId is already associated with another email
      if (userId) {
        const existingUserEmail = await prisma.emaillist.findFirst({
          where: { userId: parseInt(userId) },
        });
        if (existingUserEmail) {
          return res.status(400).json({ message: "This user already has an email" });
        }
      }

      const newEmail = await prisma.emaillist.create({
        data: {
          email,
          department: department || null,
          userId: userId ? parseInt(userId) : null,
        },
      });
      return res.status(201).json(newEmail);
    } catch (error) {
      console.error("Error adding email:", error);
      return res.status(500).json({ message: "Failed to add email" });
    }
  } else if (req.method === "GET" && !req.query.searchUser) {
    try {
      const emails = await prisma.emaillist.findMany({
        select: {
          id: true,
          email: true,
          department: true,
          createdAt: true,
          User: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return res.status(200).json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      return res.status(500).json({ message: "Failed to fetch emails" });
    }
  } else if (req.method === "GET" && req.query.searchUser) {
    const { searchUser } = req.query;
    try {
      const users = await prisma.user.findMany({
        where: {
          username: {
            contains: searchUser,
            // mode: "insensitive",
          },
        },
        select: {
          id: true,
          username: true,
        },
        take: 10,
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ message: "Failed to search users" });
    }
  } else if (req.method === "PATCH") {
    const { id, email, department, userId } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid email ID" });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    try {
      // Check if the email is already used by another record
      if (email) {
        const existingEmail = await prisma.emaillist.findFirst({
          where: {
            email,
            id: { not: parseInt(id) }, // Exclude the current email
          },
        });
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Check if the userId is already associated with another email
      if (userId) {
        const existingUserEmail = await prisma.emaillist.findFirst({
          where: {
            userId: parseInt(userId),
            id: { not: parseInt(id) }, // Exclude the current email
          },
        });
        if (existingUserEmail) {
          return res.status(400).json({ message: "This user already has an email" });
        }
      }

      const updatedEmail = await prisma.emaillist.update({
        where: { id: parseInt(id) },
        data: {
          email: email || undefined,
          department: department || null,
          userId: userId ? parseInt(userId) : null,
        },
      });
      return res.status(200).json(updatedEmail);
    } catch (error) {
      console.error("Error updating email:", error);
      return res.status(500).json({ message: "Failed to update email" });
    }
  } else if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid email ID" });
    }

    try {
      await prisma.emaillist.delete({
        where: { id: parseInt(id) },
      });
      return res.status(200).json({ message: "Email deleted successfully" });
    } catch (error) {
      console.error("Error deleting email:", error);
      return res.status(500).json({ message: "Failed to delete email" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}