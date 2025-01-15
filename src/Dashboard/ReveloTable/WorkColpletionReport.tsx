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

const WorkColpletionReport = () => {
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
    setCurrentPage(1);
  };
  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(selectedDistrict === district ? null : district);
    setSelectedTaluka(null);
    setCurrentPage(1);
  };
  const handleTalukaClick = (taluka: string) => {
    setSelectedTaluka(selectedTaluka === taluka ? null : taluka);
    setCurrentPage(1);
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

  const calculateTotals = (data) => {
    const totals = {
      key: "totals",
      division: "Total",
      district: "",
      taluka: "",
      deptName: "",
      worktype: "",
      beneficiaryname: "",
      adminapproved: "",
      workorderno: "",
      workstartdate: "",
      inprogresslocation: "",
      wocompletioncost: "",
      estimatedcost: data.reduce(
        (sum, item) => sum + (item.estimatedcost || 0),
        0,
      ),
      physicaltargetarea: data
        .reduce((sum, item) => sum + (item.physicaltargetarea || 0), 0)
        .toFixed(2),
      expectedwaterstorage: data
        .reduce((sum, item) => sum + (item.expectedwaterstorage || 0), 0)
        .toFixed(2),
      geometry: "",
    };
    return totals;
  };

  const columns = [
    {
      title: "#",
      dataIndex: "key",
      key: "key",
      width: "3%",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
      className: "center",
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      width: "100",
      ellipsis: true,
      className: "center",
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: "100",
      sorter: (a, b) => a.district.localeCompare(b.district),
      defaultSortOrder: "ascend" as const,
      ellipsis: true,
      className: "center",
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
      width: "100",
      sorter: (a, b) => a.taluka.localeCompare(b.taluka),
      className: "center",
    },

    {
      title: "Created Work",
      dataIndex: "totalwork",
      key: "totalwork",
      width: "100",
      sorter: (a, b) => a.totalwork - b.totalwork,
      // ellipsis: true,
      className: "center",
    },
    {
      title: "Started Work",
      dataIndex: "startedwork",
      key: "startedwork",
      width: "100",
      sorter: (a, b) => a.startedwork.localeCompare(b.startedwork),
      // ellipsis: true,
      className: "center",
    },
    {
      title: "Work Complete %",
      dataIndex: "workcomplete",
      key: "workcomplete",
      width: "100",
      sorter: (a, b) => a.workcomplete.localeCompare(b.workcomplete),
      // ellipsis: true,
      className: "center",
    },
  ];

  //   console.log(filteredFeatures.subplanid,"filteredFeatures");
  const date = new Date();
  const tableData =
    filteredFeatures.map((feature, index) => ({
      key: index + 1,
      division: selectedDivision,
      district: feature.properties.district,
      taluka: feature.properties.taluka,
      //   totalwork: feature.properties.subplanid.length,
      totalwork: geoData.filter(
        (f) =>
          f.properties.subplanid &&
          f.properties.taluka === feature.properties.taluka,
      ).length,
      startedwork: geoData.filter(
        (f) =>
          f.properties.workstartdate &&
          f.properties.taluka === feature.properties.taluka,
      ).length,
      workcomplete: feature.properties.worktype,
    })) || [];

  const tableMap = new Map();

  tableData.forEach((item) => {
    console.log(item.division, "item.depname");
    tableMap.set(item.taluka, item);
    console.log(Array.from(tableMap.values()), "tableMap1");
  });

  const handleExport = () => {
    const totals = calculateTotals(tableData);

    const dataWithTotals = [
      ...tableData,
      {
        key: "",
        division: "Total",
        district: "",
        taluka: "",
        deptName: "",
        worktype: "",
        beneficiaryname: "",
        adminapproved: "",
        workorderno: "",
        workstartdate: "",
        inprogresslocation: "",
        wocompletioncost: "",
        estimatedcost: `₹ ${totals.estimatedcost}`,
        physicaltargetarea: `${totals.physicaltargetarea} sq.m.`,
        expectedwaterstorage: `${totals.expectedwaterstorage} TCM`,
        geometry: "",
      },
    ];
    exportToExcel({
      data: selectedDivision ? dataWithTotals : [],
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName: "WorkMonitoring.xlsx",
      sheetName: "Work Data",
      tableTitle: "Work Monitoring Table",
    });
  };

  return (
    <Flex style={{ width: "85vw" }}>
      <Row gutter={[17, 17]} style={{ flexWrap: "nowrap" }}>
        <Col span={8.1}>
          <Typography.Text
            style={{
              fontSize: "20px",
              fontWeight: "700",
              paddingBottom: "10px",
              display: "block",
            }}>
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
                  }}>
                  Report Output
                </Typography.Text>

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

              <div
                style={{
                  overflow: "hidden",
                  width: "100%",
                }}>
                <Table
                  columns={columns}
                  //   scroll={{ x: 1600 }}
                  style={{ alignItems: "top" }}
                  dataSource={
                    selectedDivision ? Array.from(tableMap.values()) : []
                  }
                  size="small"
                  tableLayout="fixed"
                  pagination={{
                    pageSize: pageSize,
                    showSizeChanger: false,
                    total: 0,
                    current: currentPage,
                    onChange: (page, pageSize) => {
                      setCurrentPage(page);
                      setPageSize(pageSize);
                    },
                  }}
                  //   summary={(pageData) => {
                  //     const totals = calculateTotals(pageData);
                  //     return (
                  //       <Table.Summary.Row>
                  //         <Table.Summary.Cell index={0} colSpan={12}>
                  //           <div
                  //             style={{
                  //               textAlign: "center",
                  //               fontWeight: "bolder",
                  //             }}>
                  //             Total
                  //           </div>
                  //         </Table.Summary.Cell>
                  //         <Table.Summary.Cell index={10} className="center">
                  //           ₹{totals.estimatedcost}
                  //         </Table.Summary.Cell>
                  //         <Table.Summary.Cell index={11} className="center">
                  //           {totals.physicaltargetarea} sq.m
                  //         </Table.Summary.Cell>
                  //         <Table.Summary.Cell index={12} className="center">
                  //           {totals.expectedwaterstorage} TCM
                  //         </Table.Summary.Cell>
                  //       </Table.Summary.Row>
                  //     );
                  //   }}
                  // scroll={{ x: "100%" }}
                  bordered
                />
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Flex>
  );
};
export default WorkColpletionReport;
