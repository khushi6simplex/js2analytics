// keycloak.js
// Temporarily disable Keycloak
// import Keycloak from "keycloak-js";

// const keycloak = new Keycloak({
//   url: "http://103.249.98.177:1001/auth",
//   realm: "jalyuktashivar",
//   clientId: "revelo35",
// });

export const initKeycloak = () => {
  console.log("Keycloak functionality is temporarily disabled.");
  return Promise.resolve(true); // Always resolve
};

// export default keycloak;


// App.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppSelector } from "./Redux/store/store";
import Dashboard from "./Dashboard/Dashboard";
import './App.css';

const layoutStyle = {
  display: "flex",
  flexDirection: "column",
};

const contentStyle = {
  flex: "1 1 auto",
  backgroundColor: "white",
  overflow: "hidden",
};

const App = () => {
  const navigation = useNavigate();
  const { userInfo } = useAppSelector((state) => state.reveloUserInfo);

  useEffect(() => {
    console.log("Keycloak checks are disabled.");
    // Temporarily skip navigation logic
    // if (!userInfo.status) {
    //   navigation("/");
    // }
  }, [userInfo, navigation]);

  return (
    <>
      <Space direction="vertical" style={{ paddingTop:"6vh"}} size={[0, 48]}>
        <Layout style={layoutStyle}>
          <Content style={contentStyle}>
            <Dashboard />
          </Content>
        </Layout>
      </Space>
    </>
  );
};

export default App;