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

const Dashboard = () => {
  const [setSelectedTabLabel] = useState("Summary"); // Set the default tab label

  const items = [
    {
      key: "1",
      label: "Summary",
      children: <Summary />,
    },
    {
      key: "2",
      label: "District Wise Work",
      children: <DistrictWiseTable />,
    },
    {
      key: "3",
      label: "Department Wise Work",
      children: <DepartmentTable />,
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
              margin: 0, // To remove margin from <p> tag if needed
            }}
          >
            Village Wise Water Budgeting and Village Plans
          </p>
        </Tooltip>
      ),children: <VillageWaterBudget />,
    },
    {
      key: "5",
      label: "Village Wise Work",
      children: "Comming Soon ...",
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
      children: "Comming Soon ...",
    },
    {
      key: "10",
      label: "Geotagging",
      children: "Comming Soon ...",
    },
  ];

  const onChange = (key) => {
    const selectedTab = items.find((item) => item.key === key);
    setSelectedTabLabel(selectedTab?.label || ""); // Update the label when tab is changed
  };

  return (
    <>
      <Card bordered={false}>
        <Header />
        <Flex vertical justify="center">
          {/* "Reports" Text on Left */}
          <Flex style={{ marginTop: "0px", marginBottom: "-10px" }}>
            <Typography.Text
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginLeft: "-20px",
                alignContent: "start"
              }}>
              Reports
            </Typography.Text>
          </Flex>

          <Divider />

          <Tabs
            tabBarStyle={{ height: "70vh", marginLeft: "-2vw", width: "230px" }}
            items={items}
            onChange={onChange}
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
