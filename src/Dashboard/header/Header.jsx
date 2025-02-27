// Header.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

import logo from "../../assets/gov.png";
import header from "../../assets/header.png";
import user from "../../assets/user.png";
import mrsacLogo from "../../assets/mrsacLogo.png";
import toolsgrid from "../../assets/toolsgrid.png";
import userManager from "../../assets/userManager.png";

const Header = ( { userName } ) => {
  const [ isMenuOpen, setIsMenuOpen ] = useState( false );
  const [ isGridOpen, setIsGridOpen ] = useState( false );

  const toggleMenu = () => {
    setIsMenuOpen( ( prev ) => !prev );
  };

  const gridMenu = () => {
    setIsGridOpen( ( prev ) => !prev );
  };

  const handleLogout = async () => {
    const serverUrl = window.__analytics__.serverUrl;
    const apiUrl = `${ serverUrl }/users/${ userName }/logout`;

    try {
      const token = localStorage.getItem( "keycloakToken" );
      const response = await axios.post( apiUrl, {}, {
        headers: {
          Authorization: `Bearer ${ token }`
        }
      } );

      console.log( "✅ Logout Successful:", response.data );

      // Ensure logout and refresh the page
      localStorage.removeItem( "keycloakToken" );
      window.location.reload();
    } catch ( err ) {
      console.error( "❌ Logout Request Failed:", err );
    }
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "80px",
        backgroundImage: `url(${ header })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0px 20px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex" }}>
        <img src={logo} alt="Logo" style={{ height: "60px", marginTop: "10px" }} />
        <h1 style={{ fontSize: "20px", color: "white", padding: "10px" }}>
          जलयुक्त शिवार अभियान २.० अहवाल
        </h1>
      </div>

      <div style={{ justifyContent: "space-between" }}>
        {/* <img
          src={mapIcon}
          alt="Toggle Map"
          style={{
            height: "45px",
            width: "45px",
            marginRight: "10px",
            cursor: "pointer",
          }}
          onClick={onMapToggle}
        /> */}

        <img
          src={toolsgrid}
          alt="logo"
          style={{ height: "50px", width: "50px", cursor: "pointer", marginRight: "10px" }}
          onClick={gridMenu}
        />

        <img
          src={user}
          alt="Profile"
          style={{
            height: "40px",
            width: "40px",
            marginBottom: "10px",
            borderRadius: "50%",
            cursor: "pointer",
          }}
          onClick={toggleMenu}
        />

        <img
          src={mrsacLogo}
          alt="logo"
          style={{ height: "70px", width: "70px", cursor: "pointer" }}
        />

        {isMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "70px",
              right: "40px",
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "120px",
            }}
          >
            <ul style={{ listStyleType: "none", margin: 0, padding: "10px" }}>
              <li
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                About
              </li>
              <li
                style={{ padding: "8px 12px", cursor: "pointer" }}
                onClick={handleLogout}
              >
                Logout
              </li>
            </ul>
          </div>
        )}

        {isGridOpen && (
          <div
            style={{
              position: "absolute",
              top: "70px",
              right: "70px",
              background: "white",
              borderRadius: "4px",
              width: "200px",
            }}
          >
            <ul style={{ listStyleType: "none", margin: 0, padding: "10px" }}>
              <div>
                <img
                  src={userManager}
                  style={{ height: "70px", width: "70px", cursor: "pointer" }}
                />
                <li>User Manager</li>
              </div>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

Header.propTypes = {
  userName: PropTypes.string.isRequired,
};

export default Header;