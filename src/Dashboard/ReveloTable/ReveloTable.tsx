import React, { useState } from "react";
import { Table, Row, Col, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import data from "../data.json";

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

  const summarizedData = (() => {
    let filteredData = [];

    if (selectedTaluka) {
      filteredData = data.features.filter(
        (feature) => feature.properties.taluka === selectedTaluka
      ).map((feature) => ({
        key: feature.properties.taluka,
        taluka: feature.properties.taluka,
        district: feature.properties.district,
        division: selectedDivision,
        worksCount: 1,
        worksGeotagged: feature.geometry ? 1 : 0,
        worksStarted: feature.properties.workstartdate ? 1 : 0,
        worksCompleted: feature.properties.wocompletiondate ? 1 : 0,
        totalWoAmount: feature.properties.woamount || 0,
        physicaltargetarea: feature.properties.physicaltargetarea || 0,
      }));
    } else if (selectedDistrict) {
      const talukas = Array.from(
        new Set(
          data.features
            .filter((feature) => feature.properties.district === selectedDistrict)
            .map((feature) => feature.properties.taluka)
        )
      );

      filteredData = talukas.map((taluka) => {
        const talukaFeatures = data.features.filter(
          (feature) => feature.properties.taluka === taluka
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
          physicaltargetarea: talukaFeatures.reduce((sum, feature) => sum + (feature.properties.physicaltargetarea || 0), 0),
        };
      });
    } else if (selectedDivision) {
      const districts = divisionData[selectedDivision]?.districts || [];

      filteredData = districts.map((district) => {
        const districtFeatures = data.features.filter(
          (feature) => feature.properties.district === district
        );
        return {
          key: district,
          division: selectedDivision,
          district,
          worksCount: districtFeatures.length,
          worksGeotagged: districtFeatures.filter((feature) => feature.geometry).length,
          worksStarted: districtFeatures.filter((feature) => feature.properties.workstartdate).length,
          worksCompleted: districtFeatures.filter((feature) => feature.properties.wocompletiondate).length,
          totalWoAmount: districtFeatures.reduce((sum, feature) => sum + (feature.properties.woamount || 0), 0),
          physicaltargetarea: districtFeatures.reduce((sum, feature) => sum + (feature.properties.physicaltargetarea || 0), 0),
        };
      });
    }

    return filteredData;
  })();

  const summaryColumns: ColumnsType<any> = [
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      width: "110px"
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: "110px"
    },
    ...(selectedDistrict
      ? [
          {
            title: "Taluka",
            dataIndex: "taluka",
            key: "taluka",
            width: "110px"
          },
        ]
      : []),
    {
      title: "Works Count",
      dataIndex: "worksCount",
      key: "worksCount",
      width: "110px"
    },
    {
      title: "Works Geotagged",
      dataIndex: "worksGeotagged",
      key: "worksGeotagged",
      width: "110px"
    },
    {
      title: "Works Started",
      dataIndex: "worksStarted",
      key: "worksStarted",
      width: "110px"
    },
    {
      title: "Works Completed",
      dataIndex: "worksCompleted",
      key: "worksCompleted",
      width: "110px"
    },
    {
      title: "Total Work Order Amount",
      dataIndex: "totalWoAmount",
      key: "totalWoAmount",
      width: "110px"
    },
    {
      title: "Physical Target Area",
      dataIndex: "physicaltargetarea",
      key: "physicaltargetarea",
      width: "110px"
    },
  ];

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
                      data.features
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
          <Card>
            <Table
              columns={summaryColumns}
              dataSource={summarizedData}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20"],
                total: summarizedData.length,
              }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default ReveloTable;