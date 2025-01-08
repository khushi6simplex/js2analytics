import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import * as XLSX from "xlsx";
import { fetchGeoData } from "../../Data/useGeoData";

const Chart1 = () => {
  const [geoData, setGeoData] = useState([]);
  const barChartRef = useRef(null);

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
  const getBarChartData = (data) => {
    if (!data || data.length === 0) {
      return { talukas: ["No Data Available"], counts: [0] };
    }

    const talukaMap = data.reduce((acc, feature) => {
      const taluka = feature.properties.taluka || "Unknown Taluka";
      acc[taluka] = (acc[taluka] || 0) + 1; // Count works for each taluka
      return acc;
    }, {});

    const talukas = Object.keys(talukaMap);
    const counts = Object.values(talukaMap);

    return { talukas, counts };
  };

  // Export distinct talukas with total counts to Excel
  const handleExport = () => {
    if (!geoData || geoData.length === 0) {
      console.error("No data available to export");
      return;
    }

    const exportData = geoData.map((feature) => ({
      Taluka: feature.properties.taluka || "Unknown Taluka",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Taluka Data");

    XLSX.writeFile(workbook, "TalukaData.xlsx");
  };

  useEffect(() => {
    if (!geoData || geoData.length === 0) {
      return;
    }

    const { talukas, counts } = getBarChartData(geoData);

    if (barChartRef.current) {
      const barChart = echarts.init(barChartRef.current);

      const barChartOption = {
        title: {
          text: "Works Count by Taluka",
          left: "center",
          top: "10px",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        xAxis: {
          type: "category",
          data: talukas,
          axisLabel: {
            rotate: 45, // Rotate labels for better readability
            interval: 0,
          },
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Work Counts",
            type: "bar",
            data: counts,
            itemStyle: {
              color: "#90EE90", // Light green color
            },
          },
        ],
      };

      barChart.setOption(barChartOption);

      const handleResize = () => {
        barChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        barChart.dispose();
      };
    }
  }, [geoData]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <button
        onClick={handleExport}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          padding: "5px 10px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Export As Excel
      </button>
      <div
        ref={barChartRef}
        style={{ width: "100vw", height: "40vh" }}
      ></div>
    </div>
  );
};

export default Chart1;
