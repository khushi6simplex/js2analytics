import React, { useState, useEffect, version } from "react";
import { Table, Row, Col, Spin, Empty, Button, Typography, Divider, Flex } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction"; // Importing Jurisdictions
import divisionData from "../division.json";
import { exportToExcel } from "../Excel/Excel";
import "../Dashboard.css";
import axios from "axios";

const Goetagging: React.FC = () => {
    const [geoData, setGeoData] = useState<any[]>([]); // Final processed data
    const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(7);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
    
                const url = (window as any).__analytics__.wbUrl;
    
                // Fetch data from all endpoints
                const [worksResponse, subplansResponse, projectVillageResponse] = await Promise.all([
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
                            typeName: "js2surveydsws:projectvillage_js2project",
                            outputFormat: "json",
                            srsname: "EPSG:3857",
                        },
                    }),
                ]);
    
                const works = worksResponse.data.features || [];
                const subplans = subplansResponse.data.features || [];
                const projectVillages = projectVillageResponse.data.features || [];
    
                // Create a map of subplanid to villageid
                const subplanToVillageMap = new Map(
                    subplans.map((subplan) => [
                        subplan.properties.subplanid,
                        subplan.properties.villageid,
                    ])
                );
    
                // Create a map of villageid to villagename
                const villageIdToNameMap = new Map(
                    projectVillages.map((village) => [
                        village.properties.villageid,
                        village.properties.villagename || "Unknown Village",
                    ])
                );
    
                // Process works and enrich with village name and other details
                const processedData = works.map((work) => {
                    const subplanid = work.properties.subplanid;
                    const villageid = subplanToVillageMap.get(subplanid);
                    const villagename = villageIdToNameMap.get(villageid) || "Unknown Village";
    
                    return {
                        workid: work.properties.workid,
                        villagename,
                        worktype: work.properties.worktype || "Unknown",
                        deptName: work.properties.deptName || "Unknown",
                        workstartdate: work.properties.workstartdate || "N/A",
                        startedlocation: work.properties.startedlocation || "N/A",
                        startofwork: work.properties.startofwork || "N/A",
                        inprogresslocation: work.properties.inprogresslocation || "N/A",
                        workinprogress: work.properties.workinprogress || "N/A",
                        wocompletiondate: work.properties.wocompletiondate || "N/A",
                        completionlocation: work.properties.completionlocation || "N/A",
                        workcompletion: work.properties.workcompletion || "N/A",
                        waterBudgetPresent: work.properties.waterBudgetPresent || "N/A",
                        villagePlanPresent: work.properties.villagePlanPresent || "N/A",
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
    
    const handleDivisionClick = (division: string) => {
        setSelectedDivision(division === selectedDivision ? null : division);
        setSelectedDistrict(null);
        setSelectedTaluka(null);
        setCurrentPage(1);
    };

    const handleDistrictClick = (district: string) => {
        setSelectedDistrict(district === selectedDistrict ? null : district);
        setSelectedTaluka(null);
        setCurrentPage(1);
    };

    const handleTalukaClick = (taluka: string) => {
        setSelectedTaluka(taluka === selectedTaluka ? null : taluka);
        setCurrentPage(1);
    };

    const filteredData = geoData.filter((feature) => {
        const { district, taluka } = feature;
        const isInDivision =
            selectedDivision &&
            divisionData[selectedDivision]?.districts.includes(district);
        const isInDistrict = !selectedDistrict || district === selectedDistrict;
        const isInTaluka = !selectedTaluka || taluka === selectedTaluka;

        return (!selectedDivision || isInDivision) && isInDistrict && isInTaluka;
    });

    const handleExport = () => {
        const summarizedData = filteredData;
        const totals = calculateTotals(summarizedData);

        // Append totals as the last row
        const dataWithTotals = [
            ...summarizedData,
            {
                division: "Total",
                district: "",
                taluka: "",
                villagename: "",
                waterBudgetCount: totals.waterBudgetYesCount,
                villagePlanCount: totals.villagePlanYesCount,
            },
        ];

        exportToExcel({
            data: dataWithTotals,
            columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex: dataIndex || "" })),
            fileName: "Geotagging.xlsx",
            sheetName: "Geotagging",
            tableTitle: "Geotagging",
        });
    };

    const columns = [
        {
            title: "Start of Work",
            children: [
                { title: "Work ID", dataIndex: "workid", key: "workid", className: "center", defaultSortOrder: "ascend" as const },
                { title: "Village", dataIndex: "villagename", key: "villagename", className: "center", sorter: (a, b) => a.villagename.localeCompare(b.villagename), defaultSortOrder: "ascend" as const },
                { title: "Work Type", dataIndex: "worktype", key: "worktype", className: "center", sorter: (a, b) => a.worktype.localeCompare(b.worktype), defaultSortOrder: "ascend" as const },
                { title: "Department Name", dataIndex: "deptName", key: "deptName", className: "center", sorter: (a, b) => a.deptName.localeCompare(b.deptName), defaultSortOrder: "ascend" as const },
                { title: "Date", dataIndex: "workstartdate", key: "workstartdate", className: "center" },
                { title: "Started Location", dataIndex: "startedlocation", key: "startedlocation", className: "center" },
                { title: "Image", dataIndex: "startofwork", key: "startofwork", className: "center" }
            ]
        },
        {
            title: "Work In Progress",
            children: [
                { title: "In Progress Location", dataIndex: "inprogresslocation", key: "inprogresslocation", className: "center" },
                { title: "Image", dataIndex: "workinprogress", key: "workinprogress", className: "center" }
            ]
        },
        {
            title: "Work Completion",
            children: [
                { title: "Date", dataIndex: "wocompletiondate", key: "wocompletiondate", className: "center" },
                { title: "Completed Location", dataIndex: "completionlocation", key: "completionlocation", className: "center" },
                { title: "Image", dataIndex: "workcompletion", key: "workcompletion", className: "center" }
            ]
        },

        {
            title: "Water Budget Present",
            dataIndex: "waterBudgetPresent",
            key: "waterBudgetPresent",
            className: "center",
            sorter: (a, b) => a.waterBudgetPresent.localeCompare(b.waterBudgetPresent),
        },
        {
            title: "Village Plans Present",
            dataIndex: "villagePlanPresent",
            key: "villagePlanPresent",
            className: "center",
            sorter: (a, b) => a.villagePlanPresent.localeCompare(b.villagePlanPresent),
        }
    ];

    const calculateTotals = (data) => {
        const waterBudgetYesCount = data.filter((item) => item.waterBudgetPresent === "Yes").length;
        const villagePlanYesCount = data.filter((item) => item.villagePlanPresent === "Yes").length;

        // const totals = {
        //     district: "",
        //     taluka: "",
        //     villagename: "",
        //     waterBudgetPresent: `${waterBudgetYesCount}`,
        //     villagePlanPresent: `${villagePlanYesCount}`,
        // }
        return {
            waterBudgetYesCount,
            villagePlanYesCount,
        };
    };

    // Calculate totals for the complete dataset
    const { waterBudgetYesCount, villagePlanYesCount } = calculateTotals(filteredData);

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
                        }}
                    >
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
                                        ? divisionData[selectedDivision]?.districts || []
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
                                                    .filter((feature) => feature.district === selectedDistrict)
                                                    .map((feature) => feature.taluka)
                                            )
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
                <Divider type="vertical" style={{ height: "100%" }} />
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
                                size="small"
                                tableLayout="fixed"
                                dataSource={filteredData}
                                pagination={{
                                    pageSize: pageSize,
                                    showSizeChanger: false,
                                    total: filteredData.length,
                                    current: currentPage,
                                    onChange: (page, pageSize) => {
                                        setCurrentPage(page);
                                        setPageSize(pageSize);
                                    },
                                }}
                                scroll={{ x: "100%" }}
                                bordered
                                
                            />
                        </div>
                    )}
                </Col>
            </Row>
        </Flex>
    );
};

export default Goetagging;
