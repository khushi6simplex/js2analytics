import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppSelector } from "./Redux/store/store";
import Dashboard from "./Dashboard/Dashboard";
import "./App.css";

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

  useEffect(() => {
    if (userInfo) {
      setUserRole(userInfo.role);
      setUserJurisdiction(userInfo.jurisdictions?.[0]);
    }
  }, [userInfo]);

  return (
    <>
      <Space direction="vertical" style={{ paddingTop: "6vh" }} size={[0, 48]}>
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