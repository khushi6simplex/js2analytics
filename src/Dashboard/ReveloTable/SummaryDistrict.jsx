import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider, Input } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import "../Dashboard.css";
import axios from "axios";
import ExcelJS from "exceljs";

const SummaryDistrict = ( { resetTrigger, jurisdictionFilters = {} } ) => {
    const [ geoData, setGeoData ] = useState( [] );
    const [ selectedDistrict, setSelectedDistrict ] = useState( null );
    const [ selectedTaluka, setSelectedTaluka ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ searchTerm, setSearchTerm ] = useState( "" );

    useEffect( () => {
        const fetchData = async () => {
            try {
                setLoading( true );
                const url = window.__analytics__.wbUrl;

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
            setSelectedDistrict( null );
            setSelectedTaluka( null );
        }
    }, [ resetTrigger ] );

    const parseDistrictFromFilters = ( filterInput ) => {
        const filterString = typeof filterInput === "string" ? filterInput : JSON.stringify( filterInput );
        const match = filterString.match( /district='([^']+)'/ );
        return match ? match[ 1 ] : null;
    };

    useEffect( () => {
        const districtFilter = jurisdictionFilters || {};
        const district = parseDistrictFromFilters( districtFilter );
        if ( district ) {
            setSelectedDistrict( district );
        }
    }, [ jurisdictionFilters ] );

    const processDistrictData = ( projectVillageData, waterBudgetData, villagePlanData, workData ) => {
        const districtVillageCounts = countByDistrict( projectVillageData, "district" );
        // const districtWaterBudgetCounts = countByDistrict( waterBudgetData, "district" );
        // const districtVillagePlanCounts = countUniqueByDistrict( villagePlanData, "district", "villageid" );
        // const districtWorkCounts = countWorkData( workData, "district", "completionlocation" );
        // const districtGeotaggingCounts = countWorkData( workData, "district", "startedlocation" );

        const districtTalukaMap = projectVillageData.reduce( ( acc, feature ) => {
            const district = feature.properties[ "district" ] || "Unknown District";
            const taluka = feature.properties[ "taluka" ] || "Unknown Taluka";
            if ( !acc[ district ] ) {
                acc[ district ] = new Set();
            }
            acc[ district ].add( taluka );
            return acc;
        }, {} );

        return Object.keys( districtVillageCounts ).flatMap( district => {
            const talukas = Array.from( districtTalukaMap[ district ] || [] );
            return talukas.map( taluka => ( {
                key: `${ district }_${ taluka }`,
                district,
                taluka,
                villageCount: countByTaluka( projectVillageData, district, taluka, "villageid" ),
                waterBudgetCompleted: countByTaluka( waterBudgetData, district, taluka, "villageid" ),
                waterBudgetIncomplete: countByTaluka( projectVillageData, district, taluka, "villageid" ) - countByTaluka( waterBudgetData, district, taluka, "villageid" ),
                villagePlanCount: countUniqueByTaluka( villagePlanData, district, taluka, "villageid" ),
                totalWorks: countWorkByTaluka( workData, district, taluka, "completionlocation" ).total,
                workCompleted: countWorkByTaluka( workData, district, taluka, "completionlocation" ).completed,
                workIncomplete: countWorkByTaluka( workData, district, taluka, "completionlocation" ).incomplete,
                geotaggingCompleted: countWorkByTaluka( workData, district, taluka, "startedlocation" ).completed,
                geotaggingIncomplete: countWorkByTaluka( workData, district, taluka, "startedlocation" ).incomplete,
                isGroupRow: false
            } ) );
        } );
    };

    const countByDistrict = ( data, districtKey ) => {
        return data.reduce( ( acc, feature ) => {
            const district = feature.properties[ districtKey ] || "Unknown District";
            acc[ district ] = ( acc[ district ] || 0 ) + 1;
            return acc;
        }, {} );
    };

    const countByTaluka = ( data, district, taluka ) => {
        return data.filter( feature => feature.properties[ "district" ] === district && feature.properties[ "taluka" ] === taluka ).length;
    };

    // const countUniqueByDistrict = ( data, districtKey, uniqueKey ) => {
    //     const uniqueIds = new Set();
    //     return data.reduce( ( acc, feature ) => {
    //         const district = feature.properties[ districtKey ] || "Unknown District";
    //         const id = feature.properties[ uniqueKey ];
    //         const uniqueId = `${ district }_${ id }`;
    //         if ( !uniqueIds.has( uniqueId ) ) {
    //             uniqueIds.add( uniqueId );
    //             acc[ district ] = ( acc[ district ] || 0 ) + 1;
    //         }
    //         return acc;
    //     }, {} );
    // };

    const countUniqueByTaluka = ( data, district, taluka, uniqueKey ) => {
        const uniqueIds = new Set();
        return data.reduce( ( acc, feature ) => {
            if ( feature.properties[ "district" ] === district && feature.properties[ "taluka" ] === taluka ) {
                const id = feature.properties[ uniqueKey ];
                const uniqueId = `${ district }_${ taluka }_${ id }`;
                if ( !uniqueIds.has( uniqueId ) ) {
                    uniqueIds.add( uniqueId );
                    acc += 1;
                }
            }
            return acc;
        }, 0 );
    };

    // const countWorkData = ( data, districtKey, locationKey ) => {
    //     return data.reduce( ( acc, feature ) => {
    //         const district = feature.properties[ districtKey ] || "Unknown District";
    //         const location = feature.properties[ locationKey ] || "";
    //         if ( !acc[ district ] ) {
    //             acc[ district ] = { completed: 0, incomplete: 0 };
    //         }
    //         if ( location ) {
    //             acc[ district ].completed += 1;
    //         } else {
    //             acc[ district ].incomplete += 1;
    //         }
    //         return acc;
    //     }, {} );
    // };

    const countWorkByTaluka = ( data, district, taluka, locationKey ) => {
        return data.reduce( ( acc, feature ) => {
            if ( feature.properties[ "district" ] === district && feature.properties[ "taluka" ] === taluka ) {
                const location = feature.properties[ locationKey ] || "";
                if ( location ) {
                    acc.completed += 1;
                } else {
                    acc.incomplete += 1;
                }
                acc.total += 1;
            }
            return acc;
        }, { completed: 0, incomplete: 0, total: 0 } );
    };

    // const handleDistrictClick = ( district ) => {
    //     setSelectedDistrict( district === selectedDistrict ? null : district );
    //     setSelectedTaluka( null );
    // };

    const handleTalukaClick = ( taluka ) => {
        setSelectedTaluka( taluka === selectedTaluka ? null : taluka );
    };

    const getFilteredData = () => {
        let filtered = geoData;

        if ( selectedDistrict ) {
            filtered = filtered.filter( item => item.district === selectedDistrict );
        }

        if ( selectedTaluka ) {
            filtered = filtered.filter( item => item.taluka === selectedTaluka );
        }

        if ( searchTerm ) {
            filtered = filtered.filter( item =>
                item.district.toLowerCase().includes( searchTerm.toLowerCase() ) ||
                item.taluka.toLowerCase().includes( searchTerm.toLowerCase() )
            );
        }

        return filtered;
    };

    const handleSearchChange = ( e ) => {
        setSearchTerm( e.target.value );
    };

    const handleExport = async () => {
        if ( geoData.length === 0 ) {
            alert( "No data available to export." );
            return;
        }

        const sortedData = getFilteredData().sort( ( a, b ) => a.district.localeCompare( b.district ) );
        const dataToExport = sortedData.map( item => [
            item.district, item.taluka, item.villageCount, item.waterBudgetCompleted, item.waterBudgetIncomplete,
            item.villagePlanCount, item.totalWorks, item.workCompleted, item.workIncomplete, item.geotaggingCompleted, item.geotaggingIncomplete
        ] );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet( "Summary Data" );

        const headerRow1 = [ "District", "Taluka", "Village Count", "Water Budget", "Water Budget", "Village Plan", "Works", "Works", "Works", "Geotagging", "Geotagging" ];
        const headerRow2 = [ "", "", "", "Completed", "Incomplete", "", "Total", "Completed", "Incomplete", "Completed", "Incomplete" ];

        worksheet.addRow( headerRow1 );
        worksheet.addRow( headerRow2 );

        dataToExport.forEach( row => worksheet.addRow( row ) );

        const fileName = generateFileName();
        downloadWorkbook( workbook, fileName );
    };

    const generateFileName = () => {
        let fileName = "All Districts";
        if ( selectedDistrict ) fileName = selectedDistrict;
        if ( selectedTaluka ) fileName = selectedTaluka;
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
        { title: "District", dataIndex: "district", key: "district", align: "center", className: "center", sorter: ( a, b ) => ( a.district || "" ).localeCompare( b.district || "" ), defaultSortOrder: "ascend" },
        { title: "Taluka", dataIndex: "taluka", key: "taluka", align: "center", className: "center", sorter: ( a, b ) => ( a.taluka || "" ).localeCompare( b.taluka || "" ), defaultSortOrder: "ascend" },
        { title: "Village Count", dataIndex: "villageCount", key: "villageCount", align: "center", className: "center", sorter: ( a, b ) => a.villageCount - b.villageCount },
        { title: "Water Budget", children: [ { title: "Completed", dataIndex: "waterBudgetCompleted", key: "waterBudgetCompleted", align: "center", className: "center", sorter: ( a, b ) => a.waterBudgetCompleted - b.waterBudgetCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "waterBudgetIncomplete", key: "waterBudgetIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.waterBudgetIncomplete - b.waterBudgetIncomplete, defaultSortOrder: "ascend" } ] },
        { title: "Village Plan", dataIndex: "villagePlanCount", key: "villagePlanCount", align: "center", className: "center", sorter: ( a, b ) => a.villagePlanCount - b.villagePlanCount, defaultSortOrder: "ascend" },
        { title: "Works", children: [ { title: "Total", dataIndex: "totalWorks", key: "totalWorks", align: "center", className: "center", sorter: ( a, b ) => a.totalWorks - b.totalWorks, defaultSortOrder: "ascend" }, { title: "Completed", dataIndex: "workCompleted", key: "workCompleted", align: "center", className: "center", sorter: ( a, b ) => a.workCompleted - b.workCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "workIncomplete", key: "workIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.workIncomplete - b.workIncomplete, defaultSortOrder: "ascend" } ] },
        { title: "Geotagging", children: [ { title: "Completed", dataIndex: "geotaggingCompleted", key: "geotaggingCompleted", align: "center", className: "center", sorter: ( a, b ) => a.geotaggingCompleted - b.geotaggingCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "geotaggingIncomplete", key: "geotaggingIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.geotaggingIncomplete - b.geotaggingIncomplete, defaultSortOrder: "ascend" } ] },
    ];

    const sortedData = getFilteredData().sort( ( a, b ) => a.district.localeCompare( b.district ) );

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
                                    title="Districts"
                                    data={Object.keys( divisionData ).flatMap( division => divisionData[ division ].districts )}
                                    selectedItem={selectedDistrict}
                                    onItemClick={{}}
                                />
                            </Col>
                            <Col span={12}>
                                <Jurisdictions
                                    title="Talukas"
                                    data={
                                        selectedDistrict
                                            ? Array.from( new Set( geoData.filter( feature => feature.district === selectedDistrict ).map( feature => feature.taluka ) ) )
                                            : []
                                    }
                                    selectedItem={selectedTaluka}
                                    onItemClick={handleTalukaClick}
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
                                        placeholder="Enter District or Taluka Name"
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

SummaryDistrict.propTypes = {
    resetTrigger: PropTypes.bool.isRequired,
    jurisdictionFilters: PropTypes.object.isRequired,
};

export default SummaryDistrict;