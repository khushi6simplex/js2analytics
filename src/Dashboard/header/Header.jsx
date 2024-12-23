import React, { useState } from "react";
import logo from "../../assets/gov.png";
import header from "../../assets/header.png";
import user from "../../assets/user.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
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
        padding: "0 20px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div>
        <img
          src={logo}
          alt="Logo"
          style={{ height: "60px" }}
        />
      </div>

      {/* Profile Picture */}
      <div style={{ position: "relative" }}>
        <img
          src={user}
          alt="Profile"
          style={{
            height: "40px",
            width: "40px",
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer",
          }}
          onClick={toggleMenu}
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
