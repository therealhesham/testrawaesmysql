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
      const data = req.body;

      const newHomemaid = await prisma.homemaid.create({
        data: {
          Name: data.fields["Name - الاسم"],
          Nationalitycopy: data.fields["Nationality copy"],
          Religion: data.fields["Religion - الديانة"],
          Passportnumber: data.fields["Passport number - رقم الجواز"],
          ExperienceYears: data.fields["Experience - الخبرة"],
          maritalstatus: data.fields["marital status - الحالة الاجتماعية"],
          Experience: data.fields["Experience - الخبرة"],
          dateofbirth: data.fields["date of birth - تاريخ الميلاد"],
          // age: data.age,
          phone: data.fields["phone"],
          clientphonenumber: data.fields["clientphonenumber"],
          bookingstatus: data.fields["bookingstatus"],
          Education: data.fields["Education -  التعليم"],
          ArabicLanguageLeveL: data.fields["Arabic -  العربية"],
          EnglishLanguageLevel: data.fields["English - الانجليزية"],
          LaundryLeveL: data.fields["laundry - الغسيل"],
          IroningLevel: data.fields["Ironing - كوي"],
          CleaningLeveL: data.fields["cleaning - التنظيف"],
          CookingLeveL: data.fields["Cooking - الطبخ"],
          SewingLeveL: data.fields["sewing - الخياطة"],
          BabySitterLevel: data.fields["Babysitting - العناية بالأطفال"],
          Salary: data.fields["Salary - الراتب"],
          officeName: data.fields["officeName"],
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
