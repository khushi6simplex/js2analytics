import { Card, Flex } from 'antd';
import Chart2 from './Charts/Chart2';
import Chart1 from './Charts/Chart1';

const Overview = () => {
  return (
    <>
        <Flex>
            <Card style={{height: "40vh", width: "40vw", margin: "5px", border: "1px solid"}}>
              <Chart2 />
            </Card>
            <Card style={{height: "40vh", width: "40vw", margin: "5px", border: "1px solid"}}>
              <Chart1 />
            </Card>
        </Flex>
    </>
  )
}

export default Overview