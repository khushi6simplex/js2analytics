import { useEffect, useState } from "react"
import { useAppSelector } from "../Redux/store/store"
import { useNavigate } from "react-router-dom"
import { Layout, Space } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import Dashboard from "./Dashboard";
import React from "react";
const layoutStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
};
const contentStyle: React.CSSProperties = {
    flex: "1 1 auto",
    backgroundColor: "white",
    overflow: "hidden",
};
const RDashBoard = () => {
    const [download, setDownLoad] = useState()
    const navigation = useNavigate()
    const { userInfo, } = useAppSelector(state => state.reveloUserInfo)
    useEffect(() => {
        if (!userInfo.status) {
            navigation('/')
        }
    }, [])
    const headerStyle: React.CSSProperties = {
        flex: "0 0 5%",
        paddingInline: 0,
        background: userInfo.userInfo.customerInfo.customerUXInfo.colors.primaryColor,
        position: 'fixed',
        top: 0,
        width: "100%",
        left: 0
    };
    return (
        <>
            <Space direction="vertical" style={{ width: '100%' }} size={[0, 48]} ref={download}>
                <Layout style={layoutStyle} >
                    <Content style={contentStyle}>
                        <Dashboard />
                    </Content>
                </Layout>
            </Space>
        </>
    )
}
export default RDashBoard