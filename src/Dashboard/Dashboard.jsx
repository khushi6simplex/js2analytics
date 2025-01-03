import { Typography, Tabs, Flex, Card, Divider } from "antd";
import { useState } from "react";
import "./DashBoard.css";
import ReveloTable from "./ReveloTable/ReveloTable";
import WorkTable from "../Dashboard/ReveloTable/WorkTable";
import DepartmentTable from "../Dashboard/ReveloTable/DepartmentTable";
import RepairWiseReport from "./ReveloTable/RepairWiseTable";
import Header from "./header/Header";
import Overview from "./ReveloTable/Overview";

const Dashboard = () => {
  const [jurisdiction, setJurisdiction] = useState();
  const [selectedValues, setSelectedValues] = useState({});
  const [selectedOption, setSelectedOption] = useState({});
  const [selectedTabLabel, setSelectedTabLabel] = useState("Overview"); // Set the default tab label

  const handleReset = () => {
    const resetValues = {};
    Object.keys(selectedValues).forEach((panel) => {
      resetValues[panel] = "All";
    });
    setSelectedValues(resetValues);
    setJurisdiction(undefined);
    setSelectedOption(undefined);
  };

  const items = [
    {
      key: '1',
      label: 'Summary',
      children: <Overview/>,
    },
    {
      key: '2',
      label: 'District Wise Work',
      children: <ReveloTable />,
    },
    {
      key: '3',
      label: 'Work Monitoring',
      children: <WorkTable />,
    },  
    {
      key: '4',
      label: 'Department Wise Work',
      children: <DepartmentTable/>,
    },
    {
      key: '5',
      label: 'Village Wise Water budgeting',
      children: 'Comming Soon ...',
    },
    {
      key: '6',
      label: 'Village Wise Work',
      children: 'Comming Soon ...',
    },
    {
      key: '7',
      label: 'Repair Works',
      children: <RepairWiseReport/>,
    },
    {
      key: '8',
      label: 'User Defined Query',
      children: 'Comming Soon ...',
    },
    {
      key: '9',
      label: 'Geotagging',
      children: 'Comming Soon ...',
    },
  ];

  const onChange = (key) => {
    const selectedTab = items.find(item => item.key === key);
    setSelectedTabLabel(selectedTab?.label || ""); // Update the label when tab is changed
  };

  return (
    <>
      <Card bordered={false}>
        <Header />
        <Flex vertical justify="center" >
          {/* "Reports" Text on Left */}
          <Flex style={{marginTop: "20px"}}>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "600", marginLeft: "-10px"}}>
            Reports
          </Typography.Text>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "600", marginLeft: "160px"}}>
            Jurisdictions
          </Typography.Text>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "600", marginLeft: "400px"}}>
            Report Output
          </Typography.Text>
          </Flex>

          <Divider />

          <Tabs
            tabBarStyle={{height:"70vh",marginLeft:"-2vw"}}
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
