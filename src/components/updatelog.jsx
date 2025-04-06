import React from "react";
import { Modal, Button, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export const UpdateModal = ({ visible, onClose }) => {
    return (
        <Modal
            title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Title level={4} style={{ margin: 0, color: "#000", fontSize: "24px", fontWeight: "700" }}>
                        Update Logs
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
                <Title level={4}>
                    V0.4 - 2025.03.17
                </Title>
                <div style={{ marginTop: "24px" }}>
                    <Title level={5}>User Experience Optimization</Title>
                    <Paragraph>
                        This time, we've made two major user experience optimizations: introducing streaming for the AI Q&A section and compressing inquiries that return a large number of results.
                    </Paragraph>

                    <Title level={5}>New Data Sources</Title>
                    <Paragraph>
                        We have introduced a set of unique data sources for SCAICH, and we are constantly expanding them. These special search entries will be marked with a unique symbol (perhaps you recognize this symbol).
                    </Paragraph>

                </div>
                <Title level={4}>
                    V0.3 - 2025.03.09
                </Title>
                <div style={{ marginTop: "24px" }}>
                    <Title level={5}>Ranking</Title>
                    <Paragraph>
                        We enhanced the hybrid ranking model with more dataset and re-ranking techiniques. The search results are more accurate and relevant now.
                    </Paragraph>

                    <Title level={5}>More Item</Title>
                    <Paragraph>
                        We have overcome the limitation of the number of search results, which is twice as much as before.
                    </Paragraph>

                    <Title level={5}>Arxiv</Title>
                    <Paragraph>
                        We have integrated the Arxiv dataset more deeply into our search engine, and the arxiv result is not highlighted with a logo.
                    </Paragraph>


                </div>


                <Title level={4}>
                    V0.2 - 2025.03.03
                </Title>
                <div style={{ marginTop: "24px" }}>
                    <Title level={5}>New UI</Title>
                    <Paragraph>
                        We have designed a brand-new interface layout, making the overall space planning more reasonable. Meanwhile, the mobile UI retains its original design.
                    </Paragraph>

                    <Title level={5}>Non-Open Science Access</Title>
                    <Paragraph>
                        We have added a special button that can be activated on the left side of the search bar. Once activated, all your search results will consist only of OA papers. Otherwise, the results may include a broader range of search outcomes.
                    </Paragraph>

                    <Title level={5}>Search Optimization</Title>
                    <Paragraph>
                        We have integrated the BM25s algorithm to re-rank search results, making keyword matching more accurate. At the same time, we will continue to upgrade the overall performance of the search engine in the long run.
                    </Paragraph>


                </div>

                <Title level={4}>
                    V0.1 - 2025.02.21
                </Title>
                <div style={{ marginTop: "24px" }}>
                    <Title level={5}>Share</Title>
                    <Paragraph>
                        We added the share button in the result area, you can copy the link and share top 3 result to your friends!
                    </Paragraph>

                    <Title level={5}>Doi Search</Title>
                    <Paragraph>
                        We added a new fliter to support the exact match of doi-based search.
                    </Paragraph>

                    <Title level={5}>Relevant</Title>
                    <Paragraph>
                        We added the relevant level after the search result.
                    </Paragraph>

                    <Title level={5}>Publication</Title>
                    <Paragraph>
                        We added the publication info of a paper after the search result.
                    </Paragraph>

                    <Title level={5}>History</Title>
                    <Paragraph>
                        Access your search history by clicking the top-left button. You can also download your search results as images by using the download button on the right.
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