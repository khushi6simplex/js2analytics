import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Keycloak from 'keycloak-js';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const keycloak = new Keycloak('/keycloak.json'); // Use 'new' keyword here
    keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
      if (authenticated) {
        keycloak.loadUserInfo().then((userInfo) => {
          setUser({
            ...userInfo,
            roles: keycloak.realmAccess.roles,
            jurisdiction: keycloak.tokenParsed.jurisdiction, // Assuming jurisdiction is part of the token
          });
        });
      }
    });
  }, []);

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
