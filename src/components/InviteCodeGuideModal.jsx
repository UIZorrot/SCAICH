import React from "react";
import { Modal, Button, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export const InviteCodeGuideModal = ({ visible, onClose }) => {
    return (
        <Modal
            title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Title level={4} style={{ margin: 0, color: "#000", fontSize: "24px", fontWeight: "700" }}>
                        How to Get an Invite Code
                    </Title>
                    <CloseOutlined
                        onClick={onClose}
                        style={{ cursor: "pointer", background: "#F1F2F5", borderRadius: "50%", padding: "8px" }}
                    />
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
                    To access SCAICH, you need an invite code. Below are the ways to obtain one:
                </Text>

                <div style={{ marginTop: "24px" }}>
                    <Title level={5}>Join Our Telegram Group</Title>
                    <Paragraph>
                        Join our Telegram group at{" "}
                        <a href="https://t.me/WTFDeSci" target="_blank" rel="noopener noreferrer">
                            t.me/WTFDeSci
                        </a>
                        . Once in the group, apply for an invite code in the SCAICH channel. Please provide a brief introduction of
                        yourself to confirm you are a real user.
                    </Paragraph>

                    <Title level={5}>Request via Email</Title>
                    <Paragraph>
                        Send an email to{" "}
                        <a href="mailto:scihubdaily@gmail.com?subject=Scaich Invite Code&body=Dear Admin,%0D%0AI am requesting an invite code for SCAICH. Here is a brief introduction:%0D%0A[Your Name]%0D%0A[Your Background/Identity]%0D%0AThank you!">
                            scihubdaily@gmail.com
                        </a> with the subject
                        line <Text strong>Scaich Invite Code</Text>. Include a brief: brief introduction of yourself in the email to verify your identity.
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