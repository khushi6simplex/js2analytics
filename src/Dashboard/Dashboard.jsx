// Dashboard.jsx
import { Typography, Tabs, Flex, Card, Divider, Tooltip } from "antd";
import { useState } from "react";
import "./DashBoard.css";
import DistrictWiseTable from "./ReveloTable/DistrictWiseTable";
import WorkMonitoringTable from "../Dashboard/ReveloTable/WorkMonitoringTable";
import DepartmentTable from "../Dashboard/ReveloTable/DepartmentTable";
import RepairWiseReport from "./ReveloTable/RepairWiseTable";
import VillageWaterBudget from "./ReveloTable/VillageWaterBudget";
import WorkCompletionReport from "./ReveloTable/WorkCompletionReport";
import Header from "./header/Header";
import Summary from "./ReveloTable/Summary";
import VillageWiseWork from "./ReveloTable/VillageWiseWork";
import Geotagging from "./ReveloTable/Geotagging";
import StatementA from "./ReveloTable/StatementA";

const Dashboard = ({ userRole, jurisdictionFilters }) => {
  const [selectedTab, setSelectedTab] = useState("Summary");
  const [isMapVisible, setIsMapVisible] = useState(false);

  const handleTabChange = (key) => {
    setSelectedTab(key);
  };

  const toggleMapVisibility = () => {
    setIsMapVisible((prev) => !prev);
  };

  const items = [
    {
      key: "1",
      label: "Summary",
      children: <Summary resetTrigger={selectedTab === "1"} isMapVisible={isMapVisible} />,
    },
    {
      key: "2",
      label: "District Wise Work",
      children: <DistrictWiseTable resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "3",
      label: "Department Wise Work",
      children: <DepartmentTable resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "4",
      label: (
        <Tooltip title="Village Wise Water Budgeting and Village Plans">
          <p
            style={{
              width: "200px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
          >
            Village Wise Water Budgeting and Village Plans
          </p>
        </Tooltip>
      ),
      children: <VillageWaterBudget resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "5",
      label: "Village Wise Work",
      children: "Comming Soon ...",
    },
    {
      key: "6",
      label: "Work Completion Report",
      children: <WorkCompletionReport resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "7",
      label: "Repair Works",
      children: <RepairWiseReport resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "8",
      label: "Work Monitoring",
      children: <WorkMonitoringTable resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "9",
      label: "User Defined Query",
      children: "Comming Soon ...",
    },
    {
      key: "10",
      label: "Geotagging",
      children: <Geotagging resetTrigger={selectedTab === "1"} userRole={userRole} jurisdictionFilters={jurisdictionFilters}/>,
    },
    {
      key: "11",
      label: "Statement A",
      children: "Coming Soon ...",
    },
  ];

  return (
    <>
      <Card bordered={false}>
        <Header onMapToggle={toggleMapVisibility} />
        <Flex vertical justify="center">
          <Flex style={{ marginTop: "0px", marginBottom: "-10px" }}>
            <Typography.Text
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginLeft: "-20px",
                alignContent: "start",
              }}
            >
              Reports
            </Typography.Text>
          </Flex>

          <Divider />

          <Tabs
            tabBarStyle={{ height: "70vh", marginLeft: "-2vw", width: "230px" }}
            items={items}
            onChange={handleTabChange}
            tabBarGutter={4}
            tabPosition="left"
            size="small"
          />
        </Flex>
      </Card>
    </>
  );
};

export default Dashboard;
