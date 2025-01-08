import { useState } from "react";
import ReveloTable from "./ReveloTable";

const Division = () => {
  // List of divisions
  const divisions = [ "Nagpur", "Mumbai", "Pune", "Nashik", "Aurangabad" ];

  // State to store the selected division
  const [ selectedDivision, setSelectedDivision ] = useState( "Nagpur" );

  // Handle click on a division
  const handleDivisionClick = ( division ) => {
    setSelectedDivision( division );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Divisions</h2>
      <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
        {divisions.map( ( division ) => (
          <div
            key={division}
            onClick={() => handleDivisionClick( division )}
            style={{
              padding: "10px",
              backgroundColor:
                selectedDivision === division ? "#74b9ff" : "#dfe6e9",
              border: "1px solid #ccc",
              borderRadius: "5px",
              textAlign: "center",
              cursor: "pointer",
              display: "flex",
              transition: "background-color 0.3s ease",
            }}
          >
            {division}
          </div>
        ) )}
      </div>
      {/* Pass the selected division to the ReveloTable */}
      <ReveloTable selectedDivision={selectedDivision} />
    </div>
  );
};

export default Division;
