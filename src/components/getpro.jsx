import React from "react";
import { Modal, Button, Typography, Tag } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, KeyOutlined, DollarOutlined } from "@ant-design/icons";

// 假设 logo_trans.png 在 public 文件夹中
const logoTrans = "/logo_trans.png";

const { Title, Paragraph, Text } = Typography;

export const SciHubModal = ({ visible, onClose, isPro, sciHubTokens = 0 }) => {
    const isMobile = window.innerWidth <= 768;

    const modalWidth = isMobile ? "90%" : 900;
    const cardContainerStyle = {
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // 桌面端横排，移动端竖排
        gap: isMobile ? "1rem" : "1.5rem",
        margin: "2rem 0",
    };

    const cardStyle = {
        flex: 1,
        background: "#fff",
        padding: isMobile ? "1rem" : "1.5rem",
        borderRadius: "8px",
        border: "1px solid #d9d9d9",
        textAlign: "left", // 文字居右
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        position: "relative", // 用于定位标签
    };

    const normalUserCardStyle = {
        ...cardStyle,
        border: "1px solid #d9d9d9", // 普通用户卡片灰色边框
    };

    const membershipCardStyle = {
        ...cardStyle,
        border: "2px solid #ff4d4f", // 突出 Membership 卡片，使用红色边框
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // 更强的阴影
    };

    const HighCardStyle = {
        ...cardStyle,
        border: "2px solid #333", // 突出 Membership 卡片，使用红色边框
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // 更强的阴影
    };

    const blurredCardStyle = {
        ...cardStyle,
        filter: "blur(2px)", // 模糊效果
        pointerEvents: "none", // 禁用交互
    };

    const iconStyle = {
        fontSize: isMobile ? "24px" : "32px",
        marginBottom: "0.5rem",
        color: "#ff4d4f", // 红色图标
    };

    const logoStyle = {
        width: isMobile ? "32px" : "40px", // 调整图片大小
        height: "auto",
        marginBottom: "0.5rem",
    };

    const textStyle = {
        fontSize: isMobile ? "14px" : "16px",
        display: "block",
        marginBottom: "0.5rem",
        color: "#1a1a1a",
    };

    const paragraphStyle = {
        margin: 0,
        color: "#595959",
        fontSize: isMobile ? "12px" : "14px",
        textAlign: "left", // 确保段落文字也居右
    };

    const buttonContainerStyle = {
        marginTop: "2rem",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: "0.5rem",
        justifyContent: "center",
    };

    const recommendedTagStyle = {
        position: "absolute",
        top: "-12px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#ff4d4f",
        color: "#fff",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "500",
    };


    const HighTagStyle = {
        position: "absolute",
        top: "-12px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#333",
        color: "#fff",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "500",
    };

    return (
        <>
            {isPro ? (
                <Modal
                    open={visible}
                    onCancel={onClose}
                    footer={null}
                    centered
                    width={modalWidth}
                    style={{ borderRadius: "12px", body: { boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" } }}
                >
                    <div style={{ textAlign: "center", padding: isMobile ? "1rem" : "1.5rem" }}>
                        <Title level={3} style={{ marginTop: "1rem", color: "#1a1a1a", fontSize: isMobile ? "20px" : "24px" }}>
                            <strong>Congratulations</strong>
                        </Title>
                        {/* You have successfully unlocked Professional Membership by holding 1,000 SciHub Tokens. */}
                        <Paragraph style={{ fontSize: isMobile ? "14px" : "16px", color: "#595959" }}>
                            You have successfully unlocked Professional Membership by Login with Web3 Wallet.
                        </Paragraph>

                        <Title level={4} style={{ marginTop: "2rem", marginBottom: "1.5rem", color: "#1a1a1a", fontSize: isMobile ? "18px" : "20px" }}>
                            Membership Benefits
                        </Title>
                        <div style={cardContainerStyle}>
                            {/* Normal User */}
                            <div style={normalUserCardStyle}>
                                <Text strong style={textStyle}>
                                    Normal User
                                </Text>
                                <Paragraph style={paragraphStyle}>
                                    - Permanently free search functionality<br />
                                    - Local storage of up to 100 search records<br />
                                    - AI Assistant powered by a lightweight SCAI framework
                                </Paragraph>
                            </div>

                            {/* Membership */}
                            <div style={membershipCardStyle}>
                                <div style={recommendedTagStyle}>Active</div>
                                <Text strong style={textStyle}>
                                    Membership
                                </Text>
                                <Paragraph style={paragraphStyle}>
                                    - All features above<br />
                                    - AI Assistant powered by the full SCAI framework<br />
                                    - Support for Deep Reading of papers<br />
                                    - Access to token-incentivized activities and features<br />
                                    - Support for all future SCAI-based Mini-Apps
                                </Paragraph>
                            </div>

                            {/* Partnership */}
                            <div style={blurredCardStyle}>
                                <Text strong style={textStyle}>
                                    Partnership (Coming Soon)
                                </Text>
                                <Paragraph style={paragraphStyle}>
                                    - Open API access<br />
                                    - Integration with the SCAI model<br />
                                    - Access to the paper database<br />
                                    - Requires holding 1,000 SciHub Tokens
                                </Paragraph>
                            </div>
                        </div>

                        <div style={buttonContainerStyle}>
                            <Button
                                type="primary"
                                size="large"
                                onClick={onClose}
                                style={{
                                    borderRadius: "8px",
                                    padding: isMobile ? "0.5rem 1rem" : "0.5rem 1.5rem",
                                    fontWeight: 500,
                                    width: isMobile ? "100%" : "auto",
                                    backgroundColor: "#ff4d4f",
                                    borderColor: "#ff4d4f",
                                }}
                            >
                                Continue to Research
                            </Button>
                        </div>
                    </div>
                </Modal>
            ) : (
                <Modal
                    open={visible}
                    onCancel={onClose}
                    footer={null}
                    centered
                    width={modalWidth}
                    style={{ borderRadius: "12px", body: { boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" } }}
                >
                    <div style={{ textAlign: "center", padding: isMobile ? "1rem" : "1.5rem" }}>
                        <Title level={3} style={{ marginTop: "1rem", color: "#1a1a1a", fontSize: isMobile ? "20px" : "24px" }}>
                            <strong>Join Our Movement</strong>
                        </Title>
                        {/* <Paragraph style={{ fontSize: isMobile ? "14px" : "16px", color: "#595959" }}>
                            <Text strong style={{ fontWeight: "600" }}>
                                Holding 1,000 SciHub Tokens is Our Commitment
                            </Text>
                        </Paragraph> */}
                        {/*   We uphold the open and free spirit of Sci-Hub. By holding 1,000 SciHub Tokens in any Web3 wallet, you will gain access to the Pro version. We will never initiate any transactions on your behalf. SciHub is now available on <Tag color="default">BNB Testnet</Tag> and <Tag color="default">Solana Mainnet</Tag>. */}
                        <Paragraph style={{ fontSize: isMobile ? "14px" : "16px", color: "#595959" }}>
                            To gain access to Professional function, you only need to login with any BNB/Solana web3 wallet. Meanwhile, if you find the project benefits to you, please help to support <Tag color="default">Scihub Token</Tag>.
                        </Paragraph>

                        <div style={cardContainerStyle}>
                            {/* Normal User */}
                            <div style={normalUserCardStyle}>

                                <Text strong style={textStyle}>
                                    Normal User
                                </Text>
                                <Paragraph style={paragraphStyle}>
                                    - Permanently free search functionality<br />
                                    - Local storage of up to 100 search records<br />
                                    - AI Assistant powered by a lightweight SCAI framework
                                </Paragraph>
                            </div>

                            {/* Membership */}
                            <div style={HighCardStyle}>
                                <div style={HighTagStyle}>Recommended</div>

                                <Text strong style={textStyle}>
                                    Membership
                                </Text>
                                <Paragraph style={paragraphStyle}>
                                    - All features above<br />
                                    - AI Assistant powered by the full SCAI framework<br />
                                    - Support for Deep Reading of papers<br />
                                    - Access to token-incentivized activities and features<br />
                                    - Support for all future SCAI-based Mini-Apps
                                </Paragraph>
                            </div>

                            {/* Partnership */}
                            <div style={blurredCardStyle}>
                                <Text strong style={textStyle}>
                                    Partnership (Coming Soon)
                                </Text>
                                <Paragraph style={paragraphStyle}>
                                    - Open API access<br />
                                    - Integration with the SCAI model<br />
                                    - Access to the paper database<br />
                                    - Requires holding 1,000 SciHub Tokens
                                </Paragraph>
                            </div>
                        </div>

                        <div style={buttonContainerStyle}>
                            <Button
                                type="default"
                                size="large"
                                onClick={onClose}
                                style={{
                                    marginRight: isMobile ? 0 : "1rem",
                                    borderRadius: "8px",
                                    padding: isMobile ? "0.5rem 1rem" : "0.5rem 1.5rem",
                                    fontWeight: 500,
                                    width: isMobile ? "100%" : "auto",
                                }}
                            >
                                Continue with Standard
                            </Button>
                            <Button
                                type="primary"
                                href="https://forum.scihub.fans/d/68-tutorial-how-to-buy-scihub-on-solana-blockchain"
                                target="_blank"
                                size="large"
                                onClick={onClose}
                                style={{
                                    borderRadius: "8px",
                                    padding: isMobile ? "0.5rem 1rem" : "0.5rem 1.5rem",
                                    fontWeight: 500,
                                    width: isMobile ? "100%" : "auto",
                                    backgroundColor: "#ff4d4f",
                                    borderColor: "#ff4d4f",
                                }}
                            >
                                How to Get SciHub Tokens
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default SciHubModal;