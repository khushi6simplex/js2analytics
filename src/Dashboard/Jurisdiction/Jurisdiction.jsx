import PropTypes from "prop-types";
import { List, Typography, Space } from "antd";

const Jurisdiction = ({ title, data, selectedItem, onItemClick, placeholder }) => {
  return (
    <Space direction="vertical">
      <Typography.Title level={5}>{title}</Typography.Title>
      {data && data.length > 0 ? (
        <List
          bordered
          dataSource={data}
          style={{ width: "180px" }}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: selectedItem === item ? "#dfe6e9" : "white",
                cursor: "pointer",
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