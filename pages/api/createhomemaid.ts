// pages/api/homemaid/create.ts
import { PrismaClient } from "@prisma/client";
import Airtable from "airtable";
var base = new Airtable({
  apiKey:
    "patovGWItwsDoXzng.84565b10c27835cf1ac38c9f9b64e14a42a6ac3b825728e3970dffa94292577c",
}).base("app1mph1VMncBBJid");

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    // sendSuggestion()
    // try {
    //   const result = await new Promise((resolve, reject) => {
    //     const create = base("السير الذاتية").create(req.body);

    //     resolve(create);
    //   });

    //   console.log(result);
    // } catch (error) {
    //   console.log(error);
    // }

    try {
      const { fields } = req.body[0];
      console.log(fields["Name - الاسم"]);
      const newHomemaid = await prisma.homemaid.create({
        data: {
          Name: fields["Name - الاسم"],
          Nationalitycopy: fields["Nationality copy"],
          Religion: fields["Religion - الديانة"],
          Passportnumber: fields["Passport number - رقم الجواز"],
          ExperienceYears: fields["Experience - الخبرة"],
          maritalstatus: fields["marital status - الحالة الاجتماعية"],
          Experience: fields["Experience - الخبرة"],
          dateofbirth: fields["date of birth - تاريخ الميلاد"],
          // age: data.age,
          phone: fields["phone"],
          clientphonenumber: fields["clientphonenumber"],
          bookingstatus: fields["bookingstatus"],
          Education: fields["Education -  التعليم"],
          ArabicLanguageLeveL: fields["Arabic -  العربية"],
          EnglishLanguageLevel: fields["English - الانجليزية"],
          LaundryLeveL: fields["laundry - الغسيل"],
          IroningLevel: fields["Ironing - كوي"],
          CleaningLeveL: fields["cleaning - التنظيف"],
          CookingLeveL: fields["Cooking - الطبخ"],
          SewingLeveL: fields["sewing - الخياطة"],
          BabySitterLevel: fields["Babysitting - العناية بالأطفال"],
          Salary: fields["Salary - الراتب"],
          officeName: fields["officeName"],
          // Picture: data.Picture || null,
        },
      });

      res.status(200).json(newHomemaid);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Error creating homemaid CV" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
