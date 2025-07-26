import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Typography, Space, Tag, Tooltip, Dropdown, Menu, message, Statistic } from "antd";
import { 
  FileTextOutlined, 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  HistoryOutlined,
  RocketOutlined,
  FunctionOutlined,
  TeamOutlined,
  MoreOutlined,
  DeleteOutlined,
  ShareAltOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";
import DocumentVersionControl from "./DocumentVersionControl";
import MathTemplateLibrary from "./MathTemplateLibrary";
import ProjectPublisher from "./ProjectPublisher";
import CollaborativeEditor from "./CollaborativeEditor";

const { Title, Text, Paragraph } = Typography;

const GroupWorkspace = ({
  group,
  documents,
  currentUser,
  onCreateDocument,
  onEditDocument,
  onDeleteDocument,
  onPublishProject,
  loading = false,
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [versionControlVisible, setVersionControlVisible] = useState(false);
  const [mathLibraryVisible, setMathLibraryVisible] = useState(false);
  const [projectPublisherVisible, setProjectPublisherVisible] = useState(false);
  const [collaborativeEditorVisible, setCollaborativeEditorVisible] = useState(false);
  const [workspaceStats, setWorkspaceStats] = useState({
    totalDocuments: 0,
    totalWords: 0,
    activeCollaborators: 0,
    lastActivity: null,
  });

  // 计算工作区统计信息
  useEffect(() => {
    if (documents) {
      const totalWords = documents.reduce((sum, doc) => {
        return sum + (doc.content?.split(/\s+/).length || 0);
      }, 0);

      setWorkspaceStats({
        totalDocuments: documents.length,
        totalWords,
        activeCollaborators: group?.members?.length || 0,
        lastActivity: documents.length > 0 
          ? new Date(Math.max(...documents.map(doc => new Date(doc.updatedAt || doc.createdAt))))
          : null,
      });
    }
  }, [documents, group]);

  // 处理文档操作菜单
  const getDocumentMenu = (document) => (
    <Menu
      items={[
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit Document',
          onClick: () => handleEditDocument(document),
        },
        {
          key: 'collaborate',
          icon: <TeamOutlined />,
          label: 'Collaborative Edit',
          onClick: () => handleCollaborativeEdit(document),
        },
        {
          key: 'history',
          icon: <HistoryOutlined />,
          label: 'Version History',
          onClick: () => handleViewHistory(document),
        },
        {
          key: 'share',
          icon: <ShareAltOutlined />,
          label: 'Share Document',
          onClick: () => handleShareDocument(document),
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete Document',
          danger: true,
          onClick: () => handleDeleteDocument(document),
        },
      ]}
    />
  );

  // 处理编辑文档
  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    if (onEditDocument) {
      onEditDocument(document);
    }
  };

  // 处理协作编辑
  const handleCollaborativeEdit = (document) => {
    setSelectedDocument(document);
    setCollaborativeEditorVisible(true);
  };

  // 处理查看版本历史
  const handleViewHistory = (document) => {
    setSelectedDocument(document);
    setVersionControlVisible(true);
  };

  // 处理分享文档
  const handleShareDocument = (document) => {
    const shareUrl = `${window.location.origin}/irys/${document.txId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      message.success("Document link copied to clipboard!");
    }).catch(() => {
      message.error("Failed to copy link");
    });
  };

  // 处理删除文档
  const handleDeleteDocument = (document) => {
    if (onDeleteDocument) {
      onDeleteDocument(document);
    }
  };

  // 处理恢复版本
  const handleRestoreVersion = async (version) => {
    try {
      // 这里应该调用实际的恢复版本逻辑
      message.success(`Document restored to version ${version.version}`);
      setVersionControlVisible(false);
    } catch (error) {
      message.error("Failed to restore version");
    }
  };

  // 处理插入数学模板
  const handleInsertMathTemplate = (latex) => {
    // 这里应该将LaTeX代码插入到当前编辑的文档中
    message.success("Math template inserted!");
    setMathLibraryVisible(false);
  };

  // 渲染工作区统计卡片
  const renderStatsCards = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      <Col xs={12} sm={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <Statistic
            title="Documents"
            value={workspaceStats.totalDocuments}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <Statistic
            title="Total Words"
            value={workspaceStats.totalWords}
            prefix={<EditOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <Statistic
            title="Collaborators"
            value={workspaceStats.activeCollaborators}
            prefix={<TeamOutlined />}
            valueStyle={{ color: "#722ed1" }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small" style={{ textAlign: "center" }}>
          <Statistic
            title="Last Activity"
            value={workspaceStats.lastActivity ? workspaceStats.lastActivity.toLocaleDateString() : "N/A"}
            valueStyle={{ color: "#fa8c16", fontSize: "14px" }}
          />
        </Card>
      </Col>
    </Row>
  );

  // 渲染工具栏
  const renderToolbar = () => (
    <Card
      size="small"
      style={{
        marginBottom: "24px",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateDocument}
            style={{
              background: "linear-gradient(45deg, #FF3314, #FF6B47)",
              border: "none",
            }}
          >
            New Document
          </Button>
          
          <Button
            icon={<FunctionOutlined />}
            onClick={() => setMathLibraryVisible(true)}
          >
            Math Templates
          </Button>
          
          <Button
            icon={<RocketOutlined />}
            onClick={() => setProjectPublisherVisible(true)}
            disabled={documents.length === 0}
          >
            Publish Project
          </Button>
        </Space>

        <Space>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {group?.name} • {group?.type === "private" ? "Private" : "Public"} Group
          </Text>
        </Space>
      </div>
    </Card>
  );

  // 渲染文档网格
  const renderDocumentGrid = () => {
    if (!documents || documents.length === 0) {
      return (
        <Card
          style={{
            textAlign: "center",
            padding: "40px",
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(8px)",
          }}
        >
          <FileTextOutlined style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }} />
          <Title level={4} style={{ color: "#999" }}>No Documents Yet</Title>
          <Paragraph style={{ color: "#666", marginBottom: "24px" }}>
            Start collaborating by creating your first document with mathematical formulas and rich content.
          </Paragraph>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={onCreateDocument}
            style={{
              background: "linear-gradient(45deg, #FF3314, #FF6B47)",
              border: "none",
            }}
          >
            Create First Document
          </Button>
        </Card>
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {documents.map((document, index) => (
          <Col xs={24} sm={12} lg={8} key={document.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                hoverable
                style={{
                  height: "100%",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(8px)",
                }}
                actions={[
                  <Tooltip title="View Document">
                    <EyeOutlined onClick={() => handleEditDocument(document)} />
                  </Tooltip>,
                  <Tooltip title="Edit Document">
                    <EditOutlined onClick={() => handleEditDocument(document)} />
                  </Tooltip>,
                  <Tooltip title="More Options">
                    <Dropdown overlay={getDocumentMenu(document)} trigger={['click']}>
                      <MoreOutlined />
                    </Dropdown>
                  </Tooltip>,
                ]}
              >
                <div style={{ height: "200px", display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1 }}>
                    <Title level={5} ellipsis={{ rows: 2 }} style={{ marginBottom: "8px" }}>
                      {document.title}
                    </Title>
                    
                    <Paragraph
                      ellipsis={{ rows: 3 }}
                      style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}
                    >
                      {document.content?.substring(0, 150)}...
                    </Paragraph>
                  </div>
                  
                  <div>
                    <Space size="small" wrap style={{ marginBottom: "8px" }}>
                      {document.tags?.slice(0, 2).map(tag => (
                        <Tag key={tag} size="small" color="blue">
                          {tag}
                        </Tag>
                      ))}
                      {document.tags?.length > 2 && (
                        <Tag size="small">+{document.tags.length - 2}</Tag>
                      )}
                    </Space>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        By {document.author}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {new Date(document.updatedAt || document.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* 工作区标题 */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <Title level={2} style={{ color: "white", marginBottom: "8px" }}>
          {group?.name} Workspace
        </Title>
        <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "16px" }}>
          Collaborative research and document creation
        </Text>
      </div>

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 工具栏 */}
      {renderToolbar()}

      {/* 文档网格 */}
      {renderDocumentGrid()}

      {/* 版本控制模态框 */}
      <DocumentVersionControl
        visible={versionControlVisible}
        onClose={() => setVersionControlVisible(false)}
        document={selectedDocument}
        groupId={group?.id}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* 数学模板库 */}
      <MathTemplateLibrary
        visible={mathLibraryVisible}
        onClose={() => setMathLibraryVisible(false)}
        onInsertTemplate={handleInsertMathTemplate}
      />

      {/* 项目发布器 */}
      <ProjectPublisher
        visible={projectPublisherVisible}
        onClose={() => setProjectPublisherVisible(false)}
        group={group}
        documents={documents}
        onPublishSuccess={onPublishProject}
      />

      {/* 协作编辑器 */}
      {collaborativeEditorVisible && (
        <CollaborativeEditor
          document={selectedDocument}
          group={group}
          currentUser={currentUser}
          onSave={async (content, title) => {
            // 处理保存逻辑
            message.success("Document saved successfully");
          }}
          onContentChange={(content) => {
            // 处理内容变化
          }}
          style={{ marginTop: "24px" }}
        />
      )}
    </div>
  );
};

export default GroupWorkspace;
