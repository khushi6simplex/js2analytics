import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://180.149.240.169:8081/auth",
  realm: "jalyuktashivar",
  clientId: "revelo35",
});

export const initKeycloak = () => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({
        onLoad: "login-required",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (authenticated) {
          console.log("Keycloak authenticated successfully.");
          resolve(keycloak.token || null);
        } else {
          console.log("User not authenticated.");
          resolve(null);
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed", error);
        reject(error);
      });
  });
};

export default keycloak;
