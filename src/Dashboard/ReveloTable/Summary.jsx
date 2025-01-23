// Summary.jsx
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import * as XLSX from "xlsx";
import { Input } from "antd";
import ReactECharts from "echarts-for-react";

const Summary = ( { resetTrigger } ) => {
  const [ geoData, setGeoData ] = useState( [] );
  const [ selectedDivision, setSelectedDivision ] = useState( null );
  const [ selectedDistrict, setSelectedDistrict ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ pageSize, setPageSize ] = useState( 7 );
  const [ searchTerm, setSearchTerm ] = useState( "" );

  useEffect( () => {
    const fetchData = async () => {
      try {
        setLoading( true );

        const url = window.__analytics__.wbUrl;

        const [ projectVillageResponse, waterBudgetResponse, villagePlanResponse, shadowWorks, originalWorks ] = await Promise.all( [
          axios.get( url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:projectvillage_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
              CQL_FILTER: "isselected=true",
            },
          } ),
          axios.get( url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:waterbudget_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          } ),
          axios.get( url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:subplan_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          } ),
          axios.get( url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:work_js2project",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          } ),
          axios.get( url, {
            params: {
              service: "WFS",
              version: "1.0.0",
              request: "GetFeature",
              typeName: "js2surveydsws:work_js2project_shadow",
              outputFormat: "json",
              srsname: "EPSG:3857",
            },
          } ),
        ] );

        const projectVillageData = projectVillageResponse.data.features || [];
        const waterBudgetData = waterBudgetResponse.data.features || [];
        const villagePlanData = villagePlanResponse.data.features || [];

        const workData = [
          ...( shadowWorks.data.features || [] ),
          ...( originalWorks.data.features || [] ),
        ];

        const districtVillageCounts = {};
        const districtWaterBudgetCounts = {};
        const districtVillagePlanCounts = {};
        const districtWorkCounts = {};
        const districtGeotaggingCounts = {};

        projectVillageData.forEach( ( feature ) => {
          const district = feature.properties.district || "Unknown District";
          if ( !districtVillageCounts[ district ] ) {
            districtVillageCounts[ district ] = 0;
          }
          districtVillageCounts[ district ] += 1;
        } );

        waterBudgetData.forEach( ( feature ) => {
          const district = feature.properties.district || "Unknown District";
          if ( !districtWaterBudgetCounts[ district ] ) {
            districtWaterBudgetCounts[ district ] = 0;
          }
          districtWaterBudgetCounts[ district ] += 1;
        } );

        const distinctVillageIds = new Set();

        villagePlanData.forEach( ( feature ) => {
          const district = feature.properties.district || "Unknown District";
          const villageId = feature.properties.villageid;
          const uniqueKey = `${ district }_${ villageId }`;

          if ( !distinctVillageIds.has( uniqueKey ) ) {
            distinctVillageIds.add( uniqueKey );
            if ( !districtVillagePlanCounts[ district ] ) {
              districtVillagePlanCounts[ district ] = 0;
            }
            districtVillagePlanCounts[ district ] += 1;
          }
        } );

        workData.forEach( ( feature ) => {
          const district = feature.properties.district || "Unknown District";
          const completionlocation = feature.properties.completionlocation || "";
          if ( !districtWorkCounts[ district ] ) {
            districtWorkCounts[ district ] = { completed: 0, incomplete: 0 };
          }

          if ( completionlocation ) {
            districtWorkCounts[ district ].completed += 1;
          } else {
            districtWorkCounts[ district ].incomplete += 1;
          }

          const geometry = feature.properties.startedlocation || "";
          if ( !districtGeotaggingCounts[ district ] ) {
            districtGeotaggingCounts[ district ] = { completed: 0, incomplete: 0 };
          }

          if ( geometry ) {
            districtGeotaggingCounts[ district ].completed += 1;
          } else {
            districtGeotaggingCounts[ district ].incomplete += 1;
          }
        } );

        const processedData = Object.keys( districtVillageCounts ).map( ( district ) => {
          const division = Object.keys( divisionData ).find( ( div ) =>
            divisionData[ div ].districts.includes( district )
          ) || "Unknown Division";
          const totalVillages = districtVillageCounts[ district ] || 0;
          const completedWaterBudget = districtWaterBudgetCounts[ district ] || 0;
          const incompleteWaterBudget = totalVillages - completedWaterBudget;
          const villagePlanCount = districtVillagePlanCounts[ district ] || 0;
          const totalWorks = districtWorkCounts[ district ]?.completed + districtWorkCounts[ district ]?.incomplete || 0;
          const completedWork = districtWorkCounts[ district ]?.completed || 0;
          const incompleteWork = districtWorkCounts[ district ]?.incomplete || 0;
          const geotaggingComplete = districtGeotaggingCounts[ district ]?.completed || 0;
          const geotaggingIncomplete = districtGeotaggingCounts[ district ]?.incomplete || 0;

          return {
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
          };
        } );

        setGeoData( processedData );
      } catch ( error ) {
        console.error( "Error fetching or processing data:", error );
      } finally {
        setLoading( false );
      }
    };

    fetchData();
  }, [] );

  useEffect( () => {
    if ( resetTrigger ) {
      setSelectedDivision( null );
      setSelectedDistrict( null );
    }
  }, [ resetTrigger ] );

  const handleDivisionClick = ( division ) => {
    setSelectedDivision( division === selectedDivision ? null : division );
    setSelectedDistrict( null );
    setCurrentPage( 1 );
  };

  const handleDistrictClick = ( district ) => {
    setSelectedDistrict( district === selectedDistrict ? null : district );
    setCurrentPage( 1 );
  };

  const filteredData = geoData.filter( ( feature ) => {
    const isInDivision = !selectedDivision || feature.division === selectedDivision;
    const isInDistrict = !selectedDistrict || feature.district === selectedDistrict;

    // Check if the search term matches any column values
    const matchesSearch =
      feature.district.toLowerCase().includes( searchTerm.toLowerCase() ) ||
      feature.division.toLowerCase().includes( searchTerm.toLowerCase() ) ||
      ( feature.villageCount?.toString().includes( searchTerm ) || "" );

    return isInDivision && isInDistrict && matchesSearch;
  } );

  const handleSearchChange = ( e ) => {
    setSearchTerm( e.target.value ); // Update the search term state
  };

  const handleExport = () => {
    if ( filteredData.length === 0 ) {
      alert( "No data available to export." );
      return;
    }

    // Sort the filteredData array
    const sortedData = filteredData.sort( ( a, b ) => a.district.localeCompare( b.district ) );

    // Prepare the data rows
    const dataToExport = sortedData.map( ( item ) => [
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
    ] );

    // Add totals row
    const totals = calculateTotals( sortedData );

    dataToExport.push( [
      "Total",
      totals.villageCount,
      totals.waterBudgetCompleted,
      totals.waterBudgetIncomplete,
      totals.villagePlanCount,
      totals.totalWorks,
      totals.workCompleted,
      totals.workIncomplete,
      totals.geotaggingCompleted,
      totals.geotaggingIncomplete,
    ] );

    const headerRow1 = [
      "District",
      "Total Villages",
      "Water Budget",
      "Water Budget",
      "Village Plan",
      "Works",
      "Works",
      "Works",
      "Geotagging",
      "Geotagging",
    ];
    const headerRow2 = [
      "",
      "",
      "Completed",
      "Incompleted",
      "",
      "Total",
      "Completed",
      "Incompleted",
      "Completed",
      "Incompleted",
    ];

    const worksheetData = [ headerRow1, headerRow2, ...dataToExport ];

    const worksheet = XLSX.utils.aoa_to_sheet( worksheetData );
    worksheet[ "!merges" ] = [
      { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // Merge Water Budget header
      { s: { r: 0, c: 4 }, e: { r: 0, c: 4 } }, // Village Plan single header row
      { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } }, // Merge Works header
      { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } }, // Merge Geotagging header
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet( workbook, worksheet, "Summary Data" );

    let fileName = "All Divisions";
    if ( selectedDivision ) {
      fileName = selectedDivision;
    }

    if ( selectedDistrict ) {
      fileName = selectedDistrict;
    }
    XLSX.writeFile( workbook, `${ fileName }_${ new Date().toISOString().slice( 0, 10 ) }.xlsx` );
  };

  const columns = [
    {
      title: "District", dataIndex: "district", key: "district", align: "center", className: "center", sorter: ( a, b ) => a.district.localeCompare( b.district ), defaultSortOrder: "ascend", 
    },
    { title: "Village Count", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center", sorter: ( a, b ) => a.villageCount - b.villageCount },
    {
      title: "Water Budget",
      children: [
        {
          title: "Completed",
          dataIndex: "waterBudgetCompleted",
          key: "waterBudgetCompleted",
          align: "center",
          className: "center",
          sorter: ( a, b ) => a.waterBudgetCompleted - b.waterBudgetCompleted,
          defaultSortOrder: "ascend",
        },
        {
          title: "Incomplete",
          dataIndex: "waterBudgetIncomplete",
          key: "waterBudgetIncomplete",
          align: "center",
          className: "center",
          sorter: ( a, b ) => a.waterBudgetIncomplete - b.waterBudgetIncomplete,
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
      sorter: ( a, b ) => a.villagePlanCount - b.villagePlanCount,
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
          sorter: ( a, b ) => a.totalWorks - b.totalWorks,
          defaultSortOrder: "ascend",
        },
        {
          title: "Completed",
          dataIndex: "workCompleted",
          key: "workCompleted",
          align: "center",
          className: "center",
          sorter: ( a, b ) => a.workCompleted - b.workCompleted,
          defaultSortOrder: "ascend",
        },
        {
          title: "Incomplete",
          dataIndex: "workIncomplete",
          key: "workIncomplete",
          align: "center",
          className: "center",
          sorter: ( a, b ) => a.workIncomplete - b.workIncomplete,
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
          sorter: ( a, b ) => a.geotaggingCompleted - b.geotaggingCompleted,
          defaultSortOrder: "ascend",
        },
        {
          title: "Incomplete",
          dataIndex: "geotaggingIncomplete",
          key: "geotaggingIncomplete",
          align: "center",
          className: "center",
          sorter: ( a, b ) => a.geotaggingIncomplete - b.geotaggingIncomplete,
          defaultSortOrder: "ascend",
        },
      ],
    },
  ];

  const calculateTotals = ( data ) => {
    return {
      district: "Total",
      villageCount: data.reduce( ( sum, item ) => sum + ( item.villageCount || 0 ), 0 ),
      waterBudgetCompleted: data.reduce( ( sum, item ) => sum + ( item.waterBudgetCompleted || 0 ), 0 ),
      waterBudgetIncomplete: data.reduce( ( sum, item ) => sum + ( item.waterBudgetIncomplete || 0 ), 0 ),
      villagePlanCount: data.reduce( ( sum, item ) => sum + ( item.villagePlanCount || 0 ), 0 ),
      totalWorks: data.reduce( ( sum, item ) => sum + ( item.totalWorks || 0 ), 0 ),
      workCompleted: data.reduce( ( sum, item ) => sum + ( item.workCompleted || 0 ), 0 ),
      workIncomplete: data.reduce( ( sum, item ) => sum + ( item.workIncomplete || 0 ), 0 ),
      geotaggingCompleted: data.reduce( ( sum, item ) => sum + ( item.geotaggingCompleted || 0 ), 0 ),
      geotaggingIncomplete: data.reduce( ( sum, item ) => sum + ( item.geotaggingIncomplete || 0 ), 0 ),
    };
  };

  // Process `geoData` for the bar chart
  // Sort `geoData` alphabetically by district name
const sortedGeoData = geoData.sort((a, b) => a.district.localeCompare(b.district));
  const xAxisData = sortedGeoData.map((item) => item.district); // District names for x-axis
  const rawData = [
    geoData.map((item) => item.villageCount),
    geoData.map((item) => item.waterBudgetCompleted),
    geoData.map((item) => item.waterBudgetIncomplete),
    geoData.map((item) => item.villagePlanCount),
    geoData.map((item) => item.totalWorks),
    geoData.map((item) => item.workCompleted),
    geoData.map((item) => item.workIncomplete),
    geoData.map((item) => item.geotaggingCompleted),
    geoData.map((item) => item.geotaggingIncomplete),
  ];
  
  const series = [
    "Village Count",
    "Water Budget Completed",
    "Water Budget Incomplete",
    "Village Plan",
    "Total Works",
    "Work Completed",
    "Work Incompleted",
    "Geotagging Completed",
    "Geotagging Incompleted",
  ].map((name, sid) => ({
    name,
    type: "bar",
    stack: "total",
    barWidth: "80%",
    label: {
      show: true,
      formatter: (params) => `${params.value}`, // Display direct counts
    },
    data: rawData[sid], // Use direct counts
  }));
  
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
      data: xAxisData, // District names for x-axis
      axisLabel: {
        interval: 0, // Show all labels
        rotate: 45, // Rotate labels 45 degrees for better readability
        fontSize: 10, // Optional: Reduce font size
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value) => value, // Show all tick labels as-is
      },
    },
    series,
  };

  return (
    <>
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
                  data={selectedDivision ? divisionData[ selectedDivision ]?.districts || [] : []}
                  selectedItem={selectedDistrict}
                  onItemClick={handleDistrictClick}
                />
              </Col>
            </Row>
          </Col>
          <Divider type="vertical" style={{ height: "45vh", borderColor: "" }} />
          <Col span={18} >
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
                    Total Records {`${ Math.min( currentPage * pageSize, filteredData.length ) } / ${ filteredData.length }`}
                  </Typography.Text>
                  {/* Add a search input */}
                  <Input
                    placeholder="Enter District Name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{ width: 200, marginBottom: "10px" , marginRight: "-650px"}}
                  />
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
                  className="custom-table"
                  style={{ alignItems: "top", borderColor: "#ff5722" }}
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
                      setPageSize( pageSize );
                    },
                  }}
                  scroll={{ x: "100%" }}
                  bordered
                  summary={( pageData ) => {
                    const totals = calculateTotals( pageData );

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
                          <strong>{totals.villagePlanCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} className="center">
                          <strong>{totals.totalWorks}</strong>
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
      <Flex gap={20} wrap="nowrap" style={{ height: "600px" }}>
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
