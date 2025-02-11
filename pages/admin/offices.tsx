//@ts-nocheck
//@ts-ignore
import Layout from "example/containers/Layout";
import FailedModal from "office/components/failedbutton";
import SuccessModal from "office/components/successcoponent";
import { useEffect, useState } from "react";

export default function ExternalOffices() {
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
    const waiter = await fetch("../api/externalofficesprisma");
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
                    {country.name}
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
              key={office.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer"
              onClick={() => handleOfficeClick(office.id)}
            >
              <h2 className="text-xl font-semibold">{office.office}</h2>
              <p className="text-gray-600"> {office.Country}</p>

              {/* Available and Booked Numbers */}
              <div className="flex justify-between mt-4">
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
              </div>
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
  { name: "Afghanistan", flag: "🇦🇫" },
  { name: "Albania", flag: "🇦🇱" },
  { name: "Algeria", flag: "🇩🇿" },
  { name: "Andorra", flag: "🇦🇩" },
  { name: "Angola", flag: "🇦🇴" },
  { name: "Antigua and Barbuda", flag: "🇦🇬" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Armenia", flag: "🇦🇲" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Azerbaijan", flag: "🇦🇿" },
  { name: "Bahamas", flag: "🇧🇸" },
  { name: "Bahrain", flag: "🇧🇭" },
  { name: "Bangladesh", flag: "🇧🇩" },
  { name: "Barbados", flag: "🇧🇧" },
  { name: "Belarus", flag: "🇧🇾" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Belize", flag: "🇧🇿" },
  { name: "Benin", flag: "🇧🇯" },
  { name: "Bhutan", flag: "🇧🇹" },
  { name: "Bolivia", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { name: "Botswana", flag: "🇧🇼" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Brunei", flag: "🇧🇳" },
  { name: "Bulgaria", flag: "🇧🇬" },
  { name: "Burkina Faso", flag: "🇧🇫" },
  { name: "Burundi", flag: "🇧🇮" },
  { name: "Cabo Verde", flag: "🇨🇻" },
  { name: "Cambodia", flag: "🇰🇭" },
  { name: "Cameroon", flag: "🇨🇲" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Central African Republic", flag: "🇨🇫" },
  { name: "Chad", flag: "🇹🇩" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "China", flag: "🇨🇳" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Comoros", flag: "🇰🇲" },
  { name: "Congo (Congo-Brazzaville)", flag: "🇨🇬" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Croatia", flag: "🇭🇷" },
  { name: "Cuba", flag: "🇨🇺" },
  { name: "Cyprus", flag: "🇨🇾" },
  { name: "Czech Republic", flag: "🇨🇿" },
  { name: "Democratic Republic of the Congo", flag: "🇨🇩" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Djibouti", flag: "🇩🇯" },
  { name: "Dominica", flag: "🇩🇲" },
  { name: "Dominican Republic", flag: "🇩🇴" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Egypt", flag: "🇪🇬" },
  { name: "El Salvador", flag: "🇸🇻" },
  { name: "Equatorial Guinea", flag: "🇬🇶" },
  { name: "Eritrea", flag: "🇪🇷" },
  { name: "Estonia", flag: "🇪🇪" },
  { name: "Eswatini", flag: "🇸🇿" },
  { name: "Ethiopia", flag: "🇪🇹" },
  { name: "Fiji", flag: "🇫🇯" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "France", flag: "🇫🇷" },
  { name: "Gabon", flag: "🇬🇦" },
  { name: "Gambia", flag: "🇬🇲" },
  { name: "Georgia", flag: "🇬🇪" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Grenada", flag: "🇬🇩" },
  { name: "Guatemala", flag: "🇬🇹" },
  { name: "Guinea", flag: "🇬🇳" },
  { name: "Guinea-Bissau", flag: "🇬🇼" },
  { name: "Guyana", flag: "🇬🇾" },
  { name: "Haiti", flag: "🇭🇹" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "Hungary", flag: "🇭🇺" },
  { name: "Iceland", flag: "🇮🇸" },
  { name: "India", flag: "🇮🇳" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Iran", flag: "🇮🇷" },
  { name: "Iraq", flag: "🇮🇶" },
  { name: "Ireland", flag: "🇮🇪" },
  { name: "Israel", flag: "🇮🇱" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Jamaica", flag: "🇯🇲" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Jordan", flag: "🇯🇴" },
  { name: "Kazakhstan", flag: "🇰🇿" },
  { name: "Kenya", flag: "🇰🇪" },
  { name: "Kiribati", flag: "🇰🇮" },
  { name: "Korea, North", flag: "🇰🇵" },
  { name: "Korea, South", flag: "🇰🇷" },
  { name: "Kuwait", flag: "🇰🇼" },
  { name: "Kyrgyzstan", flag: "🇰🇬" },
  { name: "Laos", flag: "🇱🇦" },
  { name: "Latvia", flag: "🇱🇻" },
  { name: "Lebanon", flag: "🇱🇧" },
  { name: "Lesotho", flag: "🇱🇸" },
  { name: "Liberia", flag: "🇱🇷" },
  { name: "Libya", flag: "🇱🇾" },
  { name: "Liechtenstein", flag: "🇱🇮" },
  { name: "Lithuania", flag: "🇱🇹" },
  { name: "Luxembourg", flag: "🇱🇺" },
  { name: "Madagascar", flag: "🇲🇬" },
  { name: "Malawi", flag: "🇲🇼" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Maldives", flag: "🇲🇻" },
  { name: "Mali", flag: "🇲🇱" },
  { name: "Malta", flag: "🇲🇹" },
  { name: "Marshall Islands", flag: "🇲🇭" },
  { name: "Mauritania", flag: "🇲🇷" },
  { name: "Mauritius", flag: "🇲🇺" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Micronesia", flag: "🇫🇲" },
  { name: "Moldova", flag: "🇲🇩" },
  { name: "Monaco", flag: "🇲🇨" },
  { name: "Mongolia", flag: "🇲🇳" },
  { name: "Montenegro", flag: "🇲🇪" },
  { name: "Morocco", flag: "🇲🇦" },
  { name: "Mozambique", flag: "🇲🇿" },
  { name: "Myanmar (Burma)", flag: "🇲🇲" },
  { name: "Namibia", flag: "🇳🇦" },
  { name: "Nauru", flag: "🇳🇷" },
  { name: "Nepal", flag: "🇳🇵" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "New Zealand", flag: "🇳🇿" },
  { name: "Nicaragua", flag: "🇳🇮" },
  { name: "Niger", flag: "🇳🇪" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "North Macedonia", flag: "🇲🇰" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Oman", flag: "🇴🇲" },
  { name: "Pakistan", flag: "🇵🇰" },
  { name: "Palau", flag: "🇵🇼" },
  { name: "Panama", flag: "🇵🇦" },
  { name: "Papua New Guinea", flag: "🇵🇬" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Philippines", flag: "🇵🇭" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Romania", flag: "🇷🇴" },
  { name: "Russia", flag: "🇷🇺" },
  { name: "Rwanda", flag: "🇷🇼" },
  { name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { name: "Saint Lucia", flag: "🇱🇨" },
  { name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { name: "Samoa", flag: "🇼🇸" },
  { name: "San Marino", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", flag: "🇸🇹" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Serbia", flag: "🇷🇸" },
  { name: "Seychelles", flag: "🇸🇨" },
  { name: "Sierra Leone", flag: "🇸🇱" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Slovakia", flag: "🇸🇰" },
  { name: "Slovenia", flag: "🇸🇮" },
  { name: "Solomon Islands", flag: "🇸🇧" },
  { name: "Somalia", flag: "🇸🇴" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "South Sudan", flag: "🇸🇸" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Sri Lanka", flag: "🇱🇰" },
  { name: "Sudan", flag: "🇸🇩" },
  { name: "Suriname", flag: "🇸🇷" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Syria", flag: "🇸🇾" },
  { name: "Taiwan", flag: "🇹🇼" },
  { name: "Tajikistan", flag: "🇹🇯" },
  { name: "Tanzania", flag: "🇹🇿" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "Timor-Leste", flag: "🇹🇱" },
  { name: "Togo", flag: "🇹🇬" },
  { name: "Tonga", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", flag: "🇹🇹" },
  { name: "Tunisia", flag: "🇹🇳" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Turkmenistan", flag: "🇹🇲" },
  { name: "Tuvalu", flag: "🇹🇻" },
  { name: "Uganda", flag: "🇺🇬" },
  { name: "Ukraine", flag: "🇺🇦" },
  { name: "United Arab Emirates", flag: "🇦🇪" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "United States", flag: "🇺🇸" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Uzbekistan", flag: "🇺🇿" },
  { name: "Vanuatu", flag: "🇻🇺" },
  { name: "Vatican City", flag: "🇻🇦" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Yemen", flag: "🇾🇪" },
  { name: "Zambia", flag: "🇿🇲" },
  { name: "Zimbabwe", flag: "🇿🇼" },
];
