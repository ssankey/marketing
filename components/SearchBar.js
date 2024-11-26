// src/components/SearchBar.js
import React from 'react';
import { Form, ListGroup } from 'react-bootstrap';

const SearchBar = ({
    searchQuery,
    setSearchQuery,
    searchResults,
    handleSelectResult,
    placeholder,
    onSearch
}) => {
    const handleChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    return (
        <div className="search-container position-relative w-100">
            <Form.Control
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleChange}
            />
            {searchResults.length > 0 && (
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
