//@ts-nocheck
//@ts-ignore
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import FailedModal from "office/components/failedbutton";
import SuccessModal from "office/components/successcoponent";
import { useEffect, useState } from "react";
import Style from "styles/Home.module.css";
import Flag from "react-world-flags";
import { Plus, X } from "lucide-react";

export default function ExternalOffices() {
  const router = useRouter();
  // Define initial offices with people data
  const initialOffices = [
    {
      id: 1,
      name: "Best Migrant Workers International Manpower S",
      country: "Philippines - الفلبين",
      available: 5,
      booked: 3,
      people: [
        { name: "John Doe", position: "Manager", email: "john@example.com" },
        {
          name: "Jane Smith",
          position: "Assistant",
          email: "jane@example.com",
        },
      ],
    },
    {
      id: 2,
      name: "FURSAH INTERNATIONAL AGENCY LIMITED",
      country: "Kenya - كينيا",
      available: 8,
      booked: 2,
      people: [
        {
          name: "Mark Johnson",
          position: "Director",
          email: "mark@example.com",
        },
        { name: "Emma Davis", position: "HR", email: "emma@example.com" },
      ],
    },
    {
      id: 3,
      name: "EARTHMANPOWER PAKISTAN",
      country: "Pakistan - باكستان",
      available: 3,
      booked: 7,
      people: [
        {
          name: "Carlos Perez",
          position: "Manager",
          email: "carlos@example.com",
        },
        {
          name: "Natalie Brown",
          position: "Assistant",
          email: "natalie@example.com",
        },
      ],
    },
    {
      id: 4,
      name: "Office D",
      country: "France",
      available: 6,
      booked: 4,
      people: [
        {
          name: "Sophie Leclair",
          position: "Manager",
          email: "sophie@example.com",
        },
        {
          name: "Pierre Dubois",
          position: "Assistant",
          email: "pierre@example.com",
        },
      ],
    },
  ];

  // Define available countries for filtering
 
  const [offices, setOffices] = useState(initialOffices);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [newOffice, setNewOffice] = useState({
    Officename: "",
    Location: "",
    phonenumber: null,
    booked: 0,
    people: [],
  });
  const [isAddOfficeModalOpen, setIsAddOfficeModalOpen] = useState(false);
  const [fetchedOffices, setFetchedOffices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [date, setDate] = useState(Date.now());

  // Filter offices by selected country
  const filteredOffices =
    selectedCountry === "All"
      ? offices
      : offices.filter((office) => office.country === selectedCountry);

  // Handle office click to show people working in the office
  const handleOfficeClick = (officeId) => {
    setSelectedOffice((prevOffice) =>
      prevOffice === officeId ? null : officeId
    );
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOffice((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle people input change
  const handlePeopleChange = (e, index) => {
    const { name, value } = e.target;
    const newPeople = [...newOffice.people];
    newPeople[index] = {
      ...newPeople[index],
      [name]: value,
    };
    setNewOffice((prev) => ({
      ...prev,
      people: newPeople,
    }));
  };

  // Add new office to the list
  const handleAddOffice = () => {
    setOffices((prevOffices) => [
      ...prevOffices,
      { ...newOffice, id: prevOffices.length + 1 },
    ]);
    setNewOffice({
      name: "",
      country: "",
      available: 0,
      booked: 0,
      people: [],
    });
    setIsAddOfficeModalOpen(false);
  };

  async function createoffice() {
    const newoffice = await fetch("/api/addofficeprisma", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newOffice),
    });
    if (newoffice.status !== 200) return handleOpenFailedModal();
    const jsonify = await newoffice.json();
    setDate(Date.now());
    handleOpenModal();
  }
const [countries,setCountries]=useState([])
  const getter = async () => {
    const waiter = await fetch("/api/externalofficesprisma");
    const waiterjson = await waiter.json();
    setFetchedOffices(waiterjson.offices);
    setCountries(waiterjson.countries)
  };

  useEffect(() => {
    getter();
  }, [date]);

  // Add new person input row
  const addPerson = () => {
    setNewOffice((prev) => ({
      ...prev,
      people: [...prev.people, { name: "", position: "", email: "" }],
    }));
  };

  const handleOpenModal = () => {
    setIsAddOfficeModalOpen(false);
    setIsModalOpen(true);

  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenFailedModal = () => {
    setIsAddOfficeModalOpen(false);
    setIsFailedModalOpen(true);
  };

  const handleCloseFailedModal = () => {
    setIsFailedModalOpen(false);
  };

  return (
    <Layout>
      <div className={`min-h-screen p-6 ${Style["tajawal-regular"]}`}>
        <h1 className="text-3xl font-bold text-center mb-6">
          المكاتب الخارجية
        </h1>

        <FailedModal
          isOpen={isFailedModalOpen}
          onClose={handleCloseFailedModal}
          message="خطأ في اضافة مكتب "
        />
        <SuccessModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          message="تم اضافة مكتب "
        />

        {/* Toggle "Add Office" modal */}
        <div className="mb-6">
          <button
            onClick={() => setIsAddOfficeModalOpen(true)}
            className="px-4 py-2 flex flex-row items-center gap-2 bg-teal-900 text-white rounded-lg"
          >
            <Plus />
            إضافة مكتب
          </button>
        </div>

        {/* Add Office Modal */}
        {isAddOfficeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-50 p-6 rounded-lg shadow-xl w-full max-w-lg relative">
              <button
                onClick={() => setIsAddOfficeModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-semibold mb-4">اضافة مكتب</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="name"
                  
                  value={newOffice.name}
                  onChange={handleInputChange}
                  placeholder="ادخل اسم المكتب"
                  className="p-2 border border-gray-300 rounded-lg"
                />
                <select
                  name="country"
                  value={newOffice.country}
                  onChange={handleInputChange}
                  className=" border border-gray-300 rounded-lg"
                >
                  <option value="">اختر دولة المكتب</option>
                  {countries.map((country) => (
                    country && (
                      <option key={country.id} value={country.Country}>
                        {country.Country}
                      </option>
                    )
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="phonenumber"
                  value={newOffice.phonenumber}
                  onChange={handleInputChange}
                  placeholder="Phonenumber"
                  className="p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {/* People Working Here */}
                </h3>
                {newOffice.people.map((person, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2"
                  >
                    <input
                      type="text"
                      name="name"
                      value={person.name}
                      onChange={(e) => handlePeopleChange(e, index)}
                      placeholder="Name"
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      name="position"
                      value={person.position}
                      onChange={(e) => handlePeopleChange(e, index)}
                      placeholder="Position"
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="email"
                      name="email"
                      value={person.email}
                      onChange={(e) => handlePeopleChange(e, index)}
                      placeholder="Email"
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}
                {/* <button
                  onClick={addPerson}
                  className="mt-2 px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Add Person
                </button> */}
              </div>
              <button
                onClick={createoffice}
                className="mt-4 py-2 px-4 bg-teal-900 text-white rounded-lg"
              >
                حفظ
              </button>
            </div>
          </div>
        )}

        {/* Offices List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fetchedOffices?.map((office) => (
            <div
              onClick={() => {
                router.push("/admin/homemaidoffices?office=" + office.office);
              }}
              key={office.id}
              className="p-6 rounded-lg shadow-md hover:shadow-xl bg-gray-50 flex flex-wrap items-center gap-3 flex-col min-h-[230px] min-w-[230px] transition-all cursor-pointer"
            >
              <h2 className="text-xl font-semibold">{office.office}</h2>
              <p className="text-gray-600"> <span className="text-gray-600">الدولة:</span> {office.Country}</p>
              <p className="text-gray-600"> <span className="text-gray-600">الهاتف:</span>  {office.phoneNumber}</p>
              <p className="text-gray-600"> <span className="text-gray-600">عدد العاملات:</span> {office?._count?.HomeMaid}</p>
            </div>
          ))}
        </div>

        {/* Show People Working at Selected Office */}
        {selectedOffice && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4">
              People Working at{" "}
              {offices.find((office) => office.id === selectedOffice)?.name}
            </h3>
            <table className="min-w-full table-auto bg-gray-50 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-md font-medium text-gray-500">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {offices
                  .find((office) => office.id === selectedOffice)
                  .people.map((person, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-6 py-4 text-md font-medium text-gray-700">
                        {person.name}
                      </td>
                      <td className="px-6 py-4 text-md text-gray-500">
                        {person.position}
                      </td>
                      <td className="px-6 py-4 text-md text-gray-500">
                        {person.email}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

const countriesWithFlags = [
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1ec.svg",
    name: "Uganda",
    code: "ug",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1f9.svg",
    name: "Ethiopia",
    code: "et",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1e9.svg",
    name: "Bangladesh",
    code: "bd",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1ed.svg",
    name: "Philippines",
    code: "ph",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f0.svg",
    name: "Pakistan",
    code: "pk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ea.svg",
    name: "Kenya",
    code: "ke",
  },
];