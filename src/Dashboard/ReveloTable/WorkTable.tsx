import React, { useState } from "react";
import { Table, Row, Col, Card, Flex } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import WorkData from "../work.json";
const WorkTable: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedTaluka, setSelectedTaluka] = useState<any>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
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
      title: "#",
      dataIndex: "index",
      key: "index",
      width: "80px",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1, 
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      width: "180px",
      render: () => selectedDivision || "N/A", 
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: "180px",
      sorter: (a, b) => a.district.localeCompare(b.district),
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
       width: "180px",
       sorter: (a, b) => a.district.localeCompare(b.taluka),
    },
    {
      title: "Department",
      dataIndex: "depname",
      key: "depname",
       width: "180px",
       sorter: (a, b) => a.district.localeCompare(b.depname),
    },
    {
      title: "Work Type",
      dataIndex: "worktype",
      key: "worktype",
       width: "180px",
       sorter: (a, b) => a.district.localeCompare(b.worktype),
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
       width: "180px",
       sorter: (a, b) => a.estimatedcost - b.estimatedcost,
    },
    {
      title: "Physical Target Area",
      dataIndex: "physicaltargetarea",
      key: "physicaltargetarea",
       width: "180px",
       sorter: (a, b) => a.physicaltargetarea - b.physicaltargetarea,
    },
    {
      title: "Expected Water Storage",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: "180px",
      sorter: (a, b) => a.expectedwaterstorage - b.expectedwaterstorage,
    },
  ];
  const tableData =
    filteredFeatures.map((feature, index) => ({
      key: index,
      division: selectedDivision,
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
        <Col span={9} >
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
        <Col span={15} >
       
       <Table
         columns={columns}
         style={{alignItems:"top"}}
         dataSource={ selectedDivision ? tableData : []}
         size="large"
         pagination={{
           pageSize: pageSize,
           showSizeChanger: false,
           total: tableData.length,
           onChange: (page, pageSize) => {
             setCurrentPage(page);
             setPageSize(pageSize);
           },
         }}
       />
     </Col>
        
      </Row>
    </Flex>
  );
};
export default WorkTable;