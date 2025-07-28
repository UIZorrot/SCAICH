import { useState, useEffect } from "react";
import { Card, Button, Space, Typography, Divider, List, Tooltip, Empty, Spin, Alert, Modal, Input, Select, Form, Row, Col } from "antd";
import { BulbOutlined, EditOutlined, BookOutlined, CloseOutlined, CopyOutlined, CheckOutlined, ReloadOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAIAssistant } from "../hooks/useAIAssistant";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AISuggestionsPanel = ({ editor, selectedText = "", onApplySuggestion, onInsertContent, visible = true }) => {
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [improvementModalVisible, setImprovementModalVisible] = useState(false);

  const [contentForm] = Form.useForm();
  const [improvementForm] = Form.useForm();

  const { isLoading, suggestions, generateSectionContent, improveContent, getWritingSuggestions, clearSuggestions, getServiceStatus } = useAIAssistant();

  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    setServiceStatus(getServiceStatus());
  }, [getServiceStatus]);

  // Auto-generate suggestions when text is selected
  useEffect(() => {
    if (selectedText && selectedText.length > 10) {
      handleGetSuggestions();
    }
  }, [selectedText]);

  const handleGetSuggestions = async () => {
    if (!selectedText) return;

    await getWritingSuggestions({
      content: selectedText,
      context: editor?.getHTML() || "",
      suggestionType: "general",
    });
  };

  const handleGenerateContent = async (values) => {
    const result = await generateSectionContent({
      sectionTitle: values.sectionTitle,
      outline: values.outline,
      context: editor?.getHTML() || "",
      wordCount: values.wordCount,
      style: values.style,
    });

    if (result && onInsertContent) {
      onInsertContent(result);
      setContentModalVisible(false);
      contentForm.resetFields();
    }
  };

  const handleImproveContent = async (values) => {
    const contentToImprove = values.content || selectedText;
    if (!contentToImprove) return;

    const result = await improveContent({
      content: contentToImprove,
      improvementType: values.improvementType,
      targetAudience: values.targetAudience,
    });

    if (result && onApplySuggestion) {
      onApplySuggestion(result);
      setImprovementModalVisible(false);
      improvementForm.resetFields();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // message.success('已复制到剪贴板');
  };

  if (!visible) return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="ai-suggestions-panel">
      <Card
        title={
          <Space>
            <BulbOutlined style={{ color: "#ee1d1d" }} />
            <span>AI 写作助手</span>
            {isLoading && <Spin size="small" />}
          </Space>
        }
        size="small"
        extra={
          <Space>
            <Tooltip title="刷新建议">
              <Button size="small" icon={<ReloadOutlined />} onClick={handleGetSuggestions} disabled={!selectedText || isLoading} />
            </Tooltip>
            <Tooltip title="清除建议">
              <Button size="small" icon={<CloseOutlined />} onClick={clearSuggestions} />
            </Tooltip>
          </Space>
        }
        className="ai-panel-card"
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        styles={{ body: { flex: 1, display: "flex", flexDirection: "column", padding: "16px 16px 8px" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Fixed Header Section */}
          <div style={{ flexShrink: 0 }}>
            {!serviceStatus?.configured && <Alert message="AI服务未配置" description="请在环境变量中设置 REACT_APP_OPENAI_API_KEY" type="warning" showIcon style={{ marginBottom: 16 }} />}

            {serviceStatus?.configured && <Alert message="AI服务已配置" description={`模型: ${serviceStatus.model || "gpt-4"} | 状态: 就绪`} type="success" showIcon style={{ marginBottom: 16 }} />}

            {/* Action Buttons */}
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <Row gutter={8}>
                <Col span={24}>
                  <Button block size="small" icon={<EditOutlined />} onClick={() => setContentModalVisible(true)} disabled={!serviceStatus?.configured}>
                    生成内容
                  </Button>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={24}>
                  <Button block size="small" icon={<BookOutlined />} onClick={() => setImprovementModalVisible(true)} disabled={!serviceStatus?.configured || !selectedText}>
                    优化文本
                  </Button>
                </Col>
              </Row>
            </Space>

            <Divider style={{ margin: "12px 0" }} />
          </div>

          {/* Suggestions List */}
          <div className="suggestions-content">
            {suggestions.length > 0 ? (
              <List
                size="small"
                dataSource={suggestions}
                renderItem={(suggestion) => (
                  <List.Item
                    actions={[
                      <Tooltip title="应用建议">
                        <Button size="small" type="text" icon={<CheckOutlined />} onClick={() => onApplySuggestion?.(suggestion)} />
                      </Tooltip>,
                      <Tooltip title="复制">
                        <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(suggestion)} />
                      </Tooltip>,
                    ]}
                  >
                    <Text style={{ fontSize: "12px" }}>{suggestion}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择文本以获取AI建议" style={{ margin: "20px 0" }} />
            )}
          </div>
        </div>
      </Card>

      {/* Content Generation Modal */}
      <Modal title="生成内容" open={contentModalVisible} onCancel={() => setContentModalVisible(false)} footer={null} width={600}>
        <Form form={contentForm} layout="vertical" onFinish={handleGenerateContent}>
          <Form.Item name="sectionTitle" label="章节标题" rules={[{ required: true, message: "请输入章节标题" }]}>
            <Input placeholder="例如：文献综述" />
          </Form.Item>

          <Form.Item name="outline" label="大纲或上下文">
            <TextArea rows={4} placeholder="提供相关的大纲信息或上下文..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="wordCount" label="字数" initialValue={300}>
                <Select>
                  <Option value={200}>200字</Option>
                  <Option value={300}>300字</Option>
                  <Option value={500}>500字</Option>
                  <Option value={800}>800字</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="style" label="写作风格" initialValue="academic">
                <Select>
                  <Option value="academic">学术正式</Option>
                  <Option value="technical">技术性</Option>
                  <Option value="descriptive">描述性</Option>
                  <Option value="analytical">分析性</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                生成内容
              </Button>
              <Button onClick={() => setContentModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Content Improvement Modal */}
      <Modal title="优化内容" open={improvementModalVisible} onCancel={() => setImprovementModalVisible(false)} footer={null} width={600}>
        <Form
          form={improvementForm}
          layout="vertical"
          onFinish={handleImproveContent}
          initialValues={{
            content: selectedText,
            improvementType: "general",
            targetAudience: "academic",
          }}
        >
          <Form.Item name="content" label="要优化的内容">
            <TextArea rows={6} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="improvementType" label="优化类型">
                <Select>
                  <Option value="general">综合优化</Option>
                  <Option value="grammar">语法修正</Option>
                  <Option value="clarity">提高清晰度</Option>
                  <Option value="style">改善文风</Option>
                  <Option value="conciseness">精简表达</Option>
                  <Option value="expansion">扩展内容</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetAudience" label="目标读者">
                <Select>
                  <Option value="academic">学术读者</Option>
                  <Option value="general">一般读者</Option>
                  <Option value="expert">专业专家</Option>
                  <Option value="student">学生群体</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                开始优化
              </Button>
              <Button onClick={() => setImprovementModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default AISuggestionsPanel;
