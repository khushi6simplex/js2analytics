import React, { useState } from "react";
import { Table, Row, Col, Card } from "antd";
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
    <Card>
      <Row gutter={[16, 16]}>
        <Col span={9}>
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
        <Col span={15}>
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              total: tableData.length,
            }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default WorkTable;
