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

  console.log(currentPage, "currentPage");

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
      width: "100",
      ellipsis: true,
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      width: "100",
      sorter: (a, b) => a.district.localeCompare(b.district),
      defaultSortOrder: "ascend" as const,
      ellipsis: true,
    },
    {
      title: "Taluka",
      dataIndex: "taluka",
      key: "taluka",
      width: "100",
      sorter: (a, b) => a.taluka.localeCompare(b.taluka),
    },
    {
      title: "Department",
      dataIndex: "deptName",
      key: "deptName",
      width: "100",
      sorter: (a, b) => a.deptName.localeCompare(b.deptName),
      ellipsis: true,
    },

    {
      title: "Work Type",
      dataIndex: "worktype",
      key: "worktype",
      width: "100",
      sorter: (a, b) => a.worktype.localeCompare(b.worktype),
      ellipsis: true,
    },
    {
      title: "Benerficiary Name",
      dataIndex: "beneficiaryname",
      key: "beneficiaryname",
      width: "100",
      sorter: (a, b) => a.benerficiaryname.localeCompare(b.benerficiaryname),
      // ellipsis: true,
    },
    {
      title: "Admin Approval",
      dataIndex: "adminapprovaldate",
      key: "adminapprovaldate",
      width: "100",
      sorter: (a, b) => a.adminapprovaldate.localeCompare(b.adminapprovaldate),
      // ellipsis: true,
    },
    {
      title: "Work Order",
      dataIndex: "woorderno",
      key: "woorderno",
      width: "100",
      sorter: (a, b) => a.woorderno - b.woorderno,
      // ellipsis: true,
    },
    {
      title: "Work Started ",
      dataIndex: "workstartdate",
      key: "workstartdate",
      width: "100",
      sorter: (a, b) => a.workstartdate.localeCompare(b.workstartdate),
      // ellipsis: true,
    },
    {
      title: "In Progress",
      dataIndex: "inprogresslocation",
      key: "inprogresslocation",
      width: "100",
      sorter: (a, b) =>
        a.inprogresslocation.localeCompare(b.inprogresslocation),
      // ellipsis: true,
    },
    {
      title: "Work Completed",
      dataIndex: "wocompletioncost",
      key: "wocompletioncost",
      width: "100",
      sorter: (a, b) => a.wocompletioncost.localeCompare(b.wocompletioncost),
      // ellipsis: true,
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
      width: "100",
      sorter: (a, b) => a.estimatedcost - b.estimatedcost,
      render: (text) => (
        <p title={text}>{"₹ " + parseFloat(text).toFixed(2)}</p>
      ),
      ellipsis: true,
    },
    {
      title: "Physical Target Area",
      dataIndex: "physicaltargetarea",
      key: "physicaltargetarea",
      width: "100",
      sorter: (a, b) => a.physicaltargetarea - b.physicaltargetarea,
      render: (text) => <p title={text}>{text + " sq.m"}</p>,
      ellipsis: true,
    },
    {
      title: "Expected Water Storage",
      dataIndex: "expectedwaterstorage",
      key: "expectedwaterstorage",
      width: "100",
      sorter: (a, b) => a.expectedwaterstorage - b.expectedwaterstorage,
      render: (text) => <p title={text}>{text + " TCM"}</p>,
      ellipsis: true,
    },
    {
      title: "GeoTagged",
      dataIndex: "geometry",
      key: "geometry",
      width: "100",
      // sorter: (a, b) => a.expectedwaterstorage - b.expectedwaterstorage,
      // render: (text) => <p title={text}>{text + " TCM"}</p>,
    },
  ];

  console.log(filteredFeatures, "filteredFeatures5");
  const date = new Date();
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
      geometry: feature.geometry === null ? "No" : "Yes",
      beneficiaryname: feature.properties.beneficiaryname,
      adminapprovaldate:
        feature.properties.adminapprovaldate === "" ? "No" : "Yes",
      woorderno: feature.properties.woorderno === "" ? "No" : "Yes",
      workstartdate: feature.properties.workstartdate < date ? "Yes" : "No",
      inprogresslocation:
        feature.properties.inprogresslocation === "" ? "No" : "Yes",
      wocompletioncost: feature.properties.wocompletioncost > 0 ? "Yes" : "No",
    })) || [];

  const handleExport = () => {
    exportToExcel({
      data: selectedDivision ? tableData : [],
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
                  scroll={{ x: 1600 }}
                  style={{ alignItems: "top" }}
                  dataSource={selectedDivision ? tableData : []}
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
export default WorkTable;
