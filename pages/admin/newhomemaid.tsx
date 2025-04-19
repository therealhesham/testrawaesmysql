// pages/homemaid/new.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { NextPageContext } from "next";
import axios from "axios";
import prisma from "pages/api/globalprisma";
import Layout from "example/containers/Layout";
export default function NewHomemaid(prop) {
  const [form, setForm] = useState<any>({});
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [offices, setOffices] = useState(prop.offices);
  const [officeName, setOfficeName] = useState("");

  const [cloudinaryImage, setCloudinaryImage] = useState("");

  const router = useRouter();

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append("upload_preset", "z8q1vykv");
    formData.append("cloud_name", "duo8svqci");
    formData.append("folder", "samples");
    // axios
    await axios
      .post(`https://api.cloudinary.com/v1_1/duo8svqci/image/upload`, formData)
      .then((response) => {
        setCloudinaryImage(response.data.secure_url);
      })
      .catch((error) => {});
  };

  const handleOfficeChange = (e) => {
    setOfficeName(e.target.value);
  };

  const [Nationalitycopy, setNationalitycopy] = useState("");

  const body = [
    {
      fields: {
        Picture: [
          {
            url: cloudinaryImage,
          },
        ],
        // "External office - المكتب الخارجي": [router.query.slug],
        "Name - الاسم": form.Name,
        // officeName: officeName,
        "Nationality copy": Nationalitycopy,
        "Religion - الديانة": form.Religion,
        "marital status - الحالة الاجتماعية": form.maritalstatus,
        "Education -  التعليم": form.Education,
        "Experience - الخبرة": "Intermediate | مدربة بخبرة متوسطة",
        "Passport number - رقم الجواز": form.Passportnumber,
        "Arabic -  العربية": form.ArabicLanguageLeveL,
        "English - الانجليزية": form.EnglishLanguageLevel,
        "Salary - الراتب": form.Salary,
        "laundry - الغسيل": form.laundryLeveL,
        "Ironing - كوي": form.IroningLevel,
        "cleaning - التنظيف": form.CleaningLeveL,
        "Cooking - الطبخ": form.CookingLeveL,
        "sewing - الخياطة": form.SewingLeveL,
        "Babysitting - العناية بالأطفال": form.BabySitterLevel,
        "date of birth - تاريخ الميلاد": form.dateofbirth,
      },
    },
  ];
  // Filter offices based on user input for autocomplete
  const filteredOffices = offices.filter((office) =>
    office?.office?.toLowerCase().includes(officeName.toLowerCase())
  );

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToCloudinary = async () => {
    if (!image) return null;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const uploadedImage = await uploadImageToCloudinary();

    const res = await fetch("/api/createhomemaid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
      }),
    });

    if (res.ok) {
      router.push("/");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 shadow rounded">
          <h1 className="text-2xl font-bold mb-6">Add New Homemaid CV</h1>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Input name="Name" label="Name" onChange={handleChange} />
            <Input
              name="Nationalitycopy"
              label="Nationality"
              onChange={handleChange}
            />
            <Input name="Religion" label="Religion" onChange={handleChange} />
            <Input
              name="Passportnumber"
              label="Passport Number"
              onChange={handleChange}
            />
            <Input
              name="ExperienceYears"
              label="Experience Years"
              onChange={handleChange}
            />
            <Input
              name="maritalstatus"
              label="Marital Status"
              onChange={handleChange}
            />
            <Input
              name="Experience"
              label="Experience"
              onChange={handleChange}
            />
            <Input
              name="dateofbirth"
              label="Date of Birth"
              onChange={handleChange}
            />
            <Input name="age" label="Age" onChange={handleChange} />
            <Input name="phone" label="Phone" onChange={handleChange} />
            <Input
              name="clientphonenumber"
              label="Client Phone Number"
              onChange={handleChange}
            />
            <Input
              name="bookingstatus"
              label="Booking Status"
              onChange={handleChange}
            />
            <Input name="Education" label="Education" onChange={handleChange} />
            <Input
              name="ArabicLanguageLeveL"
              label="Arabic Level"
              onChange={handleChange}
            />
            <Input
              name="EnglishLanguageLevel"
              label="English Level"
              onChange={handleChange}
            />
            <Input
              name="LaundryLeveL"
              label="Laundry Level"
              onChange={handleChange}
            />
            <Input
              name="IroningLevel"
              label="Ironing Level"
              onChange={handleChange}
            />
            <Input
              name="CleaningLeveL"
              label="Cleaning Level"
              onChange={handleChange}
            />
            <Input
              name="CookingLeveL"
              label="Cooking Level"
              onChange={handleChange}
            />
            <Input
              name="SewingLeveL"
              label="Sewing Level"
              onChange={handleChange}
            />
            <Input
              name="BabySitterLevel"
              label="Babysitting Level"
              onChange={handleChange}
            />
            <Input name="Salary" label="Salary" onChange={handleChange} />
            <div className="mb-4">
              <label
                htmlFor="externalOfficeStatus"
                className="block text-sm font-medium text-gray-700"
              >
                اسم المكتب الخارجي
              </label>
              <input
                autoComplete="off"
                type="text"
                id="externalOfficeStatus"
                value={officeName}
                onChange={handleOfficeChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ابدأ بالكتابة لاختيار أو إضافة مكتب"
              />

              {/* Show filtered office suggestions */}
              {officeName && (
                <ul className="mt-2 border border-gray-300 rounded-md bg-white shadow-md max-h-40 overflow-auto">
                  {filteredOffices.length > 0
                    ? filteredOffices
                        .filter((office) => office.office !== officeName) // Filter out selected office
                        .map((office, index) => (
                          <li
                            key={index}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                            onClick={() => {
                              setNationalitycopy(office.Country);
                              setOfficeName(office.office);
                            }} // Set selected office
                          >
                            {office.office}
                          </li>
                        ))
                    : // (
                      //   <li
                      //     className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                      //     onClick={() => (filteredOffices = [])} // Handle adding new office when clicked
                      //   >
                      //     {officeName}
                      //   </li>
                      // )
                      null}
                </ul>
              )}
            </div>

            {/* IMAGE UPLOAD */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="mt-2"
              />
              {preview && (
                <img
                  src={cloudinaryImage}
                  alt="Preview"
                  className="mt-4 w-40 h-40 object-cover rounded"
                />
              )}
            </div>

            <button
              type="submit"
              className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save CV
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const Input = ({ name, label, onChange }: any) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

export async function getServerSideProps(context: NextPageContext) {
  const { req, res } = context;
  try {
    // const isAuthenticated = req.cookies.authToken ? true : false;
    // console.log(req.cookies.authToken);
    // // jwtDecode(req.cookies.)
    // if (!isAuthenticated) {
    //   // Redirect the user to login page before rendering the component
    //   return {
    //     redirect: {
    //       destination: "/admin/login", // Redirect URL
    //       permanent: false, // Set to true if you want a permanent redirect
    //     },
    //   };
    // }
    // const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    // console.log(user);
    const offices = await prisma.offices.findMany();
    // If authenticated, continue with rendering the page
    // const offices = new
    return {
      props: {
        //  user,
        offices,
      }, // Empty object to pass props if needed
    };
  } catch (error) {
    console.log("error");
    return {
      redirect: {
        destination: "/admin/login", // Redirect URL
        permanent: false, // Set to true if you want a permanent redirect
      },
    };
  }
}
