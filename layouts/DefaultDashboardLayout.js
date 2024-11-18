// Import required modules and libraries
import { useState } from 'react';
import { useAuth } from 'hooks/useAuth';
import NavbarVertical from './navbars/NavbarVertical';
import NavbarTop from './navbars/NavbarTop';
import { Row, Col, Spinner } from 'react-bootstrap';

const DefaultDashboardLayout = (props) => {
	const [showMenu, setShowMenu] = useState(true);
	const { isAuthenticated, isLoading, redirecting } = useAuth();  // Integrate useAuth to manage auth state

	const ToggleMenu = () => {
		setShowMenu(!showMenu);
	};	

	// Show a loader or nothing at all if still loading or redirecting
	if (isLoading || redirecting) {
		return (
			<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
				<Spinner animation="border" role="status" style={{ color: '#007bff' }}>
					<span className="sr-only">Loading...</span>
				</Spinner>
				<div className="ms-3">Checking authentication...</div>
			</div>
		);
	}

	// Render layout only if the user is authenticated
	return (
		isAuthenticated ? (
			<div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
				<div className="navbar-vertical navbar">
					<NavbarVertical
						showMenu={showMenu}
						onClick={(value) => setShowMenu(value)}
					/>
				</div>
				<div id="page-content">
					<div className="header">
						<NavbarTop
							data={{
								showMenu: showMenu,
								SidebarToggleMenu: ToggleMenu
							}}
						/>
					</div>
					{props.children}				
				</div>
			</div>
		) : null  // Render nothing if not authenticated
	);
};

export default DefaultDashboardLayout;
