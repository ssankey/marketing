
// src/components/SearchBar.js
import React from 'react';
import { Form, ListGroup } from 'react-bootstrap';

const SearchBar = ({
    searchQuery = '',
    setSearchQuery,
    searchResults = [], // Default to an empty array to prevent undefined errors
    handleSelectResult,
    placeholder = 'Search...', // Default placeholder text
    onSearch,
}) => {
    const handleChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (onSearch) {
            onSearch(query); // Call the onSearch function only if it exists
        }
    };

    return (
        <div className="search-container position-relative w-100">
            <Form.Control
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleChange}
                className="form-control"
            />
            {searchResults && searchResults.length > 0 && ( // Safely check for results
                <ListGroup
                    className="position-absolute top-100 start-0 w-100 z-3 bg-white border"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                    {searchResults.map((result) => (
                        <ListGroup.Item
                            key={result.id}
                            onClick={() => handleSelectResult(result)}
                            className="cursor-pointer"
                        >
                            <strong>{result.type}:</strong> {result.name}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

export default SearchBar;
