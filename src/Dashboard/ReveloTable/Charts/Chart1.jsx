import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { fetchGeoData } from "../../Data/useGeoData"; // Assuming fetchGeoData is similar to ReveloTable

const Chart1 = () => {
  const [geoData, setGeoData] = useState([]);
  const workStartedChartRef = useRef(null);

  // Fetch data from GeoServer
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchGeoData();
        setGeoData(data.features || []);
      } catch (error) {
        console.error("Error fetching GeoServer data:", error);
      }
    };

    fetchData();
  }, []);

  // Extract distinct talukas and calculate total work counts
  const getTreeMapData = (data) => {
    if (!data || data.length === 0) {
      return [{ name: "No Data Available", value: 1 }];
    }

    // Summarize data by taluka
    const talukaMap = data.reduce((acc, feature) => {
      const taluka = feature.properties.taluka || "Unknown Taluka";
      acc[taluka] = (acc[taluka] || 0) + 1; // Count works for each taluka
      return acc;
    }, {});

    // Convert to array format suitable for TreeMap
    return Object.entries(talukaMap).map(([name, value]) => ({ name, value }));
  };

  // Initialize and update the TreeMap chart
  useEffect(() => {
    if (!geoData.length) return;

    const treeMapData = getTreeMapData(geoData);

    if (workStartedChartRef.current) {
      const treeMapChart = echarts.init(workStartedChartRef.current);

      const treeMapOption = {
        title: {
          text: "Works Started by Taluka",
          left: "center",
        },
        tooltip: {
          formatter: (info) => {
            const value = info.value || 0;
            return `${info.name}: ${value}`;
          },
        },
        legend: { show: false },
        series: [
          {
            type: "treemap",
            data: treeMapData,
            label: {
              show: true,
              formatter: "{b}",
            },
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
            },
            breadcrumb: { show: false },
          },
        ],
      };

      treeMapChart.setOption(treeMapOption);

      const handleResize = () => {
        treeMapChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        treeMapChart.dispose();
      };
    }
  }, [geoData]);

  return (
    <div>
      <div ref={workStartedChartRef} style={{ width: "100%", height: "40vh" }}></div>
    </div>
  );
};

export default Chart1;
