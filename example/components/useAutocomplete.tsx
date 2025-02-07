import { useState, useEffect, useRef, useCallback } from "react";

export default function useAutocomplete(initialQuery = "") {
  const [query, setQuery] = useState(initialQuery); // Search query
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // Suggestions list
  const [highlightedIndex, setHighlightedIndex] = useState(-1); // For navigating the list
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const inputRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!query.trim()) return; // Skip if query is empty

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        searchTerm: query, // Send the search query for name
        Passportnumber: query, // Optionally use query to filter by passport number as well
      });

      const response = await fetch(`/api/findcvfromprisma?${queryParams}`);
      const data = await response.json();

      console.log("Fetched Data:", data); // Debug: Check if data is coming correctly

      setFilteredSuggestions(data); // Update suggestions with fetched data
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  }, [query]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setFilteredSuggestions([]); // Clear suggestions if query is empty
      return;
    }

    // Fetch data when the user starts typing, with debouncing
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500); // Debounce the API call (500ms delay)

    return () => clearTimeout(timeoutId); // Cleanup timeout on query change
  }, [query, fetchData]);

  useEffect(() => {
    if (
      highlightedIndex >= 0 &&
      highlightedIndex < filteredSuggestions.length
    ) {
      inputRef.current.value = filteredSuggestions[highlightedIndex].Name; // Update input to highlighted suggestion
    }
  }, [highlightedIndex, filteredSuggestions]);

  const handleChange = (e) => {
    setQuery(e.target.value); // Set the query state
    setHighlightedIndex(-1); // Reset highlighted index on new input
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        setHighlightedIndex((prevIndex) =>
          prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case "ArrowUp":
        setHighlightedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
        break;
      case "Enter":
        if (highlightedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        } else if (query.trim()) {
          fetchData(); // Trigger search if no suggestion is highlighted
        }
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log(suggestion);
    setQuery(suggestion.Name); // Set the query to the clicked suggestion
    setFilteredSuggestions([]); // Clear the suggestions
    setHighlightedIndex(-1); // Reset highlighted index
  };

  return {
    query,
    setQuery,
    filteredSuggestions,
    highlightedIndex,
    isLoading,
    handleChange,
    handleKeyDown,
    handleSuggestionClick,
    inputRef,
  };
}
