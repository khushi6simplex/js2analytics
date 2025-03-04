import { useState, useEffect } from "react";
import { Table, Row, Col, Spin, Empty, Flex, Button, Typography, Divider, Input } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import "../Dashboard.css";
import axios from "axios";
import ExcelJS from "exceljs";
import PropTypes from "prop-types";

const SummaryTaluka = ( { resetTrigger, jurisdictionFilters = {} } ) => {
    const [ geoData, setGeoData ] = useState( [] );
    const [ selectedTaluka, setSelectedTaluka ] = useState( null );
    const [ selectedVillage, setSelectedVillage ] = useState( null );
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

                const talukaData = processTalukaData( projectVillageData, waterBudgetData, villagePlanData, workData );
                setGeoData( talukaData );
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
            setSelectedTaluka( null );
            setSelectedVillage( null );
        }
    }, [ resetTrigger ] );

    const parseTalukaFromFilters = ( filterInput ) => {
        const filterString = typeof filterInput === "string" ? filterInput : JSON.stringify( filterInput );
        const match = filterString.match( /taluka='([^']+)'/ );
        return match ? match[ 1 ] : null;
    };

    useEffect( () => {
        const talukaFilter = jurisdictionFilters || {};
        const taluka = parseTalukaFromFilters( talukaFilter );
        if ( taluka ) {
            setSelectedTaluka( taluka );
        }
    }, [ jurisdictionFilters ] );

    const processTalukaData = ( projectVillageData, waterBudgetData, villagePlanData, workData ) => {
        const villageIdMap = projectVillageData.reduce( ( acc, feature ) => {
            const taluka = feature.properties[ "taluka" ] || "Unknown Taluka";
            const village = feature.properties[ "villagename" ] || "Unknown Village";
            const villageId = feature.properties[ "villageid" ];
            if ( !acc[ villageId ] ) {
                acc[ villageId ] = { taluka, village };
            }
            return acc;
        }, {} );

        const villagePlanMap = villagePlanData.reduce( ( acc, feature ) => {
            const villageId = feature.properties[ "villageid" ];
            const subPlanId = feature.properties[ "subPlanId" ];
            if ( !acc[ villageId ] ) {
                acc[ villageId ] = new Set();
            }
            acc[ villageId ].add( subPlanId );
            return acc;
        }, {} );

        const talukaVillageMap = Object.keys( villageIdMap ).reduce( ( acc, villageId ) => {
            const { taluka, village } = villageIdMap[ villageId ];
            if ( !acc[ taluka ] ) {
                acc[ taluka ] = {};
            }
            if ( !acc[ taluka ][ village ] ) {
                acc[ taluka ][ village ] = {
                    taluka,
                    villageName: village,
                    waterBudgetCompleted: 0,
                    waterBudgetIncomplete: 0,
                    villagePlanCount: 0,
                    totalWorks: 0,
                    workCompleted: 0,
                    workIncomplete: 0,
                    geotaggingCompleted: 0,
                    geotaggingIncomplete: 0,
                    isGroupRow: false
                };
            }
            return acc;
        }, {} );

        waterBudgetData.forEach( feature => {
            const villageId = feature.properties[ "villageid" ];
            const { taluka, village } = villageIdMap[ villageId ] || {};
            if ( taluka && village && talukaVillageMap[ taluka ] && talukaVillageMap[ taluka ][ village ] ) {
                talukaVillageMap[ taluka ][ village ].waterBudgetCompleted += 1;
            }
        } );

        villagePlanData.forEach( feature => {
            const villageId = feature.properties[ "villageid" ];
            const { taluka, village } = villageIdMap[ villageId ] || {};
            if ( taluka && village && talukaVillageMap[ taluka ] && talukaVillageMap[ taluka ][ village ] ) {
                talukaVillageMap[ taluka ][ village ].villagePlanCount += 1;
            }
        } );

        workData.forEach( feature => {
            const subplanId = feature.properties[ "subplanid" ];
            Object.keys( villagePlanMap ).forEach( villageId => {
                if ( villagePlanMap[ villageId ].has( subplanId ) ) {
                    const { taluka, village } = villageIdMap[ villageId ] || {};
                    if ( taluka && village && talukaVillageMap[ taluka ] && talukaVillageMap[ taluka ][ village ] ) {
                        talukaVillageMap[ taluka ][ village ].totalWorks += 1;
                        if ( feature.properties[ "completionlocation" ] ) {
                            talukaVillageMap[ taluka ][ village ].workCompleted += 1;
                        } else {
                            talukaVillageMap[ taluka ][ village ].workIncomplete += 1;
                        }
                        if ( feature.properties[ "startedlocation" ] ) {
                            talukaVillageMap[ taluka ][ village ].geotaggingCompleted += 1;
                        } else {
                            talukaVillageMap[ taluka ][ village ].geotaggingIncomplete += 1;
                        }
                    }
                }
            } );
        } );

        return Object.values( talukaVillageMap ).flatMap( taluka => Object.values( taluka ) );
    };

    // const countByVillage = ( data, taluka, village, key ) => {
    //     return data.filter( feature => feature.properties[ "taluka" ] === taluka && feature.properties[ "villagename" ] === village ).length;
    // };

    // const countUniqueByVillage = ( data, taluka, village, uniqueKey ) => {
    //     const uniqueIds = new Set();
    //     return data.reduce( ( acc, feature ) => {
    //         if ( feature.properties[ "taluka" ] === taluka && feature.properties[ "villagename" ] === village ) {
    //             const id = feature.properties[ uniqueKey ];
    //             const uniqueId = `${ taluka }_${ village }_${ id }`;
    //             if ( !uniqueIds.has( uniqueId ) ) {
    //                 uniqueIds.add( uniqueId );
    //                 acc += 1;
    //             }
    //         }
    //         return acc;
    //     }, 0 );
    // };

    // const countWorkByVillage = ( data, taluka, village, locationKey ) => {
    //     return data.reduce( ( acc, feature ) => {
    //         if ( feature.properties[ "taluka" ] === taluka && feature.properties[ "villagename" ] === village ) {
    //             const location = feature.properties[ locationKey ] || "";
    //             if ( location ) {
    //                 acc.completed += 1;
    //             } else {
    //                 acc.incomplete += 1;
    //             }
    //             acc.total += 1;
    //         }
    //         return acc;
    //     }, { completed: 0, incomplete: 0, total: 0 } );
    // };

    // const handleTalukaClick = ( taluka ) => {
    //     setSelectedTaluka( taluka === selectedTaluka ? null : taluka );
    //     setSelectedVillage( null );
    // };

    const handleVillageClick = ( village ) => {
        setSelectedVillage( village === selectedVillage ? null : village );
    };

    const getFilteredData = () => {
        let filtered = geoData;

        if ( selectedTaluka ) {
            filtered = filtered.filter( item => item.taluka === selectedTaluka );
        }

        if ( selectedVillage ) {
            filtered = filtered.filter( item => item.villageName === selectedVillage );
        }

        if ( searchTerm ) {
            filtered = filtered.filter( item =>
                item.taluka.toLowerCase().includes( searchTerm.toLowerCase() ) ||
                item.villageName.toLowerCase().includes( searchTerm.toLowerCase() )
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

        const sortedData = getFilteredData().sort( ( a, b ) => a.taluka.localeCompare( b.taluka ) );
        const dataToExport = sortedData.map( item => [
            item.taluka, item.villageName, item.waterBudgetCompleted, item.waterBudgetIncomplete,
            item.villagePlanCount, item.totalWorks, item.workCompleted, item.workIncomplete, item.geotaggingCompleted, item.geotaggingIncomplete
        ] );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet( "Summary Data" );

        const headerRow1 = [ "Taluka", "Village Name", "Water Budget", "Water Budget", "Village Plan", "Works", "Works", "Works", "Geotagging", "Geotagging" ];
        const headerRow2 = [ "", "", "Completed", "Incomplete", "", "Total", "Completed", "Incomplete", "Completed", "Incomplete" ];

        worksheet.addRow( headerRow1 );
        worksheet.addRow( headerRow2 );

        dataToExport.forEach( row => worksheet.addRow( row ) );

        const fileName = generateFileName();
        downloadWorkbook( workbook, fileName );
    };

    const generateFileName = () => {
        let fileName = "All Talukas";
        if ( selectedTaluka ) fileName = selectedTaluka;
        if ( selectedVillage ) fileName = selectedVillage;
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
        { title: "Taluka", dataIndex: "taluka", key: "taluka", align: "center", className: "center", sorter: ( a, b ) => ( a.taluka || "" ).localeCompare( b.taluka || "" ), defaultSortOrder: "ascend" },
        { title: "Village Name", dataIndex: "villageName", key: "villageName", align: "center", className: "center", sorter: ( a, b ) => ( a.villageName || "" ).localeCompare( b.villageName || "" ), defaultSortOrder: "ascend" },
        { title: "Water Budget", children: [ { title: "Completed", dataIndex: "waterBudgetCompleted", key: "waterBudgetCompleted", align: "center", className: "center", sorter: ( a, b ) => a.waterBudgetCompleted - b.waterBudgetCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "waterBudgetIncomplete", key: "waterBudgetIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.waterBudgetIncomplete - b.waterBudgetIncomplete, defaultSortOrder: "ascend" } ] },
        { title: "Village Plan", dataIndex: "villagePlanCount", key: "villagePlanCount", align: "center", className: "center", sorter: ( a, b ) => a.villagePlanCount - b.villagePlanCount, defaultSortOrder: "ascend" },
        { title: "Works", children: [ { title: "Total", dataIndex: "totalWorks", key: "totalWorks", align: "center", className: "center", sorter: ( a, b ) => a.totalWorks - b.totalWorks, defaultSortOrder: "ascend" }, { title: "Completed", dataIndex: "workCompleted", key: "workCompleted", align: "center", className: "center", sorter: ( a, b ) => a.workCompleted - b.workCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "workIncomplete", key: "workIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.workIncomplete - b.workIncomplete, defaultSortOrder: "ascend" } ] },
        { title: "Geotagging", children: [ { title: "Completed", dataIndex: "geotaggingCompleted", key: "geotaggingCompleted", align: "center", className: "center", sorter: ( a, b ) => a.geotaggingCompleted - b.geotaggingCompleted, defaultSortOrder: "ascend" }, { title: "Incomplete", dataIndex: "geotaggingIncomplete", key: "geotaggingIncomplete", align: "center", className: "center", sorter: ( a, b ) => a.geotaggingIncomplete - b.geotaggingIncomplete, defaultSortOrder: "ascend" } ] },
    ];

    const sortedData = getFilteredData().sort( ( a, b ) => a.taluka.localeCompare( b.taluka ) );

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
                                    title="Talukas"
                                    data={Array.from( new Set( geoData.map( feature => feature.taluka ) ) )}
                                    selectedItem={selectedTaluka}
                                    onItemClick={{}}
                                />
                            </Col>
                            <Col span={12}>
                                <Jurisdictions
                                    title="Villages"
                                    data={
                                        selectedTaluka
                                            ? Array.from( new Set( geoData.filter( feature => feature.taluka === selectedTaluka ).map( feature => feature.villageName ) ) )
                                            : []
                                    }
                                    selectedItem={selectedVillage}
                                    onItemClick={handleVillageClick}
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
                                        placeholder="Enter Taluka or Village Name"
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

SummaryTaluka.propTypes = {
    resetTrigger: PropTypes.bool.isRequired,
    jurisdictionFilters: PropTypes.object.isRequired,
};

export default SummaryTaluka;