import { Button, Select, Space, Spin, Typography, Tabs, Flex, Card, Divider } from "antd";
import { useRef, useState } from "react";
import { useAppSelector } from "../Redux/store/store";
import cytoscape from "cytoscape";
import "./DashBoard.css";
import ReveloTable from "./ReveloTable/ReveloTable";
import WorkTable from "../Dashboard/ReveloTable/WorkTable";
import Header from "./header/Header";

const Dashboard = () => {
  const [jurisdiction, setJurisdiction] = useState();
  const [selectedValues, setSelectedValues] = useState({});
  const [selectedOption, setSelectedOption] = useState({});
  const [selectedTabLabel, setSelectedTabLabel] = useState("District Wise Work"); // Set the default tab label
  const { userInfo } = useAppSelector((state) => state.reveloUserInfo);

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
      label: 'District Wise Work',
      children: <ReveloTable />,
    },
    {
      key: '2',
      label: 'Work Monitoring',
      children: <WorkTable />,
    },  
    {
      key: '3',
      label: 'Department Wise Work',
      children: 'Comming Soon ...',
    },
    {
      key: '4',
      label: 'Village Wise Water budgeting',
      children: 'Comming Soon ...',
    },
    {
      key: '5',
      label: 'Village Wise Water budgeting',
      children: 'Comming Soon ...',
    },
    {
      key: '6',
      label: 'Village Wise Water budgeting',
      children: 'Comming Soon ...',
    },
    {
      key: '7',
      label: 'Repair Works',
      children: 'Comming Soon ...',
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
      <Card bordered={false} >
        <Header />
        <Flex vertical justify="center" >
          {/* "Reports" Text on Left */}
          <Flex style={{marginTop: "7px"}}>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "600", marginLeft: "0vw"}}>
            Reports
          </Typography.Text>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "600", marginLeft: "8vw"}}>
            Jurisdictions
          </Typography.Text>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "600", marginLeft: "24vw"}}>
            Report Output
          </Typography.Text>
          </Flex>

          {/* Selected Tab Label at Center */}
          {/* {selectedTabLabel && (
            <Typography.Text style={{ fontSize: "20px", fontWeight: "600", textAlign: "center", width: "100%", position: "absolute", top: "5vh", left: "50%", transform: "translateX(-50%)" }}>
              {selectedTabLabel}
            </Typography.Text>
          )} */}

          <Divider />
          <Tabs
            style={{height:"75vh", marginLeft: "-2vw"}}
            items={items}
            onChange={onChange}
            tabBarGutter={5}
            tabPosition="left"
            size="small"
          />
        </Flex>
      </Card>
    </>
  );
};

export default Dashboard;
