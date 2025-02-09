import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider, Input } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import ExcelJS from "exceljs";

const StatementA = ({ resetTrigger }) => {
  const [geoData, setGeoData] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = window.__analytics__.wbUrl;

        const responses = await Promise.all([
          axios.get(url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:projectvillage_js2project", outputFormat: "json", srsname: "EPSG:3857", CQL_FILTER: "isselected=true" } }),
          axios.get(url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:subplan_js2project", outputFormat: "json", srsname: "EPSG:3857" } }),
          axios.get(url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:work_js2project", outputFormat: "json", srsname: "EPSG:3857" } }),
          axios.get(url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:work_js2project_shadow", outputFormat: "json", srsname: "EPSG:3857" } }),
        ]);

        const [projectVillageData, waterBudgetData, villagePlanData, shadowWorks, originalWorks] = responses.map(response => response.data.features || []);
        const workData = [...shadowWorks, ...originalWorks];

        const districtData = processDistrictData(projectVillageData, waterBudgetData, villagePlanData, workData);
        setGeoData(districtData);
      } catch (error) {
        console.error("Error fetching or processing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (resetTrigger) {
      setSelectedDivision(null);
      setSelectedDistrict(null);
    }
  }, [resetTrigger]);

  const processDistrictData = (projectVillageData, waterBudgetData, villagePlanData, workData) => {
    const districtVillageCounts = countByDistrict(projectVillageData, "district");
    const districtWorkCounts = countWorkData(workData, "district", "completionlocation");
    const districtAdminApprovalCounts = countAdminApprovalData(workData, "district", "adminapprovalnumber");
    const districtCompletionCounts = countCompletionData(workData, "district", "wocompletionofficer");

    return Object.keys(districtVillageCounts).map((district, index) => {
      const division = findDivision(district);
      return {
        key: `${division}-${district}`,
        serialNo: index + 1,
        division,
        district,
        villageCount: districtVillageCounts[district],
        totalWorks: districtWorkCounts[district]?.total || 0,
        proposedCost: districtWorkCounts[district]?.proposedCost || 0,
        adminApprovalWorks: districtAdminApprovalCounts[district]?.works || 0,
        adminApprovalCost: districtAdminApprovalCounts[district]?.cost || 0,
        completedWorks: districtCompletionCounts[district]?.works || 0,
        expenditureIncurred: districtCompletionCounts[district]?.cost || 0,
      };
    });
  };

  const countByDistrict = (data, districtKey) => {
    return data.reduce((acc, feature) => {
      const district = feature.properties[districtKey] || "Unknown District";
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {});
  };

  const countWorkData = (data, districtKey, locationKey) => {
    return data.reduce((acc, feature) => {
      const district = feature.properties[districtKey] || "Unknown District";
      const proposedCost = feature.properties.estimatedcost || 0;
      if (!acc[district]) {
        acc[district] = { total: 0, proposedCost: 0 };
      }
      acc[district].total += 1;
      acc[district].proposedCost += proposedCost;
      return acc;
    }, {});
  };

  const countAdminApprovalData = (data, districtKey, approvalKey) => {
    return data.reduce((acc, feature) => {
      const district = feature.properties[districtKey] || "Unknown District";
      const approvalNumber = feature.properties[approvalKey];
      const cost = feature.properties.estimatedcost || 0;
      if (!acc[district]) {
        acc[district] = { works: 0, cost: 0 };
      }
      if (approvalNumber) {
        acc[district].works += 1;
        acc[district].cost += cost;
      }
      return acc;
    }, {});
  };

  const countCompletionData = (data, districtKey, completionKey) => {
    return data.reduce((acc, feature) => {
      const district = feature.properties[districtKey] || "Unknown District";
      const completionOfficer = feature.properties[completionKey];
      const cost = feature.properties.estimatedcost || 0;
      if (!acc[district]) {
        acc[district] = { works: 0, cost: 0 };
      }
      if (completionOfficer) {
        acc[district].works += 1;
        acc[district].cost += cost;
      }
      return acc;
    }, {});
  };

  const findDivision = (district) => {
    return Object.keys(divisionData).find(division => divisionData[division].districts.includes(district)) || "Unknown Division";
  };

  const handleDivisionClick = (division) => {
    setSelectedDivision(division === selectedDivision ? null : division);
    setSelectedDistrict(null);
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district === selectedDistrict ? null : district);
  };

  const getFilteredData = () => {
    let filtered = geoData;

    if (selectedDivision) {
      filtered = filtered.filter(item => item.division === selectedDivision);
    }

    if (selectedDistrict) {
      filtered = filtered.filter(item => item.district === selectedDistrict);
    }

    if (searchTerm) {
      filtered = filtered.filter(item => item.district.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExport = async () => {
    if (geoData.length === 0) {
      alert("No data available to export.");
      return;
    }

    const sortedData = getFilteredData().sort((a, b) => a.division.localeCompare(b.division));
    const dataToExport = prepareExportData(sortedData);
    const workbook = createWorkbook(dataToExport);

    const fileName = generateFileName();
    downloadWorkbook(workbook, fileName);
  };

  const prepareExportData = (data) => {
    return data.map((item) => [
      item.serialNo,
      item.district,
      item.villageCount,
      item.totalWorks,
      item.proposedCost,
      item.adminApprovalWorks,
      item.adminApprovalCost,
      item.completedWorks,
      item.expenditureIncurred,
    ]);
  };

  const createWorkbook = (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Statement A Data");

    const headerRow1 = ["Serial No.", "District", "No. of Villages Covered", "Works Sanctioned in Village Plan and its Proposed Cost", "", "Status of Administrative Approval Granted", "", "Total No. of Completed Works and Expenditure Incurred", ""];
    const headerRow2 = ["", "", "", "No. of Works", "Proposed Costs", "No. of Works", "Administrative Cost", "No. of Works", "Expenditure Incurred (in Lakhs)"];

    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);

    applyHeaderStyle(worksheet.getRow(1));
    applyHeaderStyle(worksheet.getRow(2));

    data.forEach((row) => {
      const excelRow = worksheet.addRow(row);
      applyRowStyle(excelRow);
    });

    mergeHeaderCells(worksheet);

    return workbook;
  };

  const applyHeaderStyle = (row) => {
    const headerStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
    };
    row.eachCell(cell => cell.style = headerStyle);
  };

  const applyRowStyle = (row) => {
    row.eachCell(cell => {
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  };

  const mergeHeaderCells = (worksheet) => {
    worksheet.mergeCells("D1:E1");
    worksheet.mergeCells("F1:G1");
    worksheet.mergeCells("H1:I1");
  };

  const generateFileName = () => {
    let fileName = "StatementA_Report";
    if (selectedDivision) fileName = `${selectedDivision}_StatementA_Report`;
    if (selectedDistrict) fileName = `${selectedDistrict}_StatementA_Report`;
    return `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  };

  const downloadWorkbook = (workbook, fileName) => {
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    });
  };

  const columns = [
    { title: "Serial No.", dataIndex: "serialNo", key: "serialNo", align: "center", className: "center", sorter: (a, b) => a.serialNo - b.serialNo },
    { title: "District", dataIndex: "district", key: "district", align: "center", className: "center", sorter: (a, b) => a.district.localeCompare(b.district), defaultSortOrder: "ascend" },
    { title: "No. of Villages Covered", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center", sorter: (a, b) => a.villageCount - b.villageCount },
    { title: "Works Sanctioned in Village Plan and its Proposed Cost", children: [{ title: "No. of Works", dataIndex: "totalWorks", key: "totalWorks", align: "center", className: "center", sorter: (a, b) => a.totalWorks - b.totalWorks }, { title: "Proposed Costs", dataIndex: "proposedCost", key: "proposedCost", align: "center", className: "center", sorter: (a, b) => a.proposedCost - b.proposedCost }] },
    { title: "Status of Administrative Approval Granted", children: [{ title: "No. of Works", dataIndex: "adminApprovalWorks", key: "adminApprovalWorks", align: "center", className: "center", sorter: (a, b) => a.adminApprovalWorks - b.adminApprovalWorks }, { title: "Administrative Cost", dataIndex: "adminApprovalCost", key: "adminApprovalCost", align: "center", className: "center", sorter: (a, b) => a.adminApprovalCost - b.adminApprovalCost }] },
    { title: "Total No. of Completed Works and Expenditure Incurred", children: [{ title: "No. of Works", dataIndex: "completedWorks", key: "completedWorks", align: "center", className: "center", sorter: (a, b) => a.completedWorks - b.completedWorks }, { title: "Expenditure Incurred (in Lakhs)", dataIndex: "expenditureIncurred", key: "expenditureIncurred", align: "center", className: "center", sorter: (a, b) => a.expenditureIncurred - b.expenditureIncurred }] }
  ];

  const sortedData = getFilteredData().sort((a, b) => a.division.localeCompare(b.division));

  return (
    <>
      <Flex gap={50} wrap="nowrap">
        <Row gutter={[17, 17]} style={{ flexWrap: "nowrap" }}>
          <Col span={8.1}>
            <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}>
              Jurisdictions
            </Typography.Text>
            <Row gutter={[10, 10]} style={{ flexWrap: "nowrap" }}>
              <Col span={12}>
                <Jurisdictions
                  title="Divisions"
                  data={Object.keys(divisionData)}
                  selectedItem={selectedDivision}
                  onItemClick={handleDivisionClick}
                />
              </Col>
              <Col span={12}>
                <Jurisdictions
                  title="Districts"
                  data={selectedDivision ? divisionData[selectedDivision]?.districts || [] : []}
                  selectedItem={selectedDistrict}
                  onItemClick={handleDistrictClick}
                />
              </Col>
            </Row>
          </Col>
          <Divider type="vertical" style={{ height: "45vh", borderColor: "" }} />
          <Col span={18}>
            {loading ? (
              <Spin size="large" />
            ) : geoData.length === 0 ? (
              <Empty description="" />
            ) : (
              <div>
                <Flex gap="large" justify="space-between" align="center">
                  <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}>
                    Total Records {`${sortedData.length} / ${sortedData.length}`}
                  </Typography.Text>
                  <Input
                    placeholder="Enter District Name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{ width: 200, marginBottom: "10px", marginRight: "-650px" }}
                  />
                  <Button
                    onClick={handleExport}
                    style={{ backgroundColor: "#008CBA", color: "white", marginBottom: "10px" }}
                  >
                    Export As Excel
                  </Button>
                </Flex>
                <Table
                  columns={columns}
                  className="custom-table"
                  style={{ alignItems: "top", borderColor: "#ff5722" }}
                  size="small"
                  tableLayout="fixed"
                  dataSource={sortedData}
                  pagination={false}
                  scroll={{ x: "100%" }}
                  bordered
                />
              </div>
            )}
          </Col>
        </Row>
      </Flex>
    </>
  );
};

StatementA.propTypes = {
  resetTrigger: PropTypes.bool.isRequired,
  isMapVisible: PropTypes.bool,
};

export default StatementA;
