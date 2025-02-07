import { useState, useEffect } from "react";

const Autocomplete = () => {
  const [query, setQuery] = useState("");
  const [passport, setPassport] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      try {
        // Query the API based on the search term and possibly passport number
        const res = await fetch(
          `/api/findcvfromprisma?searchTerm=${value}&Passportnumber=${passport}`
        );
        const data = await res.json();

        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handlePassportChange = (e) => {
    setPassport(e.target.value);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.Name);
    setSuggestions([]);
  };

  return (
    <div className="relative w-64">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Search by Name..."
      />
      <input
        type="text"
        value={passport}
        onChange={handlePassportChange}
        className="w-full p-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Search by Passport Number..."
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="p-2 cursor-pointer hover:bg-gray-200"
            >
              {suggestion.Name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
