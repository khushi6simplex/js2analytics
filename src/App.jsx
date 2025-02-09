import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppSelector } from "./Redux/store/store";
import Dashboard from "./Dashboard/Dashboard";
import "./App.css";
import axios from "axios"; // Import axios for making HTTP requests

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
  const [userRole, setUserRole] = useState(null);
  const [userJurisdiction, setUserJurisdiction] = useState(null);

  const principalUrl = window.__analytics__.serverUrl;

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${principalUrl}/access/principal/webnew?callback=somecallback`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("keycloakToken")
          },
        });

        let data = response.data;

        // Ensure JSON is extracted correctly from "somecallback(...)"
        if (data.startsWith("somecallback(")) {
          data = data.substring(13, data.length - 2); // Remove 'somecallback(' and ')'
          data = data.replace(/^"|"$/g, ""); // Remove leading & trailing quotes
          data = data.replace(/\\/g, ""); // Remove escape characters
          data = JSON.parse(data); // Parse JSON
        } else {
          console.error("Invalid response format.");
          throw new Error("Invalid response format.");
        }

        console.log("Parsed Data:", data);

        // Extract userInfo
        const userInfo = data?.userInfo ?? null;
        const userRole = userInfo.role ?? null;
        const jurisdictionFilters = userInfo.jurisdictionFilters ?? null;

        setUserRole(userRole);

        // Filter jurisdiction based on user role
        let filteredJurisdiction = null;
        if (userRole === 'jsstate') {
          filteredJurisdiction = { state: jurisdictionFilters.state };
        } else if (userRole === 'jsdistrict') {
          filteredJurisdiction = { district: jurisdictionFilters.district };
        } else if (userRole === 'jstaluka') {
          filteredJurisdiction = { taluka: jurisdictionFilters.taluka };
        }

        setUserJurisdiction(filteredJurisdiction);

        console.log(userRole, filteredJurisdiction);

      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    if (userInfo) {
      fetchUserInfo();
    }
  }, [userInfo]);

  return (
    <>
      <Space direction="vertical" style={{ paddingTop: "6vh" }} size={[0, 48]}>
        <Layout style={layoutStyle}>
          <Content style={contentStyle}>
            <Dashboard userRole={userRole} jurisdictionFilters={userJurisdiction} />
          </Content>
        </Layout>
      </Space>
    </>
  );
};

export default App;