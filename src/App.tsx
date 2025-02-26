import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppSelector } from "./Redux/store/store";
import Dashboard from "./Dashboard/Dashboard";
import "./App.css";
import jsonp from "jsonp"; // Import JSONP

declare global {
  interface Window {
    __analytics__: {
      serverUrl: string;
    };
  }
}

const layoutStyle: React.CSSProperties = {
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userJurisdiction, setUserJurisdiction] = useState<{ state?: any; district?: any; taluka?: any }>({});
  const [userName, setUserName] = useState<string | null>(null);

  const principalUrl = window.__analytics__?.serverUrl;

  useEffect(() => {
    const fetchUserInfo = () => {
      if (!principalUrl) {
        console.error("Server URL is undefined.");
        return;
      }

      const apiUrl = `${principalUrl}/access/principal/web?`;

      jsonp(apiUrl, { param: "callback", name: "somecallback", timeout: 100000 }, (err: Error | null, response: any) => {
        if (err) {
          console.error("JSONP Request Failed", err);
          return;
        }

        console.log("✅ Raw JSONP Response:", response);
        const data = JSON.parse(response);
        console.log(data);

        // Directly use the response without unnecessary parsing
        const userInfo = data?.userInfo;
        if (!userInfo) {
          console.error("🚨 userInfo is missing in the response:", response);
          return;
        }

        console.log("✅ Extracted userInfo:", userInfo);

        // Set state values correctly
        setUserRole(userInfo.role);
        setUserName(userInfo.userName);

        let filteredJurisdiction: { state?: any; district?: any; taluka?: any } = {};

        if (userInfo.role === "jsstate") {
          filteredJurisdiction.state = userInfo.jurisdictionFilters?.state;
        } else if (userInfo.role === "jsdistrict") {
          filteredJurisdiction.district = userInfo.jurisdictionFilters?.district;
        } else if (userInfo.role === "jstaluka") {
          filteredJurisdiction.taluka = userInfo.jurisdictionFilters?.taluka;
        }

        setUserJurisdiction(filteredJurisdiction);
        console.log("✅ Final State:", { userRole: userInfo.role, userJurisdiction: filteredJurisdiction });
      });
    };

    fetchUserInfo(); // Fetch user info whenever principalUrl is available
  }, [principalUrl]); // Trigger useEffect when principalUrl changes

  console.log("Rendering App with:", { userRole, userJurisdiction, userName });

  return (
    <Space>
      <Layout style={layoutStyle}>
        <Content style={contentStyle}>
          {userRole && userJurisdiction && userName ? (
            <Dashboard userRole={userRole} jurisdictionFilters={userJurisdiction} userName={userName} />
          ) : (
            <div>Loading...</div>
          )}
        </Content>
      </Layout>
    </Space>
  );
};

export default App;