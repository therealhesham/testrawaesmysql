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
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1e8.svg",
    name: "Ascension Island",
    code: "ac",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1e9.svg",
    name: "Andorra",
    code: "ad",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1ea.svg",
    name: "United Arab Emirates",
    code: "ae",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1eb.svg",
    name: "Afghanistan",
    code: "af",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1ec.svg",
    name: "Antigua & Barbuda",
    code: "ag",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1ee.svg",
    name: "Anguilla",
    code: "ai",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f1.svg",
    name: "Albania",
    code: "al",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f2.svg",
    name: "Armenia",
    code: "am",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f4.svg",
    name: "Angola",
    code: "ad",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f6.svg",
    name: "Antarctica",
    code: "aq",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f7.svg",
    name: "Argentina",
    code: "ar",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f8.svg",
    name: "American Samoa",
    code: "as",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1f9.svg",
    name: "Austria",
    code: "at",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1fa.svg",
    name: "Australia",
    code: "au",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1fc.svg",
    name: "Aruba",
    code: "aw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1fd.svg",
    name: "Åland Islands",
    code: "ax",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e6-1f1ff.svg",
    name: "Azerbaijan",
    code: "az",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1e6.svg",
    name: "Bosnia & Herzegovina",
    code: "ba",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1e7.svg",
    name: "Barbados",
    code: "bb",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1e9.svg",
    name: "Bangladesh",
    code: "bd",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1ea.svg",
    name: "Belgium",
    code: "be",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1eb.svg",
    name: "Burkina Faso",
    code: "bf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1ec.svg",
    name: "Bulgaria",
    code: "bg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1ed.svg",
    name: "Bahrain",
    code: "bh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1ee.svg",
    name: "Burundi",
    code: "bi",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1ef.svg",
    name: "Benin",
    code: "bj",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f1.svg",
    name: "St. Barthélemy",
    code: "bl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f2.svg",
    name: "Bermuda",
    code: "bm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f3.svg",
    name: "Brunei",
    code: "bn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f4.svg",
    name: "Bolivia",
    code: "bo",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f6.svg",
    name: "Caribbean Netherlands",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f7.svg",
    name: "Brazil",
    code: "br",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f8.svg",
    name: "Bahamas",
    code: "bs",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1f9.svg",
    name: "Bhutan",
    code: "bt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1fb.svg",
    name: "Bouvet Island",
    code: "bv",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1fc.svg",
    name: "Botswana",
    code: "bw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1fe.svg",
    name: "Belarus",
    code: "by",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e7-1f1ff.svg",
    name: "Belize",
    code: "bz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1e6.svg",
    name: "Canada",
    code: "ca",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1e8.svg",
    name: "Cocos (Keeling) Islands",
    code: "cc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1e9.svg",
    name: "Congo - Kinshasa",
    code: "cg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1eb.svg",
    name: "Central African Republic",
    code: "cf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1ec.svg",
    name: "Congo - Brazzaville",
    code: "cd",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1ed.svg",
    name: "Switzerland",
    code: "ch",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1ee.svg",
    name: "Côte d’Ivoire",
    code: "ci",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f0.svg",
    name: "Cook Islands",
    code: "ck",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f1.svg",
    name: "Chile",
    code: "cl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f2.svg",
    name: "Cameroon",
    code: "cm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f3.svg",
    name: "China",
    code: "cn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f4.svg",
    name: "Colombia",
    code: "co",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f5.svg",
    name: "Clipperton Island",
    code: "cp",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1f7.svg",
    name: "Costa Rica",
    code: "cr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1fa.svg",
    name: "Cuba",
    code: "cu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1fb.svg",
    name: "Cape Verde",
    code: "cv",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1fc.svg",
    name: "Curaçao",
    code: "cw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1fd.svg",
    name: "Christmas Island",
    code: "cx",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1fe.svg",
    name: "Cyprus",
    code: "cy",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e8-1f1ff.svg",
    name: "Czechia",
    code: "cz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1ea.svg",
    name: "Germany",
    code: "de",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1ec.svg",
    name: "Diego Garcia",
    code: "dg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1ef.svg",
    name: "Djibouti",
    code: "dj",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1f0.svg",
    name: "Denmark",
    code: "dk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1f2.svg",
    name: "Dominica",
    code: "dm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1f4.svg",
    name: "Dominican Republic",
    code: "do",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1e9-1f1ff.svg",
    name: "Algeria",
    code: "dz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1e6.svg",
    name: "Ceuta & Melilla",
    code: "ea",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1e8.svg",
    name: "Ecuador",
    code: "ec",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1ea.svg",
    name: "Estonia",
    code: "ee",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1ec.svg",
    name: "Egypt",
    code: "eg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1ed.svg",
    name: "Western Sahara",
    code: "eh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1f7.svg",
    name: "Eritrea",
    code: "er",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1f8.svg",
    name: "Spain",
    code: "es",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1f9.svg",
    name: "Ethiopia",
    code: "et",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ea-1f1fa.svg",
    name: "European Union",
    code: "eu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1eb-1f1ee.svg",
    name: "Finland",
    code: "fi",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1eb-1f1ef.svg",
    name: "Fiji",
    code: "fj",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1eb-1f1f0.svg",
    name: "Falkland Islands",
    code: "fk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1eb-1f1f2.svg",
    name: "Micronesia",
    code: "fm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1eb-1f1f4.svg",
    name: "Faroe Islands",
    code: "fo",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1eb-1f1f7.svg",
    name: "France",
    code: "fr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1e6.svg",
    name: "Gabon",
    code: "ga",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1e7.svg",
    name: "United Kingdom",
    code: "gb",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1e9.svg",
    name: "Grenada",
    code: "gd",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1ea.svg",
    name: "Georgia",
    code: "ge",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1eb.svg",
    name: "French Guiana",
    code: "gf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1ec.svg",
    name: "Guernsey",
    code: "gg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1ed.svg",
    name: "Ghana",
    code: "gh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1ee.svg",
    name: "Gibraltar",
    code: "gi",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f1.svg",
    name: "Greenland",
    code: "gl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f2.svg",
    name: "Gambia",
    code: "gm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f3.svg",
    name: "Guinea",
    code: "gn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f5.svg",
    name: "Guadeloupe",
    code: "gp",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f6.svg",
    name: "Equatorial Guinea",
    code: "gq",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f7.svg",
    name: "Greece",
    code: "gr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f8.svg",
    name: "South Georgia & South', Sandwich Islands",
    code: "gs",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1f9.svg",
    name: "Guatemala",
    code: "gt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1fa.svg",
    name: "Guam",
    code: "gu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1fc.svg",
    name: "Guinea-Bissau",
    code: "gw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ec-1f1fe.svg",
    name: "Guyana",
    code: "gy",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ed-1f1f0.svg",
    name: "Hong Kong SAR China",
    code: "hk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ed-1f1f2.svg",
    name: "Heard & McDonald Islands",
    code: "hm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ed-1f1f3.svg",
    name: "Honduras",
    code: "hn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ed-1f1f7.svg",
    name: "Croatia",
    code: "hr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ed-1f1f9.svg",
    name: "Haiti",
    code: "ht",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ed-1f1fa.svg",
    name: "Hungary",
    code: "hu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1e8.svg",
    name: "Canary Islands",
    code: "ic",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1e9.svg",
    name: "Indonesia",
    code: "id",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1ea.svg",
    name: "Ireland",
    code: "ie",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f1.svg",
    name: "Israel",
    code: "il",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f2.svg",
    name: "Isle of Man",
    code: "im",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f3.svg",
    name: "India",
    code: "in",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f4.svg",
    name: "British Indian Ocean Territory",
    code: "io",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f6.svg",
    name: "Iraq",
    code: "iq",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f7.svg",
    name: "Iran",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f8.svg",
    name: "Iceland",
    code: "is",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ee-1f1f9.svg",
    name: "Italy",
    code: "it",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ef-1f1ea.svg",
    name: "Jersey",
    code: "je",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ef-1f1f2.svg",
    name: "Jamaica",
    code: "jm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ef-1f1f4.svg",
    name: "Jordan",
    code: "jo",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ef-1f1f5.svg",
    name: "Japan",
    code: "jp",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ea.svg",
    name: "Kenya",
    code: "ke",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ec.svg",
    name: "Kyrgyzstan",
    code: "kg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ed.svg",
    name: "Cambodia",
    code: "kh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ee.svg",
    name: "Kiribati",
    code: "ki",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1f2.svg",
    name: "Comoros",
    code: "km",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1f3.svg",
    name: "St. Kitts & Nevis",
    code: "kn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1f5.svg",
    name: "North Korea",
    code: "kp",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1f7.svg",
    name: "South Korea",
    code: "kr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1fc.svg",
    name: "Kuwait",
    code: "kw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1fe.svg",
    name: "Cayman Islands",
    code: "ky",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f0-1f1ff.svg",
    name: "Kazakhstan",
    code: "kz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1e6.svg",
    name: "Laos",
    code: "la",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1e7.svg",
    name: "Lebanon",
    code: "lb",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1e8.svg",
    name: "St. Lucia",
    code: "lc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1ee.svg",
    name: "Liechtenstein",
    code: "li",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1f0.svg",
    name: "Sri Lanka",
    code: "lk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1f7.svg",
    name: "Liberia",
    code: "lr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1f8.svg",
    name: "Lesotho",
    code: "ls",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1f9.svg",
    name: "Lithuania",
    code: "lt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1fa.svg",
    name: "Luxembourg",
    code: "lu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1fb.svg",
    name: "Latvia",
    code: "lv",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f1-1f1fe.svg",
    name: "Libya",
    code: "ly",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1e6.svg",
    name: "Morocco",
    code: "ma",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1e8.svg",
    name: "Monaco",
    code: "mc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1e9.svg",
    name: "Moldova",
    code: "md",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1ea.svg",
    name: "Montenegro",
    code: "me",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1eb.svg",
    name: "St. Martin",
    code: "mf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1ec.svg",
    name: "Madagascar",
    code: "mg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1ed.svg",
    name: "Marshall Islands",
    code: "mh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f0.svg",
    name: "North Macedonia",
    code: "mk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f1.svg",
    name: "Mali",
    code: "ml",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f2.svg",
    name: "Myanmar (Burma)",
    code: "mm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f3.svg",
    name: "Mongolia",
    code: "mn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f4.svg",
    name: "Macao Sar China",
    code: "mo",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f5.svg",
    name: "Northern Mariana Islands",
    code: "mp",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f6.svg",
    name: "Martinique",
    code: "mq",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f7.svg",
    name: "Mauritania",
    code: "mr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f8.svg",
    name: "Montserrat",
    code: "ms",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1f9.svg",
    name: "Malta",
    code: "mt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1fa.svg",
    name: "Mauritius",
    code: "mu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1fb.svg",
    name: "Maldives",
    code: "mv",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1fc.svg",
    name: "Malawi",
    code: "mw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1fd.svg",
    name: "Mexico",
    code: "mx",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1fe.svg",
    name: "Malaysia",
    code: "my",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f2-1f1ff.svg",
    name: "Mozambique",
    code: "mz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1e6.svg",
    name: "Namibia",
    code: "na",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1e8.svg",
    name: "New Caledonia",
    code: "nc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1ea.svg",
    name: "Niger",
    code: "ne",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1eb.svg",
    name: "Norfolk Island",
    code: "nf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1ec.svg",
    name: "Nigeria",
    code: "ng",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1ee.svg",
    name: "Nicaragua",
    code: "ni",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1f1.svg",
    name: "Netherlands",
    code: "nl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1f4.svg",
    name: "Norway",
    code: "no",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1f5.svg",
    name: "Nepal",
    code: "np",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1f7.svg",
    name: "Nauru",
    code: "nr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1fa.svg",
    name: "Niue",
    code: "nu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f3-1f1ff.svg",
    name: "New Zealand",
    code: "nz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f4-1f1f2.svg",
    name: "Oman",
    code: "om",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1e6.svg",
    name: "Panama",
    code: "pa",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1ea.svg",
    name: "Peru",
    code: "pe",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1eb.svg",
    name: "French Polynesia",
    code: "pf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1ec.svg",
    name: "Papua New Guinea",
    code: "pg",
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
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f1.svg",
    name: "Poland",
    code: "pl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f2.svg",
    name: "St. Pierre & Miquelon",
    code: "pm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f3.svg",
    name: "Pitcairn Islands",
    code: "pn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f7.svg",
    name: "Puerto Rico",
    code: "pr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f8.svg",
    name: "Palestinian Territories",
    code: "ps",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1f9.svg",
    name: "Portugal",
    code: "pt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1fc.svg",
    name: "Palau",
    code: "pw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f5-1f1fe.svg",
    name: "Paraguay",
    code: "py",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f6-1f1e6.svg",
    name: "Qatar",
    code: "qa",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f7-1f1ea.svg",
    name: "Réunion",
    code: "re",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f7-1f1f4.svg",
    name: "Romania",
    code: "ro",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f7-1f1f8.svg",
    name: "Serbia",
    code: "yu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f7-1f1fa.svg",
    name: "Russia",
    code: "ru",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f7-1f1fc.svg",
    name: "Rwanda",
    code: "rw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1e6.svg",
    name: "Saudi Arabia",
    code: "sa",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1e7.svg",
    name: "Solomon Islands",
    code: "sb",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1e8.svg",
    name: "Seychelles",
    code: "sc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1e9.svg",
    name: "Sudan",
    code: "sd",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1ea.svg",
    name: "Sweden",
    code: "se",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1ec.svg",
    name: "Singapore",
    code: "sg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1ed.svg",
    name: "St. Helena",
    code: "sh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1ee.svg",
    name: "Slovenia",
    code: "si",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1ef.svg",
    name: "Svalbard & Jan Mayen",
    code: "sj",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f0.svg",
    name: "Slovakia",
    code: "sk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f1.svg",
    name: "Sierra Leone",
    code: "sl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f2.svg",
    name: "San Marino",
    code: "sm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f3.svg",
    name: "Senegal",
    code: "sn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f4.svg",
    name: "Somalia",
    code: "so",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f7.svg",
    name: "Suriname",
    code: "sr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f8.svg",
    name: "South Sudan",
    code: "ss",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1f9.svg",
    name: "São Tomé & Príncipe",
    code: "st",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1fb.svg",
    name: "El Salvador",
    code: "sv",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1fd.svg",
    name: "Sint Maarten",
    code: "sx",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1fe.svg",
    name: "Syria",
    code: "sy",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f8-1f1ff.svg",
    name: "Eswatini",
    code: "sz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1e6.svg",
    name: "Tristan Da Cunha",
    code: "sh",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1e8.svg",
    name: "Turks & Caicos Islands",
    code: "tc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1e9.svg",
    name: "Chad",
    code: "td",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1eb.svg",
    name: "French Southern Territories",
    code: "tf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1ec.svg",
    name: "Togo",
    code: "tg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1ed.svg",
    name: "Thailand",
    code: "th",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1ef.svg",
    name: "Tajikistan",
    code: "tj",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f0.svg",
    name: "Tokelau",
    code: "tk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f1.svg",
    name: "Timor-Leste",
    code: "tl",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f2.svg",
    name: "Turkmenistan",
    code: "tm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f3.svg",
    name: "Tunisia",
    code: "tn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f4.svg",
    name: "Tonga",
    code: "to",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f7.svg",
    name: "Turkey",
    code: "tr",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1f9.svg",
    name: "Trinidad & Tobago",
    code: "tt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1fb.svg",
    name: "Tuvalu",
    code: "tv",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1fc.svg",
    name: "Taiwan",
    code: "tw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1f9-1f1ff.svg",
    name: "Tanzania",
    code: "tz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1e6.svg",
    name: "Ukraine",
    code: "ua",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1ec.svg",
    name: "Uganda",
    code: "ug",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1f2.svg",
    name: "U.S. Outlying Islands",
    code: "um",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1f3.svg",
    name: "United Nations",
    code: "un",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1f8.svg",
    name: "United States",
    code: "us",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1fe.svg",
    name: "Uruguay",
    code: "uy",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fa-1f1ff.svg",
    name: "Uzbekistan",
    code: "uz",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1e6.svg",
    name: "Vatican City",
    code: "va",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1e8.svg",
    name: "St. Vincent & Grenadines",
    code: "vc",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1ea.svg",
    name: "Venezuela",
    code: "ve",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1ec.svg",
    name: "British Virgin Islands",
    code: "vg",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1ee.svg",
    name: "U.S. Virgin Islands",
    code: "vi",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1f3.svg",
    name: "Vietnam",
    code: "vn",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fb-1f1fa.svg",
    name: "Vanuatu",
    code: "vu",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fc-1f1eb.svg",
    name: "Wallis & Futuna",
    code: "wf",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fc-1f1f8.svg",
    name: "Samoa",
    code: "ws",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fd-1f1f0.svg",
    name: "Kosovo",
    code: "xk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fe-1f1ea.svg",
    name: "Yemen",
    code: "ye",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1fe-1f1f9.svg",
    name: "Mayotte",
    code: "yt",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ff-1f1e6.svg",
    name: "South Africa",
    code: "za",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ff-1f1f2.svg",
    name: "Zambia",
    code: "zm",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f1ff-1f1fc.svg",
    name: "Zimbabwe",
    code: "zw",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f3f4-e0067-e0062-e0065-e006e-e0067-e007f.svg",
    name: "England",
    code: "uk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f3f4-e0067-e0062-e0073-e0063-e0074-e007f.svg",
    name: "Scotland",
    code: "uk",
  },
  {
    flag: "https://twemoji.maxcdn.com/2/svg/1f3f4-e0067-e0062-e0077-e006c-e0073-e007f.svg",
    name: "Wales",
    code: "uk",
  },
];
