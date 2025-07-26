import React, { useState, useEffect, useRef } from "react";
import { Card, Avatar, Typography, Tag, Space, Tooltip, Button, message, Badge } from "antd";
import { UserOutlined, EditOutlined, EyeOutlined, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownEditor from "../../../components/MarkdownEditor";

const { Title, Text } = Typography;

const CollaborativeEditor = ({
  document,
  group,
  currentUser,
  onSave,
  onContentChange,
  style = {},
  className = "",
}) => {
  const [content, setContent] = useState(document?.content || "");
  const [collaborators, setCollaborators] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimer = useRef(null);
  const lastContentRef = useRef(content);

  // 模拟协作者数据（实际应用中应该从WebSocket或实时数据库获取）
  const mockCollaborators = [
    {
      id: "user1",
      name: "Dr. Alice Chen",
      avatar: null,
      status: "editing",
      lastSeen: new Date(),
      cursorPosition: 150,
      selection: { start: 100, end: 200 },
    },
    {
      id: "user2", 
      name: "Prof. Bob Wilson",
      avatar: null,
      status: "viewing",
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      cursorPosition: 0,
    },
    {
      id: "user3",
      name: "Dr. Carol Zhang",
      avatar: null,
      status: "editing",
      lastSeen: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      cursorPosition: 300,
    },
  ];

  useEffect(() => {
    // 模拟加载协作者信息
    setCollaborators(mockCollaborators);
    setActiveUsers(mockCollaborators.filter(user => 
      user.status === "editing" && 
      Date.now() - user.lastSeen.getTime() < 5 * 60 * 1000 // 5分钟内活跃
    ));
  }, []);

  // 内容变化处理
  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(newContent !== lastContentRef.current);
    
    if (onContentChange) {
      onContentChange(newContent);
    }

    // 自动保存逻辑
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave(newContent);
    }, 3000); // 3秒后自动保存
  };

  // 自动保存
  const handleAutoSave = async (contentToSave) => {
    if (contentToSave === lastContentRef.current) return;
    
    setIsAutoSaving(true);
    try {
      if (onSave) {
        await onSave(contentToSave, `${document?.title || 'Untitled'}_autosave`);
        lastContentRef.current = contentToSave;
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        message.success("Auto-saved successfully", 2);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      message.error("Auto-save failed", 2);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // 手动保存
  const handleManualSave = async () => {
    if (!hasUnsavedChanges) {
      message.info("No changes to save");
      return;
    }

    try {
      if (onSave) {
        await onSave(content, document?.title || 'Untitled');
        lastContentRef.current = content;
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        message.success("Document saved successfully");
      }
    } catch (error) {
      console.error("Save failed:", error);
      message.error("Failed to save document");
    }
  };

  // 获取用户状态颜色
  const getUserStatusColor = (status, lastSeen) => {
    const timeDiff = Date.now() - lastSeen.getTime();
    if (status === "editing" && timeDiff < 2 * 60 * 1000) return "#52c41a"; // 绿色：正在编辑
    if (status === "viewing" && timeDiff < 5 * 60 * 1000) return "#1890ff"; // 蓝色：正在查看
    return "#d9d9d9"; // 灰色：离线
  };

  // 获取用户状态文本
  const getUserStatusText = (status, lastSeen) => {
    const timeDiff = Date.now() - lastSeen.getTime();
    if (status === "editing" && timeDiff < 2 * 60 * 1000) return "Editing now";
    if (status === "viewing" && timeDiff < 5 * 60 * 1000) return "Viewing";
    if (timeDiff < 60 * 1000) return "Just left";
    if (timeDiff < 60 * 60 * 1000) return `${Math.floor(timeDiff / (60 * 1000))}m ago`;
    return "Offline";
  };

  // 渲染协作者头像
  const renderCollaboratorAvatars = () => (
    <Space size="small">
      <AnimatePresence>
        {collaborators.map((collaborator, index) => {
          const isActive = Date.now() - collaborator.lastSeen.getTime() < 5 * 60 * 1000;
          return (
            <motion.div
              key={collaborator.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Tooltip
                title={
                  <div>
                    <div style={{ fontWeight: "bold" }}>{collaborator.name}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      {getUserStatusText(collaborator.status, collaborator.lastSeen)}
                    </div>
                  </div>
                }
              >
                <Badge
                  dot
                  color={getUserStatusColor(collaborator.status, collaborator.lastSeen)}
                  offset={[-2, 2]}
                >
                  <Avatar
                    size="small"
                    src={collaborator.avatar}
                    icon={<UserOutlined />}
                    style={{
                      border: `2px solid ${getUserStatusColor(collaborator.status, collaborator.lastSeen)}`,
                      opacity: isActive ? 1 : 0.6,
                    }}
                  />
                </Badge>
              </Tooltip>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Space>
  );

  // 渲染状态栏
  const renderStatusBar = () => (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 16px",
      background: "rgba(255, 255, 255, 0.8)",
      borderRadius: "8px",
      marginBottom: "16px",
      border: "1px solid rgba(0, 0, 0, 0.1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Text strong style={{ fontSize: "14px" }}>Collaborators:</Text>
          {renderCollaboratorAvatars()}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge count={activeUsers.length} color="#52c41a">
            <EditOutlined style={{ color: "#52c41a" }} />
          </Badge>
          <Text style={{ fontSize: "12px", color: "#666" }}>
            {activeUsers.length} editing
          </Text>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isAutoSaving && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <SyncOutlined spin style={{ color: "#1890ff" }} />
            <Text style={{ fontSize: "12px", color: "#1890ff" }}>Auto-saving...</Text>
          </div>
        )}
        
        {hasUnsavedChanges && !isAutoSaving && (
          <Tag color="orange" style={{ margin: 0 }}>
            Unsaved changes
          </Tag>
        )}
        
        {lastSaved && !hasUnsavedChanges && (
          <Text style={{ fontSize: "12px", color: "#52c41a" }}>
            Saved {lastSaved.toLocaleTimeString()}
          </Text>
        )}

        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="small"
          onClick={handleManualSave}
          disabled={!hasUnsavedChanges}
          style={{
            background: hasUnsavedChanges 
              ? "linear-gradient(45deg, #FF3314, #FF6B47)" 
              : undefined,
            border: "none",
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
      style={style}
    >
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <EditOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
              <div>
                <Title level={4} style={{ margin: 0, color: "#333" }}>
                  Collaborative Editor
                </Title>
                <Text type="secondary">
                  {document?.title || "Untitled Document"} • {group?.name}
                </Text>
              </div>
            </div>
            
            <Space>
              <Tag color="blue">{content.length} characters</Tag>
              <Tag color="green">{collaborators.length} collaborators</Tag>
            </Space>
          </div>
        }
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(12px)",
        }}
        bodyStyle={{ padding: "16px" }}
      >
        {renderStatusBar()}
        
        <MarkdownEditor
          title=""
          initialValue={content}
          height={500}
          onContentChange={handleContentChange}
          enableSave={false}
          enableExport={true}
          enableImport={true}
          hideToolbar={false}
          preview="live"
          style={{
            border: "1px solid #d9d9d9",
            borderRadius: "8px",
          }}
        />

        {/* 协作者活动指示器 */}
        <div style={{ marginTop: "16px" }}>
          <Space wrap>
            {collaborators.map(collaborator => {
              const isActive = Date.now() - collaborator.lastSeen.getTime() < 5 * 60 * 1000;
              return (
                <motion.div
                  key={collaborator.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: isActive ? 1 : 0.6, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Tag
                    color={collaborator.status === "editing" ? "blue" : "default"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                    }}
                  >
                    <Avatar size={16} src={collaborator.avatar} icon={<UserOutlined />} />
                    <span style={{ fontSize: "12px" }}>
                      {collaborator.name} • {getUserStatusText(collaborator.status, collaborator.lastSeen)}
                    </span>
                  </Tag>
                </motion.div>
              );
            })}
          </Space>
        </div>
      </Card>
    </motion.div>
  );
};

export default CollaborativeEditor;
