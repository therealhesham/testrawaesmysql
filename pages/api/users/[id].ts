import prisma from "../globalprisma";

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (method === "PUT") {
    try {
      const { phonenumber, pictureurl, username, password, role, idnumber } =
        req.body;
      const user = await prisma.user.update({
        where: { username: id },
        data: {
          phonenumber,
          pictureurl,
          // password,
        },
      });
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ error: "Error updating user" });
    }
  } else if (method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { username: id },
        select: {
          id: true,
          phonenumber: true,
          pictureurl: true,
          username: true,
          role: true,
          idnumber: true,
        },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Error fetching user" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
