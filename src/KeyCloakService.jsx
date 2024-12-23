import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://180.149.240.169:8081/auth",
  realm: "jalyuktashivar",
  clientId: "revelo35",
});

export const initKeycloak = () => {
  if (keycloak.authenticated) {
    console.log("Keycloak is already initialized and authenticated.");
    return Promise.resolve(true); // Skip initialization
  }

  return new Promise((resolve, reject) => {
    keycloak
      .init({ onLoad: "check-sso", silentCheckSsoRedirectrUi: `${window.location.origin}/silent-check-sso.html` })
      .then((authenticated) => {
        if (authenticated) {
          console.log("Authenticated via check-sso");
          resolve(true); // User is authenticated
        } else {
          console.log("Silent check failed, triggering login-required...");
          keycloak
            .login()
            .then(() => resolve(true)) // Login successful
            .catch((error) => {
              console.error("Keycloak login failed", error);
              reject(error);
            });
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed during check-sso", error);
        reject(error);
      });
  });
};

export default keycloak;
