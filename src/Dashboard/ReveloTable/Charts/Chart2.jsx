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

  const getTreeMapData = (data) => {
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
      : [{ name: "No Data Available", value: 1 }];
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

    const treeMapData = getTreeMapData(jsonData.hits.hits);

    if (workStartedChartRef.current) {
      const treeMapChart = echarts.init(workStartedChartRef.current);

      const treeMapOption = {
        title: {
          text: "Water Budgets Created by Districts",
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
  }, [jsonData]);

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

export default Chart2;
