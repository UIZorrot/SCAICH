import { useState, useCallback, useEffect } from "react";
import { Layout, Button, Space, Typography, Card, Row, Col, Drawer, message, Modal } from "antd";
import { EditOutlined, FileTextOutlined, UnorderedListOutlined, BulbOutlined, FullscreenOutlined, FullscreenExitOutlined, MenuOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import TipTapEditor from "./components/TipTapEditor";
import DocumentManager from "./components/DocumentManager";
import DocumentOutline from "./components/DocumentOutline";
import AISuggestionsPanel from "./components/AISuggestionsPanel";
import FloatingToolPanel from "./components/FloatingToolPanel";
import "./components/AISuggestionsPanel.css";
import "./AcademicEditor.css";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const AcademicEditor = ({ onBackToTools }) => {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("documents"); // 'documents', 'outline', or 'ai'
  const [selectedText, setSelectedText] = useState("");
  const [editorInstance, setEditorInstance] = useState(null);

  // Load current document from localStorage on mount
  useEffect(() => {
    const savedDoc = localStorage.getItem("scai_current_document");
    if (savedDoc) {
      try {
        setCurrentDocument(JSON.parse(savedDoc));
      } catch (error) {
        console.error("Error loading current document:", error);
      }
    }
  }, []);

  // Handle document content changes
  const handleDocumentChange = useCallback(
    (jsonContent, htmlContent) => {
      if (!currentDocument) return;

      // Count words and characters
      const text = htmlContent.replace(/<[^>]*>/g, "");
      const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
      const characterCount = text.length;

      const updatedDoc = {
        ...currentDocument,
        content: jsonContent,
        htmlContent,
        wordCount,
        characterCount,
        updatedAt: new Date().toISOString(),
      };

      setCurrentDocument(updatedDoc);
    },
    [currentDocument]
  );

  // Handle document loading
  const handleDocumentLoad = useCallback((doc) => {
    setCurrentDocument(doc);
    if (window.innerWidth <= 768) {
      setMobileDrawerVisible(false);
    }
  }, []);

  // AI optimization handlers
  const handleAIOptimize = useCallback(
    async (text) => {
      try {
        message.loading("正在优化文本...", 0);

        // Call AI service to optimize text
        const aiService = (await import("./services/AIService")).default;
        const response = await aiService.improveContent({
          content: text,
          improvementType: "general",
          targetAudience: "academic",
        });

        const optimizedText = response.choices?.[0]?.message?.content;
        if (optimizedText) {
          // Show optimization result in a modal for user to choose
          Modal.confirm({
            title: "AI文本优化结果",
            content: (
              <div>
                <p>
                  <strong>原文：</strong>
                </p>
                <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", marginBottom: "16px" }}>{text}</div>
                <p>
                  <strong>优化后：</strong>
                </p>
                <div style={{ background: "#e6f7ff", padding: "8px", borderRadius: "4px" }}>{optimizedText}</div>
              </div>
            ),
            okText: "替换原文",
            cancelText: "取消",
            width: 600,
            onOk: () => {
              // Replace selected text with optimized version
              if (editorInstance) {
                const { from, to } = editorInstance.state.selection;
                editorInstance.chain().focus().deleteRange({ from, to }).insertContent(optimizedText).run();
              }
              message.success("文本已替换为优化版本");
            },
          });
        }

        message.destroy();
      } catch (error) {
        message.destroy();
        message.error("文本优化失败：" + error.message);
      }
    },
    [editorInstance]
  );

  const handleAIPolish = useCallback(
    async (text) => {
      try {
        message.loading("正在润色文本...", 0);

        // Call AI service to polish text
        const aiService = new (await import("./services/AIService")).default();
        const response = await aiService.improveContent({
          content: text,
          improvementType: "style",
          targetAudience: "academic",
        });

        const polishedText = response.choices?.[0]?.message?.content;
        if (polishedText) {
          // Show polishing result in a modal for user to choose
          Modal.confirm({
            title: "AI文本润色结果",
            content: (
              <div>
                <p>
                  <strong>原文：</strong>
                </p>
                <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", marginBottom: "16px" }}>{text}</div>
                <p>
                  <strong>润色后：</strong>
                </p>
                <div style={{ background: "#f6ffed", padding: "8px", borderRadius: "4px" }}>{polishedText}</div>
              </div>
            ),
            okText: "替换原文",
            cancelText: "取消",
            width: 600,
            onOk: () => {
              // Replace selected text with polished version
              if (editorInstance) {
                const { from, to } = editorInstance.state.selection;
                editorInstance.chain().focus().deleteRange({ from, to }).insertContent(polishedText).run();
              }
              message.success("文本已替换为润色版本");
            },
          });
        }

        message.destroy();
      } catch (error) {
        message.destroy();
        message.error("文本润色失败：" + error.message);
      }
    },
    [editorInstance]
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setSidebarCollapsed(true);
    }
  }, [isFullscreen]);

  // Responsive sidebar for mobile
  const isMobile = window.innerWidth <= 768;

  const sidebarContent = (
    <div className="editor-sidebar">
      <div className="sidebar-tabs">
        <Button type={activeTab === "documents" ? "primary" : "text"} icon={<FileTextOutlined />} onClick={() => setActiveTab("documents")} block>
          文档管理
        </Button>
        <Button type={activeTab === "outline" ? "primary" : "text"} icon={<UnorderedListOutlined />} onClick={() => setActiveTab("outline")} block disabled={!currentDocument}>
          文档大纲
        </Button>
        <Button type={activeTab === "ai" ? "primary" : "text"} icon={<BulbOutlined />} onClick={() => setActiveTab("ai")} block disabled={!currentDocument}>
          AI 助手
        </Button>
      </div>

      <div className="sidebar-content">
        <AnimatePresence mode="wait">
          {activeTab === "documents" && (
            <motion.div key="documents" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <DocumentManager currentDocument={currentDocument} onDocumentChange={setCurrentDocument} onDocumentLoad={handleDocumentLoad} autoSave={true} />
            </motion.div>
          )}
          {activeTab === "outline" && (
            <motion.div key="outline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <DocumentOutline
                editor={editorInstance}
                onNodeClick={(node) => {
                  console.log("Outline node clicked:", node);
                  // Jump to the position in editor
                  if (editorInstance && node.position) {
                    editorInstance.commands.setTextSelection(node.position);
                    editorInstance.commands.focus();
                  }
                }}
                onInsertContent={(content) => {
                  // Insert generated outline content to editor
                  if (editorInstance) {
                    editorInstance.commands.insertContent(content, {
                      parseOptions: {
                        preserveWhitespace: false,
                      },
                    });
                  }
                }}
                showWordCount={true}
                collapsible={true}
              />
            </motion.div>
          )}
          {activeTab === "ai" && (
            <motion.div key="ai" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <AISuggestionsPanel
                editor={currentDocument?.editor}
                selectedText={selectedText}
                onApplySuggestion={(suggestion) => {
                  // Apply suggestion to editor
                  if (currentDocument?.editor) {
                    currentDocument.editor.commands.insertContent(suggestion);
                  }
                }}
                onInsertContent={(content) => {
                  // Insert generated content to editor
                  if (currentDocument?.editor) {
                    currentDocument.editor.commands.insertContent(content, {
                      parseOptions: {
                        preserveWhitespace: false,
                      },
                    });
                  }
                }}
                visible={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className={`academic-editor ${isFullscreen ? "fullscreen" : ""}`}>
      <Layout style={{ height: isFullscreen ? "100vh" : "80vh" }}>
        {/* Header */}
        <Header className="editor-header">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                {isMobile && <Button type="text" icon={<MenuOutlined />} onClick={() => setMobileDrawerVisible(true)} />}
                <EditOutlined style={{ color: "#ee1d1d", fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, color: "white" }}>
                  学术写作编辑器
                </Title>
                {currentDocument && <span style={{ color: "#fff", fontSize: 20 }}>- {currentDocument.title}</span>}
              </Space>
            </Col>

            <Col>
              <Space>
                <Button type="text" icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} style={{ color: "white" }} />
              </Space>
            </Col>
          </Row>
        </Header>

        <Layout>
          {/* Sidebar for Desktop */}
          {!isMobile && (
            <Sider
              width="20%"
              collapsed={sidebarCollapsed || isFullscreen}
              collapsedWidth={0}
              className="editor-sider"
              style={{
                background: "white",
                borderRight: "1px solid #e8e8e8",
                flex: 1,
              }}
            >
              {sidebarContent}
            </Sider>
          )}

          {/* Mobile Drawer */}
          {isMobile && (
            <Drawer title="编辑器工具" placement="left" onClose={() => setMobileDrawerVisible(false)} open={mobileDrawerVisible} width={320} styles={{ body: { padding: 0 } }}>
              {sidebarContent}
            </Drawer>
          )}

          {/* Main Content */}
          <Content className="editor-main-content">
            {currentDocument ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="editor-container">
                <TipTapEditor
                  key={currentDocument.id}
                  initialContent={currentDocument.content}
                  onChange={handleDocumentChange}
                  onTextSelection={setSelectedText}
                  onAIOptimize={handleAIOptimize}
                  onAIPolish={handleAIPolish}
                  onEditorReady={setEditorInstance}
                  placeholder="开始写作您的学术论文..."
                  editable={true}
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="editor-welcome">
                <Card className="welcome-card">
                  <div className="welcome-content">
                    <EditOutlined
                      style={{
                        fontSize: 64,
                        color: "#ee1d1d",
                        marginBottom: 24,
                      }}
                    />
                    <Title level={2}>欢迎使用学术写作编辑器</Title>
                    <p style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>专为学术写作设计的智能编辑器，支持数学公式、图表、定理等学术元素</p>

                    <Space direction="vertical" size="large">
                      <Button
                        type="primary"
                        size="large"
                        icon={<FileTextOutlined />}
                        onClick={() => {
                          // Trigger document creation
                          setActiveTab("documents");
                          if (isMobile) {
                            setMobileDrawerVisible(true);
                          }
                        }}
                      >
                        创建新文档
                      </Button>

                      <div className="feature-list">
                        <Title level={4}>功能特色</Title>
                        <ul style={{ textAlign: "left", color: "#666" }}>
                          <li>自动编号的标题结构</li>
                          <li>数学公式支持 (KaTeX)</li>
                          <li>图表与标题管理</li>
                          <li>定理、引理等学术块</li>
                          <li>文档大纲导航</li>
                          <li>自动保存功能</li>
                        </ul>
                      </div>
                    </Space>
                  </div>
                </Card>
              </motion.div>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* 右侧悬浮工具面板 */}
      <FloatingToolPanel
        editor={editorInstance}
        onInsertCitation={(paper) => {
          console.log("Citation inserted:", paper);
        }}
      />
    </div>
  );
};

export default AcademicEditor;
