import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";

const Chart1 = () => {
  const [jsonData, setJsonData] = useState(null);
  const workStartedChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataUrl = window.__analytics__.works; // Replace this with your actual data URL if needed
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
    const talukaData = data
      .filter(
        (hit) =>
          hit._source.jurisdictionType === "taluka" &&
          hit._source.workcount > 0
      )
      .map((hit) => ({
        name: hit._source.jurisdictionName,
        value: hit._source.workcount,
      }));

    return talukaData.length > 0
      ? talukaData
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
    <div>
      <div ref={workStartedChartRef} style={{ width: "100%", height: "40vh" }}></div>
    </div>
  );
};

export default Chart1;
