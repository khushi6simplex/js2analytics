import { Card, Flex } from 'antd';
import Chart2 from './Charts/Chart2';

const Overview = () => {
  return (
    <>
        <Flex>
            {/* <Card style={{height: "40vh", width: "40vw", margin: "10px", border: "1px solid"}}>
                <WaterBudget />
            </Card> */}
            <Card style={{height: "40vh", width: "40vw", margin: "10px", border: "1px solid"}}>
                <Chart2 />
            </Card>
        </Flex>
    </>
  )
}

export default Overview