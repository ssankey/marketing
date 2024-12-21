import { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import SearchBar from "components/SearchBar";

export default function CustomerChart() {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (search.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/customers?search=${search}`);
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [search]);

  return (
    <div className="p-4">
      {/* <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} /> */}

      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center">
          <Spinner
            animation="border"
            role="status"
            style={{ color: "#007bff" }}
          >
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <div className="mt-4">
          <ul>
            {recommendations.map((customer) => (
              <li key={customer.CustomerCode}>{customer.CustomerName}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
