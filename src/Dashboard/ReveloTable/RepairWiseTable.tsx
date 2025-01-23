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
  Tabs,
  Button,
  Typography,
  Divider,
} from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../../Dashboard/Dashboard.css";
import { fetchGeoData } from "../Data/useGeoData";
import type { TabsProps } from "antd";
import RepairWorks from "../../Dashboard/repairWorks.json";
import { exportToExcel } from "../Excel/Excel";

function RepairWiseReport() {
  const [loading, setLoading] = useState<boolean>(true);
  const [geoData, setGeoData] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<any>();
  const [reportValue, setReportsValue] = useState<any>();
  const [selectedDistrict, setSelectedDistrict] = useState<any>();
  const [selectedTaluka, setSelectedTaluka] = useState<any>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(7);

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

  const columns = [
    {
      title: "#",
      dataIndex: "key",
      key: "key",
      width: "5%",
      render: (_: any, __: any, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Work Type",
      dataIndex: "worktype",
      key: "worktype",
      width: "30%",
      sorter: (a, b) => a.worktype.localeCompare(b.worktype),
    },
    {
      title: "Work Count",
      dataIndex: "workcount",
      key: "workcount",
      width: "20%",
      sorter: (a, b) => a.workcount - b.workcount,
      className: "center",
    },
    {
      title: "Estimated Cost",
      dataIndex: "estimatedcost",
      key: "estimatedcost",
      width: "20%",

      render: (text) => (
        <p title={text}>
          {" "}
          ₹
          {parseFloat(text)
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </p>
      ),
      sorter: (a, b) => a.estimatedcost - b.estimatedcost,
      className: "center",
    },
  ];

  const workTypes =
    reportValue && RepairWorks.values[reportValue]?.workType?.values
      ? Object.keys(RepairWorks.values[reportValue].workType.values)
      : [];

  const tableData = workTypes.map((worktype, index) => {
    const matchingFeatures = filteredFeatures.filter(
      (feature) => feature.properties.worktype === worktype,
    );
    const workcount = matchingFeatures.length;
    const estimatedcost = matchingFeatures.reduce(
      (sum, feature) => sum + (feature.properties.estimatedcost || 0),
      0,
    );

    return {
      key: index + 1,
      worktype,
      workcount,
      estimatedcost,
    };
  });

  const calculateTotals = (data) => {
    const totals = {
      key: "totals",
      worktype: "Total",
      workcount: data.reduce((sum, item) => sum + (item.workcount || 0), 0),
      estimatedcost: data.reduce(
        (sum, item) => sum + (item.estimatedcost || 0),
        0,
      ),
    };
    return totals;
  };

  const items: TabsProps["items"] = Object.keys(RepairWorks.values).map(
    (key) => ({
      key,
      label: key,
    }),
  );

  const onChange = (item: string) => {
    setReportsValue(item === undefined ? "Drainage Line Treatment" : item);
  };

  useEffect(() => {
    setReportsValue("Drainage Line Treatment");
  }, []);

  const handleExport = () => {
    const totals = calculateTotals(tableData);
    const dataWithTotals = [
      ...tableData,
      {
        key: "",
        worktype: "Total",
        workcount: `${totals.workcount}`,
        estimatedcost: `${totals.estimatedcost}`,
      },
    ];
    exportToExcel({
      data: selectedDivision ? dataWithTotals : [],
      columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })), // Pass only title and dataIndex
      fileName: "RepairWorks.xlsx",
      sheetName: "Work Data",
      tableTitle: "Repair Works Table",
    });
  };

  return (
    <Flex gap={50} wrap="nowrap">
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

              <Flex vertical>
                <Tabs defaultActiveKey="1" items={items} onChange={onChange} />

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
                    current: currentPage,
                    onChange: (page, pageSize) => {
                      setCurrentPage(page);
                      setPageSize(pageSize);
                    },
                  }}
                  summary={(pageData) => {
                    const totals = calculateTotals(pageData);
                    return (
                      <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                        <Table.Summary.Cell index={0} colSpan={2}>
                          <div style={{ fontWeight: "bold" }}>Total</div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} className="center">
                          <p style={{ fontWeight: "bold" }}>
                            {totals.workcount}
                          </p>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} className="center">
                          <p style={{ fontWeight: "bold" }}>
                            ₹{" "}
                            {parseFloat(totals.estimatedcost)
                              .toFixed(2)
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </p>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                  scroll={{ x: "100%" }}
                  bordered
                />
              </Flex>
            </div>
          )}
        </Col>
      </Row>
    </Flex>
  );
}

export default RepairWiseReport;
