import React, { useState, useEffect } from "react";
import { Table, Row, Col, Flex } from "antd";
import type { ColumnsType } from "antd/es/table";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import data from "../data.json";

const ReveloTable: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(5);

  useEffect(() => {
    const updatePageSize = () => {
      const availableHeight = window.innerHeight - 300; // Adjust as needed
      const rowHeight = 50; // Approx row height
      setPageSize(Math.floor(availableHeight / rowHeight));
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, []);

  const handleDivisionClick = (division: string) => {
    setSelectedDivision(division === selectedDivision ? null : division);
    setSelectedDistrict(null);
    setSelectedTaluka(null);
  };

  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(district === selectedDistrict ? null : district);
    setSelectedTaluka(null);
  };

  const handleTalukaClick = (taluka: string) => {
    setSelectedTaluka(taluka === selectedTaluka ? null : taluka);
  };

  const getSummarizedData = () => {
    if (selectedTaluka) {
      const talukaFeatures = data.features.filter(
        (feature) =>
          feature.properties.taluka === selectedTaluka &&
          feature.properties.district === selectedDistrict
      );
  
      // Summarize data for the selected taluka
      return [
        {
          key: selectedTaluka,
          taluka: selectedTaluka,
          district: selectedDistrict,
          division: selectedDivision,
          worksCount: talukaFeatures.length,
          worksGeotagged: talukaFeatures.filter((feature) => feature.geometry).length,
          worksStarted: talukaFeatures.filter((feature) => feature.properties.workstartdate).length,
          worksCompleted: talukaFeatures.filter((feature) => feature.properties.wocompletiondate).length,
          totalWoAmount: talukaFeatures.reduce((sum, feature) => sum + (feature.properties.woamount || 0), 0),
          physicalTargetArea: talukaFeatures.reduce(
            (sum, feature) => sum + (feature.properties.physicaltargetarea || 0),
            0
          ),
        },
      ];
    }
  
    if (selectedDistrict && !selectedTaluka) {
      const talukas = Array.from(
        new Set(
          data.features
            .filter((feature) => feature.properties.district === selectedDistrict)
            .map((feature) => feature.properties.taluka)
        )
      );
      return talukas.map((taluka) => {
        const talukaFeatures = data.features.filter(
          (feature) =>
            feature.properties.taluka === taluka &&
            feature.properties.district === selectedDistrict
        );
        return {
          key: taluka,
          taluka,
          district: selectedDistrict,
          division: selectedDivision,
          worksCount: talukaFeatures.length,
          worksGeotagged: talukaFeatures.filter((feature) => feature.geometry).length,
          worksStarted: talukaFeatures.filter((feature) => feature.properties.workstartdate).length,
          worksCompleted: talukaFeatures.filter((feature) => feature.properties.wocompletiondate).length,
          totalWoAmount: talukaFeatures.reduce((sum, feature) => sum + (feature.properties.woamount || 0), 0),
          physicalTargetArea: talukaFeatures.reduce(
            (sum, feature) => sum + (feature.properties.physicaltargetarea || 0),
            0
          ),
        };
      });
    }
  
    if (selectedDivision && !selectedDistrict && !selectedTaluka) {
      const districts = divisionData[selectedDivision]?.districts || [];
      return districts.map((district) => {
        const districtFeatures = data.features.filter(
          (feature) => feature.properties.district === district
        );
         // Get unique talukas in this district
    const uniqueTalukas = Array.from(
      new Set(districtFeatures.map((feature) => feature.properties.taluka))
    );

        return {
          key: district,
          taluka: uniqueTalukas.length,
          division: selectedDivision,
          district,
          worksCount: districtFeatures.length,
          worksGeotagged: districtFeatures.filter((feature) => feature.geometry).length,
          worksStarted: districtFeatures.filter((feature) => feature.properties.workstartdate).length,
          worksCompleted: districtFeatures.filter((feature) => feature.properties.wocompletiondate).length,
          totalWoAmount: districtFeatures.reduce((sum, feature) => sum + (feature.properties.woamount || 0), 0),
          physicalTargetArea: districtFeatures.reduce(
            (sum, feature) => sum + (feature.properties.physicaltargetarea || 0),
            0
          ),
        };
      });
    }
  
    return [];
  };
  

  const columns: ColumnsType<any> = [
    { title: "Division", dataIndex: "division", key: "division", sorter: (a, b) => a.division.localeCompare(b.division),},
    { title: "District", dataIndex: "district", key: "district", sorter: (a, b) => a.division.localeCompare(b.district),},
    { title: "Taluka", dataIndex: "taluka", key: "taluka", sorter: (a, b) => a.division.localeCompare(b.taluka),},
    { title: "Works Count", dataIndex: "worksCount", key: "worksCount", sorter: (a, b) => a.worksCount - b.worksCount},
    { title: "Works Geotagged", dataIndex: "worksGeotagged", key: "worksGeotagged", sorter: (a, b) => a.worksGeotagged - b.worksGeotagged},
    { title: "Works Started", dataIndex: "worksStarted", key: "worksStarted", sorter: (a, b) => a.worksStarted - b.worksStarted},
    { title: "Works Completed", dataIndex: "worksCompleted", key: "worksCompleted", sorter: (a, b) => a.worksCompleted - b.worksCompleted},
    { title: "Total Work Order Amount", dataIndex: "totalWoAmount", key: "totalWoAmount", sorter: (a, b) => a.totalWoAmount - b.totalWoAmount},
    { title: "Physical Target Area", dataIndex: "physicalTargetArea", key: "physicalTargetArea", sorter: (a, b) => a.physicalTargetArea - b.physicalTargetArea},
  ];

  return (
    <Flex gap={50}>
      <Row gutter={[17, 17]}>
        <Col span={8}>
          <Jurisdictions
            title="Divisions"
            data={Object.keys(divisionData)}
            selectedItem={selectedDivision}
            onItemClick={handleDivisionClick}
            placeholder="No divisions available"
          />
          <Jurisdictions
            title="Districts"
            data={selectedDivision ? divisionData[selectedDivision]?.districts || [] : []}
            selectedItem={selectedDistrict}
            onItemClick={handleDistrictClick}
            placeholder="Select a Division"
          />
          <Jurisdictions
            title="Talukas"
            data={
              selectedDistrict
                ? Array.from(
                    new Set(
                      data.features
                        .filter((feature) => feature.properties.district === selectedDistrict)
                        .map((feature) => feature.properties.taluka)
                    )
                  )
                : []
            }
            selectedItem={selectedTaluka}
            onItemClick={handleTalukaClick}
            placeholder="Select a District"
          />
        </Col>
        <Col span={16}>
          <Table
            columns={columns}
            dataSource={getSummarizedData()}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
            }}
          />
        </Col>
      </Row>
    </Flex>
  );
};

export default ReveloTable;
