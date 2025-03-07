import React, { useState, useEffect } from "react";
import {
  Table,
  Row,
  Col,
  Card,
  Flex,
  Tooltip,
  Spin,
  Empty,
  Button,
  Divider,
  Typography,
  Input,
} from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import { fetchGeoData } from "../Data/useGeoData";
import "../../Dashboard/Dashboard.css";
import { exportToExcel } from "../Excel/Excel";

interface DepartmentTableProps {
  resetTrigger: boolean;
  userRole: string;
  jurisdictionFilters: any;
}

const DepartmentTable: React.FC<DepartmentTableProps> = ({
  resetTrigger,
  userRole,
  jurisdictionFilters,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedDepartment, setSelectedDepartment] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [geoData, setGeoData] = useState<any[]>([]);
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
    const filterString =
      typeof filterInput === "string"
        ? filterInput
        : JSON.stringify(filterInput);
    const match = filterString.match(/district='([^']+)'/);
    return match ? match[1] : null;
  };

  const parseTalukaFromFilters = (filterInput: any): string | null => {
    const filterString =
      typeof filterInput === "string"
        ? filterInput
        : JSON.stringify(filterInput);
    const match = filterString.match(/taluka='([^']+)'/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (userRole === "jsdistrict" || userRole === "jstaluka") {
      const districtFilter = jurisdictionFilters || {};
      const district = parseDistrictFromFilters(districtFilter);
      if (district) {
        setSelectedDistrict(district);
        const division = Object.keys(divisionData).find((div) =>
          divisionData[div].districts.includes(district),
        );
        setSelectedDivision(division || null);
      }
    }

    if (userRole === "jstaluka") {
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
    // setSelectedDepartment(null);
    setCurrentPage(1);
  };
  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(selectedDistrict === district ? null : district);
    setSelectedTaluka(null);
    // setSelectedDepartment(null);
    setCurrentPage(1);
  };
  const handleTalukaClick = (taluka: string) => {
    setSelectedTaluka(selectedTaluka === taluka ? null : taluka);
    // setSelectedDepartment(null);
    setCurrentPage(1);
  };

  const handleDepartmentClick = (deptName: string) => {
    setSelectedDepartment(selectedDepartment === deptName ? null : deptName);
    setSelectedDivision(null);
    setSelectedDistrict(null);
    setSelectedTaluka(null);
  };

  const filteredFeatures = geoData.filter((feature) => {
    const { district, taluka, deptName } = feature.properties;
    const isInDivision =
      selectedDivision &&
      divisionData[selectedDivision]?.districts.includes(district);
    const isInDistrict = !selectedDistrict || district === selectedDistrict;
    const isInTaluka = !selectedTaluka || taluka === selectedTaluka;
    const isInDepartment =
      !selectedDepartment || deptName === selectedDepartment;
    const matchesSearch = Object.values(feature.properties).some((value) =>
      String(value).toLowerCase().toString().includes(searchTerm),
    );

    return (
      (!selectedDivision || isInDivision) &&
      isInDistrict &&
      isInTaluka &&
      isInDepartment &&
      matchesSearch
    );
  });

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: "3%",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
      align: "center" as "center",
    },
    {
      title: "Department",
      dataIndex: "deptName",
      key: "deptName",
      width: "15%",
      defaultSortOrder: "ascend" as const,
      sorter: (a, b) => a.deptName.localeCompare(b.deptName),
      ellipsis: true,
      align: "center" as "center",
    },

    {
      title: "Admin Approved",
      dataIndex: "adminapprovalno",
      key: "adminapprovalno",
      width: "10%",
      sorter: (a, b) => a.adminapprovalno - b.adminapprovalno,
      className: "center",
      align: "center" as "center",
    },
    {
      title: "Works Started",
      dataIndex: "workstarted",
      key: "workstarted",
      width: "10%",
      sorter: (a, b) => a.workstarted - b.workstarted,
      className: "center",
      align: "center" as "center",
    },
    {
      title: "Works Completed",
      dataIndex: "worksCompleted",
      key: "worksCompleted",
      width: "15%",
      sorter: (a, b) => a.worksCompleted - b.worksCompleted,
      className: "center",
      align: "center" as "center",
    },
    {
      title: "Expected Water Storage",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: "15%",
      sorter: (a, b) => a.expectedwaterstorage - b.expectedwaterstorage,
      render: (text) => (
        <p title={text}>{parseFloat(text).toFixed(2) + " TCM"}</p>
      ),
      className: "center",
      align: "center" as "center",
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
      width: "15%",
      sorter: (a, b) => a.estimatedcost - b.estimatedcost,
      render: (text) => (
        <p title={text}>
          {"₹ " +
            parseFloat(text)
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </p>
      ),
      className: "center",
      align: "center" as "center",
    },
    {
      title: "GeoTagged",
      dataIndex: "geometry",
      key: "geometry",
      width: "15%",
      // sorter: (a, b) => a.estimatedcost - b.estimatedcost,
      // render: (text) => (
      //   <p title={text}>{"₹ " + parseFloat(text).toFixed(2)}</p>
      // ),
      className: "center",
      align: "center" as "center",
    },
  ];

  const tableData =
    filteredFeatures.map((feature, index) => ({
      key: index + 1,
      division: selectedDivision,
      deptName: selectedDepartment,
      adminapprovalno: geoData.filter(
        (f) =>
          f.properties.adminapprovalno &&
          f.properties.deptName === feature.properties.deptName,
      ).length,
      workstarted: geoData.filter(
        (f) =>
          f.properties.startedlocation &&
          f.properties.deptName === feature.properties.deptName,
      ).length,
      estimatedcost: geoData
        .filter((f) => f.properties.deptName === feature.properties.deptName)
        .reduce(
          (sum, feature) => sum + (feature.properties.estimatedcost || 0),
          0,
        ),
      worksCompleted: geoData.filter(
        (f) =>
          f.properties.completionlocation &&
          f.properties.deptName === feature.properties.deptName,
      ).length,
      expectedwaterstorage: geoData
        .filter((f) => f.properties.deptName === feature.properties.deptName)
        .reduce(
          (sum, feature) =>
            sum + (feature.properties.expectedwaterstorage || 0),
          0,
        ),
      geometry: feature.geometry === null ? "No" : "Yes",
    })) || [];

  const tableMap = new Map();

  tableData.forEach((item) => {
    tableMap.set(item.deptName, item);
  });

  const handleExport = () => {
    exportToExcel({
      data: selectedDivision ? Array.from(tableMap.values()) : [],
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName: "RepairWorks.xlsx",
      sheetName: "Work Data",
      tableTitle: "Repair Works Table",
    });
  };

  const handleSearchChange = (e) => {
    const search = e.target.value.toLowerCase();
    setSearchTerm(search);
  };

  return (
    <Flex gap={30} wrap="nowrap">
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
            <Col span={6}>
              <Jurisdictions
                title="Department"
                data={Array.from(
                  new Set(
                    geoData.map((feature) => feature.properties.deptName),
                  ),
                )}
                selectedItem={selectedDepartment}
                onItemClick={handleDepartmentClick}
                placeholder="No Departments Available"
              />
            </Col>

            <Col span={6}>
              <Jurisdictions
                title="Divisions"
                data={Object.keys(divisionData)}
                selectedItem={selectedDivision}
                onItemClick={
                  userRole === "jsdistrict" || userRole === "jstaluka"
                    ? () => {}
                    : handleDivisionClick
                }
                placeholder="No divisions available"
              />
            </Col>
            <Col span={6}>
              <Jurisdictions
                title="Districts"
                data={
                  selectedDivision
                    ? divisionData[selectedDivision].districts
                    : []
                }
                selectedItem={selectedDistrict}
                onItemClick={
                  userRole === "jsdistrict" || userRole === "jstaluka"
                    ? () => {}
                    : handleDistrictClick
                }
                placeholder=""
              />
            </Col>
            <Col span={6}>
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
                onItemClick={
                  userRole === "jstaluka" ? () => {} : handleTalukaClick
                }
                placeholder=""
              />
            </Col>
          </Row>
        </Col>
        <Divider type="vertical" style={{ height: "100%", borderColor: "" }} />
        <Col span={14}>
          {loading ? (
            <Spin size="large" /> // Show loading spinner
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

              <Table
                columns={columns}
                style={{ alignItems: "top" }}
                dataSource={
                  selectedDepartment ? Array.from(tableMap.values()) : []
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
                // scroll={{ x: "100%", y: "100%" }}
                bordered
              />
            </div>
          )}
        </Col>
      </Row>
    </Flex>
  );
};
export default DepartmentTable;
