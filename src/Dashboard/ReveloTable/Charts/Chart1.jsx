import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import * as XLSX from "xlsx"; // Import XLSX for exporting data
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

  // Export distinct talukas with total counts to Excel
  const handleExport = () => {
    if (!geoData || geoData.length === 0) {
      console.error("No data available to export");
      return;
    }

    // Summarize data by taluka for Excel
    const talukaMap = geoData.reduce((acc, feature) => {
      const taluka = feature.properties.taluka || "Unknown Taluka";
      acc[taluka] = (acc[taluka] || 0) + 1;
      return acc;
    }, {});

    const exportData = Object.entries(talukaMap).map(([taluka, count]) => ({
      Taluka: taluka,
      TotalCount: count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Taluka Data");

    XLSX.writeFile(workbook, "TalukaData.xlsx");
  };

  // Initialize and update the TreeMap chart
  useEffect(() => {
    if (!geoData.length) return;

    const treeMapData = getTreeMapData(geoData);

    if (workStartedChartRef.current) {
      const treeMapChart = echarts.init(workStartedChartRef.current);

      const treeMapOption = {
        title: {
          text: "Work Started by Taluka",
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
            leafDepth: 1,
            label: {
              show: true,
              formatter: "{b}",
            },
            itemStyle: {
              borderColor: "#fff",
              borderWidth: 2,
            },
            breadcrumb: { show: false },
            nodeClick: "none", // Disable zooming on node click
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
    <div style={{ position: "relative" }}>
      {/* Export Button */}
      <button
        onClick={handleExport}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10, // Ensure it's on top
          padding: "5px 10px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Export as Excel
      </button>

      <div
        ref={workStartedChartRef}
        style={{ width: "100%", height: "40vh" }}
      ></div>
    </div>
  );
};

export default Chart1;
