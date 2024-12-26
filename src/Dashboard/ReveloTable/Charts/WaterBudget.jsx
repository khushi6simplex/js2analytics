import { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";

const WaterBudget = () => {
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

  const getWorkStartedData = (data) => {
    const jurisdictionsWithWorkStarted = data.filter(
      (hit) => hit._source.countofwaterbudgets > 0
    );

    const jurisdictionCounts = {
      districts: 0,
      talukas: 0,
    };

    jurisdictionsWithWorkStarted.forEach((hit) => {
      if (hit._source.jurisdictionType === "district") {
        jurisdictionCounts.districts += 1;
      } else if (hit._source.jurisdictionType === "taluka") {
        jurisdictionCounts.talukas += 1;
      }
    });

    return jurisdictionCounts;
  };

  useEffect(() => {
    if (!jsonData || !jsonData.hits?.hits) {
      return;
    }

    const workStarted = getWorkStartedData(jsonData.hits.hits);
    const workStartedChartData = [
      { name: "Districts with Work Started", value: workStarted.districts },
      { name: "Talukas with Work Started", value: workStarted.talukas },
    ];

    if (workStartedChartRef.current) {
      const workStartedChart = echarts.init(workStartedChartRef.current);

      const workStartedOption = {
        title: {
          text: "Work Started Overview",
          left: "center",
        },
        tooltip: {
          trigger: "item",
        },
        legend: {
          orient: "vertical",
          left: "left",
        },
        series: [
          {
            name: "Work Started",
            type: "pie",
            radius: "50%",
            data: workStartedChartData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      };

      workStartedChart.setOption(workStartedOption);

      const handleResize = () => {
        workStartedChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        workStartedChart.dispose();
      };
    }
  }, [jsonData]);

  return (
    <div>
      <div ref={workStartedChartRef} style={{ width: "100%", height: "400px" }}></div>
    </div>
  );
};

export default WaterBudget;
