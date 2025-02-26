import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Space, Spin } from "antd";
import { Content } from "antd/es/layout/layout";
import { useAppSelector } from "./Redux/store/store";
import Dashboard from "./Dashboard/Dashboard";
import "./App.css";
import axios from "axios";
import { CSSProperties } from "react";

declare global {
    interface Window {
        __analytics__: {
            serverUrl?: string;
            securityUrl?: string;
            logoutUrl?: string;
            baseUrl?: string;
            dataUrl?: string;
            wbUrl?: string;
            talukasMap?: string;
            attachmentsInfoUrl?: string;
        };
    }
}

const layoutStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
};

const contentStyle = {
    flex: "1 1 auto",
    backgroundColor: "white",
    overflow: "hidden",
};

const App = () => {
    const navigation = useNavigate();
    const { userInfo } = useAppSelector((state) => state.reveloUserInfo);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userJurisdiction, setUserJurisdiction] = useState<{ state?: any; district?: any; taluka?: any }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initApp = async () => {
            await fetchConfig();
            await fetchUserInfo();
        };

        initApp();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch("../analytics/services.json");
            const config = await response.json();

            // Set all URLs to global window object
            window.__analytics__ = {
                serverUrl: config.serverUrl,
                securityUrl: config.securityUrl,
                logoutUrl: config.logoutUrl,
                baseUrl: config.baseUrl,
                dataUrl: config.dataUrl,
                wbUrl: config.wbUrl,
                talukasMap: config.talukasMap,
                attachmentsInfoUrl: config.attachmentsInfoUrl
            };

            console.log("All services configured:", window.__analytics__);
        } catch (error) {
            console.error("Failed to fetch config:", error);
        }
    };

    const fetchPrincipalEndpoint = () => {
        if (!window.__analytics__?.serverUrl) {
            console.error("API URL not loaded yet");
            return;
        }
        return axios.get(
            `${window.__analytics__.serverUrl}/access/principal/web?callback=cbk`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("keycloakToken")}`,
                },
            }
        );
    };

    const fetchUserInfo = async () => {
        try {
            const response = await fetchPrincipalEndpoint();

            if (response?.data.startsWith("cbk(")) {
                let data = response.data.substring(5, response.data.length - 2);
                data = data.replace(/\\/g, "");
                data = JSON.parse(data);

                console.log("Parsed Data:", data);

                const userInfo = data?.userInfo ?? null;
                const userRole = userInfo.role ?? null;
                const jurisdictionFilters = userInfo.jurisdictionFilters ?? null;

                setUserRole(userRole);

                let filteredJurisdiction: { state?: any; district?: any; taluka?: any } = {};
                if (userRole === 'jsstate') {
                    filteredJurisdiction = { state: jurisdictionFilters.state };
                } else if (userRole === 'jsdistrict') {
                    filteredJurisdiction = { district: jurisdictionFilters.district };
                } else if (userRole === 'jstaluka') {
                    filteredJurisdiction = { taluka: jurisdictionFilters.taluka };
                }

                setUserJurisdiction(filteredJurisdiction);
                console.log(userRole, filteredJurisdiction);
            } else {
                console.error("Invalid authorization, please login.");
                throw new Error("Invalid authorization, please login.");
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching user info:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Space direction="vertical" style={{ paddingTop: "6vh" }} size={[0, 48]}>
            <Layout style={layoutStyle}>
                <Content style={contentStyle}>
                    {userRole && userJurisdiction && (
                        <Dashboard userRole={userRole} jurisdictionFilters={userJurisdiction} />
                    )}
                </Content>
            </Layout>
        </Space>
    );
};

export default App;