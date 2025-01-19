import React, { useState, useEffect, version } from "react";
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
    
                // Fetch project village and water budget data
                const [projectVillageResponse, waterBudgetResponse, villagePlanResponse] = await Promise.all([
                    axios.get(url, {
                        params: {
                            service: "WFS",
                            version: "1.0.0",
                            request: "GetFeature",
                            typeName: "js2surveydsws:projectvillage_js2project",
                            outputFormat: "json",
                            srsname: "EPSG:3857",
                            CQL_FILTER: "isselected=true", // Server-side filter for 'isselected=true'
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
                    })
                ]);
    
                // Extract features from the responses
                const projectVillageData = projectVillageResponse.data.features || [];
                const waterBudgetData = waterBudgetResponse.data.features || [];
                const villagePlanData = villagePlanResponse.data.features || [];
    
                // Create a set of village IDs from the water budget data
                const waterBudgetVillageIds = new Set(
                    waterBudgetData.map((feature) => feature.properties.villageid)
                );

                const villagePlanVillageIds = new Set(
                    villagePlanData.map((feature) => feature.properties.villageid)
                );
    
                // Process project village data and check if water budget and sub plan exists for each village
                const processedData = projectVillageData.map((feature) => {
                    const villageid = feature.properties.villageid;
                    const villagename = feature.properties.villagename || "Unknown Village";
    
                    return {
                        division: feature.properties.division || "Unknown Division",
                        district: feature.properties.district || "Unknown District",
                        taluka: feature.properties.taluka || "Unknown Taluka",
                        villagename,
                        waterBudgetPresent: waterBudgetVillageIds.has(villageid) ? "Yes" : "No", // Check if water budget exists
                        villagePlanPresent: villagePlanVillageIds.has(villageid) ? "Yes" : "No", // Check if sub plan exists
                    };
                });
    
                // Update state with processed data
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
            columns: columns.map(({ title, dataIndex }) => ({ title, dataIndex })),
            fileName: "VillageWiseWaterBudget.xlsx",
            sheetName: "Village Wise Water Budget",
            tableTitle: "Village Wise Water Budget Data",
        });
    };

    const columns = [
        { title: "District", dataIndex: "district", key: "district", className: "center", sorter: (a, b) => a.district.localeCompare(b.district), defaultSortOrder: "ascend" as const },
        { title: "Taluka", dataIndex: "taluka", key: "taluka", className: "center", sorter: (a, b) => a.taluka.localeCompare(b.taluka), defaultSortOrder: "ascend" as const },
        { title: "Village", dataIndex: "villagename", key: "villagename", className: "center", sorter: (a, b) => a.villagename.localeCompare(b.villagename), defaultSortOrder: "ascend" as const },
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
                                summary={() => {
                                    const totals = calculateTotals(filteredData);
                                    return (
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={3}>
                                            <div style={{ textAlign: "center", fontWeight: "bolder"}}>Total</div>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1}>
                                                <div style={{ textAlign: "center", fontWeight: "bolder"}}>{totals.waterBudgetYesCount}</div>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2}>
                                                <div style={{ textAlign: "center", fontWeight: "bolder"}}>{totals.villagePlanYesCount}</div>
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

export default VillageWaterBudget;
