import React, { useState, useEffect } from "react";
import { Table, Row, Col, Spin, Empty, Button, Typography, Divider, Flex } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction"; // Importing Jurisdictions
import divisionData from "../division.json";
import { exportToExcel } from "../Excel/Excel";
import "../Dashboard.css";
import axios from "axios";

const VillageWaterBudget: React.FC = () => {
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
    
                const [projectVillageResponse, waterBudgetResponse] = await Promise.all([
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
                ]);
    
                const projectVillageData = projectVillageResponse.data.features || [];
                const waterBudgetData = waterBudgetResponse.data.features || [];
    
                // Step 1: Create a lookup map for villageid to villageName
                const villageidToNameMap = projectVillageData.reduce((map, feature) => {
                    const villageid = feature.properties.villageid;
                    const villagename = feature.properties.villagename || "Unknown Village";
                    if (villageid) {
                        map[villageid] = villagename;
                    }
                    return map;
                }, {} as Record<string, string>);
    
                console.log("Village ID to Name Map:", villageidToNameMap); // Debugging
    
                // Step 2: Process waterBudgetData and map villageName
                const processedData = waterBudgetData.map((feature) => {
                    const villageid = feature.properties.villageid;
                    return {
                        division: feature.properties.division || "Unknown Division",
                        district: feature.properties.district || "Unknown District",
                        taluka: feature.properties.taluka || "Unknown Taluka",
                        villagename: villageidToNameMap[villageid] || "Unknown Village",
                        waterBudgetCount: 1, // Each feature represents one count
                    };
                });
    
                console.log("Processed Data:", processedData); // Debugging
    
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

    const normalize = (str: string | null) => str?.trim().toLowerCase();

    const filteredData = geoData.filter((feature) => {
        const { district, taluka } = feature;
        const isInDivision =
            selectedDivision &&
            divisionData[selectedDivision]?.districts.includes(district);
        const isInDistrict = !selectedDistrict || district === selectedDistrict;
        const isInTaluka = !selectedTaluka || taluka === selectedTaluka;
    
        return (!selectedDivision || isInDivision) && isInDistrict && isInTaluka;
    });    

    const calculateTotals = (data: any[]) => {
        return data.reduce(
            (totals, row) => {
                totals.waterBudgetCount += row.waterBudgetCount || 0;
                return totals;
            },
            { waterBudgetCount: 0 }
        );
    };

    const handleExport = () => {
        const summarizedData = geoData;
        const totals = calculateTotals(summarizedData);

        // Append totals as the last row
        const dataWithTotals = [
            ...summarizedData,
            {
                division: "Total",
                district: "",
                taluka: "",
                villagename: "",
                waterBudgetCount: totals.waterBudgetCount,
            },
        ];

        exportToExcel({
            data: dataWithTotals,
            columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })),
            fileName: "VillageWaterBudget.xlsx",
            sheetName: "Village Water Budget",
            tableTitle: "Village Water Budget Data",
        });
    };

    const columns = [
        { title: "District", dataIndex: "district", key: "district", className: "center" },
        { title: "Taluka", dataIndex: "taluka", key: "taluka", className: "center" },
        { title: "Village Name", dataIndex: "villagename", key: "villagename", className: "center" },
        {
            title: "Water Budget Count",
            dataIndex: "waterBudgetCount",
            key: "waterBudgetCount",
            className: "center",
        },
    ];

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
                                    Report Output
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

export default VillageWaterBudget;
