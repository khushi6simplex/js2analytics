import React, { useState } from "react";
import { List, Typography, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import divisionData from "../division.json"; // Importing division.json
import data from "../data.json"; // Importing data.json

const ReveloTable: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);

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
    selectedDistrict &&
    Array.from(
      new Set(
        data.features
          .filter((feature) => feature.properties.district === selectedDistrict)
          .map((feature) => feature.properties.taluka)
      )
    );

  const filteredFeatures =
    selectedTaluka &&
    data.features.filter((feature) => feature.properties.taluka === selectedTaluka);

  const columns: ColumnsType<any> = [
    { title: "गट क्रमांक", dataIndex: "gatnumber", key: "gatnumber", width: 150 },
    { title: "टप्प्यानुसार बिलाची एकूण किंमत (रु.)", dataIndex: "wocompletioncost", key: "wocompletioncost", width: 150},
    { title: "अंदाजे किंमत", dataIndex: "estimatedcost", key: "estimatedcost", width: 150 },
    { title: "आवश्यक रक्कम (अंदाजे खर्चापेक्षा कमी)", dataIndex: "amountrequired", key: "amountrequired", width: 150 },
    { title: "काम सुरु झाल्याचा दिनांक", dataIndex: "workstartdate", key: "workstartdate", width: 150 },
    { title: "काम संपल्याचा दिनांक", dataIndex: "wocompletiondate", key: "wocompletiondate", width: 150 },
    { title: "जिओटॅग केलेले आहे?", dataIndex: "isGeotagged", key: "isGeotagged", width: 120, render: (isGeotagged) => (isGeotagged ? "Yes" : "No") }
  ];

  const tableData =
    filteredFeatures?.map((feature, index) => ({
      key: index,
      gatnumber: feature.properties.gatnumber,
      estimatedcost: feature.properties.estimatedcost,
      wocompletioncost: feature.properties.wocompletioncost,
      amountrequired: feature.properties.amountrequired,
      workstartdate: feature.properties.workstartdate,
      wocompletiondate: feature.properties.wocompletiondate,
      isGeotagged: feature.geometry ? true : false,  // Check if geometry is null or not
    })) || [];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar: Fixed on the left */}
      <div
        style={{
          width: "770px",
          overflowY: "auto",
          font: "10px",
          backgroundColor: "#f8f9fa",
          borderRight: "1px solid #ddd",
          padding: "10px",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <Typography.Title level={4}>Division Wise Work Data</Typography.Title>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "30%" }}>
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
          </div>

          <div style={{ width: "30%" }}>
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
          </div>

          <div style={{ width: "30%" }}>
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
          </div>
        </div>
      </div>

      {/* Main Content: Work Properties Table */}
      <div
        style={{
          marginLeft: "800px",
          flex: 1,
          padding: "10px",
          overflowY: "auto"
        }}
      >
        {selectedTaluka ? (
          <div>
            <Typography.Title level={5} style={{marginTop: "-10px"}}>Works: {selectedTaluka}</Typography.Title>
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={{
                pageSize: 8, // Adjust the number of rows per page
                showSizeChanger: true, // Allows the user to change the page size
                pageSizeOptions: ["10", "20", "50"], // Provide different page size options
                total: tableData.length, // Show the total number of items
              }}
              style={{ width: "100%" }}
            />
          </div>
        ) : (
          <Typography.Text>Select a Taluka to see Work Properties</Typography.Text>
        )}
      </div>
    </div>
  );
};

export default ReveloTable;
