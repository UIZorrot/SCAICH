import { useState, useCallback, useEffect, useRef } from "react";
import { Layout, Button, Space, Typography, Card, Row, Col, Drawer, message, Modal, Select } from "antd";
import { EditOutlined, FileTextOutlined, UnorderedListOutlined, BulbOutlined, FullscreenOutlined, FullscreenExitOutlined, MenuOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import TipTapEditor from "./components/TipTapEditor";
import DocumentManager from "./components/DocumentManager";
import DocumentOutline from "./components/DocumentOutline";
import AISuggestionsPanel from "./components/AISuggestionsPanel";
import FloatingToolPanel from "./components/FloatingToolPanel";
import BibliographyPanel from "./components/BibliographyPanel";
import "./components/AISuggestionsPanel.css";
import "./AcademicEditor.css";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const AcademicEditor = ({ onBackToTools }) => {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("documents"); // 'documents', 'outline', 'ai', or 'bibliography'
  const [selectedText, setSelectedText] = useState("");
  const [editorInstance, setEditorInstance] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Ref for DocumentManager to access its methods
  const documentManagerRef = useRef(null);

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

  // Add global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S or Cmd+S for save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (currentDocument) {
          // Use the DocumentManager ref to trigger save
          if (documentManagerRef.current && documentManagerRef.current.saveCurrentDocument) {
            documentManagerRef.current.saveCurrentDocument();
          } else {
            message.info("保存功能暂时不可用");
          }
        } else {
          message.warning("没有打开的文档需要保存");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentDocument]);

  // Sync hasUnsavedChanges state from DocumentManager
  useEffect(() => {
    const syncUnsavedChanges = () => {
      if (documentManagerRef.current) {
        setHasUnsavedChanges(documentManagerRef.current.hasUnsavedChanges || false);
      }
    };

    // Initial sync
    syncUnsavedChanges();

    // Set up interval to sync periodically
    const interval = setInterval(syncUnsavedChanges, 100);

    return () => clearInterval(interval);
  }, [currentDocument]);

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
      if (!text || text.trim().length === 0) {
        message.warning("请先选择要优化的文本");
        return;
      }

      try {
        message.loading("正在优化文本...", 0);

        // Import AI service singleton instance
        const aiService = (await import("./services/AIService")).default;

        const response = await aiService.improveContent({
          content: text,
          improvementType: "general",
          targetAudience: "academic",
        });

        const optimizedText = response.choices?.[0]?.message?.content;
        if (optimizedText) {
          message.destroy();
          // Show optimization result in a modal for user to choose
          Modal.confirm({
            title: "AI文本优化结果",
            content: (
              <div>
                <p>
                  <strong>原文：</strong>
                </p>
                <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", marginBottom: "16px", maxHeight: "150px", overflow: "auto" }}>{text}</div>
                <p>
                  <strong>优化后：</strong>
                </p>
                <div style={{ background: "#e6f7ff", padding: "8px", borderRadius: "4px", maxHeight: "150px", overflow: "auto" }}>{optimizedText}</div>
              </div>
            ),
            okText: "替换原文",
            cancelText: "取消",
            width: 700,
            onOk: () => {
              // Replace selected text with optimized version
              if (editorInstance) {
                const { from, to } = editorInstance.state.selection;
                if (from !== to) {
                  // Replace selected text
                  editorInstance.chain().focus().deleteRange({ from, to }).insertContent(optimizedText).run();
                } else {
                  // Insert at cursor position
                  editorInstance.chain().focus().insertContent(optimizedText).run();
                }
                message.success("文本已替换为优化版本");
              } else {
                message.error("编辑器未准备就绪");
              }
            },
          });
        } else {
          message.destroy();
          message.error("AI 服务返回空内容，请重试");
        }
      } catch (error) {
        message.destroy();
        console.error("AI optimization error:", error);
        message.error("文本优化失败：" + (error.message || "未知错误"));
      }
    },
    [editorInstance]
  );

  const handleAIPolish = useCallback(
    async (text) => {
      if (!text || text.trim().length === 0) {
        message.warning("请先选择要润色的文本");
        return;
      }

      try {
        message.loading("正在润色文本...", 0);

        // Import AI service singleton instance
        const aiService = (await import("./services/AIService")).default;

        const response = await aiService.improveContent({
          content: text,
          improvementType: "style",
          targetAudience: "academic",
        });

        const polishedText = response.choices?.[0]?.message?.content;
        if (polishedText) {
          message.destroy();
          // Show polishing result in a modal for user to choose
          Modal.confirm({
            title: "AI文本润色结果",
            content: (
              <div>
                <p>
                  <strong>原文：</strong>
                </p>
                <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", marginBottom: "16px", maxHeight: "150px", overflow: "auto" }}>{text}</div>
                <p>
                  <strong>润色后：</strong>
                </p>
                <div style={{ background: "#f6ffed", padding: "8px", borderRadius: "4px", maxHeight: "150px", overflow: "auto" }}>{polishedText}</div>
              </div>
            ),
            okText: "替换原文",
            cancelText: "取消",
            width: 700,
            onOk: () => {
              // Replace selected text with polished version
              if (editorInstance) {
                const { from, to } = editorInstance.state.selection;
                if (from !== to) {
                  // Replace selected text
                  editorInstance.chain().focus().deleteRange({ from, to }).insertContent(polishedText).run();
                } else {
                  // Insert at cursor position
                  editorInstance.chain().focus().insertContent(polishedText).run();
                }
                message.success("文本已替换为润色版本");
              } else {
                message.error("编辑器未准备就绪");
              }
            },
          });
        } else {
          message.destroy();
          message.error("AI 服务返回空内容，请重试");
        }
      } catch (error) {
        message.destroy();
        console.error("AI polish error:", error);
        message.error("文本润色失败：" + (error.message || "未知错误"));
      }
    },
    [editorInstance]
  );

  // AI translation handler
  const handleAITranslate = useCallback(
    async (text) => {
      if (!text || text.trim().length === 0) {
        message.warning("请先选择要翻译的文本");
        return;
      }

      // Language options
      const languages = [
        { label: "🇺🇸 英语 (English)", value: "英语" },
        { label: "🇯🇵 日语 (日本語)", value: "日语" },
        { label: "🇰🇷 韩语 (한국어)", value: "韩语" },
        { label: "🇫🇷 法语 (Français)", value: "法语" },
        { label: "🇩🇪 德语 (Deutsch)", value: "德语" },
        { label: "🇪🇸 西班牙语 (Español)", value: "西班牙语" },
        { label: "🇷🇺 俄语 (Русский)", value: "俄语" },
        { label: "🇮🇹 意大利语 (Italiano)", value: "意大利语" },
      ];

      let selectedLanguage = "英语"; // default

      Modal.confirm({
        title: "选择翻译语言",
        content: (
          <div style={{ marginTop: "16px" }}>
            <Select
              defaultValue="英语"
              style={{ width: "100%" }}
              placeholder="选择目标语言"
              onChange={(value) => {
                selectedLanguage = value;
              }}
              options={languages}
            />
          </div>
        ),
        okText: "开始翻译",
        cancelText: "取消",
        width: 400,
        onOk: async () => {
          try {
            message.loading("正在翻译文本...", 0);

            // Import AI service singleton instance
            const aiService = (await import("./services/AIService")).default;

            const response = await aiService.translateText({
              content: text,
              targetLanguage: selectedLanguage,
            });

            const translatedText = response.choices?.[0]?.message?.content;
            if (translatedText) {
              message.destroy();
              // Show translation result in a modal for user to choose
              Modal.confirm({
                title: `翻译结果 (${selectedLanguage})`,
                content: (
                  <div>
                    <p>
                      <strong>原文：</strong>
                    </p>
                    <div style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", marginBottom: "16px", maxHeight: "150px", overflow: "auto" }}>{text}</div>
                    <p>
                      <strong>翻译结果：</strong>
                    </p>
                    <div style={{ background: "#e6f7ff", padding: "8px", borderRadius: "4px", maxHeight: "150px", overflow: "auto" }}>{translatedText}</div>
                  </div>
                ),
                okText: "替换原文",
                cancelText: "取消",
                width: 700,
                onOk: () => {
                  // Replace selected text with translated version
                  if (editorInstance) {
                    const { from, to } = editorInstance.state.selection;
                    if (from !== to) {
                      // Replace selected text
                      editorInstance.chain().focus().deleteRange({ from, to }).insertContent(translatedText).run();
                    } else {
                      // Insert at cursor position
                      editorInstance.chain().focus().insertContent(translatedText).run();
                    }
                    message.success(`文本已翻译为${selectedLanguage}`);
                  } else {
                    message.error("编辑器未准备就绪");
                  }
                },
              });
            } else {
              message.destroy();
              message.error("AI 翻译服务返回空内容，请重试");
            }
          } catch (error) {
            message.destroy();
            console.error("AI translation error:", error);
            message.error("文本翻译失败：" + (error.message || "未知错误"));
          }
        },
      });
    },
    [editorInstance]
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Quick create document function
  const handleQuickCreateDocument = useCallback(async () => {
    if (documentManagerRef.current) {
      try {
        const newDoc = await documentManagerRef.current.createDocument();
        if (newDoc) {
          message.success("新文档已创建，开始编写吧！");
          // Close mobile drawer if open
          if (isMobile) {
            setMobileDrawerVisible(false);
          }
        }
      } catch (error) {
        console.error("Quick create document error:", error);
        message.error("创建文档失败，请重试");
      }
    }
  }, []);

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
        <Button type={activeTab === "bibliography" ? "primary" : "text"} icon={<FileTextOutlined />} onClick={() => setActiveTab("bibliography")} block disabled={!currentDocument}>
          参考文献
        </Button>
      </div>

      {/* DocumentManager should always be rendered to maintain ref */}
      <DocumentManager ref={documentManagerRef} currentDocument={currentDocument} onDocumentChange={setCurrentDocument} onDocumentLoad={handleDocumentLoad} autoSave={true} editorInstance={editorInstance} visible={activeTab === "documents"} />

      <div className="sidebar-content">
        <AnimatePresence mode="wait">
          {activeTab === "outline" && (
            <motion.div key="outline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <DocumentOutline
                editor={editorInstance}
                currentDocument={currentDocument}
                onSave={() => {
                  if (documentManagerRef.current && documentManagerRef.current.saveCurrentDocument) {
                    documentManagerRef.current.saveCurrentDocument();
                  } else {
                    message.info("保存功能暂时不可用");
                  }
                }}
                hasUnsavedChanges={hasUnsavedChanges}
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
                editor={editorInstance}
                selectedText={selectedText}
                onApplySuggestion={(suggestion) => {
                  // Apply suggestion to editor
                  if (editorInstance) {
                    editorInstance.commands.insertContent(suggestion);
                  }
                }}
                onInsertContent={(content) => {
                  // Insert generated content to editor
                  if (editorInstance) {
                    editorInstance.commands.insertContent(content, {
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
          {activeTab === "bibliography" && (
            <motion.div key="bibliography" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <BibliographyPanel editor={editorInstance} isVisible={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className={`academic-editor ${isFullscreen ? "fullscreen" : ""}`}>
      <Layout style={{ height: isFullscreen ? "86vh" : "85vh" }}>
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
          {!isMobile && !isFullscreen && (
            <Sider
              width="25%"
              collapsed={false}
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
                  onAITranslate={handleAITranslate}
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
                      <Button type="primary" size="large" icon={<FileTextOutlined />} onClick={handleQuickCreateDocument}>
                        创建新文档
                      </Button>

                      <div className="feature-list">
                        <Title level={4}>功能特色</Title>
                        <ul style={{ textAlign: "left", color: "#666" }}>
                          <li>自动编号的标题结构</li>
                          <li>数学公式支持 (KaTeX)</li>
                          <li>图表与标题管理</li>
                          <li>定理、引理等学术块</li>
                          <li>智能文献引用系统</li>
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
    </div>
  );
};

export default AcademicEditor;
