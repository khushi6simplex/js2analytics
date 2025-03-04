import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider, Input } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import ExcelJS from "exceljs";

const SummaryState = ( { resetTrigger } ) => {
  const [ geoData, setGeoData ] = useState( [] );
  const [ selectedDivision, setSelectedDivision ] = useState( null );
  const [ selectedDistrict, setSelectedDistrict ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ searchTerm, setSearchTerm ] = useState( "" );

  useEffect( () => {
    const fetchData = async () => {
      try {
        setLoading( true );
        const url = window.__analytics__.wbUrl;

        console.log( "Fetching data from URL:", url );

        const responses = await Promise.all( [
          axios.get( url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:projectvillage_js2project", outputFormat: "json", srsname: "EPSG:3857", CQL_FILTER: "isselected=true" } } ),
          axios.get( url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:waterbudget_js2project", outputFormat: "json", srsname: "EPSG:3857" } } ),
          axios.get( url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:subplan_js2project", outputFormat: "json", srsname: "EPSG:3857" } } ),
          axios.get( url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:work_js2project", outputFormat: "json", srsname: "EPSG:3857" } } ),
          axios.get( url, { params: { service: "WFS", version: "1.0.0", request: "GetFeature", typeName: "js2surveydsws:work_js2project_shadow", outputFormat: "json", srsname: "EPSG:3857" } } ),
        ] );

        const [ projectVillageData, waterBudgetData, villagePlanData, shadowWorks, originalWorks ] = responses.map( response => response.data.features || [] );
        const workData = [ ...shadowWorks, ...originalWorks ];

        const districtData = processDistrictData( projectVillageData, waterBudgetData, villagePlanData, workData );
        setGeoData( districtData );
      } catch ( error ) {
        console.error( "Error fetching or processing data:", error );
      } finally {
        setLoading( false );
      }
    };

    fetchData();
  } );

  useEffect( () => {
    if ( resetTrigger ) {
      setSelectedDivision( null );
      setSelectedDistrict( null );
    }
  }, [ resetTrigger ] );

  const processDistrictData = ( projectVillageData, waterBudgetData, villagePlanData, workData ) => {
    const districtVillageCounts = countByDistrict( projectVillageData, "district" );
    const districtWaterBudgetCounts = countByDistrict( waterBudgetData, "district" );
    const districtVillagePlanCounts = countUniqueByDistrict( villagePlanData, "district", "villageid" );
    const districtWorkCounts = countWorkData( workData, "district", "completionlocation" );
    const districtGeotaggingCounts = countWorkData( workData, "district", "startedlocation" );

    return Object.keys( districtVillageCounts ).map( district => {
      const division = findDivision( district );
      return {
        key: `${ division }-${ district }`,
        division,
        district,
        villageCount: districtVillageCounts[ district ],
        waterBudgetCompleted: districtWaterBudgetCounts[ district ] || 0,
        waterBudgetIncomplete: ( districtVillageCounts[ district ] || 0 ) - ( districtWaterBudgetCounts[ district ] || 0 ),
        villagePlanCount: districtVillagePlanCounts[ district ] || 0,
        totalWorks: ( districtWorkCounts[ district ]?.completed || 0 ) + ( districtWorkCounts[ district ]?.incomplete || 0 ),
        workCompleted: districtWorkCounts[ district ]?.completed || 0,
        workIncomplete: districtWorkCounts[ district ]?.incomplete || 0,
        geotaggingCompleted: districtGeotaggingCounts[ district ]?.completed || 0,
        geotaggingIncomplete: districtGeotaggingCounts[ district ]?.incomplete || 0,
        isGroupRow: false
      };
    } );
  };

  const countByDistrict = ( data, districtKey ) => {
    return data.reduce( ( acc, feature ) => {
      const district = feature.properties[ districtKey ] || "Unknown District";
      acc[ district ] = ( acc[ district ] || 0 ) + 1;
      return acc;
    }, {} );
  };

  const countUniqueByDistrict = ( data, districtKey, uniqueKey ) => {
    const uniqueIds = new Set();
    return data.reduce( ( acc, feature ) => {
      const district = feature.properties[ districtKey ] || "Unknown District";
      const id = feature.properties[ uniqueKey ];
      const uniqueId = `${ district }_${ id }`;
      if ( !uniqueIds.has( uniqueId ) ) {
        uniqueIds.add( uniqueId );
        acc[ district ] = ( acc[ district ] || 0 ) + 1;
      }
      return acc;
    }, {} );
  };

  const countWorkData = ( data, districtKey, locationKey ) => {
    return data.reduce( ( acc, feature ) => {
      const district = feature.properties[ districtKey ] || "Unknown District";
      const location = feature.properties[ locationKey ] || "";
      if ( !acc[ district ] ) {
        acc[ district ] = { completed: 0, incomplete: 0 };
      }
      if ( location ) {
        acc[ district ].completed += 1;
      } else {
        acc[ district ].incomplete += 1;
      }
      return acc;
    }, {} );
  };

  const findDivision = ( district ) => {
    return Object.keys( divisionData ).find( division => divisionData[ division ].districts.includes( district ) ) || "Unknown Division";
  };

  const handleDivisionClick = ( division ) => {
    setSelectedDivision( division === selectedDivision ? null : division );
    setSelectedDistrict( null );
  };

  const handleDistrictClick = ( district ) => {
    setSelectedDistrict( district === selectedDistrict ? null : district );
  };

  const prepareData = ( data ) => {
    let lastDivision = null;
    return data.map( row => {
      const isNewDivision = row.division !== lastDivision;
      lastDivision = row.division;
      return { ...row, isNewDivision };
    } );
  };

  const addDivisionTotals = ( data ) => {
    const groupedByDivision = data.reduce( ( result, record ) => {
      if ( !result[ record.division ] ) {
        result[ record.division ] = [];
      }
      result[ record.division ].push( record );
      return result;
    }, {} );

    const dataWithTotals = [];

    Object.entries( groupedByDivision ).forEach( ( [ division, records ] ) => {
      dataWithTotals.push( ...records );
      const divisionTotals = calculateDivisionTotals( division, records );
      dataWithTotals.push( divisionTotals );
    } );

    return dataWithTotals;
  };

  const calculateDivisionTotals = ( division, records ) => {
    return {
      key: `${ division }-totals`,
      division: `${ division } Totals`,
      district: "",
      villageCount: records.reduce( ( sum, item ) => sum + ( item.villageCount || 0 ), 0 ),
      waterBudgetCompleted: records.reduce( ( sum, item ) => sum + ( item.waterBudgetCompleted || 0 ), 0 ),
      waterBudgetIncomplete: records.reduce( ( sum, item ) => sum + ( item.waterBudgetIncomplete || 0 ), 0 ),
      villagePlanCount: records.reduce( ( sum, item ) => sum + ( item.villagePlanCount || 0 ), 0 ),
      totalWorks: records.reduce( ( sum, item ) => sum + ( item.totalWorks || 0 ), 0 ),
      workCompleted: records.reduce( ( sum, item ) => sum + ( item.workCompleted || 0 ), 0 ),
      workIncomplete: records.reduce( ( sum, item ) => sum + ( item.workIncomplete || 0 ), 0 ),
      geotaggingCompleted: records.reduce( ( sum, item ) => sum + ( item.geotaggingCompleted || 0 ), 0 ),
      geotaggingIncomplete: records.reduce( ( sum, item ) => sum + ( item.geotaggingIncomplete || 0 ), 0 ),
      isTotalsRow: true
    };
  };

  const calculateOverallTotals = ( data ) => {
    const filteredData = data.filter( item => !item.isTotalsRow );
    return {
      division: "Overall Totals",
      district: "",
      villageCount: filteredData.reduce( ( sum, item ) => sum + ( item.villageCount || 0 ), 0 ),
      waterBudgetCompleted: filteredData.reduce( ( sum, item ) => sum + ( item.waterBudgetCompleted || 0 ), 0 ),
      waterBudgetIncomplete: filteredData.reduce( ( sum, item ) => sum + ( item.waterBudgetIncomplete || 0 ), 0 ),
      villagePlanCount: filteredData.reduce( ( sum, item ) => sum + ( item.villagePlanCount || 0 ), 0 ),
      totalWorks: filteredData.reduce( ( sum, item ) => sum + ( item.totalWorks || 0 ), 0 ),
      workCompleted: filteredData.reduce( ( sum, item ) => sum + ( item.workCompleted || 0 ), 0 ),
      workIncomplete: filteredData.reduce( ( sum, item ) => sum + ( item.workIncomplete || 0 ), 0 ),
      geotaggingCompleted: filteredData.reduce( ( sum, item ) => sum + ( item.geotaggingCompleted || 0 ), 0 ),
      geotaggingIncomplete: filteredData.reduce( ( sum, item ) => sum + ( item.geotaggingIncomplete || 0 ), 0 ),
      isTotalsRow: true
    };
  };

  const getFilteredData = () => {
    let filtered = geoData;

    if ( selectedDivision ) {
      filtered = filtered.filter( item => item.division === selectedDivision );
    }

    if ( selectedDistrict ) {
      filtered = filtered.filter( item => item.district === selectedDistrict );
    }

    if ( searchTerm ) {
      filtered = filtered.filter( item => item.district.toLowerCase().includes( searchTerm.toLowerCase() ) );
    }

    const preparedData = prepareData( addDivisionTotals( filtered ) );
    return preparedData;
  };

  const handleSearchChange = ( e ) => {
    setSearchTerm( e.target.value );
  };

  const handleExport = async () => {
    if ( geoData.length === 0 ) {
      alert( "No data available to export." );
      return;
    }

    const sortedData = getFilteredData().sort( ( a, b ) => a.division.localeCompare( b.division ) );
    const dataToExport = prepareExportData( sortedData );
    const workbook = createWorkbook( dataToExport );

    const fileName = generateFileName();
    downloadWorkbook( workbook, fileName );
  };

  const prepareExportData = ( data ) => {
    const dataToExport = data.map( item => [
      item.division, item.district, item.villageCount, item.waterBudgetCompleted, item.waterBudgetIncomplete,
      item.villagePlanCount, item.totalWorks, item.workCompleted, item.workIncomplete, item.geotaggingCompleted, item.geotaggingIncomplete
    ] );

    const overallTotals = calculateOverallTotals( data.filter( item => !item.isTotalsRow ) );
    dataToExport.push( [
      overallTotals.division, overallTotals.district, overallTotals.villageCount, overallTotals.waterBudgetCompleted,
      overallTotals.waterBudgetIncomplete, overallTotals.villagePlanCount, overallTotals.totalWorks, overallTotals.workCompleted,
      overallTotals.workIncomplete, overallTotals.geotaggingCompleted, overallTotals.geotaggingIncomplete
    ] );

    return dataToExport;
  };

  const createWorkbook = ( data ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet( "Summary Data" );

    const headerRow1 = [ "Division", "District", "Total Villages", "Water Budget", "Water Budget", "Village Plan", "Works", "Works", "Works", "Geotagging", "Geotagging" ];
    const headerRow2 = [ "", "", "", "Completed", "Incomplete", "", "Total", "Completed", "Incomplete", "Completed", "Incomplete" ];

    worksheet.addRow( headerRow1 );
    worksheet.addRow( headerRow2 );

    applyHeaderStyle( worksheet.getRow( 1 ) );
    applyHeaderStyle( worksheet.getRow( 2 ) );

    data.forEach( ( row, rowIndex ) => {
      const excelRow = worksheet.addRow( row );
      applyRowStyle( excelRow, rowIndex === data.length - 1 );
    } );

    mergeHeaderCells( worksheet );
    mergeDivisionCells( worksheet, data );

    return workbook;
  };

  const applyHeaderStyle = ( row ) => {
    const headerStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "middle" },
      border: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }
    };
    row.eachCell( cell => cell.style = headerStyle );
  };

  const applyRowStyle = ( row, isTotalsRow ) => {
    row.eachCell( cell => {
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if ( isTotalsRow ) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF99" } };
      }
    } );
  };

  const mergeHeaderCells = ( worksheet ) => {
    worksheet.mergeCells( "D1:E1" );
    worksheet.mergeCells( "G1:I1" );
    worksheet.mergeCells( "J1:K1" );
  };

  const mergeDivisionCells = ( worksheet, data ) => {
    let startRow = 3;
    let currentDivision = data[ 0 ][ 0 ];
    for ( let i = 1; i < data.length; i++ ) {
      if ( data[ i ][ 0 ] !== currentDivision ) {
        if ( i > startRow ) {
          worksheet.mergeCells( `A${ startRow }:A${ i + 2 }` );
        }
        startRow = i + 3;
        currentDivision = data[ i ][ 0 ];
      }
    }
    if ( startRow < data.length + 2 ) {
      worksheet.mergeCells( `A${ startRow }:A${ data.length + 2 }` );
    }
  };

  const generateFileName = () => {
    let fileName = "All Divisions";
    if ( selectedDivision ) fileName = selectedDivision;
    if ( selectedDistrict ) fileName = selectedDistrict;
    return `${ fileName }_${ new Date().toISOString().slice( 0, 10 ) }.xlsx`;
  };

  const downloadWorkbook = ( workbook, fileName ) => {
    workbook.xlsx.writeBuffer().then( buffer => {
      const blob = new Blob( [ buffer ], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } );
      const link = document.createElement( "a" );
      link.href = URL.createObjectURL( blob );
      link.download = fileName;
      link.click();
    } );
  };

  const columns = [
    { title: "Division", dataIndex: "division", key: "division", align: "center", className: "center division-column", sorter: ( a, b ) => a.division.localeCompare( b.division ), defaultSortOrder: "ascend", render: ( text, record ) => ( record.isNewDivision ? text : null ) },
    { title: "District", dataIndex: "district", key: "district", align: "center", className: "center", sorter: ( a, b ) => a.district.localeCompare( b.district ), defaultSortOrder: "ascend" },
    { title: "Village Count", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center", sorter: ( a, b ) => a.villageCount - b.villageCount },
    { title: "Water Budget", children: [ { title: "Completed", dataIndex: "waterBudgetCompleted", key: "waterBudgetCompleted", align: "center", className: "center", sorter: ( a, b ) => a.waterBudgetCompleted - b.waterBudgetCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "waterBudgetIncomplete", key: "waterBudgetIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.waterBudgetIncomplete - b.waterBudgetIncomplete, defaultSortOrder: "ascend" } ] },
    { title: "Village Plan", dataIndex: "villagePlanCount", key: "villagePlanCount", align: "center", className: "center", sorter: ( a, b ) => a.villagePlanCount - b.villagePlanCount, defaultSortOrder: "ascend" },
    { title: "Works", children: [ { title: "Total", dataIndex: "totalWorks", key: "totalWorks", align: "center", className: "center", sorter: ( a, b ) => a.totalWorks - b.totalWorks, defaultSortOrder: "ascend" }, { title: "Completed", dataIndex: "workCompleted", key: "workCompleted", align: "center", className: "center", sorter: ( a, b ) => a.workCompleted - b.workCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "workIncomplete", key: "workIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.workIncomplete - b.workIncomplete, defaultSortOrder: "ascend" } ] },
    { title: "Geotagging", children: [ { title: "Completed", dataIndex: "geotaggingCompleted", key: "geotaggingCompleted", align: "center", className: "center", sorter: ( a, b ) => a.geotaggingCompleted - b.geotaggingCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "geotaggingIncomplete", key: "geotaggingIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.geotaggingIncomplete - b.geotaggingIncomplete, defaultSortOrder: "ascend" } ] }
  ];

  const sortedData = getFilteredData().sort( ( a, b ) => a.division.localeCompare( b.division ) );

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function ( params ) {
        let tooltipContent = `<strong>${ params[ 0 ].name }</strong><br/>`;
        params.forEach( param => {
          tooltipContent += `${ param.marker } <strong>${ param.seriesName }:</strong> ${ param.value }<br/>`;
        } );
        return tooltipContent;
      }
    },
    legend: { selectedMode: false },
    grid: { left: 100, right: 100, top: 50, bottom: 100 },
    xAxis: {
      type: "category",
      data: geoData.map( ( item ) => item.district ),
      axisLabel: { interval: 0, rotate: 45, fontSize: 10 }
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { formatter: ( value ) => value }
    },
    series: [
      { name: "Village Count", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.villageCount ) },
      { name: "Water Budget Completed", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.waterBudgetCompleted ) },
      { name: "Water Budget Incompleted", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.waterBudgetIncomplete ) },
      { name: "Village Plan", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.villagePlanCount ) },
      { name: "Total Works", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.totalWorks ) },
      { name: "Work Completed", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.workCompleted ) },
      { name: "Work Incompleted", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.workIncomplete ) },
      { name: "Geotagging Completed", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.geotaggingCompleted ) },
      { name: "Geotagging Incompleted", type: "bar", stack: "total", barWidth: "80%", label: { show: true, formatter: ( params ) => `${ params.value }` }, data: geoData.map( ( item ) => item.geotaggingIncomplete ) }
    ]
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
          <Col span={18}>
            {loading ? (
              <Spin size="large" />
            ) : geoData.length === 0 ? (
              <Empty description="" />
            ) : (
              <div>
                <Flex gap="large" justify="space-between" align="center">
                  <Typography.Text style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "10px", display: "block" }}>
                    Total Records {`${ sortedData.length } / ${ sortedData.length }`}
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
                  rowClassName={( record ) =>
                    record.isTotalsRow ? "totals-row" : record.isNewDivision ? "no-border-row" : ""
                  }
                  pagination={false}
                  scroll={{ x: "100%" }}
                  bordered
                  summary={() => {
                    const totals = calculateOverallTotals( sortedData.filter( item => !item.isTotalsRow ) );
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

SummaryState.propTypes = {
  resetTrigger: PropTypes.bool.isRequired,
  isMapVisible: PropTypes.bool,
};

export default SummaryState;