import { useState, useEffect, useMemo } from "react";
import { Tree, Typography, Card, Space, Button, Tooltip, Empty, Modal, Form, Input, Select, Row, Col, Divider, message } from "antd";
import { UnorderedListOutlined, EyeOutlined, EyeInvisibleOutlined, ExpandOutlined, CompressOutlined, BulbOutlined, CopyOutlined, CloseOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAIAssistant } from "../hooks/useAIAssistant";
import aiService from "../services/AIService";
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DocumentOutline = ({ editor, onNodeClick, showWordCount = true, collapsible = true }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  // AI outline generation states
  const [outlineModalVisible, setOutlineModalVisible] = useState(false);
  const [outlineForm] = Form.useForm();

  // Use AI Assistant hook (but we won't use generateOutline to avoid storing in state)
  const { isLoading, outlineData, clearOutline, getServiceStatus } = useAIAssistant();
  const [serviceStatus, setServiceStatus] = useState(null);

  // Check service status
  useEffect(() => {
    setServiceStatus(getServiceStatus());
  }, [getServiceStatus]);

  // 简化的大纲生成处理函数 - 直接插入TipTap JSON
  const handleGenerateOutline = async (values) => {
    const params = {
      topic: values.topic,
      keywords: values.keywords?.split(",").map((k) => k.trim()) || [],
      researchFocus: values.researchFocus,
      paperType: values.paperType,
      targetLength: values.targetLength,
    };

    try {
      if (!aiService.isConfigured()) {
        message.warning("请先配置AI服务API密钥");
        return;
      }

      message.loading("正在生成学术论文大纲...", 0);

      const response = await aiService.generateEnhancedOutline(params);
      const content = response.content || response.choices?.[0]?.message?.content;

      if (content && editor) {
        try {
          // 解析AI返回的JSON内容
          let jsonContent;
          if (typeof content === "string") {
            // 处理可能的markdown包装
            let cleanContent = content.trim();
            if (cleanContent.startsWith("```json")) {
              cleanContent = cleanContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (cleanContent.startsWith("```")) {
              cleanContent = cleanContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }
            jsonContent = JSON.parse(cleanContent);
          } else {
            jsonContent = content;
          }

          // 直接插入TipTap JSON格式
          editor.commands.insertContent(jsonContent);

          // 关闭模态框并重置表单
          setOutlineModalVisible(false);
          outlineForm.resetFields();

          message.destroy();
          message.success("论文大纲已插入到编辑器中");
        } catch (parseError) {
          console.error("解析大纲JSON失败:", parseError);
          message.destroy();
          message.error(`解析大纲数据失败: ${parseError.message}`);
        }
      } else {
        message.destroy();
        message.error("AI服务返回空内容或编辑器未就绪");
      }
    } catch (error) {
      console.error("Error generating outline:", error);
      message.destroy();
      message.error(`生成大纲时出现错误: ${error.message}`);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("已复制到剪贴板");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      message.error("复制失败");
    }
  };

  // Monitor editor content changes
  useEffect(() => {
    if (!editor) return;

    const updateContent = () => {
      const content = editor.getHTML();
      setEditorContent(content);
    };

    // Initial content
    updateContent();

    // Listen to editor updates
    editor.on("update", updateContent);

    return () => {
      editor.off("update", updateContent);
    };
  }, [editor]);

  // 简化的大纲提取函数 - 适配标准heading
  const extractOutline = useMemo(() => {
    if (!editor) {
      return [];
    }

    const outline = [];
    const stack = []; // Stack to maintain hierarchy
    let nodeId = 0;

    // 手动计数器，用于生成编号
    const counters = [0, 0, 0, 0, 0, 0]; // H1-H6

    editor.state.doc.descendants((node, pos) => {
      // 检查是否为标题节点（heading或numberedHeading）
      if (node.type.name === "heading" || node.type.name === "numberedHeading") {
        const level = node.attrs.level;
        const originalText = node.textContent;

        // 清理标题文本，移除可能存在的编号前缀
        // 匹配格式：1. 1.1. 1.1.1. 等，但保留纯文本
        const cleanText = originalText.replace(/^\d+(\.\d+)*\.?\s+/, "").trim();

        // 生成编号字符串 - 一级标题不编号，从二级开始
        let number = "";
        if (level > 1) {
          // 更新计数器（从二级标题开始）
          counters[level - 1]++;
          // 重置更低级别的计数器
          for (let i = level; i < counters.length; i++) {
            counters[i] = 0;
          }

          // 生成编号字符串，跳过一级标题
          const relevantCounters = counters.slice(1, level); // 从索引1开始（二级标题）
          if (relevantCounters.some((n) => n > 0)) {
            number = relevantCounters.filter((n) => n > 0).join(".");
          }
        } else {
          // 一级标题重置所有计数器
          for (let i = 0; i < counters.length; i++) {
            counters[i] = 0;
          }
        }

        // Count words in this heading section
        let wordCount = 0;
        editor.state.doc.nodesBetween(pos, editor.state.doc.content.size, (nextNode, nextPos) => {
          if ((nextNode.type.name === "heading" || nextNode.type.name === "numberedHeading") && nextPos > pos) {
            return false; // Stop iteration
          }
          if (nextNode.isText) {
            wordCount += nextNode.text.split(/\s+/).filter((word) => word.length > 0).length;
          }
        });

        const currentNode = {
          key: `heading-${nodeId++}`,
          title: (
            <div className="outline-node">
              <Space>
                {level > 1 && number && (
                  <Text strong style={{ color: "#ee1d1d" }}>
                    {number}.
                  </Text>
                )}
                <Text>{cleanText || "未命名标题"}</Text>
                {showWordCount && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    ({wordCount} 字)
                  </Text>
                )}
              </Space>
            </div>
          ),
          level,
          position: pos,
          wordCount,
          children: [],
        };

        // Maintain hierarchy using stack
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          outline.push(currentNode);
        } else {
          stack[stack.length - 1].children.push(currentNode);
        }

        stack.push(currentNode);
      }
    });

    return outline;
  }, [editor, showWordCount, editorContent]);

  // Update tree data when outline changes
  useEffect(() => {
    setTreeData(extractOutline);

    // Auto-expand all nodes initially
    if (extractOutline.length > 0 && expandedKeys.length === 0) {
      const allKeys = [];
      const collectKeys = (nodes) => {
        nodes.forEach((node) => {
          allKeys.push(node.key);
          if (node.children) {
            collectKeys(node.children);
          }
        });
      };
      collectKeys(extractOutline);
      setExpandedKeys(allKeys);
    }
  }, [extractOutline, expandedKeys.length]);

  // Handle node click - scroll to heading in editor
  const handleNodeClick = (selectedKeys, info) => {
    if (selectedKeys.length > 0 && info.node.position !== undefined) {
      const position = info.node.position;

      // Scroll to position in editor
      if (editor) {
        editor.commands.focus();
        editor.commands.setTextSelection(position);

        // Scroll into view
        const editorElement = editor.view.dom;
        const targetElement = editorElement.querySelector(`[data-position="${position}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      onNodeClick?.(info.node);
    }
  };

  // Toggle expand/collapse all
  const toggleExpandAll = () => {
    if (isExpanded) {
      setExpandedKeys([]);
    } else {
      const allKeys = [];
      const collectKeys = (nodes) => {
        nodes.forEach((node) => {
          allKeys.push(node.key);
          if (node.children) {
            collectKeys(node.children);
          }
        });
      };
      collectKeys(treeData);
      setExpandedKeys(allKeys);
    }
    setIsExpanded(!isExpanded);
  };

  // Calculate total document statistics
  const documentStats = useMemo(() => {
    let totalWords = 0;
    let totalHeadings = 0;

    const countStats = (nodes) => {
      nodes.forEach((node) => {
        totalWords += node.wordCount || 0;
        totalHeadings += 1;
        if (node.children) {
          countStats(node.children);
        }
      });
    };

    countStats(treeData);

    return { totalWords, totalHeadings };
  }, [treeData]);

  if (!isVisible) {
    return (
      <motion.div initial={{ width: 0 }} animate={{ width: "auto" }} className="outline-collapsed">
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setIsVisible(true)}
          style={{
            writingMode: "vertical-rl",
            height: 100,
            padding: "8px 4px",
          }}
        >
          大纲
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div exit={{ width: 0, opacity: 0 }} className="document-outline">
      <Card size="small" className="outline-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="outline-header">
          <Space>
            <UnorderedListOutlined style={{ color: "#ee1d1d" }} />
            <Title level={5} style={{ margin: 0 }}>
              文档大纲
            </Title>
          </Space>

          <Space>
            <Tooltip title="AI生成论文大纲">
              <Button type="text" size="small" icon={<BulbOutlined />} onClick={() => setOutlineModalVisible(true)} disabled={!serviceStatus?.configured} style={{ color: "#ee1d1d" }} />
            </Tooltip>
            {collapsible && (
              <Tooltip title={isExpanded ? "折叠全部" : "展开全部"}>
                <Button type="text" size="small" icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />} onClick={toggleExpandAll} />
              </Tooltip>
            )}
            <Tooltip title="隐藏大纲">
              <Button type="text" size="small" icon={<EyeInvisibleOutlined />} onClick={() => setIsVisible(false)} />
            </Tooltip>
          </Space>
        </div>

        {/* Document Statistics */}
        {treeData.length > 0 && (
          <div className="outline-stats">
            <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {documentStats.totalHeadings} 个标题
              </Text>
              {showWordCount && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  约 {documentStats.totalWords} 字
                </Text>
              )}
            </Space>
          </div>
        )}

        {/* Outline Tree */}
        <div className="outline-content" style={{ flex: 1 }}>
          {treeData.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无标题" style={{ margin: "20px 0" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                在编辑器中添加标题来生成大纲
              </Text>
            </Empty>
          ) : (
            <Tree treeData={treeData} expandedKeys={expandedKeys} onExpand={setExpandedKeys} onSelect={handleNodeClick} showLine={{ showLeafIcon: false }} className="outline-tree" blockNode />
          )}
        </div>

        {/* AI Generated Outline Display */}
        {outlineData && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <div className="ai-outline-display">
              <Space>
                <Title level={5} style={{ margin: 0, color: "#ee1d1d" }}>
                  AI生成的大纲
                </Title>
                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(typeof outlineData === "object" && outlineData.type !== "text" ? JSON.stringify(outlineData, null, 2) : outlineData.content || outlineData)} />
                <Button size="small" type="text" icon={<CloseOutlined />} onClick={clearOutline} />
              </Space>
              <div
                style={{
                  maxHeight: "200px",
                  overflow: "auto",
                  padding: "12px",
                  marginTop: "8px",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                {typeof outlineData === "object" && outlineData.type !== "text" ? (
                  <pre
                    style={{
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      fontFamily: "Monaco, 'Courier New', monospace",
                    }}
                  >
                    {JSON.stringify(outlineData, null, 2)}
                  </pre>
                ) : (
                  <div
                    style={{
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {outlineData.content || outlineData}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        {treeData.length > 0 && (
          <div className="outline-actions">
            <Space size="small">
              <Button
                type="text"
                size="small"
                onClick={() => {
                  if (editor) {
                    editor.commands.focus();
                    editor.commands.setTextSelection(0);
                  }
                }}
              >
                回到顶部
              </Button>
              <Button
                type="text"
                size="small"
                onClick={() => {
                  if (editor) {
                    const docSize = editor.state.doc.content.size;
                    editor.commands.focus();
                    editor.commands.setTextSelection(docSize);
                  }
                }}
              >
                跳到末尾
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* Outline Generation Modal */}
      <Modal title="AI生成论文大纲" open={outlineModalVisible} onCancel={() => setOutlineModalVisible(false)} footer={null} width={600}>
        <Form form={outlineForm} layout="vertical" onFinish={handleGenerateOutline}>
          <Form.Item name="topic" label="研究主题" rules={[{ required: true, message: "请输入研究主题" }]}>
            <Input placeholder="例如：机器学习在医疗诊断中的应用" />
          </Form.Item>

          <Form.Item name="keywords" label="关键词">
            <Input placeholder="用逗号分隔，例如：机器学习,医疗诊断,深度学习" />
          </Form.Item>

          <Form.Item name="researchFocus" label="研究重点">
            <TextArea rows={2} placeholder="描述研究的具体重点和方向..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paperType" label="论文类型" initialValue="research">
                <Select>
                  <Option value="research">研究论文</Option>
                  <Option value="review">综述论文</Option>
                  <Option value="case">案例研究</Option>
                  <Option value="theoretical">理论分析</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetLength" label="目标长度" initialValue="medium">
                <Select>
                  <Option value="short">短篇 (3000-5000字)</Option>
                  <Option value="medium">中篇 (5000-8000字)</Option>
                  <Option value="long">长篇 (8000字以上)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                生成论文大纲
              </Button>
              <Button onClick={() => setOutlineModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .document-outline {
          height: 100%;
          border-right: 1px solid #e8e8e8;
        }

        .outline-card {
          border: none;
          border-radius: 0;
        }

        .outline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 12px;
        }

        .outline-stats {
          padding: 8px 12px;
          background: #fafafa;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .outline-content {
          min-height: 200px;
        }

        .outline-tree .ant-tree-node-content-wrapper {
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .outline-tree .ant-tree-node-content-wrapper:hover {
          background: #f5f5f5;
        }

        .outline-tree .ant-tree-node-selected .ant-tree-node-content-wrapper {
          background: #fff2f0;
          border: 1px solid #ffccc7;
        }

        .outline-node {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .outline-actions {
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
          margin-top: 12px;
          text-align: center;
        }

        .outline-collapsed {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          border-right: 1px solid #e8e8e8;
        }

        @media (max-width: 768px) {
          .document-outline {
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            z-index: 1000;
            background: white;
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default DocumentOutline;
