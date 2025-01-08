import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import * as XLSX from "xlsx";

const Chart2 = () => {
  const [jsonData, setJsonData] = useState(null);
  const workStartedChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataUrl = window.__analytics__.waterBudget;
        const query = JSON.stringify({
          query: { match_all: {} },
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
          hit._source.jurisdictionType === "district" &&
          hit._source.countofwaterbudgets > 0
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

    const exportData = jsonData.hits.hits.map((hit) => ({
      District: hit._source.jurisdictionName,
      WaterBudgets: hit._source.countofwaterbudgets,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Water Budgets");

    XLSX.writeFile(workbook, "WaterBudgets.xlsx");
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
  }, [jsonData]);

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

export default Chart2;
