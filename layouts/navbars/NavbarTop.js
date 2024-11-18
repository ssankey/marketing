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
            onClick={() =>
              props.data.SidebarToggleMenu(!props.data.showMenu)
            }
          >
            <Menu size="18px" />
          </Link>
          <div className="ms-lg-3 d-none d-md-none d-lg-block position-relative" style={{ width: '800px' }}>
            <Form className="d-flex align-items-center">
              <FormControl
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
              />
            </Form>
            {showSuggestions && (
              <ListGroup
                className="position-absolute suggestion-box"
                style={{ width: '100%', zIndex: 1000 }}
              >
                {searchResults.length === 0 && (
                  <ListGroup.Item className="text-center">
                    No results found
                  </ListGroup.Item>
                )}
                {searchResults.map((item) => (
                  <ListGroup.Item
                    key={`${item.type}-${item.id}`}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <Link href={`/${item.type.toLowerCase()}s/${item.id}`}>
                      {item.name}
                    </Link>
                    <Badge
                      bg={
                        item.type === 'Customer' ? 'primary' :
                          item.type === 'Product' ? 'success' :
                            item.type === 'Employee' ? 'warning' :
                              item.type === 'Order' ? 'info' :
                                item.type === 'Quotation' ? 'secondary' :
                                  item.type === 'Invoice' ? 'dark' :
                                    'light'
                      }
                    >
                      {item.type}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>

        </div>
      </div>

      {/* You can include other Navbar content here */}
    </Navbar>
  );
};

export default NavbarTop;
