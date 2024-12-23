import React, { useState } from "react";
import { Table, Row, Col, Card, Flex } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import WorkData from "../work.json";

const WorkTable: React.FC = () => {
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

  const filteredFeatures = WorkData.features.filter((feature) => {
    const { district, taluka } = feature.properties;
    const isInDivision =
      selectedDivision &&
      divisionData[selectedDivision]?.districts.includes(district);
    const isInDistrict = !selectedDistrict || district === selectedDistrict;
    const isInTaluka = !selectedTaluka || taluka === selectedTaluka;

    return (!selectedDivision || isInDivision) && isInDistrict && isInTaluka;
  });

  const columns = [
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: "180px"
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
       width: "180px"
    },
    {
      title: "Department",
      dataIndex: "depname",
      key: "depname",
       width: "180px"
    },
    {
      title: "Work Type",
      dataIndex: "worktype",
      key: "worktype",
       width: "180px"
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
       width: "180px"
    },
    {
      title: "Physical Target Area",
      dataIndex: "physicaltargetarea",
      key: "physicaltargetarea",
       width: "180px"
    },
    {
      title: "Expected Water Storage",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: "180px"
    },
  ];

  const tableData =
    filteredFeatures.map((feature, index) => ({
      key: index,
      district: feature.properties.district,
      taluka: feature.properties.taluka,
      depname: feature.properties.depname,
      worktype: feature.properties.worktype,
      estimatedcost: feature.properties.estimatedcost,
      physicaltargetarea: feature.properties.physicaltargetarea,
      expectedwaterstorage: feature.properties.expectedwaterstorage,
    })) || [];

  return (
    <Flex  gap={50}>
      <Row gutter={[17, 17]} >
        <Col span={8} >
          <Jurisdictions
            title="Divisions"
            data={Object.keys(divisionData)}
            selectedItem={selectedDivision}
            onItemClick={handleDivisionClick}
            placeholder="No divisions available"
          />
          <Jurisdictions
            title="Districts"
            data={
              selectedDivision
                ? divisionData[selectedDivision].districts
                : []
            }
            selectedItem={selectedDistrict}
            onItemClick={handleDistrictClick}
            placeholder="Select a Division to see Districts"
          />
          <Jurisdictions
            title="Talukas"
            data={
              selectedDistrict
                ? Array.from(
                    new Set(
                      WorkData.features
                        .filter(
                          (feature) =>
                            feature.properties.district === selectedDistrict
                        )
                        .map((feature) => feature.properties.taluka)
                    )
                  )
                : []
            }
            selectedItem={selectedTaluka}
            onItemClick={handleTalukaClick}
            placeholder="Select a District to see Talukas"
          />
        </Col>
        <Col span={16} >
          <Table
            columns={columns}
            style={{alignItems:"top"}}
            dataSource={tableData}
            size="large"
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              total: tableData.length,
            }}
          />
        </Col>
      </Row>
    </Flex>
  );
};

export default WorkTable;
