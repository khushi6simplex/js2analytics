import React, { useState, useEffect } from "react";
import { Table, Row, Col, Spin, Empty, Flex, Typography, Divider } from "antd";
import { fetchGeoData } from "../Data/useGeoData";
import Jurisdictions from "../Jurisdiction/Jurisdiction"; // Importing Jurisdictions
import divisionData from "../division.json";

const ReveloTable: React.FC = () => {
  const [geoData, setGeoData] = useState<any[]>([]); // Ensure this is always an array
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading to true while fetching
        const filter = `state='Maharashtra'`; // Your CQL filter for state
        const data = await fetchGeoData();
        setGeoData(data.features || []); // Ensure it's always an array
      } catch (error) {
        console.error("Error fetching Geoserver data", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };
    fetchData();
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
    if (loading) return []; // Return empty array if still loading

    const dataToUse = geoData || [];

    if (selectedTaluka) {
      const talukaFeatures = dataToUse.filter(
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
          worksCompleted: talukaFeatures.filter((feature) => feature.properties.wocompletiondate > feature.properties.workstartdate).length,
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
          dataToUse
            .filter((feature) => feature.properties.district === selectedDistrict)
            .map((feature) => feature.properties.taluka)
        )
      );
      return talukas.map((taluka) => {
        const talukaFeatures = dataToUse.filter(
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
          worksCompleted: talukaFeatures.filter((feature) => feature.properties.wocompletiondate > feature.properties.workstartdate).length,
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
        const districtFeatures = dataToUse.filter(
          (feature) => feature.properties.district === district
        );
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
          worksCompleted: districtFeatures.filter((feature) => feature.properties.wocompletiondate > feature.properties.workstartdate).length,
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

  const columns = [
    { title: "Division", dataIndex: "division", key: "division" },
    { title: "District", dataIndex: "district", key: "district", sorter: (a, b) => a.district.localeCompare(b.district), defaultSortOrder: "ascend" },
    { title: "Taluka", dataIndex: "taluka", key: "taluka", sorter: (a, b) => a.district.localeCompare(b.taluka) },
    { title: "Works Count", dataIndex: "worksCount", key: "worksCount", sorter: (a, b) => a.worksCount - b.worksCount },
    { title: "Works Geotagged", dataIndex: "worksGeotagged", key: "worksGeotagged", sorter: (a, b) => a.worksGeotagged - b.worksGeotagged },
    { title: "Works Started", dataIndex: "worksStarted", key: "worksStarted", sorter: (a, b) => a.worksStarted - b.worksStarted },
    { title: "Works Completed", dataIndex: "worksCompleted", key: "worksCompleted", sorter: (a, b) => a.worksCompleted - b.worksCompleted },
    { title: "Total Work Order Amount", dataIndex: "totalWoAmount", key: "totalWoAmount", sorter: (a, b) => a.totalWoAmount - b.totalWoAmount, render: (text) => <p title={text}>{"₹ " + parseFloat(text).toFixed(2)}</p> },
    { title: "Physical Target Area", dataIndex: "physicalTargetArea", key: "physicalTargetArea", sorter: (a, b) => a.physicalTargetArea - b.physicalTargetArea, render: (text) => <p title={text}>{text + " sq.m."}</p> },
  ];

  return (
    <Flex gap={50} wrap="nowrap">
      <Row gutter={[17, 17]} style={{ flexWrap: "nowrap" }}>
        <Col span={8.1}>
        {/* <Typography.Text style={{ fontSize: "18px", fontWeight: "400", paddingBottom: "10px", display: "block" }}>
          Jurisdictions
        </Typography.Text> */}
          <Row gutter={[10, 10]} style={{ flexWrap: "nowrap" }}>
            <Col span={8}>
              <Jurisdictions
                title="Divisions"
                data={Object.keys(divisionData)}
                selectedItem={selectedDivision}
                onItemClick={handleDivisionClick}
                placeholder="No divisions available"
              />
            </Col>
            <Col span={8}>
              <Jurisdictions
                title="Districts"
                data={selectedDivision ? divisionData[selectedDivision]?.districts || [] : []}
                selectedItem={selectedDistrict}
                onItemClick={handleDistrictClick}
                placeholder="Select a Division"
              />
            </Col>
            <Col span={8}>
              <Jurisdictions
                title="Talukas"
                data={
                  selectedDistrict
                    ? Array.from(
                        new Set(
                          geoData
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
          </Row>
        </Col>
        {/* <Divider type="vertical" style={{ height: "100%", borderColor: "blue" }} /> */}
        <Col span={16}>
        {/* <Typography.Text style={{ fontSize: "20px", fontWeight: "400", paddingBottom: "10px", display: "block" }}>
          Report Output
        </Typography.Text> */}
          {loading ? (
            <Spin size="large" /> // Show loading spinner
          ) : geoData.length === 0 ? (
            <Empty description="No data available" /> // Show empty state
          ) : (
            <Table
              columns={columns}
              style={{ alignItems: "top" }}
              size="small"
              tableLayout="fixed"
              dataSource={getSummarizedData()}
              pagination={{
                pageSize: 6,
                showSizeChanger: false,
                total: getSummarizedData().length,
              }}
              scroll={{ x: "100%" }}
              bordered
            />
          )}
        </Col>
      </Row>
    </Flex>
  );
};

export default ReveloTable;
