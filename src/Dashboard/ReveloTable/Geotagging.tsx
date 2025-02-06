import React, { useState, useEffect, version } from "react";
import { Table, Row, Col, Spin, Empty, Button, Typography, Divider, Flex, Input } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction"; // Importing Jurisdictions
import divisionData from "../division.json";
import { exportToExcel } from "../Excel/Excel";
import "../Dashboard.css";
import axios from "axios";

interface GoetaggingProps {
    resetTrigger: boolean;
    userRole: string;
    jurisdictionFilters: any;
}

const Goetagging: React.FC<GoetaggingProps> = ({resetTrigger, userRole, jurisdictionFilters}) => {
    const [geoData, setGeoData] = useState<any[]>([]); // Final processed data
    const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(12);
    const [ searchTerm, setSearchTerm ] = useState( "" );  

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const url = (window as any).__analytics__.wbUrl;
                const attachmentsInfoUrlTemplate = (window as any).__analytics__.attachmentsInfoUrl;

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
                        subplan.properties.subPlanId,
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

                // Utility function to convert date format
                const formatDate = (dateString: string): string => {
                    if (!dateString || dateString === "N/A") return dateString;
                    const date = new Date(dateString);
                    const day = String(date.getUTCDate()).padStart(2, "0");
                    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
                    const year = date.getUTCFullYear();
                    return `${day}-${month}-${year}`;
                };


                // Process works and enrich with village name and other details
                const processedData = await Promise.all(works.map(async (work) => {
                    const workid = work.properties.workid;
                    const subplanid = work.properties.subplanid;
                    const villageid = subplanToVillageMap.get(subplanid);
                    const villagename = villageIdToNameMap.get(villageid) || "Unknown Village";

                    // Fetch attachments for this workid
                    const attachmentsInfoUrl = attachmentsInfoUrlTemplate.replace("{{workid}}", workid);
                    let startThumbnail = "N/A";
                    let progressThumbnail = "N/A";
                    let completionThumbnail = "N/A";

                    try {
                        const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJPR0RIb3AtazUtTTZ6M3JxU0dVRkRkazcwb2ptYlVBYjNGbC1PbDlUT2lVIn0.eyJleHAiOjE3Mzk5Mzg5NDQsImlhdCI6MTczNzM0Njk0NCwianRpIjoiNTdlYTMwYTItNzU3ZS00YTVlLWE3YWYtMjEwMWM0NDdlZWI5IiwiaXNzIjoiaHR0cDovLzEwMy4yNDkuOTguMTc3OjEwMDEvYXV0aC9yZWFsbXMvamFseXVrdGFzaGl2YXIiLCJhdWQiOlsianMyIiwiYWNjb3VudCIsInJldmVsbzM1Il0sInN1YiI6IjQ4NGYxNzc3LTg3MzktNGVkZC04NzM2LTdkZWJlZDNjODA2NSIsInR5cCI6IkJlYXJlciIsImF6cCI6InJldmVsb2FkbWluMzUiLCJzZXNzaW9uX3N0YXRlIjoiZTQxNmNhZTItNjA3My00ZGQwLThjMTYtNGNlOTE3YzI2ZTdlIiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJqc3N0YXRlIiwib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLWphbHl1a3Rhc2hpdmFyIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJqczIiOnsicm9sZXMiOlsianNzdGF0ZSJdfSwicmV2ZWxvYWRtaW4zNSI6eyJyb2xlcyI6WyJqc3N0YXRlIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sInJldmVsbzM1Ijp7InJvbGVzIjpbImpzc3RhdGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkpTIFN0YXRlIFVzZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqc3N0YXRldXNlciIsImdpdmVuX25hbWUiOiJKUyBTdGF0ZSIsImZhbWlseV9uYW1lIjoiVXNlciIsImVtYWlsIjoianNzdGF0ZXVzZXJAZ21haWwuY29tIn0.MUxt9QejU1UMltO5kCt0l5NZeBYWkC8QzQpo9_mZgNacsPtHN52gXh9rjwiLsMiCR4BbErwBvql09cwAbcHQO3wwSew8mTrgxJMKuVcJFaCU5Iiuvcw1kTc2hSI4fyGlq6bdNwNgdE5oCLqTfGZbfs77ZXqVTBhdEhBkpmUMn86I1N831iW88vxYwCqPdCBgL7IQz9K9GNYkrX3EYcpFWQo4kT83CSZ6G_Jfvy_mAdD4MceOJlDSg6DKWGbNSnuXgVWzDzhNiqBs7aIh944KzPyhEygfHJ5oUjgnKbRVxfVt8SuP7736QHmkIcXH4kzPW5Xx_vNanZmrWFIhXdHI0Q";
                        const attachmentsResponse = await axios.get(attachmentsInfoUrl, {headers: {Authorization: `Bearer ${token}`}});
                        const attachments = attachmentsResponse.data.features || [];

                        // Find thumbnails for specific captions
                        startThumbnail = attachments.find((a) => a.properties.caption === "Work Started")?.properties.thumbnail || "N/A";
                        progressThumbnail = attachments.find((a) => a.properties.caption === "Work In Progress")?.properties.thumbnail || "N/A";
                        completionThumbnail = attachments.find((a) => a.properties.caption === "Work Completed")?.properties.thumbnail || "N/A";
                    } catch (error) {
                        console.warn(`Error fetching attachments for workid ${workid}:`, error);
                    }

                    return {
                        workid: work.properties.workid,
                        villagename,
                        worktype: work.properties.worktype || "Unknown",
                        deptName: work.properties.deptName || "Unknown",
                        workstartdate: formatDate(work.properties.workstartdate),
                        startThumbnail,
                        progressThumbnail,
                        wocompletiondate: formatDate(work.properties.wocompletiondate),
                        completionThumbnail,
                    };
                }));


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
    if (resetTrigger && userRole === "jsstate") {
      setSelectedDivision(null);
      setSelectedDistrict(null);
      setSelectedTaluka(null);
    } else if (resetTrigger && userRole === "jsdistrict") {
      setSelectedTaluka(null);
    }
  }, [resetTrigger, userRole]);
  
      const parseDistrictFromFilters = (filterInput: any): string | null => {
        const filterString = typeof filterInput === "string" ? filterInput : JSON.stringify(filterInput);
        const match = filterString.match(/district='([^']+)'/);
        return match ? match[1] : null;
      };
    
      const parseTalukaFromFilters = (filterInput: any): string | null => {
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

    // Filter data based on selected filters and search term
    const filteredData = geoData.filter((item) => {
        const matchesDivision =
            !selectedDivision || divisionData[selectedDivision]?.districts.includes(item.district);
        const matchesDistrict = !selectedDistrict || item.district === selectedDistrict;
        const matchesTaluka = !selectedTaluka || item.taluka === selectedTaluka;
    
        const matchesSearch = Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
    
        return matchesDivision && matchesDistrict && matchesTaluka && matchesSearch;
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
            columns: columns.flatMap(column => column.children ? column.children.map(({ title, dataIndex }) => ({ title, dataIndex: dataIndex || "" })) : []),
            fileName: "Geotagging.xlsx",
            sheetName: "Geotagging",
            tableTitle: "Geotagging",
        });
    };

    // Utility function to convert date format
    const formatDate = (dateString: string): string => {
        if (!dateString || dateString === "N/A") return dateString;
        const date = new Date(dateString);
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;
    };

    const columns = [
        {
            title: "Start of Work",
            align: "center" as "center",
            children: [
                {
                    title: "Work ID",
                    dataIndex: "workid",
                    key: "workid",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                },
                {
                    title: "Village",
                    dataIndex: "villagename",
                    key: "villagename",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis,
                    sorter: (a, b) => a.villagename.localeCompare(b.villagename), defaultSortOrder: "ascend"
                },
                {
                    title: "Work Type",
                    dataIndex: "worktype",
                    key: "worktype",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    sorter: (a, b) => a.worktype.localeCompare(b.worktype)
                },
                {
                    title: "Department Name",
                    dataIndex: "deptName",
                    key: "deptName",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    sorter: (a, b) => a.deptName.localeCompare(b.deptName)
                },
                {
                    title: "Date",
                    dataIndex: "workstartdate",
                    key: "workstartdate",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    sorter: (a, b) => a.workstartdate.localeCompare(b.workstartdate)
                },
                {
                    title: "Image",
                    dataIndex: "startThumbnail",
                    key: "startThumbnail",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    render: (thumbnail) => thumbnail !== "N/A" ? <img src={thumbnail} alt="Start of Work" width="50" /> : "N/A",
                },
            ],
        },
        {
            title: "Work In Progress",
            align: "center" as "center",
            children: [
                {
                    title: "Date",
                    dataIndex: "workstartdate",
                    key: "workstartdate",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    sorter: (a, b) => a.workstartdate.localeCompare(b.workstartdate)
                },
                {
                    title: "Image",
                    dataIndex: "progressThumbnail",
                    key: "progressThumbnail",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    render: (thumbnail) => thumbnail !== "N/A" ? <img src={thumbnail} alt="Work In Progress" width="50" /> : "N/A",
                },
            ],
        },
        {
            title: "Work Completion",
            align: "center" as "center",
            children: [
                {
                    title: "Date",
                    dataIndex: "wocompletiondate",
                    key: "wocompletiondate",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    sorter: (a, b) => a.wocompletiondate.localeCompare(b.wocompletiondate)
                },
                {
                    title: "Image",
                    dataIndex: "completionThumbnail",
                    key: "completionThumbnail",
                    align: "center" as "center",
                    width: "5vw",
                    ellipsis: true, // Enable ellipsis
                    render: (thumbnail) => thumbnail !== "N/A" ? <img src={thumbnail} alt="Work Completion" width="50" /> : "N/A",
                },
            ],
        },
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
                                onItemClick={userRole === 'jsdistrict' || userRole === 'jstaluka' ? () => { } : handleDistrictClick}
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
                                onItemClick={userRole === 'jsdistrict' || userRole === 'jstaluka' ? () => { } : handleDistrictClick}
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
                                onItemClick={userRole === 'jstaluka' ? () => { } : handleTalukaClick}
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
                                    Total Records {`${Math.min(currentPage * pageSize, filteredData.length)} / ${filteredData.length}`}
                                </Typography.Text>
                                <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: "10px", width: "200px", marginRight: "-500px" }}
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
