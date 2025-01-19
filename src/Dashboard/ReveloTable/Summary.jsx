import { useState, useEffect } from "react";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction"; // Importing Jurisdictions
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import * as XLSX from "xlsx";

const Summary = () => {
  const [ geoData, setGeoData ] = useState( [] );
  const [ selectedDivision, setSelectedDivision ] = useState( null );
  const [ selectedDistrict, setSelectedDistrict ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ pageSize, setPageSize ] = useState( 7 );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const url = window.__analytics__.wbUrl;

        const [projectVillageResponse, waterBudgetResponse, villagePlanResponse, workResponse] = await Promise.all([
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
              typeName: "js2surveydsws:work_js2project_shadow",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          }),
        ]);

        const projectVillageData = projectVillageResponse.data.features || [];
        const waterBudgetData = waterBudgetResponse.data.features || [];
        const villagePlanData = villagePlanResponse.data.features || [];
        const workData = workResponse.data.features || [];

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

        villagePlanData.forEach((feature) => {
          const district = feature.properties.district || "Unknown District";
          if (!districtVillagePlanCounts[district]) {
            districtVillagePlanCounts[district] = 0;
          }
          districtVillagePlanCounts[district] += 1;
        });

        workData.forEach((feature) => {
          const district = feature.properties.district || "Unknown District";
          const workStartDate = new Date(feature.properties.workstartdate);
          const cutoffDate = new Date("2049-01-01");

          if (!districtWorkCounts[district]) {
            districtWorkCounts[district] = { completed: 0, incomplete: 0 };
          }

          if (workStartDate < cutoffDate) {
            districtWorkCounts[district].completed += 1;
          } else {
            districtWorkCounts[district].incomplete += 1;
          }

          const startedLocation = feature.properties.startedlocation || "";
          if (!districtGeotaggingCounts[district]) {
            districtGeotaggingCounts[district] = { completed: 0, incomplete: 0 };
          }

          if (startedLocation) {
            districtGeotaggingCounts[district].completed += 1;
          } else {
            districtGeotaggingCounts[district].incomplete += 1;
          }
        });

        const processedData = Object.keys(districtVillageCounts).map((district) => {
          const division = Object.keys(divisionData).find((div) =>
          divisionData[div].districts.includes(district)
        ) || "Unknown Division"
          const totalVillages = districtVillageCounts[district] || 0;
          const completedWaterBudget = districtWaterBudgetCounts[district] || 0;
          const incompleteWaterBudget = totalVillages - completedWaterBudget;
          const completedVillagePlan = districtVillagePlanCounts[district] || 0;
          const incompleteVillagePlan = totalVillages - completedVillagePlan;
          const completedWork = districtWorkCounts[district]?.completed || 0;
          const incompleteWork = districtWorkCounts[district]?.incomplete || 0;
          const geotaggingComplete = districtGeotaggingCounts[district]?.completed || 0;
          const geotaggingIncomplete = districtGeotaggingCounts[district]?.incomplete || 0;

          return {
            division,
            district,
            villageCount: totalVillages,
            waterBudgetCompleted: completedWaterBudget,
            waterBudgetIncomplete: incompleteWaterBudget,
            villagePlanCompleted: completedVillagePlan,
            villagePlanIncomplete: incompleteVillagePlan,
            workCompleted: completedWork,
            workIncomplete: incompleteWork,
            geotaggingCompleted: geotaggingComplete,
            geotaggingIncomplete: geotaggingIncomplete,
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

  const handleDivisionClick = ( division ) => {
    setSelectedDivision( division === selectedDivision ? null : division );
    setSelectedDistrict( null );
    setCurrentPage(1);
  };

  const handleDistrictClick = ( district ) => {
    setSelectedDistrict( district === selectedDistrict ? null : district );
    setCurrentPage(1);
  };

  const filteredData = geoData.filter((feature) => {
    const isInDivision = !selectedDivision || feature.division === selectedDivision;
    const isInDistrict = !selectedDistrict || feature.district === selectedDistrict;
    return isInDivision && isInDistrict;
  });  

  const handleExport = () => {
    if (filteredData.length === 0) {
      alert("No data available to export.");
      return;
    }
  
    // Prepare the data rows
    const dataToExport = filteredData.map((item) => [
      item.district,
      item.villageCount,
      item.waterBudgetCompleted,
      item.waterBudgetIncomplete,
      item.villagePlanCompleted,
      item.villagePlanIncomplete,
      item.workCompleted,
      item.workIncomplete,
      item.geotaggingCompleted,
      item.geotaggingIncomplete,
    ]);
  
    // Add totals row
    const totals = calculateTotals(filteredData);
    dataToExport.push([
      "Total",
      totals.villageCount,
      totals.waterBudgetCompleted,
      totals.waterBudgetIncomplete,
      totals.villagePlanCompleted,
      totals.villagePlanIncomplete,
      totals.workCompleted,
      totals.workIncomplete,
      totals.geotaggingCompleted,
      totals.geotaggingIncomplete,
    ]);
  
    // Define the header rows with merged cells
    const headerRow1 = [
      "District",
      "Total Villages",
      "Water Budget",
      "",
      "Village Plan",
      "",
      "Works",
      "",
      "Geotagging",
      "",
    ];
    const headerRow2 = [
      "",
      "",
      "Completed",
      "Incomplete",
      "Completed",
      "Incomplete",
      "Completed",
      "Incomplete",
      "Completed",
      "Incomplete",
    ];
  
    // Combine headers and data
    const worksheetData = [headerRow1, headerRow2, ...dataToExport];
  
    // Create the worksheet and apply merges
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!merges"] = [
      { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Merge "Water Budget"
      { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Merge "Village Plan"
      { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } }, // Merge "Works"
      { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }, // Merge "Geotagging"
    ];
  
    // Create the workbook and export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary Data");
    XLSX.writeFile(workbook, `SummaryReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }; 
  
  const columns = [
    { title: "District", dataIndex: "district", key: "district", align: "center", className: "center", sorter: ( a, b ) => a.district.localeCompare( b.district ), defaultSortOrder: "ascend" },
    { title: "Village Count", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center" },
    {
      title: "Water Budget",
      children: [
        {
          title: "Completed",
          dataIndex: "waterBudgetCompleted",
          key: "waterBudgetCompleted",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.waterBudgetCompleted.localeCompare( b.waterBudgetCompleted ), defaultSortOrder: "ascend" 
        },
        {
          title: "Incompleted",
          dataIndex: "waterBudgetIncomplete",
          key: "waterBudgetIncomplete",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.waterBudgetIncomplete.localeCompare( b.waterBudgetIncomplete ), defaultSortOrder: "ascend" 
        },
      ],
    },
    {
      title: "Village Plans",
      children: [
        {
          title: "Completed",
          dataIndex: "villagePlanCompleted",
          key: "villagePlanCompleted",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.villagePlanCompleted.localeCompare( b.villagePlanCompleted ), defaultSortOrder: "ascend" 
        },
        {
          title: "Incompleted",
          dataIndex: "villagePlanIncomplete",
          key: "villagePlanIncomplete",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.villagePlanIncomplete.localeCompare( b.villagePlanIncomplete ), defaultSortOrder: "ascend" 
        },
      ],
    },
    {
      title: "Works",
      children: [
        {
          title: "Completed",
          dataIndex: "workCompleted",
          key: "workCompleted",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.workCompleted.localeCompare( b.workCompleted ), defaultSortOrder: "ascend" 
        },
        {
          title: "Incompleted",
          dataIndex: "workIncomplete",
          key: "workIncomplete",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.workIncomplete.localeCompare( b.workIncomplete ), defaultSortOrder: "ascend" 
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
          sorter: ( a, b ) => a.geotaggingCompleted.localeCompare( b.geotaggingCompleted ), defaultSortOrder: "ascend" 
        },
        {
          title: "Incompleted",
          dataIndex: "geotaggingIncomplete",
          key: "geotaggingIncomplete",
          align: "center", 
          className: "center",
          sorter: ( a, b ) => a.geotaggingIncomplete.localeCompare( b.geotaggingIncomplete ), defaultSortOrder: "ascend" 
        },
      ],
    },
  ];

  const calculateTotals = ( data ) => {
    const totals = {
      district: "Total",
      villageCount: data.reduce( ( sum, item ) => sum + ( item.villageCount || 0 ), 0 ),
      waterBudgetCompleted: data.reduce( ( sum, item ) => sum + ( item.waterBudgetCompleted || 0 ), 0 ),
      waterBudgetIncomplete: data.reduce( ( sum, item ) => sum + ( item.waterBudgetIncomplete || 0 ), 0 ),
      villagePlanCompleted: data.reduce( ( sum, item ) => sum + ( item.villagePlanCompleted || 0 ), 0 ),
      villagePlanIncomplete: data.reduce( ( sum, item ) => sum + ( item.villagePlanIncomplete || 0 ), 0 ),
      workCompleted: data.reduce( ( sum, item ) => sum + ( item.workCompleted || 0 ), 0 ),
      workIncomplete: data.reduce( ( sum, item ) => sum + ( item.workIncomplete || 0 ), 0 ),
      geotaggingCompleted: data.reduce( ( sum, item ) => sum + ( item.geotaggingCompleted || 0 ), 0 ),
      geotaggingIncomplete: data.reduce( ( sum, item ) => sum + ( item.geotaggingIncomplete || 0 ), 0 ),
    };
    return totals;
  };

  return (
    <Flex gap={50} wrap="nowrap">
      <Row gutter={[ 17, 17 ]} style={{ flexWrap: "nowrap" }}>
        <Col span={8.1}>
          <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}>
            Jurisdictions
          </Typography.Text>
          <Row gutter={[ 10, 10 ]} style={{ flexWrap: "nowrap" }}>
            <Col span={12}>
              <Jurisdictions
                title="Divisions"
                data={Object.keys( divisionData )}
                selectedItem={selectedDivision}
                onItemClick={handleDivisionClick}
              />
            </Col>
            <Col span={12}>
              <Jurisdictions
                title="Districts"
                data={
                  selectedDivision ? divisionData[ selectedDivision ]?.districts || [] : []
                }
                selectedItem={selectedDistrict}
                onItemClick={handleDistrictClick}
              />
            </Col>
          </Row>
        </Col>
        <Divider type="vertical" style={{ height: "80vh", borderColor: "" }} />
        <Col span={18}>
          {loading ? (
            <Spin size="large" />
          ) : geoData.length === 0 ? (
            <Empty description="" />
          ) : (
            <div>
              <Flex gap="large" justify="space-between" align="center">
                <Typography.Text
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    paddingBottom: "10px",
                    display: "block",
                  }}
                >
                  Report Output {filteredData.length}
                </Typography.Text>
                <Button
                  onClick={handleExport}
                  style={{
                    backgroundColor: "#008CBA",
                    color: "white",
                    marginBottom: "10px",
                  }}
                >
                  Export As Excel
                </Button>
              </Flex>
              <Table
                columns={columns}
                style={{ alignItems: "top" }}
                size="small"
                tableLayout="fixed"
                dataSource={filteredData}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: false,
                  total: filteredData.length,
                  current: currentPage,
                  onChange: ( page, pageSize ) => {
                    setCurrentPage( page );
                    setPageSize( pageSize )
                  }
                }}
                scroll={{ x: "100%" }}
                bordered
                summary={(pageData) => {
                  const totals = calculateTotals(pageData);
                
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} className="center">
                        <strong>{totals.district}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} className="center">
                        <strong>{totals.villageCount}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} className="center">
                        <strong>{totals.waterBudgetCompleted}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} className="center">
                        <strong>{totals.waterBudgetIncomplete}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} className="center">
                        <strong>{totals.villagePlanCompleted}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} className="center">
                        <strong>{totals.villagePlanIncomplete}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6} className="center">
                        <strong>{totals.workCompleted}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} className="center">
                        <strong>{totals.workIncomplete}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} className="center">
                        <strong>{totals.geotaggingCompleted}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} className="center">
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
  );
};

export default Summary;
