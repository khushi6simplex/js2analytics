import PropTypes from "prop-types";
import { List, Typography, Space } from "antd";

const Jurisdiction = ({ title, data, selectedItem, onItemClick, placeholder }) => {

  const sortedData = data.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return (
    <>
    <Space direction="vertical" style={{width: "9vw",padding:"2px"}}>
      <Typography.Text style={{fontSize:"18px",fontWeight:"400"}}>{title}</Typography.Text>
      {sortedData && sortedData.length > 0 ? (
        <List
          // bordered
          dataSource={sortedData}
          style={{border:"1px solid #dfe6e9", borderRadius: "0px"}}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: selectedItem === item ? "#dfe6e9" : "white",
                cursor: "pointer",
                padding: "10px",
               
                
              }}
              onClick={() => onItemClick(item)}
            >
              <Typography.Text style={{ fontSize: "12px" }}>{item}</Typography.Text>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text>{placeholder}</Typography.Text>
      )}
    </Space>
    </>
  );
};

Jurisdiction.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.string),
  selectedItem: PropTypes.string,
  onItemClick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

Jurisdiction.defaultProps = {
  data: [],
  selectedItem: null,
  placeholder: "No data available",
};

export default Jurisdiction;