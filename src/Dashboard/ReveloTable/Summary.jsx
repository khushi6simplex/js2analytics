// Summary.jsx
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import { Input } from "antd";
import ReactECharts from "echarts-for-react";
import ExcelJS from "exceljs";

const Summary = ({ resetTrigger }) => {
  const [geoData, setGeoData] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const url = window.__analytics__.wbUrl;

        const [projectVillageResponse, waterBudgetResponse, villagePlanResponse, shadowWorks, originalWorks] = await Promise.all([
          axios.get(url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:projectvillage_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
              CQL_FILTER: "isselected=true",
            },
          }),
          axios.get(url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:waterbudget_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          }),
          axios.get(url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:subplan_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          }),
          axios.get(url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:work_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          }),
          axios.get(url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:work_js2project_shadow",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          }),
        ]);

        const projectVillageData = projectVillageResponse.data.features || [];
        const waterBudgetData = waterBudgetResponse.data.features || [];
        const villagePlanData = villagePlanResponse.data.features || [];

        const workData = [
          ...(shadowWorks.data.features || []),
          ...(originalWorks.data.features || []),
        ];

        const districtVillageCounts = {};
        const districtWaterBudgetCounts = {};
        const districtVillagePlanCounts = {};
        const districtWorkCounts = {};
        const districtGeotaggingCounts = {};

        projectVillageData.forEach((feature) => {
          const district = feature.properties.district || "Unknown District";
          if (!districtVillageCounts[district]) {
            districtVillageCounts[district] = 0;
          }
          districtVillageCounts[district] += 1;
        });

        waterBudgetData.forEach((feature) => {
          const district = feature.properties.district || "Unknown District";
          if (!districtWaterBudgetCounts[district]) {
            districtWaterBudgetCounts[district] = 0;
          }
          districtWaterBudgetCounts[district] += 1;
        });

        const distinctVillageIds = new Set();

        villagePlanData.forEach((feature) => {
          const district = feature.properties.district || "Unknown District";
          const villageId = feature.properties.villageid;
          const uniqueKey = `${district}_${villageId}`;

          if (!distinctVillageIds.has(uniqueKey)) {
            distinctVillageIds.add(uniqueKey);
            if (!districtVillagePlanCounts[district]) {
              districtVillagePlanCounts[district] = 0;
            }
            districtVillagePlanCounts[district] += 1;
          }
        });

        workData.forEach((feature) => {
          const district = feature.properties.district || "Unknown District";
          const completionlocation = feature.properties.completionlocation || "";
          if (!districtWorkCounts[district]) {
            districtWorkCounts[district] = { completed: 0, incomplete: 0 };
          }

          if (completionlocation) {
            districtWorkCounts[district].completed += 1;
          } else {
            districtWorkCounts[district].incomplete += 1;
          }

          const geometry = feature.properties.startedlocation || "";
          if (!districtGeotaggingCounts[district]) {
            districtGeotaggingCounts[district] = { completed: 0, incomplete: 0 };
          }

          if (completionlocation) {
            districtGeotaggingCounts[district].completed += 1;
          } else {
            districtGeotaggingCounts[district].incomplete += 1;
          }
        });

        const processedData = Object.keys(districtVillageCounts).map((district) => {
          const division = Object.keys(divisionData).find((div) =>
            divisionData[div].districts.includes(district)
          ) || "Unknown Division";
          const totalVillages = districtVillageCounts[district] || 0;
          const completedWaterBudget = districtWaterBudgetCounts[district] || 0;
          const incompleteWaterBudget = totalVillages - completedWaterBudget;
          const villagePlanCount = districtVillagePlanCounts[district] || 0;
          const totalWorks = districtWorkCounts[district]?.completed + districtWorkCounts[district]?.incomplete || 0;
          const completedWork = districtWorkCounts[district]?.completed || 0;
          const incompleteWork = districtWorkCounts[district]?.incomplete || 0;
          const geotaggingComplete = districtGeotaggingCounts[district]?.completed || 0;
          const geotaggingIncomplete = districtGeotaggingCounts[district]?.incomplete || 0;

          return {
            key: `${division}-${district}`,
            division,
            district,
            villageCount: totalVillages,
            waterBudgetCompleted: completedWaterBudget,
            waterBudgetIncomplete: incompleteWaterBudget,
            villagePlanCount: villagePlanCount,
            totalWorks: totalWorks,
            workCompleted: completedWork,
            workIncomplete: incompleteWork,
            geotaggingCompleted: geotaggingComplete,
            geotaggingIncomplete: geotaggingIncomplete,
            isGroupRow: false
          };
        });

        setGeoData(processedData);
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

  const handleDivisionClick = (division) => {
    setSelectedDivision(division === selectedDivision ? null : division);
    setSelectedDistrict(null);
    setCurrentPage(1);
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district === selectedDistrict ? null : district);
    setCurrentPage(1);
  };

  // Add a helper to prepare grouped data
  const prepareData = (data) => {
    let lastDivision = null;
    return data.map((row) => {
      const isNewDivision = row.division !== lastDivision;
      lastDivision = row.division;
      return {
        ...row,
        isNewDivision,
      };
    });
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
      // Add all records for the division
      dataWithTotals.push(...records);

      // Calculate totals for this division
      const divisionTotals = {
        key: `${division}-totals`, // Unique key for React
        division: `${division} Totals`,
        district: "", // Label for the totals row
        villageCount: records.reduce((sum, item) => sum + (item.villageCount || 0), 0),
        waterBudgetCompleted: records.reduce((sum, item) => sum + (item.waterBudgetCompleted || 0), 0),
        waterBudgetIncomplete: records.reduce((sum, item) => sum + (item.waterBudgetIncomplete || 0), 0),
        villagePlanCount: records.reduce((sum, item) => sum + (item.villagePlanCount || 0), 0),
        totalWorks: records.reduce((sum, item) => sum + (item.totalWorks || 0), 0),
        workCompleted: records.reduce((sum, item) => sum + (item.workCompleted || 0), 0),
        workIncomplete: records.reduce((sum, item) => sum + (item.workIncomplete || 0), 0),
        geotaggingCompleted: records.reduce((sum, item) => sum + (item.geotaggingCompleted || 0), 0),
        geotaggingIncomplete: records.reduce((sum, item) => sum + (item.geotaggingIncomplete || 0), 0),
        isTotalsRow: true, // Flag to style totals rows differently
      };

      // Add the totals row
      dataWithTotals.push(divisionTotals);
    });

    return dataWithTotals;
  };

  const calculateOverallTotals = (data) => {
    const filteredData = data.filter(item => !item.isTotalsRow); // Ignore division totals rows
    return {
      division: "Overall Totals",
      district: "",
      villageCount: filteredData.reduce((sum, item) => sum + (item.villageCount || 0), 0),
      waterBudgetCompleted: filteredData.reduce((sum, item) => sum + (item.waterBudgetCompleted || 0), 0),
      waterBudgetIncomplete: filteredData.reduce((sum, item) => sum + (item.waterBudgetIncomplete || 0), 0),
      villagePlanCount: filteredData.reduce((sum, item) => sum + (item.villagePlanCount || 0), 0),
      totalWorks: filteredData.reduce((sum, item) => sum + (item.totalWorks || 0), 0),
      workCompleted: filteredData.reduce((sum, item) => sum + (item.workCompleted || 0), 0),
      workIncomplete: filteredData.reduce((sum, item) => sum + (item.workIncomplete || 0), 0),
      geotaggingCompleted: filteredData.reduce((sum, item) => sum + (item.geotaggingCompleted || 0), 0),
      geotaggingIncomplete: filteredData.reduce((sum, item) => sum + (item.geotaggingIncomplete || 0), 0),
      isTotalsRow: true,
    };
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

    const preparedData = prepareData(addDivisionTotals(filtered));
    return preparedData;
  };

  const filteredData = getFilteredData(); // Process the data to include totals

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term state
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Sort the filteredData array by division and district
    const sortedData = filteredData.sort((a, b) => {
      if (a.division === b.division) {
        return a.district.localeCompare(b.district);
      }
      return a.division.localeCompare(b.division);
    });

    // Prepare the data rows
    const dataToExport = sortedData.map((item) => [
      item.division,
      item.district,
      item.villageCount,
      item.waterBudgetCompleted,
      item.waterBudgetIncomplete,
      item.villagePlanCount,
      item.totalWorks,
      item.workCompleted,
      item.workIncomplete,
      item.geotaggingCompleted,
      item.geotaggingIncomplete,
    ]);

    // Add the Overall Totals row
    const overallTotals = calculateOverallTotals(filteredData.filter(item => !item.isTotalsRow));
    dataToExport.push([
      overallTotals.division,
      overallTotals.district,
      overallTotals.villageCount,
      overallTotals.waterBudgetCompleted,
      overallTotals.waterBudgetIncomplete,
      overallTotals.villagePlanCount,
      overallTotals.totalWorks,
      overallTotals.workCompleted,
      overallTotals.workIncomplete,
      overallTotals.geotaggingCompleted,
      overallTotals.geotaggingIncomplete,
    ]);

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Summary Data");

    // Define header rows
    const headerRow1 = [
      "Division", "District", "Total Villages", "Water Budget", "Water Budget", "Village Plan",
      "Works", "Works", "Works", "Geotagging", "Geotagging",
    ];
    const headerRow2 = [
      "", "", "", "Completed", "Incomplete", "", "Total", "Completed", "Incomplete", "Completed", "Incomplete",
    ];

    // Add header rows to the worksheet
    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);

    // Apply style to header rows (custom color background and borders)
    const headerStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } }, // Orange background
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    worksheet.getRow(2).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add data rows with borders
    dataToExport.forEach((row, rowIndex) => {
      const excelRow = worksheet.addRow(row);

      excelRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Optional: Apply a different background color for the totals row
      if (rowIndex === dataToExport.length - 1) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF99" }, // Light yellow for totals
          };
        });
      }
    });

    // Merge cells for headers
    worksheet.mergeCells("D1:E1"); // Merge Water Budget header
    worksheet.mergeCells("G1:I1"); // Merge Works header
    worksheet.mergeCells("J1:K1"); // Merge Geotagging header

    // Merge cells for division column
    let startRow = 3; // Data starts from the third row
    let currentDivision = dataToExport[0][0];
    for (let i = 1; i < dataToExport.length; i++) {
      if (dataToExport[i][0] !== currentDivision) {
        if (i > startRow) {
          worksheet.mergeCells(`A${startRow}:A${i + 2}`);
        }
        startRow = i + 3; // Adjust for 0-based index and header rows
        currentDivision = dataToExport[i][0];
      }
    }
    // Merge the last group
    if (startRow < dataToExport.length + 2) {
      worksheet.mergeCells(`A${startRow}:A${dataToExport.length + 2}`);
    }

    // Generate the file name
    let fileName = "All Divisions";
    if (selectedDivision) {
      fileName = selectedDivision;
    }

    if (selectedDistrict) {
      fileName = selectedDistrict;
    }

    // Write the Excel file and trigger download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
    });
  };

  const columns = [
    {
      title: "Division",
      dataIndex: "division",
      key: "division",
      align: "center",
      className: "center division-column",
      sorter: (a, b) => a.division.localeCompare(b.division),
      defaultSortOrder: "ascend",
      render: (text, record) => (record.isNewDivision ? text : null),
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      align: "center",
      className: "center",
      sorter: (a, b) => a.district.localeCompare(b.district),
      defaultSortOrder: "ascend",
    },
    { title: "Village Count", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center", sorter: (a, b) => a.villageCount - b.villageCount },
    {
      title: "Water Budget",
      children: [
        {
          title: "Completed",
          dataIndex: "waterBudgetCompleted",
          key: "waterBudgetCompleted",
          align: "center",
          className: "center",
          sorter: (a, b) => a.waterBudgetCompleted - b.waterBudgetCompleted,
          defaultSortOrder: "ascend",
        },
        {
          title: "Incomplete",
          dataIndex: "waterBudgetIncomplete",
          key: "waterBudgetIncomplete",
          align: "center",
          className: "center",
          sorter: (a, b) => a.waterBudgetIncomplete - b.waterBudgetIncomplete,
          defaultSortOrder: "ascend",
        },
      ],
    },
    {
      title: "Village Plan",
      dataIndex: "villagePlanCount",
      key: "villagePlanCount",
      align: "center",
      className: "center",
      sorter: (a, b) => a.villagePlanCount - b.villagePlanCount,
      defaultSortOrder: "ascend",
    },
    {
      title: "Works",
      children: [
        {
          title: "Total",
          dataIndex: "totalWorks",
          key: "totalWorks",
          align: "center",
          className: "center",
          sorter: (a, b) => a.totalWorks - b.totalWorks,
          defaultSortOrder: "ascend",
        },
        {
          title: "Completed",
          dataIndex: "workCompleted",
          key: "workCompleted",
          align: "center",
          className: "center",
          sorter: (a, b) => a.workCompleted - b.workCompleted,
          defaultSortOrder: "ascend",
        },
        {
          title: "Incomplete",
          dataIndex: "workIncomplete",
          key: "workIncomplete",
          align: "center",
          className: "center",
          sorter: (a, b) => a.workIncomplete - b.workIncomplete,
          defaultSortOrder: "ascend",
        },
      ],
    },
    {
      title: "Geotagging",
      children: [
        {
          title: "Completed",
          dataIndex: "geotaggingCompleted",
          key: "geotaggingCompleted",
          align: "center",
          className: "center",
          sorter: (a, b) => a.geotaggingCompleted - b.geotaggingCompleted,
          defaultSortOrder: "ascend",
        },
        {
          title: "Incomplete",
          dataIndex: "geotaggingIncomplete",
          key: "geotaggingIncomplete",
          align: "center",
          className: "center",
          sorter: (a, b) => a.geotaggingIncomplete - b.geotaggingIncomplete,
          defaultSortOrder: "ascend",
        },
      ],
    },
  ];

  // Ensure the table is sorted by division by default
  const sortedData = filteredData.sort((a, b) => a.division.localeCompare(b.division));

  // Define the option variable for ReactECharts
  const option = {
    tooltip: {
      trigger: 'axis', // Trigger tooltip on axis (hover over any point on the line)
      axisPointer: {
        type: 'shadow' // You can change this to 'line' or 'cross' if you prefer a different pointer type
      },
      formatter: function (params) {
        let tooltipContent = `<strong>${params[0].name}</strong><br/>`; // Display the x-axis value (district name)
        params.forEach(param => {
          tooltipContent += `${param.marker} <strong>${param.seriesName}:</strong> ${param.value}<br/>`; // Show series name and value
        });
        return tooltipContent;
      }
    },
    legend: {
      selectedMode: false, // Disable toggling legend items
    },
    grid: {
      left: 100,
      right: 100,
      top: 50,
      bottom: 100, // Increase bottom margin to accommodate labels
    },
    xAxis: {
      type: "category",
      data: geoData.map((item) => item.district), // District names for x-axis
      axisLabel: {
        interval: 0, // Show all labels
        rotate: 45, // Rotate labels 45 degrees for better readability
        fontSize: 10, // Optional: Reduce font size
      },
    },
    yAxis: {
      type: "value",
      min: 0, // Ensure y-axis starts from 0
      axisLabel: {
        formatter: (value) => value, // Show all tick labels as-is
      },
    },
    series: [
      {
        name: "Village Count",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.villageCount), // Use direct counts
      },
      {
        name: "Water Budget Completed",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.waterBudgetCompleted), // Use direct counts
      },
      {
        name: "Water Budget Incompleted",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.waterBudgetIncomplete), // Use direct counts
      },
      {
        name: "Village Plan",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.villagePlanCount), // Use direct counts
      },
      {
        name: "Total Works",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.totalWorks), // Use direct counts
      },
      {
        name: "Work Completed",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.workCompleted), // Use direct counts
      },
      {
        name: "Work Incompleted",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.workIncomplete), // Use direct counts
      },
      {
        name: "Geotagging Completed",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.geotaggingCompleted), // Use direct counts
      },
      {
        name: "Geotagging Incompleted",
        type: "bar",
        stack: "total",
        barWidth: "80%",
        label: {
          show: true,
          formatter: (params) => `${params.value}`, // Display direct counts
        },
        data: geoData.map((item) => item.geotaggingIncomplete), // Use direct counts
      },
    ],
  };

  return (
    <>
      <Flex gap={50} wrap="nowrap">
        <Row gutter={[17, 17]} style={{ flexWrap: "nowrap" }}>
          <Col span={8.1}>
            <Typography.Text
              style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}
            >
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
                  <Typography.Text
                    style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}
                  >
                    Total Records {`${filteredData.length} / ${filteredData.length}`}
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
                  dataSource={sortedData} // Use sortedData instead of filteredData
                  rowClassName={(record) =>
                    record.isTotalsRow ? "totals-row" : record.isNewDivision ? "no-border-row" : ""
                  }
                  pagination={false}
                  scroll={{ x: "100%" }}
                  bordered
                  summary={() => {
                    const totals = calculateOverallTotals(filteredData.filter(item => !item.isTotalsRow));
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} className="center">
                          <strong>{totals.division}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} className="center">
                          <strong>{totals.district}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} className="center">
                          <strong>{totals.villageCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} className="center">
                          <strong>{totals.waterBudgetCompleted}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} className="center">
                          <strong>{totals.waterBudgetIncomplete}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} className="center">
                          <strong>{totals.villagePlanCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} className="center">
                          <strong>{totals.totalWorks}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7} className="center">
                          <strong>{totals.workCompleted}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8} className="center">
                          <strong>{totals.workIncomplete}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9} className="center">
                          <strong>{totals.geotaggingCompleted}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={10} className="center">
                          <strong>{totals.geotaggingIncomplete}</strong>
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
      <Flex gap={20} wrap="nowrap" style={{ height: "600px", marginTop: "100px" }}>
        <ReactECharts option={option} style={{ width: "85vw", height: "100%" }} />
      </Flex>
    </>
  );
};

Summary.propTypes = {
  resetTrigger: PropTypes.bool.isRequired,
  isMapVisible: PropTypes.bool,
};

export default Summary;
