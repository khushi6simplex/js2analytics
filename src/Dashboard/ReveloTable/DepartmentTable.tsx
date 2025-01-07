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
} from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import WorkData from "../work.json";
import { fetchGeoData } from "../Data/useGeoData";
import "../../Dashboard/Dashboard.css";
import { exportToExcel } from "../Excel/Excel";

const WorkTable: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedDepartment, setSelectedDepartment] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [geoData, setGeoData] = useState<any[]>([]);
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

  const handleDepartmentClick = (deptName: string) => {
    setSelectedDepartment(selectedDepartment === deptName ? null : deptName);
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
    return (
      (!selectedDivision || isInDivision) &&
      isInDistrict &&
      isInTaluka &&
      isInDepartment
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
    },
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      width: "10%",
      // render: () => selectedDivision || "N/A",
      // ellipsis: true,
      //   render: (text) => (
      //    <Tooltip placement="topLeft" title={text}>
      //      {text}
      //    </Tooltip>
      //  ),
    },

    {
      title: "Department",
      dataIndex: "deptName",
      key: "deptName",
      width: "15%",
      defaultSortOrder: "ascend" as const,
      sorter: (a, b) => a.deptName.localeCompare(b.deptName),
      ellipsis: true,
      //  render: (text) => (
      //   <Tooltip placement="topLeft" title={text}>
      //     {text}
      //   </Tooltip>
      // ),
    },

    {
      title: "Admin Approved",
      dataIndex: "adminapprovalno",
      key: "adminapprovalno",
      width: "10%",
      sorter: (a, b) => a.adminapprovalno - b.adminapprovalno,
      //  ellipsis: true,
      // render: (text) => (
      //   <Tooltip placement="topLeft" title={text}>
      //     {text}
      //   </Tooltip>
      // ),
    },
    {
      title: "Works Started",
      dataIndex: "workstarted",
      key: "workstarted",
      width: "10%",
      sorter: (a, b) => a.workstarted - b.workstarted,
      // render: (text) => {
      //   const date = dayjs(text);
      //   const formattedDate = date.format("MMMM D, YYYY");
      //   return (
      //     <p title={formattedDate}>
      //       {formattedDate}
      //     </p>
      //   );
      // },
    },
    {
      title: "Works Completed",
      dataIndex: "worksCompleted",
      key: "worksCompleted",
      width: "15%",
      sorter: (a, b) => a.worksCompleted - b.worksCompleted,
      //  render: (text) => (
      //   <p  title={text}>
      //     {text+"sq.m"}
      //   </p>
      // ),
    },
    {
      title: "Expected Water Storage (MLD)",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: "15%",
      sorter: (a, b) => a.expectedwaterstorage - b.expectedwaterstorage,
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
      width: "15%",
      sorter: (a, b) => a.estimatedcost - b.estimatedcost,
      render: (text) => <p title={text}>{"₹" + parseFloat(text).toFixed(2)}</p>,
    },
  ];

  const tableData =
    filteredFeatures.map((feature, index) => ({
      key: index + 1,
      division: selectedDivision,
      deptName: selectedDepartment,
      // deptName: geoData.filter(
      //   (f) => f.properties.deptName === selectedDepartment,
      // ),

      adminapprovalno: geoData.filter(
        (f) =>
          f.properties.adminapprovalno &&
          f.properties.deptName === feature.properties.deptName,
      ).length,
      workstarted: geoData.filter(
        (f) =>
          f.properties.workstartdate &&
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
          f.properties.wocompletiondate > f.properties.workstartdate &&
          f.properties.deptName === feature.properties.deptName,
      ).length,
      expectedwaterstorage: geoData
        .filter((f) => f.properties.deptName === feature.properties.deptName)
        .reduce(
          (sum, feature) =>
            sum + (feature.properties.expectedwaterstorage || 0),
          0,
        ),
    })) || [];

  // console.log(tableData, "tableData5");

  const tableMap = new Map();

  tableData.forEach((item) => {
    console.log(item.division, "item.depname");
    tableMap.set(item.deptName, item);
    console.log(Array.from(tableMap.values()), "tableMap1");
  });

  const downloadExcel = () => {
    exportToExcel({
      data: Array.from(tableMap.values()),
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName: "RepairWorks.xlsx",
      sheetName: "Work Data",
      tableTitle: "Repair Works Table",
    });
  };

  return (
    <Flex gap={50} wrap="nowrap">
      <Row gutter={[20, 20]} style={{ flexWrap: "nowrap" }}>
        <Col span={10}>
          <Row gutter={[10, 10]} style={{ flexWrap: "nowrap" }}>
            <Col span={6}>
              <Jurisdictions
                title="Divisions"
                data={Object.keys(divisionData)}
                selectedItem={selectedDivision}
                onItemClick={handleDivisionClick}
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
                onItemClick={handleDistrictClick}
                placeholder="Select a Division"
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
                onItemClick={handleTalukaClick}
                placeholder="Select a District"
              />
            </Col>
            <Col span={6}>
              <Jurisdictions
                title="Department"
                data={
                  selectedTaluka
                    ? Array.from(
                        new Set(
                          geoData
                            .filter(
                              (feature) =>
                                feature.properties.taluka === selectedTaluka,
                            )
                            .map((feature) => feature.properties.deptName),
                        ),
                      )
                    : []
                }
                selectedItem={selectedDepartment}
                onItemClick={handleDepartmentClick}
                placeholder="No Departments Available"
              />
            </Col>
          </Row>
        </Col>
        <Col span={14}>
          {loading ? (
            <Spin size="large" /> // Show loading spinner
          ) : geoData.length === 0 ? (
            <Empty description="No data available" /> // Show empty state
          ) : (
            <div>
              <Flex justify="right">
                <Button
                  onClick={downloadExcel}
                  style={{
                    backgroundColor: "#008CBA",
                    color: "white",
                    marginBottom: "10px",
                  }}>
                  Download As Excel
                </Button>
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
                  onChange: (page, pageSize) => {
                    setCurrentPage(page);
                    setPageSize(pageSize);
                  },
                }}
                scroll={{ x: "100%", y: "100%" }}
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
