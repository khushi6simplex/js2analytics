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
  const filteredFeatures = geoData.filter((feature) => {
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
      dataIndex: "key",
      key: "key",
      width: "3%",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      width: "10%",
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: "10%",
      sorter: (a, b) => a.district.localeCompare(b.district),
      defaultSortOrder: "ascend" as const,
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
      width: "10%",
      sorter: (a, b) => a.district.localeCompare(b.taluka),
    },
    {
      title: "Department",
      dataIndex: "deptName",
      key: "deptName",
      width: "10%",
      sorter: (a, b) => a.district.localeCompare(b.deptName),
      ellipsis: true,
    },

    {
      title: "Work Type",
      dataIndex: "worktype",
      key: "worktype",
      width: "10%",
      sorter: (a, b) => a.district.localeCompare(b.worktype),
      ellipsis: true,
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
      width: "10%",
      sorter: (a, b) => a.estimatedcost - b.estimatedcost,
      render: (text) => <p title={text}>{"₹ " + parseFloat(text).toFixed(2)}</p>,
    },
    {
      title: "Physical Target Area",
      dataIndex: "physicaltargetarea",
      key: "physicaltargetarea",
      width: "10%",
      sorter: (a, b) => a.physicaltargetarea - b.physicaltargetarea,
      render: (text) => <p title={text}>{text + " sq.m"}</p>,
    },
    {
      title: "Expected Water Storage",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: "10%",
      sorter: (a, b) => a.expectedwaterstorage - b.expectedwaterstorage,
      render: (text) => <p title={text}>{text + " TCM"}</p>,
    },
  ];

  const tableData =
    filteredFeatures.map((feature, index) => ({
      key: index + 1,
      division: selectedDivision,
      district: feature.properties.district,
      taluka: feature.properties.taluka,
      deptName: feature.properties.deptName,
      worktype: feature.properties.worktype,
      estimatedcost: feature.properties.estimatedcost,
      physicaltargetarea: feature.properties.physicaltargetarea,
      expectedwaterstorage: feature.properties.expectedwaterstorage,
    })) || [];

  const handleExport = () => {
    exportToExcel({
      data: tableData,
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName: "WorkMonitoring.xlsx",
      sheetName: "Work Data",
      tableTitle: "Work Monitoring Table",
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
                placeholder="Select a District"
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
              <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "0px", display: "block" }}>
                Report Output
              </Typography.Text>
              <Flex justify="right" gap="large">
                <Button
                  onClick={handleExport}
                  style={{
                    backgroundColor: "#008CBA",
                    color: "white",
                    marginBottom: "10px",
                  }}>
                  Export As Excel
                </Button>
              </Flex>

              <Table
                columns={columns}
                style={{ alignItems: "top" }}
                dataSource={selectedDivision ? tableData : []}
                size="small"
                tableLayout="fixed"
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
              />
            </div>
          )}
        </Col>
      </Row>
    </Flex>
  );
};
export default WorkTable;
