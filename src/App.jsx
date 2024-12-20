import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppSelector } from "./Redux/store/store";
// import ReveloTable from "./Dashboard/ReveloTable/ReveloTable";
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
    if (!userInfo.status) {
      navigation("/");
    }
  }, [userInfo, navigation]);

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }} size={[0, 48]}>
        <Layout style={layoutStyle}>
          <Content style={contentStyle}>
            {/* <RDashBoard/> */}
            <Dashboard />
            {/* <ReveloTable /> */}
          </Content>
        </Layout>
      </Space>
    </>
  );
};

export default App;
