import React from "react";
import { Modal, Button, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export const UserGuidelineModal = ({ visible, onClose }) => {
    return (
        <Modal
            title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Title level={4} style={{ margin: 0, color: "#000", fontSize: "24px", fontWeight: "700" }}>
                        User Guidelines
                    </Title>
                    <CloseOutlined onClick={onClose} style={{ cursor: "pointer", background: "#F1F2F5", borderRadius: "50%", padding: "8px" }} />
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={800}
            closable={false}
            style={{ overflow: "auto", maxHeight: "75vh", zIndex: 10 }}
        >
            <div>
                <Text style={{ fontSize: "14px" }}>
                    Welcome to SCAICH, a cutting-edge academic search engine powered by the Sci-Hub database. To get started and enjoy our features:
                </Text>

                <div style={{ marginTop: "24px" }}>
                    <Title level={5}>Privacy</Title>
                    <Paragraph>
                        We value your privacy. Our website will never store or track your information in any way.
                    </Paragraph>

                    <Title level={5}>Basic Usage</Title>
                    <Paragraph>
                        Simply enter your query in the search bar and click the button on the right to see the results.
                    </Paragraph>

                    <Title level={5}>Assistant</Title>
                    <Paragraph>
                        We’ve integrated an LLM model to help you better understand your query. The based model can be switch between Deepseek© and ChatGPT© Automatically.
                    </Paragraph>

                    <Title level={5}>History</Title>
                    <Paragraph>
                        Access your search history by clicking the top-left button. You can also download your search results as images by using the download button on the right.
                    </Paragraph>

                    <Title level={5}>Support</Title>
                    <Paragraph>
                        Join our Telegram group at{" "}
                        <a href="https://t.me/WTFDeSci" target="_blank" rel="noopener noreferrer">
                            t.me/WTFDeSci
                        </a>
                        and get any help you encounter during the usage.
                    </Paragraph>

                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                    <Button
                        type="primary"
                        danger
                        onClick={onClose}
                        style={{
                            height: "36px",
                            borderRadius: "8px",
                            fontSize: "16px",
                            fontWeight: "600",
                        }}
                    >
                        Got It!
                    </Button>
                </div>
            </div>
        </Modal>
    );
};