import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const prisma = new PrismaClient();
    console.log(req.query);
    async function getUsersWithFullName() {
      const users = await prisma.neworder.findMany({
        select: {
          age: true,
          ages: true,
          id: true,
          ClientName: true,
          clientphonenumber: true,
          Passportnumber: true,
          Religion: true,
          Experience: true,
        },
      });

      // Combine firstName and lastName to create the fullName
      const usersWithFullName = users
        .map((user) => ({
          ...user,
          fakedate: `${user.Passportnumber} ${user.Name} ${user.clientphonenumber} `,
        }))
        .filter((e) => req.query.params == e.fakedate);

      return usersWithFullName;
    }

    getUsersWithFullName()
      .then((users) => console.log(users))
      .catch((e) => console.error(e))
      .finally(async () => await prisma.$disconnect());
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // res.send("error")
  }
}

// import { PrismaClient } from "@prisma/client";
