import React, { useState, useEffect } from "react";
import { Spin, Typography } from "antd";

const { Text } = Typography;

export const LoadingComponent = ({ loading }) => {
    const [message, setMessage] = useState("");
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (loading) {
            const steps = [
                "Connecting to the engine...",
                "Matching relevant results...",
                "Thinking and summarizing..."
            ];

            let stepIndex = 0;
            const interval = setInterval(() => {
                if (stepIndex < steps.length) {
                    setMessage(steps[stepIndex]);
                    setStep(stepIndex + 1);
                    stepIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 3000); // 每3秒更新一次信息

            return () => clearInterval(interval); // 清除定时器
        } else {
            setMessage(""); // 结束loading时清空消息
        }
    }, [loading]);

    return (
        loading && (
            <div style={{ textAlign: "center", marginTop: 25, marginBottom: 20 }}>
                <Spin size="large" style={{ marginBottom: 10 }} />
                <Text style={{ display: "block", marginTop: "1vw", opacity: 0.6 }}>
                    {message || "Preview version takes about 30 seconds to get results"}
                </Text>
            </div>
        )
    );
};
