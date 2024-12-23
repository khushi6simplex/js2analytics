import PropTypes from "prop-types";
import { List, Typography, Space } from "antd";

const Jurisdiction = ({ title, data, selectedItem, onItemClick, placeholder }) => {
  return (
    <Space direction="vertical" style={{width: "9vw"}}>
      <Typography.Text style={{fontSize:"18px",fontWeight:"400"}}>{title}</Typography.Text>
      {data && data.length > 0 ? (
        <List
          bordered
          dataSource={data}
          style={{ width: "8.5vw"}}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: selectedItem === item ? "#dfe6e9" : "white",
                cursor: "pointer",
                padding: "10px",
                width: "8.35vw",
                borderRadius: "8px"
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