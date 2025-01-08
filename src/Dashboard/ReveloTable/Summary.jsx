import { Card } from "antd";
import Chart2 from "./Charts/Chart2";
import Chart1 from "./Charts/Chart1";

const Summary = () => {
  return (
    <div>
      <Card
        style={{
          height: "40vh",
          width: "85vw",
          margin: "10px 0px",
          border: "1px solid",
          display: "flex", // Ensures child components can stretch fully
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Chart2 />
      </Card>
      <Card
        style={{
          height: "40vh",
          width: "85vw",
          border: "1px solid",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Chart1 />
      </Card>
    </div>
  );
};

export default Summary;