//@ts-nocheck
//@ts-ignore
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const prisma = new PrismaClient();
    console.log(req.query);
    const users = await prisma.neworder.findMany({
      select: {
        age: true,
        ages: true,
        id: true,
        HomemaidId: true,
        phone: true,
        ClientName: true,
        clientphonenumber: true,
        Passportnumber: true,
        Religion: true,
        Experience: true,
        ExperienceYears: true,
      },
      skip: 10 * (req.query.id - 1),
      take: 10,
    });
    // console.log(users);
    const usersC = await prisma.neworder.count();
    console.log(users.length);
    res.status(200).json({ users: users, count: usersC });

    // Combine firstName and lastName to create the fullName
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // res.send("error")
  }
}

// // import { PrismaClient } from "@prisma/client";

// import { PrismaClient } from "@prisma/client";
// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     const prisma = new PrismaClient();
//     console.log(req.query.id.toString().toUpperCase());
//     const users = await prisma.neworder.findMany({
//       select: {
//         age: true,
//         ages: true,
//         id: true,
//         ClientName: true,
//         clientphonenumber: true,
//         Passportnumber: true,
//         Religion: true,
//         Experience: true,
//       },
//     });

//     // Combine firstName and lastName to create the fullName
//     const usersWithFullName = users
//       .map((user) => ({
//         ...user,
//         fakedate:
//           `${user.Passportnumber} ${user.ClientName} ${user.clientphonenumber} ${user.Religion} `.toUpperCase(),
//       }))
//       .filter((e) =>
//         e.fakedate.includes(req.query.id.toString().toUpperCase())
//       );
//     console.log(usersWithFullName);
//     res.status(200).send(usersWithFullName);
//   } catch (error) {
//     console.log(error);
//     res.status(301).send("createAdmin");

//     // res.send("error")
//   }
// }

// // import { PrismaClient } from "@prisma/client";
