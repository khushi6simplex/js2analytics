import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Ensure this path matches your Vite project structure
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./Redux/store/store";
import { MainRoutes } from "./Routes/Route";
import { initKeycloak } from "./KeyCloakService";

const AppWrapper = () => {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);

  useEffect(() => {
    initKeycloak()
      .then(() => {
        setKeycloakInitialized(true);
      })
      .catch((error) => {
        console.error("Keycloak initialization failed", error);
      });
  }, []);

  if (!keycloakInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter basename="/analytics">
      <Provider store={store}>
        <Routes>
          {MainRoutes().map((tools) => {
            const Tools = tools.component;
            return (
              <Route key={tools.link} path={tools.link} element={<Tools />} />
            );
          })}
          <Route path="*" element={<h1>Not found...</h1>} />
        </Routes>
      </Provider>
    </BrowserRouter>
  );
};


async function init() {
  await fetch(window.__analytics__.appUrl + "/services.json")
    .then((response) => response.json())
    .then((result) => {
      Object.keys(result).forEach((serviceName) => {
        window.__analytics__[serviceName] = result[serviceName];
      });
    });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

(async () => {
  await init();
  root.render(<AppWrapper />);
})();