import React, { useState, useEffect, useCallback } from "react";
import { Modal, Input, Button, List, Card, Typography, Space, Popconfirm, message, Tag, Tooltip, Empty, Row, Col, Spin } from "antd";
import { FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, FolderOpenOutlined, ClockCircleOutlined, FileOutlined, DatabaseOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import indexedDBService from "../services/IndexedDBService";
import dataMigrationService from "../services/DataMigrationService";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const DocumentManager = ({
  currentDocument,
  onDocumentChange,
  onDocumentLoad,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
}) => {
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [],
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState(null);

  // Initialize IndexedDB and handle migration on mount
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        setIsLoading(true);

        // Check if migration is needed
        if (dataMigrationService.needsMigration()) {
          message.loading("正在迁移数据到新的存储系统...", 0);
          const migrationResult = await dataMigrationService.migrate();
          message.destroy();

          if (migrationResult.success) {
            message.success(`数据迁移完成！已迁移 ${migrationResult.migrated} 项数据`);
            setMigrationStatus(migrationResult);
          } else {
            message.error("数据迁移失败：" + migrationResult.error);
          }
        }

        // Load documents from IndexedDB
        await loadDocumentsFromDB();

        // Load current document if exists
        const currentDocId = await indexedDBService.loadSetting("currentDocumentId");
        if (currentDocId && onDocumentLoad) {
          const currentDoc = await indexedDBService.loadDocument(currentDocId);
          if (currentDoc) {
            onDocumentLoad(currentDoc);
          }
        }
      } catch (error) {
        console.error("Error initializing storage:", error);
        message.error("存储系统初始化失败");
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [onDocumentLoad]);

  // Load documents from IndexedDB
  const loadDocumentsFromDB = async () => {
    try {
      const docs = await indexedDBService.getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
      message.error("加载文档失败");
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !currentDocument) return;

    const autoSaveTimer = setInterval(() => {
      if (hasUnsavedChanges) {
        saveCurrentDocument();
      }
    }, autoSaveInterval);

    return () => clearInterval(autoSaveTimer);
  }, [autoSave, currentDocument, hasUnsavedChanges, autoSaveInterval]);

  // Track changes in current document
  useEffect(() => {
    if (currentDocument) {
      setHasUnsavedChanges(true);
    }
  }, [currentDocument]);

  // Create new document
  const createDocument = useCallback(
    async (docData) => {
      try {
        const newDoc = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: docData.title || "未命名文档",
          description: docData.description || "",
          tags: docData.tags || [],
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "开始写作您的学术论文...",
                  },
                ],
              },
            ],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wordCount: 0,
          characterCount: 0,
          version: 1,
        };

        // Save to IndexedDB
        await indexedDBService.saveDocument(newDoc);

        // Update local state
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);

        // Set as current document
        await indexedDBService.saveSetting("currentDocumentId", newDoc.id);
        onDocumentLoad?.(newDoc);

        message.success("文档创建成功");
        return newDoc;
      } catch (error) {
        console.error("Error creating document:", error);
        message.error("创建文档失败");
        return null;
      }
    },
    [documents, onDocumentLoad]
  );

  // Save current document
  const saveCurrentDocument = useCallback(async () => {
    if (!currentDocument) return;

    try {
      // Save to IndexedDB
      const updatedDoc = await indexedDBService.saveDocument(currentDocument);

      // Update local state
      const updatedDocs = documents.map((doc) => (doc.id === currentDocument.id ? updatedDoc : doc));
      setDocuments(updatedDocs);

      // Update current document setting
      await indexedDBService.saveSetting("currentDocumentId", currentDocument.id);

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      message.success("文档已保存");
    } catch (error) {
      console.error("Error saving document:", error);
      message.error("保存文档失败");
    }
  }, [currentDocument, documents]);

  // Load document
  const loadDocument = useCallback(
    async (doc) => {
      const loadDocumentAction = async () => {
        try {
          await indexedDBService.saveSetting("currentDocumentId", doc.id);
          onDocumentLoad?.(doc);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Error loading document:", error);
          message.error("加载文档失败");
        }
      };

      if (hasUnsavedChanges) {
        Modal.confirm({
          title: "未保存的更改",
          content: "当前文档有未保存的更改，是否要保存？",
          onOk: async () => {
            await saveCurrentDocument();
            await loadDocumentAction();
          },
          onCancel: async () => {
            await loadDocumentAction();
          },
        });
      } else {
        await loadDocumentAction();
      }
    },
    [hasUnsavedChanges, saveCurrentDocument, onDocumentLoad]
  );

  // Delete document
  const deleteDocument = useCallback(
    async (docId) => {
      try {
        // Delete from IndexedDB
        await indexedDBService.deleteDocument(docId);

        // Update local state
        const updatedDocs = documents.filter((doc) => doc.id !== docId);
        setDocuments(updatedDocs);

        // If deleting current document, clear it
        if (currentDocument?.id === docId) {
          await indexedDBService.saveSetting("currentDocumentId", null);
          onDocumentLoad?.(null);
        }

        message.success("文档已删除");
      } catch (error) {
        console.error("Error deleting document:", error);
        message.error("删除文档失败");
      }
    },
    [documents, currentDocument, onDocumentLoad]
  );

  // Update document metadata
  const updateDocument = useCallback(
    async (docId, updates) => {
      try {
        // Update in IndexedDB
        const updatedDoc = await indexedDBService.updateDocument(docId, updates);

        // Update local state
        const updatedDocs = documents.map((doc) => (doc.id === docId ? updatedDoc : doc));
        setDocuments(updatedDocs);

        // Update current document if it's the one being edited
        if (currentDocument?.id === docId) {
          const updatedCurrentDoc = { ...currentDocument, ...updates };
          onDocumentChange?.(updatedCurrentDoc);
        }

        message.success("文档信息已更新");
      } catch (error) {
        console.error("Error updating document:", error);
        message.error("更新文档失败");
      }
    },
    [documents, currentDocument, onDocumentChange]
  );

  // Modal handlers
  const showCreateModal = () => {
    setIsCreateMode(true);
    setEditingDoc(null);
    setFormData({ title: "", description: "", tags: [] });
    setIsModalVisible(true);
  };

  const showEditModal = (doc) => {
    setIsCreateMode(false);
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      description: doc.description,
      tags: doc.tags || [],
    });
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    if (!formData.title.trim()) {
      message.error("请输入文档标题");
      return;
    }

    if (isCreateMode) {
      createDocument(formData);
    } else {
      updateDocument(editingDoc.id, formData);
    }

    setIsModalVisible(false);
    setFormData({ title: "", description: "", tags: [] });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFormData({ title: "", description: "", tags: [] });
  };

  return (
    <div className="document-manager">
      {/* Header */}
      <div className="document-manager-header">
        <Row justify="space-between" align="top" gutter={[8, 8]}>
          <Col flex="auto">
            <Space direction="vertical" size={2}>
              <Title level={4} style={{ margin: 0 }}>
                <FileTextOutlined style={{ color: "#ee1d1d", marginRight: 8 }} />
                文档管理
              </Title>
            </Space>
          </Col>
          <Col flex="none">
            <Space size={8} wrap>
              {currentDocument && (
                <Button type="primary" icon={<SaveOutlined />} onClick={saveCurrentDocument} disabled={!hasUnsavedChanges}>
                  保存
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
                新建文档
              </Button>
            </Space>
          </Col>
          <Col flex="none">
            {lastSaved && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                上次保存: {dayjs(lastSaved).fromNow()}
              </Text>
            )}
          </Col>
        </Row>
      </div>

      {/* Current Document Info */}
      {currentDocument && (
        <Card size="small" className="current-document-info">
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <FileOutlined style={{ color: "#ee1d1d" }} />
                <Text strong>{currentDocument.title}</Text>
                {hasUnsavedChanges && (
                  <Tag color="orange" size="small">
                    未保存
                  </Tag>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  字数: {currentDocument.wordCount || 0}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  字符: {currentDocument.characterCount || 0}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>正在初始化存储系统...</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Migration Status */}
      {migrationStatus && (
        <Card size="small" style={{ marginBottom: 16, borderColor: "#52c41a" }}>
          <Space>
            <DatabaseOutlined style={{ color: "#52c41a" }} />
            <Text type="success">数据迁移完成！已迁移 {migrationStatus.migrated} 项数据到新的存储系统</Text>
          </Space>
        </Card>
      )}

      {/* Documents List */}
      <div className="documents-list">
        {!isLoading && documents.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无文档" style={{ margin: "40px 0" }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
              创建第一个文档
            </Button>
          </Empty>
        ) : !isLoading ? (
          <List
            dataSource={documents}
            renderItem={(doc) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                <List.Item
                  className={`document-item ${currentDocument?.id === doc.id ? "active" : ""}`}
                  actions={[
                    <Tooltip title="编辑信息">
                      <Button type="text" size="small" icon={<EditOutlined />} onClick={() => showEditModal(doc)} />
                    </Tooltip>,
                    <Popconfirm title="确定要删除这个文档吗？" onConfirm={() => deleteDocument(doc.id)} okText="确定" cancelText="取消">
                      <Tooltip title="删除文档">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                  onClick={() => loadDocument(doc)}
                  style={{ cursor: "pointer" }}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 20, color: "#ee1d1d" }} />}
                    title={
                      <Space>
                        <Text strong>{doc.title}</Text>
                        {doc.tags?.map((tag) => (
                          <Tag key={tag} size="small" color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    }
                    description={
                      <div>
                        {doc.description && (
                          <Paragraph ellipsis={{ rows: 2 }} style={{ margin: "4px 0", color: "#666" }}>
                            {doc.description}
                          </Paragraph>
                        )}
                        <Row gutter={[8, 4]}>
                          <Col span={24}>
                            <Space size={8} wrap>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                创建: {dayjs(doc.createdAt).format("MM-DD HH:mm")}
                              </Text>
                              <span style={{ color: "#d9d9d9" }}>|</span>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                更新: {dayjs(doc.updatedAt).fromNow()}
                              </Text>
                              <span style={{ color: "#d9d9d9" }}>|</span>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {doc.wordCount || 0} 字
                              </Text>
                            </Space>
                          </Col>
                        </Row>
                      </div>
                    }
                  />
                </List.Item>
              </motion.div>
            )}
          />
        ) : null}
      </div>

      {/* Create/Edit Modal */}
      <Modal title={isCreateMode ? "创建新文档" : "编辑文档信息"} open={isModalVisible} onOk={handleModalOk} onCancel={handleModalCancel} okText={isCreateMode ? "创建" : "保存"} cancelText="取消">
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>文档标题 *</Text>
            <Input placeholder="请输入文档标题" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ marginTop: 4 }} />
          </div>

          <div>
            <Text strong>文档描述</Text>
            <TextArea placeholder="请输入文档描述（可选）" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ marginTop: 4 }} />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default DocumentManager;
