import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";

const Chart2 = () => {
  const [jsonData, setJsonData] = useState(null);

  const workStartedChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataUrl = window.__analytics__.waterBudget;
        const response = await fetch(dataUrl);
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

  useEffect(() => {
    if (!jsonData || !jsonData.hits?.hits) {
      return;
    }

    const treeMapData = getTreeMapData(jsonData.hits.hits);

    if (workStartedChartRef.current) {
      const treeMapChart = echarts.init(workStartedChartRef.current);

      const treeMapOption = {
        title: {
          text: "Work Started in Districts",
          left: "center",
        },
        tooltip: {
          formatter: (info) => {
            const value = info.value || 0;
            return `${info.name}: ${value}`;
          },
        },
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
    <div>
      <div ref={workStartedChartRef} style={{ width: "100%", height: "400px" }}></div>
    </div>
  );
};

export default Chart2;
