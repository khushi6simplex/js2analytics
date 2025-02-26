import React, { useState, useEffect, useRef } from "react";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider, Input } from "antd";
import { fetchGeoData } from "../Data/useGeoData";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import { exportToExcel } from "../Excel/Excel";
import '../Dashboard.css';
import { panToLocation } from '../utils/mapUtils';
import axios from "axios";
import PropTypes from "prop-types";

interface DistrictWiseTableProps {
  isMapVisible: boolean;
  resetTrigger: boolean;
  userRole: string;
  jurisdictionFilters: any;
}

const DistrictWiseTable: React.FC<DistrictWiseTableProps> = ({ resetTrigger, isMapVisible, userRole, jurisdictionFilters = {} }) => {
  const [geoData, setGeoData] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(7);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchGeoData();
        setGeoData(data.features || []);
      } catch (error) {
        console.error("Error fetching Geoserver data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (resetTrigger && userRole === "jsstate") {
      setSelectedDivision(null);
      setSelectedDistrict(null);
      setSelectedTaluka(null);
    } else if (resetTrigger && userRole === "jsdistrict") {
      setSelectedTaluka(null);
    }
  }, [resetTrigger, userRole]);

  const parseDistrictFromFilters = (filterInput: any): string | null => {
    const filterString = typeof filterInput === "string" ? filterInput : JSON.stringify(filterInput);
    const match = filterString.match(/district='([^']+)'/);
    return match ? match[1] : null;
  };

  const parseTalukaFromFilters = (filterInput: any): string | null => {
    const filterString = typeof filterInput === "string" ? filterInput : JSON.stringify(filterInput);
    const match = filterString.match(/taluka='([^']+)'/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (userRole === 'jsdistrict' || userRole === 'jstaluka') {
      const districtFilter = jurisdictionFilters || {};
      const district = parseDistrictFromFilters(districtFilter);
      if (district) {
        setSelectedDistrict(district);
        const division = Object.keys(divisionData).find((div) =>
          divisionData[div].districts.includes(district)
        );
        setSelectedDivision(division || null);
      }
    }

    if (userRole === 'jstaluka') {
      const talukaFilter = jurisdictionFilters || {};
      const taluka = parseTalukaFromFilters(talukaFilter);
      if (taluka) {
        setSelectedTaluka(taluka);
      }
    }
  }, [userRole, jurisdictionFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getFilteredData = () => {
    const summarizedData = getSummarizedData();
    if (!searchTerm.trim()) return summarizedData;
    return summarizedData.filter((item) =>
      Object.values(item).join(" ").toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleDivisionClick = (division: string) => {
    setSelectedDivision(division === selectedDivision ? null : division);
    setSelectedDistrict(null);
    setSelectedTaluka(null);
    setCurrentPage(1);
  };

  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(district === selectedDistrict ? null : district);
    setSelectedTaluka(null);
    setCurrentPage(1);
  };

  const handleTalukaClick = (taluka: string) => {
    setSelectedTaluka(taluka === selectedTaluka ? null : taluka);
    setCurrentPage(1);
  };

  const calculateTotals = (data) => {
    return {
      key: "totals",
      division: "Total",
      district: "",
      taluka: "",
      worksCount: data.reduce((sum, item) => sum + (item.worksCount || 0), 0),
      worksGeotagged: data.reduce((sum, item) => sum + (item.worksGeotagged || 0), 0),
      worksStarted: data.reduce((sum, item) => sum + (item.worksStarted || 0), 0),
      worksCompleted: data.reduce((sum, item) => sum + (item.worksCompleted || 0), 0),
      totalWoAmount: data.reduce((sum, item) => sum + (item.totalWoAmount || 0), 0).toFixed(2),
      physicalTargetArea: data.reduce((sum, item) => sum + (item.physicalTargetArea || 0), 0).toFixed(1),
    };
  };

  const getSummarizedData = () => {
    if (loading) return [];
    const dataToUse = geoData || [];

    if (selectedTaluka) {
      return summarizeTalukaData(dataToUse);
    }

    if (selectedDistrict && !selectedTaluka) {
      return summarizeDistrictData(dataToUse);
    }

    if (selectedDivision && !selectedDistrict && !selectedTaluka) {
      return summarizeDivisionData(dataToUse);
    }

    return [];
  };

  const summarizeTalukaData = (dataToUse) => {
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
        worksStarted: talukaFeatures.filter((feature) => feature.properties.startedlocation).length,
        worksCompleted: talukaFeatures.filter((feature) => feature.properties.completionlocation).length,
        totalWoAmount: talukaFeatures.reduce((sum, feature) => sum + (feature.properties.woamount || 0), 0),
        physicalTargetArea: talukaFeatures.reduce(
          (sum, feature) => sum + (feature.properties.physicaltargetarea || 0), 0),
      },
    ];
  };

  const summarizeDistrictData = (dataToUse) => {
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
        worksStarted: talukaFeatures.filter((feature) => feature.properties.startedlocation).length,
        worksCompleted: talukaFeatures.filter((feature) => feature.properties.completionlocation).length,
        totalWoAmount: talukaFeatures.reduce((sum, feature) => sum + (feature.properties.woamount || 0), 0),
        physicalTargetArea: talukaFeatures.reduce(
          (sum, feature) => sum + (feature.properties.physicaltargetarea || 0),
          0
        ),
      };
    });
  };

  const summarizeDivisionData = (dataToUse) => {
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
  };

  const columns = [
    { title: "Division", align: "center" as "center", dataIndex: "division", key: "division", className: "center", width: "5vw" },
    { title: "District", align: "center" as "center", dataIndex: "district", key: "district", sorter: (a, b) => a.district.localeCompare(b.district), defaultSortOrder: "ascend" as const, className: "center", width: "5vw" },
    { title: "Taluka", align: "center" as "center", dataIndex: "taluka", key: "taluka", sorter: (a, b) => a.district.localeCompare(b.taluka), className: "center", width: "5vw" },
    { title: "Works Count", align: "center" as "center", dataIndex: "worksCount", key: "worksCount", sorter: (a, b) => a.worksCount - b.worksCount, className: "center", width: "5vw" },
    { title: "Works Geotagged", align: "center" as "center", dataIndex: "worksGeotagged", key: "worksGeotagged", sorter: (a, b) => a.worksGeotagged - b.worksGeotagged, className: "center", width: "5vw" },
    { title: "Works Started", align: "center" as "center", dataIndex: "worksStarted", key: "worksStarted", sorter: (a, b) => a.worksStarted - b.worksStarted, className: "center", width: "5vw" },
    { title: "Works Completed", align: "center" as "center", dataIndex: "worksCompleted", key: "worksCompleted", sorter: (a, b) => a.worksCompleted - b.worksCompleted, className: "center", width: "5vw" },
    { title: "Total Work Order Amount", align: "center" as "center", dataIndex: "totalWoAmount", key: "totalWoAmount", sorter: (a, b) => a.totalWoAmount - b.totalWoAmount, render: (text) => <p title={text}>{"₹ " + parseFloat(text).toFixed(2)}</p>, className: "center", width: "5vw" },
    { title: "Physical Target Area", align: "center" as "center", dataIndex: "physicalTargetArea", key: "physicalTargetArea", sorter: (a, b) => a.physicalTargetArea - b.physicalTargetArea, render: (text) => <p title={text}>{parseFloat(text).toFixed(2) + " sq.m."}</p>, className: "center", width: "5vw" },
  ];

  const handleExport = () => {
    const summarizedData = getSummarizedData();
    const totals = calculateTotals(summarizedData);

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

    let fileName = "All Divisions";
    if (selectedDivision) fileName = selectedDivision;
    if (selectedDistrict) fileName = selectedDistrict;
    if (selectedTaluka) fileName = selectedTaluka;
    fileName = `${fileName}.xlsx`;

    exportToExcel({
      data: dataWithTotals,
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })),
      fileName,
      sheetName: "District Wise Work Data",
      tableTitle: "District Wise Work Table",
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
                onItemClick={userRole === 'jsdistrict' || userRole === 'jstaluka' ? () => { } : handleDivisionClick}
                placeholder=""
              />
            </Col>
            <Col span={8}>
              <Jurisdictions
                title="Districts"
                data={selectedDivision ? divisionData[selectedDivision]?.districts || [] : []}
                selectedItem={selectedDistrict}
                onItemClick={userRole === 'jsdistrict' || userRole === 'jstaluka' ? () => { } : handleDistrictClick}
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
                          .filter((feature) => feature.properties.district === selectedDistrict)
                          .map((feature) => feature.properties.taluka)
                      )
                    )
                    : []
                }
                selectedItem={selectedTaluka}
                onItemClick={userRole === 'jstaluka' ? () => { } : handleTalukaClick}
                placeholder=""
              />
            </Col>
          </Row>
        </Col>
        <Divider type="vertical" style={{ height: "100%", borderColor: "" }} />
        <Col span={isMapVisible ? 10 : 16} style={{ overflow: "auto" }}>
          {loading ? (
            <Spin size="large" />
          ) : geoData.length === 0 ? (
            <Empty description="No data available" />   
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
                  Total Records {`${Math.min(currentPage * pageSize, getSummarizedData().length)} / ${getSummarizedData().length}`}
                </Typography.Text>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ width: 200, marginBottom: "10px", marginRight: "-500px" }}
                />
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
                dataSource={getFilteredData()}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: false,
                  total: getFilteredData().length,
                  current: currentPage,
                  onChange: (page, pageSize) => {
                    setCurrentPage(page);
                    setPageSize(pageSize);
                  }
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
                        <strong>{totals.worksCount}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} className="center">
                        <strong>{totals.worksGeotagged}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} className="center">
                        <strong>{totals.worksStarted}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} className="center">
                        <strong>{totals.worksCompleted}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} className="center">
                        <strong>₹ {totals.totalWoAmount}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} className="center">
                        <strong>{totals.physicalTargetArea} sq.m.</strong>
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

DistrictWiseTable.propTypes = {
  resetTrigger: PropTypes.bool.isRequired,
  userRole: PropTypes.string.isRequired,
  jurisdictionFilters: PropTypes.object.isRequired,
};

export default DistrictWiseTable;