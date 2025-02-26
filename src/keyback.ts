import Keycloak from "keycloak-js";

// Configure Keycloak instance
const keycloak = new Keycloak({
  url: "http://180.149.240.169:8081/auth",
  realm: "jalyuktashivar",
  clientId: "revelo35",
});

// Keycloak Initialization
export const initKeycloak = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({ onLoad: "login-required", checkLoginIframe: false })
      .then((authenticated) => {
        console.log("Authenticated status:", authenticated);
        if (authenticated) {
          const token = keycloak.token;
          const refreshToken = keycloak.refreshToken;
          const userProfile = keycloak.loadUserProfile();

          // Corrected the typo in localStorage
          localStorage.setItem("keycloakToken", token || "");
          localStorage.setItem("keycloakRefreshToken", refreshToken || "");
          localStorage.setItem(
            "keycloakUserProfile",
            JSON.stringify(userProfile),
          );
          console.log("Authenticated successfully");
          resolve();
        } else {
          reject("Not authenticated");
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed", error);
        reject(error);
      });
  });
};

// Keycloak Logout Function
export const logoutKeycloak = (): void => {
  keycloak.logout({
    redirectUri: window.location.origin, // Redirects the user back to your app after logout
  });
};

export default keycloak;
