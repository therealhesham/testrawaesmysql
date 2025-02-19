//@ts-nocheck
//@ts-ignore
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import FailedModal from "office/components/failedbutton";
import SuccessModal from "office/components/successcoponent";
import { useEffect, useState } from "react";
import Flag from "react-world-flags";
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
  const countries = [
    "All",
    "Philippines - الفلبين",
    "Kenya - كينيا",
    "Pakistan - باكستان",
    "France",
    // Add more countries as needed
  ];

  const [offices, setOffices] = useState(initialOffices); // Office state
  const [selectedCountry, setSelectedCountry] = useState("All"); // Filter by country state
  const [selectedOffice, setSelectedOffice] = useState(null); // Track selected office
  const [newOffice, setNewOffice] = useState({
    Officename: "",
    Location: "",
    phonenumber: 0,
    booked: 0,
    people: [],
  }); // New office form data

  const [isAddOfficeVisible, setIsAddOfficeVisible] = useState(false); // State for toggling visibility of the "Add Office" section

  // Filter offices by selected country
  const filteredOffices =
    selectedCountry === "All"
      ? offices
      : offices.filter((office) => office.country === selectedCountry);

  // Handle office click to show people working in the office
  const handleOfficeClick = (officeId) => {
    setSelectedOffice((prevOffice) =>
      prevOffice === officeId ? null : officeId
    ); // Toggle visibility of office details
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
    setIsAddOfficeVisible(false); // Hide the form after adding the office
  };
  const [date, setDate] = useState(Date.now());
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
  const [fetchedOffices, setFetchedOffices] = useState([]);
  const getter = async () => {
    const waiter = await fetch("/api/externalofficesprisma");
    const waiterjson = await waiter.json();
    setFetchedOffices(waiterjson);
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);

  const handleOpenFailedModal = () => {
    setIsFailedModalOpen(true);
  };

  const handleCloseFailedModal = () => {
    setIsFailedModalOpen(false);
  };
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
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
        {/* Toggle "Add Office" form visibility */}
        <div className="mb-6">
          <button
            onClick={() => setIsAddOfficeVisible(!isAddOfficeVisible)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg"
          >
            {isAddOfficeVisible ? "Cancel" : "Add Office"}
          </button>
        </div>

        {/* Add Office Form (conditionally rendered) */}
        {isAddOfficeVisible && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Add a New Office</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="name"
                value={newOffice.name}
                onChange={handleInputChange}
                placeholder="Office Name"
                className="p-2 border border-gray-300 rounded-lg"
              />
              <select
                name="country"
                value={newOffice.country}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Country</option>
                {countriesWithFlags.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name} ||
                    {/* <Image /> */}
                    <img src={country.flag} />
                  </option>
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
                People Working Here
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
                  <input
                    type="text"
                    name="phoneNumber"
                    value={person.email}
                    onChange={(e) => handlePeopleChange(e, index)}
                    placeholder="phonenumber"
                    className="p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={createoffice}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg"
            >
              Add Office
            </button>
          </div>
        )}

        {/* Country Filter */}
        {/* <div className="mb-6 text-center">
          <label htmlFor="country" className="mr-2 text-lg">
            Filter by Country:
          </label>
          <select
            id="country"
            className="p-2 border border-gray-300 rounded-lg"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div> */}

        {/* Offices List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fetchedOffices.map((office) => (
            <div
              onClick={() => {
                router.push("/admin/homemaidoffices?office=" + office.office);
              }}
              key={office.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              <h2 className="text-xl font-semibold">{office.office}</h2>
              <p className="text-gray-600"> {office.Country}</p>
              <p className="text-gray-600"> {office?.phoneNumber}</p>

              {/* Available and Booked Numbers */}
              {/* <div className="flex justify-between mt-4">
                <div className="flex items-center">
                  <span className="bg-green-500 text-white text-sm font-semibold rounded-full w-8 h-8 flex items-center justify-center">
                    {office.available}
                  </span>
                  <span className="ml-2 text-gray-600">Available</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-red-500 text-white text-sm font-semibold rounded-full w-8 h-8 flex items-center justify-center">
                    {office.booked}
                  </span>
                  <span className="ml-2 text-gray-600">Booked</span>
                </div>
              </div> */}
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
            <table className="min-w-full table-auto bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody>
                {offices
                  .find((office) => office.id === selectedOffice)
                  .people.map((person, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {person.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {person.position}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
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
  ,
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ea.svg",
    name: "Kenya",
    code: "ke",
  },
];
