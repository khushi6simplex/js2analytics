import { useState } from "react";
import { Card } from "antd";
import ByDistrict from "./Charts/ByDistrict";
import ByTaluka from "./Charts/ByTaluka";

const Summary = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Callback function to handle the selected district from ByDistrict
  const handleDistrictClick = (clickedDistrict) => {
    setSelectedDistrict({ taluka: clickedDistrict });
  };

  return (
    <div>
      {/* ByDistrict Card */}
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
        {/* Pass the callback to handle district click */}
        <ByDistrict onBarClick={handleDistrictClick} />
      </Card>

      {/* ByTaluka Card */}
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
        {/* Pass the selected district to ByTaluka */}
        <ByTaluka linkedData={selectedDistrict} />
      </Card>
    </div>
  );
};

export default Summary;
