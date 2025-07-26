import React, { useState, useEffect } from "react";
import { Modal, Timeline, Button, Typography, Tag, Space, Tooltip, Spin, message } from "antd";
import { HistoryOutlined, EyeOutlined, RollbackOutlined, UserOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import irysService from "../../../services/irysService";

const { Title, Text, Paragraph } = Typography;

const DocumentVersionControl = ({ visible, onClose, document, groupId, onRestoreVersion, loading = false }) => {
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // 加载文档版本历史
  const loadDocumentVersions = async () => {
    if (!document?.id || !groupId) return;

    setLoadingVersions(true);
    try {
      // 查询所有相关的文档版本
      const versionsQuery = await irysService.queryTransactions({
        tags: [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: "text/markdown" },
          { name: "Data-Type", value: "document" },
          { name: "Group-Id", value: groupId },
          { name: "Document-Title", value: document.title },
        ],
      });

      const versionList = [];
      for (const tx of versionsQuery) {
        try {
          const content = await irysService.getTransactionData(tx.id);
          const metadata = tx.tags.reduce((acc, tag) => {
            acc[tag.name] = tag.value;
            return acc;
          }, {});

          versionList.push({
            id: tx.id,
            content,
            author: metadata["Author"] || "Unknown",
            editor: metadata["Editor"],
            createdAt: new Date(parseInt(metadata["Created-At"]) || Date.now()),
            updatedAt: new Date(parseInt(metadata["Updated-At"]) || Date.now()),
            previousVersion: metadata["Previous-Version"],
            version: versionList.length + 1,
            isOriginal: !metadata["Previous-Version"],
          });
        } catch (error) {
          console.error("Error loading version data:", error);
        }
      }

      // 按时间排序，最新的在前
      versionList.sort((a, b) => b.updatedAt - a.updatedAt);

      // 重新分配版本号
      versionList.forEach((version, index) => {
        version.version = versionList.length - index;
      });

      setVersions(versionList);
    } catch (error) {
      console.error("Error loading document versions:", error);
      message.error("Failed to load document versions");
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (visible && document) {
      loadDocumentVersions();
    }
  }, [visible, document, groupId]);

  // 预览版本内容
  const handlePreviewVersion = (version) => {
    setSelectedVersion(version);
    setPreviewVisible(true);
  };

  // 恢复到指定版本
  const handleRestoreToVersion = async (version) => {
    Modal.confirm({
      title: "Restore Document Version",
      content: `Are you sure you want to restore to version ${version.version}? This will create a new version with the content from the selected version.`,
      okText: "Restore",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        if (onRestoreVersion) {
          await onRestoreVersion(version);
          await loadDocumentVersions(); // 重新加载版本列表
        }
      },
    });
  };

  // 计算内容差异
  const getContentDiff = (currentContent, previousContent) => {
    const currentLength = currentContent?.length || 0;
    const previousLength = previousContent?.length || 0;
    const diff = currentLength - previousLength;

    if (diff > 0) {
      return { type: "added", count: diff, text: `+${diff} characters` };
    } else if (diff < 0) {
      return { type: "removed", count: Math.abs(diff), text: `-${Math.abs(diff)} characters` };
    } else {
      return { type: "unchanged", count: 0, text: "No change" };
    }
  };

  // 渲染版本时间线项
  const renderTimelineItem = (version, index) => {
    const isLatest = index === 0;
    const previousVersion = versions[index + 1];
    const contentDiff = previousVersion ? getContentDiff(version.content, previousVersion.content) : null;

    return {
      color: isLatest ? "#ff4d4f" : version.isOriginal ? "#52c41a" : "#1890ff",
      dot: isLatest ? (
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "linear-gradient(45deg, #ff4d4f, #ff7875)",
            border: "2px solid white",
            boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)",
          }}
        />
      ) : undefined,
      children: (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <Space>
                <Tag color={isLatest ? "red" : version.isOriginal ? "green" : "blue"}>
                  Version {version.version}
                  {isLatest && " (Current)"}
                  {version.isOriginal && " (Original)"}
                </Tag>
                {contentDiff && <Tag color={contentDiff.type === "added" ? "green" : contentDiff.type === "removed" ? "red" : "default"}>{contentDiff.text}</Tag>}
              </Space>
              <div style={{ marginTop: "4px" }}>
                <Space size="small">
                  <UserOutlined style={{ color: "#666" }} />
                  <Text style={{ color: "#666" }}>{version.editor ? `Edited by ${version.editor}` : `Created by ${version.author}`}</Text>
                </Space>
              </div>
              <div style={{ marginTop: "4px" }}>
                <Space size="small">
                  <ClockCircleOutlined style={{ color: "#666" }} />
                  <Text style={{ color: "#666" }}>{version.updatedAt.toLocaleString()}</Text>
                </Space>
              </div>
            </div>

            <Space>
              <Tooltip title="Preview Version">
                <Button type="text" icon={<EyeOutlined />} onClick={() => handlePreviewVersion(version)} size="small" />
              </Tooltip>
              {!isLatest && (
                <Tooltip title="Restore to This Version">
                  <Button type="text" icon={<RollbackOutlined />} onClick={() => handleRestoreToVersion(version)} size="small" style={{ color: "#52c41a" }} />
                </Tooltip>
              )}
            </Space>
          </div>

          <Paragraph ellipsis={{ rows: 2 }} style={{ color: "#999", margin: 0, fontSize: "12px" }}>
            {version.content.substring(0, 150)}...
          </Paragraph>
        </motion.div>
      ),
    };
  };

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <HistoryOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Document Version History
              </Title>
              <Text type="secondary">{document?.title}</Text>
            </div>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width="80%"
        style={{ maxWidth: "800px" }}
        bodyStyle={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {loadingVersions ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px" }}>
              <Text>Loading version history...</Text>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <HistoryOutlined style={{ fontSize: "48px", color: "#ccc" }} />
            <div style={{ marginTop: "16px" }}>
              <Title level={4} style={{ color: "#999" }}>
                No Version History
              </Title>
              <Text type="secondary">This document has no version history yet.</Text>
            </div>
          </div>
        ) : (
          <div style={{ padding: "16px 0" }}>
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              <Text strong>Total Versions: {versions.length}</Text>
            </div>

            <Timeline mode="left" items={versions.map((version, index) => renderTimelineItem(version, index))} />
          </div>
        )}
      </Modal>

      {/* Version Preview Modal */}
      <Modal
        title={`Preview Version ${selectedVersion?.version}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
          selectedVersion && (
            <Button
              key="restore"
              type="primary"
              icon={<RollbackOutlined />}
              onClick={() => {
                setPreviewVisible(false);
                handleRestoreToVersion(selectedVersion);
              }}
            >
              Restore This Version
            </Button>
          ),
        ]}
        width="90%"
        style={{ maxWidth: "1000px" }}
      >
        {selectedVersion && (
          <div>
            <div style={{ marginBottom: "16px", padding: "12px", background: "#f5f5f5", borderRadius: "8px" }}>
              <Space direction="vertical" size="small">
                <div>
                  <Text strong>Version:</Text> {selectedVersion.version}
                </div>
                <div>
                  <Text strong>Author:</Text> {selectedVersion.author}
                  {selectedVersion.editor && <span> (Edited by {selectedVersion.editor})</span>}
                </div>
                <div>
                  <Text strong>Date:</Text> {selectedVersion.updatedAt.toLocaleString()}
                </div>
                <div>
                  <Text strong>Content Length:</Text> {selectedVersion.content.length} characters
                </div>
              </Space>
            </div>

            <div
              style={{
                background: "#fafafa",
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                padding: "16px",
                maxHeight: "400px",
                overflowY: "auto",
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedVersion.content}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DocumentVersionControl;
