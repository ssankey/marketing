// layouts/navbar/NavbarTop.js
import { useState, useEffect } from 'react';
import { Menu } from 'react-feather';
import Link from 'next/link';
import {
  Navbar,
  Form,
  FormControl,
  ListGroup,
  Badge,
} from 'react-bootstrap';
import { useAuth } from 'contexts/AuthContext';

const NavbarTop = (props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length > 0) {
        try {
          const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching search results:', error);
        }
      } else {
        setShowSuggestions(false);
        setSearchResults([]);
      }
    };

    // Debounce the API call
    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Navbar expanded="lg" className="navbar-classic navbar navbar-expand-lg">
      <div className="d-flex justify-content-between w-100">
        <div className="d-flex align-items-center">
          <Link
            href="#"
            id="nav-toggle"
            className="nav-icon me-2 icon-xs"
            onClick={() => props.data.SidebarToggleMenu(!props.data.showMenu)}
          >
            <Menu size="18px" />
          </Link>
        </div>
      </div>

      {/* You can include other Navbar content here */}
    </Navbar>
  );
};

export default NavbarTop;
