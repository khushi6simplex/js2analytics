import React,{useState,useEffect} from 'react'
import { Table, Row, Col, Card, Flex,Spin, Empty,Tooltip,Tabs } from "antd";
import Jurisdictions from "../Jurisdiction/Jurisdiction";
import divisionData from "../division.json";
import  "../../Dashboard/Dashboard.css";
import { fetchGeoData } from "../Data/useGeoData";
import type { TabsProps } from 'antd';
import WorkData from "../../Dashboard/work.json"
import RepairWorks from "../../Dashboard/repairWorks.json"

function RepairWiseReport() {

const [loading, setLoading] = useState<boolean>(true);
const [geoData, setGeoData] = useState<any[]>([]);
const [selectedDivision, setSelectedDivision] = useState<any>();
const [reportValue, setReportsValue] = useState<any>();
const [selectedDistrict, setSelectedDistrict] = useState<any>();
const [selectedTaluka, setSelectedTaluka] = useState<any>();
const [currentPage, setCurrentPage] = useState<number>(1);
const [pageSize, setPageSize] = useState<number>(12);

     useEffect(() => {
            const fetchData = async () => {
              try {
                setLoading(true);
                const data = await fetchGeoData();
                setGeoData(data.features || []);
              } catch (error) {
                console.error("Error fetching Geoserver data", error);
              } finally {
                setLoading(false);
              }
            };
            fetchData();
          }, []);

          const handleDivisionClick = (division: string) => {
            setSelectedDivision(selectedDivision === division ? null : division);
            setSelectedDistrict(null);
            setSelectedTaluka(null);
            
          };
          const handleDistrictClick = (district: string) => {
            setSelectedDistrict(selectedDistrict === district ? null : district);
            setSelectedTaluka(null);
          };
          const handleTalukaClick = (taluka: string) => {
            setSelectedTaluka(selectedTaluka === taluka ? null : taluka);
          };
          const filteredFeatures = geoData.filter((feature) => {
            const { district, taluka } = feature.properties;
            const isInDivision =
              selectedDivision &&
              divisionData[selectedDivision]?.districts.includes(district);
            const isInDistrict = !selectedDistrict || district === selectedDistrict;
            const isInTaluka = !selectedTaluka || taluka === selectedTaluka;
            return (!selectedDivision || isInDivision) && isInDistrict && isInTaluka;
          });
          const columns = [
            {
              title: "#",
              dataIndex: "index",
              key: "index",
              width: "3%",
              render: (_: any, __: any, index: number) =>
                (currentPage - 1) * pageSize + index + 1, 
            },
            {
              title: "Work Type",
              dataIndex: "worktype",
              key: "worktype",
              width: "30%",
               sorter: (a, b) => a.worktype.localeCompare(b.worktype),
            },
            {
              title: "Work Count",
              dataIndex: "workcount",
              key: "workcount",
              width: "20%",
              sorter: (a, b) => a.workcount - b.workcount,
            },
            {
              title: "Estimated Cost",
              dataIndex: "workprice",
              key: "workprice",
              width: "20%",
              sorter: (a, b) => a.workprice - b.workprice,
            },
          ];

          const workTypes =
          reportValue && RepairWorks.values[reportValue]?.workType?.values
            ? Object.keys(RepairWorks.values[reportValue].workType.values)
            : [];
      
        const tableData = workTypes.map((worktype) => {
          const matchingFeatures = filteredFeatures.filter(
            (feature) => feature.properties.worktype === worktype
          );
          const workcount = matchingFeatures.length;
          const workprice = matchingFeatures.reduce(
            (sum, feature) => sum + (feature.properties.estimatedcost || 0),
            0
          );
      
          return {
            key: worktype,
            worktype,
            workcount,
            workprice,
          };
        });

            const items: TabsProps['items'] = Object.keys(RepairWorks.values).map((key) => ({
              key,
              label: key,
            }));
        
     const onChange = (item: string) => {
          console.log(item,"keysitem");
          setReportsValue(item === undefined ? "Drainage Line Treatment" : item);
      };

      useEffect(() => {
        setReportsValue("Drainage Line Treatment");
      }, []);

  return (
    <Flex  gap={50} wrap="nowrap" >
    <Row gutter={[17, 17]} style={{flexWrap: "nowrap"}}>
      <Col span={8.1} >
      <Row gutter={[10, 10]} style={{flexWrap: "nowrap"}}>
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
              ? divisionData[selectedDivision].districts
              : []
          }
          selectedItem={selectedDistrict}
          onItemClick={handleDistrictClick}
          placeholder="Select a Division"
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
                      .filter(
                        (feature) =>
                          feature.properties.district === selectedDistrict
                      )
                      .map((feature) => feature.properties.taluka)
                  )
                )
              : []
          }
          selectedItem={selectedTaluka}
          onItemClick={handleTalukaClick}
          placeholder="Select a District"
        />
        </Col>

      </Row>
      
      </Col>
      <Col span={16} >
      {loading ? (
          <Spin size="large" /> // Show loading spinner
        ) : geoData.length === 0 ? (
          <Empty description="No data available" /> // Show empty state
        ) : (
    <Flex vertical>
        <Tabs defaultActiveKey="1" items={items}  onChange={onChange}/>
  
        <Table
       columns={columns}
       style={{alignItems:"top"}}
       dataSource={ selectedDivision ? tableData : []}
       size="small"
       tableLayout="fixed"
       pagination={{
         pageSize: pageSize,
         showSizeChanger: false,
         total:0,
         onChange: (page, pageSize) => {
           setCurrentPage(page);
           setPageSize(pageSize);
         },
       }}
       scroll={{ x: "100%" }}
        bordered
     />
    </Flex>
    
    )}
       
   </Col>
      
    </Row>
  </Flex>
  )
}

export default RepairWiseReport