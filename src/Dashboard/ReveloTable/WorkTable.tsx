import React, { useState } from "react";
import { List, Typography, Table,Row,Col, Card, Flex,Space} from "antd";
import type { ColumnsType } from "antd/es/table";
import divisionData from "../division.json"; // Importing division.json
import WorkData from "../work.json"; // Importing data.json

const ReveloTable: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedTaluka, setSelectedTaluka] = useState<any>();

  const handleDivisionClick = (division: string) => {
    setSelectedDivision(selectedDivision === division ? null : division);
    setSelectedDistrict(null);
    setSelectedTaluka(null);
  };

  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(selectedDistrict === district ? null : district);
    setSelectedTaluka(null);
  };

  const handleTalukaClick = (taluka: string) => {
    setSelectedTaluka(selectedTaluka === taluka ? null : taluka);
  };

  const talukas =
  selectedDivision &&
    Array.from(
      new Set(
        WorkData.features
          .filter((feature) => feature.properties.district === selectedDistrict)
          .map((feature) => feature.properties.taluka)
      )
    );

  // const filteredFeatures =
  //   selectedTaluka &&
  //   WorkData.features.filter((feature) => feature.properties.taluka === selectedTaluka);

  // console.log(divisionData?.[selectedDivision],"selectedDivision")
    const filteredFeatures = WorkData.features.filter((feature) => {
      
      const { district, taluka } = feature.properties;
      const isInDivision =
    selectedDivision && divisionData[selectedDivision]?.districts.includes(district);
    const isInDistrict = !selectedDistrict || district === selectedDistrict;
  const isInTaluka = !selectedTaluka || taluka === selectedTaluka;
 
   console.log(isInDivision,isInDistrict,isInTaluka,"alldata")
      return (!selectedDivision || isInDivision) && isInDistrict && isInTaluka;
    });
  
    // console.log(filteredFeatures,"filteredFeatures")

  const columns = [
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: 150
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
      width: 150
    },
    {
      title: "Department",
      dataIndex: "depname",
      key: "depname",
      width: 150
    },
    {
      title: "Work Type",
      dataIndex: "worktype",
      key: "worktype",
      width: 150
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
      width: 150
    },
    {
      title: "Physical Target Area",
      dataIndex: "physicaltargetarea",
      key: "physicaltargetarea",
      width: 150
    },
    {
      title: "Expected Water Storage",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: 150
    },
  ];



  const tableData =
    filteredFeatures?.map((feature, index) => ({
      key: index,
      district: feature.properties.district,
      taluka: feature.properties.taluka,
      depname: feature.properties.depname,
      worktype: feature.properties.worktype,
      estimatedcost: feature.properties.estimatedcost,
      physicaltargetarea: feature.properties.physicaltargetarea,
      expectedwaterstorage:feature.properties.expectedwaterstorage,
      // isGeotagged: feature.geometry ? true : false,  // Check if geometry is null or not
    })) || [];

    console.log(tableData,"tableData")

  return (

    <Card>

    <Row gutter={[16, 16]}>

     <Col span={9}>  
           <Typography.Text style={{fontSize:"15px",fontWeight:"600"}}>Division Wise Work Data</Typography.Text>

          <Flex justify="start" gap="small">

           <Space direction="vertical">
            <Typography.Title level={5}>Divisions</Typography.Title>
            <List
              bordered
              dataSource={Object.keys(divisionData)}
              renderItem={(division) => (
                <List.Item
                  style={{
                    backgroundColor: selectedDivision === division ? "#dfe6e9" : "white",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDivisionClick(division)}
                >
                  <Typography.Text>{division}</Typography.Text>
                </List.Item>
              )}
            />
          </Space>

          <Space direction="vertical">
            <Typography.Title level={5}>Districts</Typography.Title>
            {selectedDivision ? (
              <List
                bordered
                dataSource={divisionData[selectedDivision].districts}
                renderItem={(district) => (
                  <List.Item
                    style={{
                      backgroundColor: selectedDistrict === district ? "#dfe6e9" : "white",
                      cursor: "pointer",
                    }}
                    onClick={() => handleDistrictClick(district)}
                  >
                    <Typography.Text>{district}</Typography.Text>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text>Select a Division to see Districts</Typography.Text>
            )}
          </Space>

          <Space direction="vertical">
            <Typography.Title level={5}>Talukas</Typography.Title>
            {selectedDistrict ? (
              <List
                bordered
                dataSource={talukas}
                renderItem={(taluka) => (
                  <List.Item
                    style={{
                      backgroundColor: selectedTaluka === taluka ? "#dfe6e9" : "white",
                      cursor: "pointer",
                    }}
                    onClick={() => handleTalukaClick(taluka)}
                  >
                    <Typography.Text>{taluka}</Typography.Text>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text>Select a District to see Talukas</Typography.Text>
            )}
          </Space>
        </Flex>
      </Col>

         <Col span={15}>
         {!selectedDivision ? 
        (
          <Typography.Text style={{alignItems:"center"}}>Select Jurisdiction </Typography.Text>
        ) : (
          <Card>
          <Typography.Title level={5} style={{marginTop: "-10px"}}>Works: 
            {selectedDivision  !== null|| undefined ? !selectedDistrict ? selectedDivision : !selectedTaluka ? selectedDistrict : selectedTaluka : ""
            }
            </Typography.Title>
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 5, // Adjust the number of rows per page
              showSizeChanger: true, // Allows the user to change the page size
              pageSizeOptions: ["10", "10", "30"], // Provide different page size options
              total: tableData.length, // Show the total number of items
            }}

          />
        </Card>
        )    
}
         
     
    </Col>
    </Row>
    </Card>
  );
};

export default ReveloTable;
