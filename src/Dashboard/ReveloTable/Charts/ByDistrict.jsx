import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import * as XLSX from "xlsx";

// eslint-disable-next-line react/prop-types
const ByDistrict = ({ onBarClick }) => {
  const [jsonData, setJsonData] = useState(null);
  const workStartedChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataUrl = window.__analytics__.waterBudget;
        const query = JSON.stringify({
          query: {
            bool: {
              must: [
                { match: { jurisdictionType: "district" } }, // Only fetch data for districts
              ],
            },
          },
          size: 100,
        });

        const response = await fetch(dataUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: query,
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setJsonData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const getBarChartData = (data) => {
    const districtsWithWorkStarted = data
      .filter(
        (hit) =>
          hit._source.countofwaterbudgets > 0 // Include only districts with work started
      )
      .map((hit) => ({
        name: hit._source.jurisdictionName,
        value: hit._source.countofwaterbudgets,
      }));

    return districtsWithWorkStarted.length > 0
      ? districtsWithWorkStarted
      : [{ name: "No Data Available", value: 0 }];
  };

  const handleExport = () => {
    if (!jsonData || !jsonData.hits?.hits) {
      console.error("No data available to export");
      return;
    }
  
    // Filter data for districts only
    const districtData = jsonData.hits.hits.filter(
      (hit) => hit._source.jurisdictionType === "district"
    );
  
    if (districtData.length === 0) {
      console.error("No district data available to export");
      return;
    }
  
    const exportData = districtData.map((hit) => ({
      District: hit._source.jurisdictionName,
      WaterBudgets: hit._source.countofwaterbudgets,
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "District Water Budgets");
  
    // Generate a more readable timestamp
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}-${String(
      now.getMinutes()
    ).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
  
    const fileName = `DistrictWaterBudgets_${timestamp}.xlsx`;
  
    XLSX.writeFile(workbook, fileName);
  };
  

  useEffect(() => {
    if (!jsonData || !jsonData.hits?.hits) {
      return;
    }

    const barChartData = getBarChartData(jsonData.hits.hits);

    if (workStartedChartRef.current) {
      const barChart = echarts.init(workStartedChartRef.current);

      const barChartOption = {
        title: {
          text: "Water Budgets Created by Districts",
          left: "center",
          top: "10px",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        xAxis: {
          type: "category",
          data: barChartData.map((item) => item.name),
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
            name: "Water Budgets",
            type: "bar",
            data: barChartData.map((item) => item.value),
            itemStyle: {
              color: "#007bff",
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

      barChart.on("click", (params) => {
        if (onBarClick) {
          onBarClick(params.name); // Pass the clicked district name to the parent
        }
      });

      return () => {
        window.removeEventListener("resize", handleResize);
        barChart.dispose();
      };
    }
  }, [jsonData, onBarClick]);

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
        ref={workStartedChartRef}
        style={{ width: "100vw", height: "40vh" }}
      ></div>
    </div>
  );
};

export default ByDistrict;
