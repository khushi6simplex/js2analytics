import React, { useState, useEffect } from "react";
import {
  Table,
  Row,
  Col,
  Card,
  Flex,
  Spin,
  Empty,
  Tooltip,
  Button,
  Typography,
  Divider,
} from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import { fetchGeoData } from "../Data/useGeoData";
import "../../Dashboard/Dashboard.css";
import { exportToExcel } from "../Excel/Excel";

const WorkTable: React.FC = () => {
  const [geoData, setGeoData] = useState<any[]>([]); // Ensure this is always an array
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedTaluka, setSelectedTaluka] = useState<any>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(7);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading to true while fetching
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

  const calculateTotals = (data) => {
    const totals = {
      key: "totals",
      division: "Total",
      district: "",
      taluka: "",
      worksCount: data.reduce((sum, item) => sum + (item.worksCount || 0), 0),
      worksGeotagged: data.reduce((sum, item) => sum + (item.worksGeotagged || 0), 0),
      worksStarted: data.reduce((sum, item) => sum + (item.worksStarted || 0), 0),
      worksCompleted: data.reduce((sum, item) => sum + (item.worksCompleted || 0), 0),
      totalWoAmount: data.reduce((sum, item) => sum + (item.totalWoAmount || 0), 0).toFixed(2),
      physicalTargetArea: data.reduce((sum, item) => sum + (item.physicalTargetArea || 0), 0).toFixed(2),
    };
    return totals;
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

      return [
        {
          key: selectedTaluka,
          taluka: selectedTaluka,
          district: selectedDistrict,
          division: selectedDivision,
          worksCount: talukaFeatures.length,
          worksGeotagged: talukaFeatures.filter((feature) => feature.geometry).length,
          worksStarted: talukaFeatures.filter((feature) => feature.properties.workstartdate).length,
          worksCompleted: talukaFeatures.filter(
            (feature) => feature.properties.wocompletiondate > feature.properties.workstartdate
          ).length,
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
          worksCompleted: talukaFeatures.filter(
            (feature) => feature.properties.wocompletiondate > feature.properties.workstartdate
          ).length,
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
          worksCompleted: districtFeatures.filter(
            (feature) => feature.properties.wocompletiondate > feature.properties.workstartdate
          ).length,
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
    { title: "Division", dataIndex: "division", key: "division", className: "center" },
    { title: "District", dataIndex: "district", key: "district", sorter: (a, b) => a.district.localeCompare(b.district), defaultSortOrder: "ascend" as const, className: "center" },
    { title: "Taluka", dataIndex: "taluka", key: "taluka", sorter: (a, b) => a.district.localeCompare(b.taluka), className: "center" },
    { title: "Works Count", dataIndex: "worksCount", key: "worksCount", sorter: (a, b) => a.worksCount - b.worksCount, className: "center" },
    { title: "Works Geotagged", dataIndex: "worksGeotagged", key: "worksGeotagged", sorter: (a, b) => a.worksGeotagged - b.worksGeotagged, className: "center" },
    { title: "Works Started", dataIndex: "worksStarted", key: "worksStarted", sorter: (a, b) => a.worksStarted - b.worksStarted, className: "center" },
    { title: "Works Completed", dataIndex: "worksCompleted", key: "worksCompleted", sorter: (a, b) => a.worksCompleted - b.worksCompleted, className: "center" },
    { title: "Total Work Order Amount", dataIndex: "totalWoAmount", key: "totalWoAmount", sorter: (a, b) => a.totalWoAmount - b.totalWoAmount, render: (text) => <p title={text}>{"₹ " + parseFloat(text).toFixed(2)}</p>, className: "center" },
    { title: "Physical Target Area", dataIndex: "physicalTargetArea", key: "physicalTargetArea", sorter: (a, b) => a.physicalTargetArea - b.physicalTargetArea, render: (text) => <p title={text}>{text + " sq.m."}</p>, className: "center" },
  ];

const handleExport = () => {
    const summarizedData = getSummarizedData();
    const totals = calculateTotals(summarizedData);
  
    // Append totals as the last row
    const dataWithTotals = [
      ...summarizedData,
      {
        division: "Total",
        district: "",
        taluka: "",
        worksCount: totals.worksCount,
        worksGeotagged: totals.worksGeotagged,
        worksStarted: totals.worksStarted,
        worksCompleted: totals.worksCompleted,
        totalWoAmount: `₹ ${totals.totalWoAmount}`,
        physicalTargetArea: `${totals.physicalTargetArea} sq.m.`,
      },
    ];
  
    exportToExcel({
      data: dataWithTotals,
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName: "WorkMonitoring.xlsx",
      sheetName: "Work Monitoring Report",
      tableTitle: "Work Monitoring Report",
    });
  };

  return (
    <Flex gap={50} wrap="nowrap">
      <Row gutter={[17, 17]} style={{ flexWrap: "nowrap" }}>
        <Col span={8.1}>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}>
            Jurisdictions
          </Typography.Text>
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
                data={
                  selectedDivision
                    ? divisionData[selectedDivision].districts
                    : []
                }
                selectedItem={selectedDistrict}
                onItemClick={handleDistrictClick}
                placeholder=""
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
                          .filter(
                            (feature) =>
                              feature.properties.district ===
                              selectedDistrict,
                          )
                          .map((feature) => feature.properties.taluka),
                      ),
                    )
                    : []
                }
                selectedItem={selectedTaluka}
                onItemClick={handleTalukaClick}
                placeholder=""
              />
            </Col>
          </Row>
        </Col>
        <Divider type="vertical" style={{ height: "100%", borderColor: "" }} />
        <Col span={16}>
          {/* Show loading spinner */}
          {loading ? (
            <Spin size="large" />
          ) : geoData.length === 0 ? (
            <Empty description="No data available" /> // Show empty state
          ) : (
            <div>
              <Flex gap="large" justify="space-between" align="center">
                <Typography.Text
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    paddingBottom: "10px",
                    display: "block",
                  }}
                >
                  Report Output
                </Typography.Text>
                <Button
                  onClick={handleExport}
                  style={{
                    backgroundColor: "#008CBA",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  Export As Excel
                </Button>
              </Flex>

              <Table
                columns={columns}
                style={{ alignItems: "top" }}
                size="small"
                tableLayout="fixed"
                dataSource={selectedDivision ? tableData : []}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: false,
                  total: 0,
                  onChange: (page, pageSize) => {
                    setCurrentPage(page);
                    setPageSize(pageSize);
                  },
                }}
                scroll={{ x: "100%" }}
                bordered
                summary={(pageData) => {
                  const totals = calculateTotals(pageData);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <div style={{ textAlign: "center", fontWeight: "bolder" }}>Total</div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} className="center">
                        {totals.worksCount}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} className="center">
                        {totals.worksGeotagged}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} className="center">
                        {totals.worksStarted}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} className="center">
                        {totals.worksCompleted}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} className="center">
                        ₹{totals.totalWoAmount}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} className="center">
                        {totals.physicalTargetArea} sq.m.
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </div>
          )}
        </Col>
      </Row>
    </Flex>
  );
};
export default WorkTable;
