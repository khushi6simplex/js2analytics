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
  Input,
} from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import { fetchGeoData } from "../Data/useGeoData";
import "../../Dashboard/Dashboard.css";
import { exportToExcel } from "../Excel/Excel";

interface WorkCompletionReportProps {
  resetTrigger: boolean;
  isMapVisible: boolean;
  userRole: string;
  jurisdictionFilters: any[];
}

const WorkCompletionReport: React.FC<WorkCompletionReportProps> = ({ resetTrigger, isMapVisible, userRole, jurisdictionFilters }) => {
  const [geoData, setGeoData] = useState<any[]>([]); // Ensure this is always an array
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedTaluka, setSelectedTaluka] = useState<any>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(7);
  const [searchTerm, setSearchTerm] = useState("");

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
    const matchesSearch = Object.values(feature.properties).some((value) =>
      String(value).toLowerCase().toString().includes(searchTerm),
    );

    return (
      (!selectedDivision || isInDivision) &&
      isInDistrict &&
      isInTaluka &&
      matchesSearch
    );
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
      align: "center" as "center",
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      width: "100",
      ellipsis: true,
      className: "center",
      align: "center" as "center",
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
      align: "center" as "center",
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
      width: "100",
      sorter: (a, b) => a.taluka.localeCompare(b.taluka),
      className: "center",
      align: "center" as "center",
      ellipsis: true, // Enable ellipsis
    },

    {
      title: "Created Work",
      dataIndex: "totalwork",
      key: "totalwork",
      width: "100",
      sorter: (a, b) => a.totalwork - b.totalwork,
      // ellipsis: true,
      className: "center",
      align: "center" as "center",
      ellipsis: true, // Enable ellipsis
    },
    {
      title: "Started Work",
      dataIndex: "startedwork",
      key: "startedwork",
      width: "100",
      sorter: (a, b) => a.startedwork - b.startedwork,
      // ellipsis: true,
      className: "center",
      align: "center" as "center",
      ellipsis: true, // Enable ellipsis
    },
    {
      title: "Work Complete %",
      dataIndex: "workcomplete",
      key: "workcomplete",
      width: "100",
      sorter: (a, b) => a.workcomplete - b.workcomplete,
      // ellipsis: true,
      render: (text) => <p title={text}>{text + "%"}</p>,
      className: "center",
      align: "center" as "center",
      ellipsis: true, // Enable ellipsis
    },
  ];

  const handleSearchChange = (e) => {
    const search = e.target.value.toLowerCase();
    setSearchTerm(search);

    // const searchFilterData = tableData.filter((item) => {
    //   return Object.values(item).some((value) =>
    //     String(value).toLowerCase().includes(search),
    //   );
    // });
    // console.log(searchFilterData, "searchFilterData");
  };

  function calculateWorkComplete(feature, geoData) {
    let percentage = 0;
    geoData.map((item) => {
      if (item.properties.workid === feature.properties.workid) {
        if (feature.properties.workname !== "") {
          percentage = 20;
        }

        if (feature.properties.adminapprovalno !== "") {
          percentage = 40;
        }

        if (feature.properties.woorderno !== "") {
          percentage = 60;
        }

        if (feature.properties.startedlocation !== "") {
          percentage = 80;
        }

        if (feature.properties.completionlocation !== "") {
          percentage = 100;
        }
      }
    });
    return percentage;
  }

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
          f.properties.workstartdate < "2049-01-13T18:30:00Z" &&
          f.properties.taluka === feature.properties.taluka,
      ).length,
      workcomplete: calculateWorkComplete(feature, geoData),
    })) || [];

  const tableMap = new Map();

  tableData.forEach((item) => {
    tableMap.set(item.taluka, item);
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
    // Determine the file name based on selection
    let fileName = "All Divisions"; // Default

    if (selectedDivision) {
      fileName = selectedDivision; // Use division name if selected
    }

    if (selectedDistrict) {
      fileName = selectedDistrict; // Override with district name if selected
    }

    if (selectedTaluka) {
      fileName = selectedTaluka; // Override with taluka name if selected
    }

    // Add the date suffix only once
    fileName = `${fileName}.xlsx`;

    exportToExcel({
      data: selectedDivision ? dataWithTotals : [],
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName,
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
                onItemClick={userRole === 'jsdistrict' || userRole === 'jstaluka' ? () => { } : handleDivisionClick}
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
                onItemClick={userRole === 'jstaluka' ? () => { } : handleTalukaClick}
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
                  Total Records
                </Typography.Text>

                <Flex gap="small">
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{
                      marginBottom: "10px",
                    }}
                  />
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
export default WorkCompletionReport;
