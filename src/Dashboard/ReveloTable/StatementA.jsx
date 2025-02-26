import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider, Input } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import ExcelJS from "exceljs";

const StatementA = ({ resetTrigger, userRole, jurisdictionFilters = {} }) => {
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

        const [projectVillageData, villagePlanData, shadowWorks, originalWorks] = responses.map(response => response.data.features || []);
        const workData = [...shadowWorks, ...originalWorks];

        const districtData = processDistrictData(projectVillageData, villagePlanData, workData);
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
    if (resetTrigger && userRole === "jsstate") {
      setSelectedDivision(null);
      setSelectedDistrict(null);
    } else if (resetTrigger && userRole === "jsdistrict") {
      setSelectedDistrict(null);
    }
  }, [resetTrigger, userRole]);

  const parseDistrictFromFilters = (filterInput) => {
    const filterString = typeof filterInput === "string" ? filterInput : JSON.stringify(filterInput);
    const match = filterString.match(/district='([^']+)'/);
    return match ? match[1] : null;
  };

  const parseTalukaFromFilters = (filterInput) => {
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

  const processDistrictData = (projectVillageData, villagePlanData, workData) => {
    const districtVillageCounts = countByDistrict(projectVillageData, "district");
    const districtWorkCounts = countWorkData(workData, "district", "worktype");
    const districtAdminApprovalCounts = countAdminApprovalData(workData, "district", "adminapprovalno");
    const districtCompletionCounts = countCompletionData(workData, "district", "completionlocation");

    const districtData = Object.keys(districtVillageCounts).map((district, index) => {
      const division = findDivision(district);
      return {
        key: `${division}-${district}`,
        serialNo: index + 1, // Add serial number
        division,
        district,
        villageCount: districtVillageCounts[district],
        totalWorks: districtWorkCounts[district]?.total || 0,
        proposedCost: districtWorkCounts[district]?.proposedCost || 0,
        adminApprovalWorks: districtAdminApprovalCounts[district]?.works || 0,
        adminApprovalCost: districtAdminApprovalCounts[district]?.cost || 0,
        completedWorks: districtCompletionCounts[district]?.works || 0,
        expenditureIncurred: districtCompletionCounts[district]?.cost || 0,
        isGroupRow: false,
      };
    });

    return addDivisionTotals(districtData);
  };

  const addDivisionTotals = (data) => {
    const groupedByDivision = data.reduce((result, record) => {
      if (!result[record.division]) {
        result[record.division] = [];
      }
      result[record.division].push(record);
      return result;
    }, {});

    const dataWithTotals = [];

    Object.entries(groupedByDivision).forEach(([division, records]) => {
      dataWithTotals.push(...records);
      const divisionTotals = calculateDivisionTotals(division, records);
      dataWithTotals.push(divisionTotals);
    });

    return dataWithTotals;
  };

  const calculateDivisionTotals = (division, records) => {
    return {
      key: `${division}-totals`,
      division: `${division} Totals`,
      district: `${division} Totals`, // Add division name to the district field
      villageCount: records.reduce((sum, item) => sum + (item.villageCount || 0), 0),
      totalWorks: records.reduce((sum, item) => sum + (item.totalWorks || 0), 0),
      proposedCost: records.reduce((sum, item) => sum + (item.proposedCost || 0), 0),
      adminApprovalWorks: records.reduce((sum, item) => sum + (item.adminApprovalWorks || 0), 0),
      adminApprovalCost: records.reduce((sum, item) => sum + (item.adminApprovalCost || 0), 0),
      completedWorks: records.reduce((sum, item) => sum + (item.completedWorks || 0), 0),
      expenditureIncurred: records.reduce((sum, item) => sum + (item.expenditureIncurred || 0), 0),
      isTotalsRow: true,
    };
  };

  const prepareData = (data) => {
    let lastDivision = null;
    let serialNo = 1;
    return data.map((row) => {
      const isNewDivision = row.division !== lastDivision;
      if (isNewDivision) {
        serialNo = 1;
      }
      lastDivision = row.division;
      return { ...row, isNewDivision, serialNo: row.isTotalsRow ? "" : serialNo++ };
    });
  };

  const getFilteredData = () => {
    let filtered = geoData;

    if (selectedDivision) {
      filtered = filtered.filter((item) => item.division === selectedDivision);
    }

    if (selectedDistrict) {
      filtered = filtered.filter((item) => item.district === selectedDistrict);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const preparedData = prepareData(filtered);
    return preparedData;
  };

  const countByDistrict = (data, districtKey) => {
    return data.reduce((acc, feature) => {
      const district = feature.properties[districtKey] || "Unknown District";
      acc[district] = (acc[district] || 0) + 1;
      return acc;
    }, {});
  };

  const countWorkData = (data, districtKey) => {
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
      const cost = feature.properties.fundsourcevalue || 0;
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
      const completionLocation = feature.properties[completionKey];
      const cost = feature.properties.wocompletioncost || 0;
      if (!acc[district]) {
        acc[district] = { works: 0, cost: 0 };
      }
      if (completionLocation) {
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExport = () => {
    const filteredData = getFilteredData();
    const totals = calculateTotals(filteredData);
  
    let serialCounter = 1;
    const dataWithTotals = filteredData.map(row => {
      if (!row.isTotalsRow) {
        return { ...row, serialNo: serialCounter++ };
      }
      return { ...row, division: `${row.division} Total`, serialNo: "" };
    });
  
    let fileName = "StatementA_Report";
    if (selectedDivision) fileName = `${selectedDivision}_StatementA_Report`;
    if (selectedDistrict) fileName = `${selectedDistrict}_StatementA_Report`;
    fileName = `${fileName}.xlsx`;
  
    const exportColumns = [
      { title: "Sr. No.", dataIndex: "serialNo", key: "serialNo" },
      { title: "District", dataIndex: "district", key: "district" },
      { title: "No. of Villages Covered", dataIndex: "villageCount", key: "villageCount" },
      { title: "No. of Works", dataIndex: "totalWorks", key: "totalWorks" },
      { title: "Proposed Costs", dataIndex: "proposedCost", key: "proposedCost" },
      { title: "No. of Works", dataIndex: "adminApprovalWorks", key: "adminApprovalWorks" },
      { title: "Administrative Cost", dataIndex: "adminApprovalCost", key: "adminApprovalCost" },
      { title: "No. of Works", dataIndex: "completedWorks", key: "completedWorks" },
      { title: "Expenditure Incurred", dataIndex: "expenditureIncurred", key: "expenditureIncurred" },
    ];
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Statement A Data");
    
    // Add merged title rows
    worksheet.addRow(["JALYUKTA SHIVAR ABHIYAN 2.0"]);
    worksheet.addRow(["Statement 'A'"]);
    worksheet.addRow(["Statement showing current status of Works Sanctioned, Administrative Approval granted, Works Completed and Expenditure Incurred"]);
    worksheet.mergeCells("A1:I1");
    worksheet.mergeCells("A2:I2");
    worksheet.mergeCells("A3:I3");
    applyHeaderStyle(worksheet.getRow(1));
    applyHeaderStyle(worksheet.getRow(2));
    applyHeaderStyle(worksheet.getRow(3));
    
    // Add headers
    const headerRow1 = ["Sr. No.", "District", "No. of Villages Covered", "Works Sanctioned in Village Plan", "Works Sanctioned in Village Plan", "Status of Administrative Approval Granted", "Status of Administrative Approval Granted", "Total No. of Completed Works and Expenditure Incurred", "Total No. of Completed Works and Expenditure Incurred"];
    const headerRow2 = ["", "", "", "No. of Works", "Proposed Costs", "No. of Works", "Administrative Cost", "No. of Works", "Expenditure Incurred"];
    
    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);
    
    // Apply header styles
    applyHeaderStyle(worksheet.getRow(4));
    applyHeaderStyle(worksheet.getRow(5));
    
    // Merge header cells
    worksheet.mergeCells("D4:E4");
    worksheet.mergeCells("F4:G4");
    worksheet.mergeCells("H4:I4");
    
    // Add data rows
    dataWithTotals.forEach((row, rowIndex) => {
      const excelRow = worksheet.addRow([
        row.serialNo,
        row.district || row.division,
        row.villageCount,
        row.totalWorks,
        row.proposedCost,
        row.adminApprovalWorks,
        row.adminApprovalCost,
        row.completedWorks,
        row.expenditureIncurred,
      ]);
      applyRowStyle(excelRow, row.isTotalsRow);
    });
    
    // Download the workbook
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    });
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
  
  const applyRowStyle = (row, isTotalsRow) => {
    row.eachCell(cell => {
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if (isTotalsRow) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF99" } };
      }
    });
  };

  const calculateTotals = (data) => {
    return {
      villageCount: data.reduce((sum, item) => sum + (item.villageCount || 0), 0),
      totalWorks: data.reduce((sum, item) => sum + (item.totalWorks || 0), 0),
      proposedCost: data.reduce((sum, item) => sum + (item.proposedCost || 0), 0),
      adminApprovalWorks: data.reduce((sum, item) => sum + (item.adminApprovalWorks || 0), 0),
      adminApprovalCost: data.reduce((sum, item) => sum + (item.adminApprovalCost || 0), 0),
      completedWorks: data.reduce((sum, item) => sum + (item.completedWorks || 0), 0),
      expenditureIncurred: data.reduce((sum, item) => sum + (item.expenditureIncurred || 0), 0),
    };
  };

  const columns = [
    { title: "Sr. No.", dataIndex: "serialNo", key: "serialNo", align: "center", className: "center" },
    { title: "District", dataIndex: "district", key: "district", align: "center", className: "center", sorter: (a, b) => a.division.localeCompare(b.division), defaultSortOrder: "ascend", ellipsis: true },
    { title: "No. of Villages Covered", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center" },
    {
      title: "Works Sanctioned in Village Plan",
      children: [
        { title: "No. of Works", dataIndex: "totalWorks", key: "totalWorks", align: "center", className: "center" },
        { title: "Proposed Costs", dataIndex: "proposedCost", key: "proposedCost", align: "center", className: "center", render: (text) => <p title={text}>{parseFloat(text).toFixed(2)}</p> },
      ],
    },
    {
      title: "Status of Administrative Approval Granted",
      children: [
        { title: "No. of Works", dataIndex: "adminApprovalWorks", key: "adminApprovalWorks", align: "center", className: "center" },
        { title: "Administrative Cost", dataIndex: "adminApprovalCost", key: "adminApprovalCost", align: "center", className: "center",  render: (text) => <p title={text}>{parseFloat(text).toFixed(2)}</p>  },
      ],
    },
    {
      title: "Total No. of Completed Works and Expenditure Incurred",
      children: [
        { title: "No. of Works", dataIndex: "completedWorks", key: "completedWorks", align: "center", className: "center" },
        { title: "Expenditure Incurred", dataIndex: "expenditureIncurred", key: "expenditureIncurred", align: "center", className: "center",  render: (text) => <p title={text}>{parseFloat(text).toFixed(2)}</p>  },
      ],
    },
  ];

  const sortedData = getFilteredData().sort((a, b) => a.division.localeCompare(b.division));

  return (
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
        <Divider type="vertical" style={{ height: "100%", borderColor: "" }} />
        <Col span={18} style={{ overflow: "auto" }}>
          {loading ? (
            <Spin size="large" />
          ) : geoData.length === 0 ? (
            <Empty description="No data available" />
          ) : (
            <div>
              <Flex gap="large" justify="space-between" align="center">
                <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}>
                  Total Records {`${sortedData.length} / ${sortedData.length}`}
                </Typography.Text>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ width: 200, marginBottom: "10px", marginRight: "-500px" }}
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
                style={{ alignItems: "top" }}
                size="small"
                tableLayout="fixed"
                dataSource={sortedData}
                pagination={false} // Remove pagination
                scroll={{ x: "100%" }}
                bordered
                rowClassName={(record) =>
                  record.isTotalsRow ? "totals-row" : record.isNewDivision ? "no-border-row" : ""
                }
                summary={() => {
                  const totals = calculateTotals(sortedData.filter((item) => !item.isTotalsRow));
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <div style={{ textAlign: "center", fontWeight: "bolder" }}>Total</div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} className="center">
                        <strong>{totals.villageCount}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} className="center">
                        <strong>{totals.totalWorks}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} className="center">
                        <strong>{totals.proposedCost}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} className="center">
                        <strong>{totals.adminApprovalWorks}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} className="center">
                        <strong>{totals.adminApprovalCost}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} className="center">
                        <strong>{totals.completedWorks}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} className="center">
                        <strong>{totals.expenditureIncurred}</strong>
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

StatementA.propTypes = {
  resetTrigger: PropTypes.bool.isRequired,
  userRole: PropTypes.string.isRequired,
  jurisdictionFilters: PropTypes.object,
};

export default StatementA;