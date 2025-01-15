import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import * as echarts from "echarts";
import * as XLSX from "xlsx";
import { fetchGeoData } from "../../Data/useGeoData";

// eslint-disable-next-line react/prop-types
const ByTaluka = ({ linkedData }) => {
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

  // Filter data by the selected district
  const getFilteredData = () => {
    if (!linkedData || !linkedData.taluka) {
      return []; // Return empty if no district is selected
    }
    return geoData.filter(
      (feature) =>
        feature.properties.district === linkedData.taluka // Match district name with clicked district
    );
  };

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

  // Export filtered talukas with total counts to Excel
  const handleExport = () => {
    const filteredData = getFilteredData();
    if (!filteredData || filteredData.length === 0) {
      console.error("No data available to export");
      return;
    }

    const talukaMap = filteredData.reduce((acc, feature) => {
      const taluka = feature.properties.taluka || "Unknown Taluka";
      acc[taluka] = (acc[taluka] || 0) + 1; // Count works for each taluka
      return acc;
    }, {});

    const exportData = Object.entries(talukaMap).map(([taluka, count]) => ({
      Taluka: taluka,
      WorksCount: count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Taluka Data");

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}T${String(
      now.getHours()
    ).padStart(2, "0")}-${String(now.getMinutes()).padStart(
      2,
      "0"
    )}-${String(now.getSeconds()).padStart(2, "0")}`;

    const fileName = `TalukaData_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  useEffect(() => {
    const filteredData = getFilteredData();
    if (!filteredData || filteredData.length === 0) {
      return;
    }

    const { talukas, counts } = getBarChartData(filteredData);

    if (barChartRef.current) {
      const barChart = echarts.init(barChartRef.current);

      const barChartOption = {
        title: {
          text: `Works Count by Taluka in ${linkedData?.taluka || "District"}`,
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
            rotate: 45,
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
              color: "#90EE90",
            },
            label: {
              show: true,
              position: 'top', 
            }
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
  }, [geoData, linkedData]);

  // Render UI based on whether a district is selected
  if (!linkedData || !linkedData.taluka) {
    return (
      <div
        style={{
          width: "100%",
          height: "40vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "18px",
          color: "#666",
          textAlign: "center",
        }}
      >
        Select a District to View Taluka Stats
      </div>
    );
  }

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
      <div ref={barChartRef} style={{ width: "100vw", height: "40vh" }}></div>
    </div>
  );
};
ByTaluka.propTypes = {
  linkedData: PropTypes.shape({
    taluka: PropTypes.string,
  }),
};

export default ByTaluka;
