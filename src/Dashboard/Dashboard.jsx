import { Typography, Tabs, Flex, Card, Divider } from "antd";
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

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("Summary");
  const [isMapVisible, setIsMapVisible] = useState(false); // State for map visibility

  const handleTabChange = (key) => {
    setSelectedTab(key);
  };

  const handleMapToggle = () => {
    setIsMapVisible((prev) => !prev);
  };

  const items = [
    {
      key: "1",
      label: "Summary",
      children: <Summary resetTrigger={selectedTab === "1"} />,
    },
    {
      key: "2",
      label: "District Wise Work",
      children: <DistrictWiseTable isMapVisible={isMapVisible} />, // Pass isMapVisible
    },
    {
      key: "3",
      label: "Department Wise Work",
      children: <DepartmentTable />,
    },
    {
      key: "4",
      label: "Village Wise Water Budgeting and Village Plans",
      children: <VillageWaterBudget />,
    },
    {
      key: "5",
      label: "Village Wise Work",
      children: <VillageWiseWork />,
    },
    {
      key: "6",
      label: "Work Completion Report",
      children: <WorkCompletionReport />,
    },
    {
      key: "7",
      label: "Repair Works",
      children: <RepairWiseReport />,
    },
    {
      key: "8",
      label: "Work Monitoring",
      children: <WorkMonitoringTable />,
    },
    {
      key: "9",
      label: "User Defined Query",
      children: "Coming Soon ...",
    },
    {
      key: "10",
      label: "Geotagging",
      children: <Geotagging />,
    },
  ];

  return (
    <>
      <Card bordered={false}>
        <Header onMapToggle={handleMapToggle} /> {/* Pass toggle function to Header */}
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
