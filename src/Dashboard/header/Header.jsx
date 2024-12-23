import { useState } from "react";
import axios from "axios";

import logo from "../../assets/gov.png";
import header from "../../assets/header.png";
import user from "../../assets/user.png";
import mrsacLogo from "../../assets/mrsacLogo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const doLogout = () => {
    const logoutUrl = window.__analytics__.logoutUrl;
    axios.post(logoutUrl, "").finally(() => {
      axios.post(process.env.PUBLIC_URL + "/logout").finally(() => {
        const newLocation = process.env.PUBLIC_URL;
        window.location.href = newLocation;
        window.location.reload()
      });
    });
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "80px",
        backgroundImage: `url(${header})`,
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
      {/* Logo */}
      <div style={{display: "flex"}}>
        <img
          src={logo}
          alt="Logo"
          style={{ height: "60px", marginTop: "10px"}}
        />
        <h1 style={{fontSize: "20px", color: "white", padding: "10px"}}>जलयुक्त शिवार अभियान २.० अहवाल</h1>
      </div>

      {/* Profile */}
      <div style={{ }}>
        <img
          src={user}
          alt="Profile"
          style={{
            height: "40px",
            width: "40px",
            marginBottom: "10px",
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer",
          }}
          onClick={toggleMenu}
        />

        <img
          src={mrsacLogo}
          alt="logo"
          style={{
            height: "70px",
            width: "70px",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />

        {/* Toggle Menu */} 
        {isMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: "50px",
              right: 0,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
              width: "120px",
            }}
          >
            <ul
              style={{
                listStyleType: "none",
                margin: 0,
                padding: "10px",
              }}
            >
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
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  doLogout()
                }}
              >
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
