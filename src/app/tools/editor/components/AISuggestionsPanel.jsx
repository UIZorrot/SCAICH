import { useState, useEffect } from "react";
import { Card, Button, Space, Typography, Divider, List, Tooltip, Empty, Spin, Alert, Modal, Input, Select, Form, Row, Col } from "antd";
import { BulbOutlined, EditOutlined, BookOutlined, CloseOutlined, CopyOutlined, CheckOutlined, ReloadOutlined, SettingOutlined, CheckCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAIAssistant } from "../hooks/useAIAssistant";
import aiService from "../services/AIService";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AISuggestionsPanel = ({ editor, selectedText = "", onApplySuggestion, onInsertContent, visible = true }) => {
  const [improvementModalVisible, setImprovementModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const [improvementForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { isLoading, suggestions, improveContent, getWritingSuggestions, clearSuggestions, getServiceStatus } = useAIAssistant();

  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    setServiceStatus(getServiceStatus());
  }, [getServiceStatus]);

  // Initialize configuration form
  useEffect(() => {
    const currentConfig = aiService.getCurrentConfiguration();
    configForm.setFieldsValue({
      baseURL: currentConfig.baseURL || "",
      apiKey: currentConfig.apiKey || "",
      model: currentConfig.model || "gpt-4",
    });
  }, [configForm]);

  // Remove auto-generation - let users manually trigger suggestions
  // useEffect(() => {
  //   if (selectedText && selectedText.length > 10) {
  //     handleGetSuggestions();
  //   }
  // }, [selectedText]);

  const handleGetSuggestions = async (suggestionType = "general") => {
    if (!selectedText) return;

    await getWritingSuggestions({
      content: selectedText,
      context: editor?.getHTML() || "",
      suggestionType: suggestionType,
    });
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

  // 打开配置模态框
  const openConfigModal = () => {
    const currentConfig = aiService.getCurrentConfiguration();
    configForm.setFieldsValue({
      baseURL: currentConfig.baseURL || "",
      apiKey: currentConfig.apiKey || "",
      model: currentConfig.model || "gpt-4",
    });
    setConfigModalVisible(true);
  };

  // 保存配置
  const handleSaveConfig = async (values) => {
    try {
      const success = aiService.saveUserConfiguration(values);
      if (success) {
        setConfigModalVisible(false);
        // 更新服务状态
        setServiceStatus(getServiceStatus());
        // message.success("AI服务配置已保存！");
      } else {
        // message.error("保存配置失败，请重试");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      // message.error(`保存配置失败: ${error.message}`);
    }
  };

  // 测试连接
  const testConnection = async () => {
    const values = configForm.getFieldsValue();
    if (!values.baseURL || !values.apiKey) {
      // message.warning("请先填写API URL和API Key");
      return;
    }

    setIsTestingConnection(true);
    try {
      // 发送测试请求
      const response = await fetch(`${values.baseURL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${values.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // message.success("连接测试成功！API服务可正常访问");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      // message.error(`连接测试失败: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
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
            <Tooltip title="清除建议">
              <Button size="small" type="text" icon={<CloseOutlined />} onClick={clearSuggestions} disabled={suggestions.length === 0} />
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
            <Space>
              <Tooltip title="AI服务配置">
                <Button
                  size="large"
                  type="primary"
                  icon={serviceStatus?.configured ? <CheckCircleOutlined /> : <SettingOutlined />}
                  onClick={openConfigModal}
                  style={{
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  🤖 AI服务配置
                </Button>
              </Tooltip>
            </Space>

            {!serviceStatus?.configured && (
              <Alert
                message="AI服务未配置"
                description={
                  <span>
                    请配置您的AI服务API密钥。
                    <Button type="link" size="small" onClick={openConfigModal} style={{ padding: 0, height: "auto", marginLeft: "4px" }}>
                      点击配置
                    </Button>
                  </span>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {serviceStatus?.configured && <Alert message="AI服务已配置" description={`模型: ${serviceStatus.model || "gpt-4"} | 状态: 就绪`} type="success" showIcon style={{ marginBottom: 16 }} />}

            {/* Quick Actions */}
            {selectedText && (
              <Space direction="vertical" style={{ width: "100%" }} size="small">
                <Button block size="small" icon={<BookOutlined />} onClick={() => setImprovementModalVisible(true)} disabled={!serviceStatus?.configured}>
                  ✨ 快速优化选中文本
                </Button>

                {/* AI Suggestions Trigger */}
                <Button block size="small" icon={<BulbOutlined />} onClick={() => handleGetSuggestions("general")} disabled={!serviceStatus?.configured} loading={isLoading} style={{ marginBottom: "8px" }}>
                  💡 获取AI写作建议
                </Button>

                {/* Quick Suggestion Types */}
                {/* flex-wrap */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <Button size="small" onClick={() => handleGetSuggestions("grammar")} disabled={!serviceStatus?.configured || isLoading} style={{ fontSize: "11px" }}>
                    📝 语法
                  </Button>
                  <Button size="small" onClick={() => handleGetSuggestions("style")} disabled={!serviceStatus?.configured || isLoading} style={{ fontSize: "11px" }}>
                    ✍️ 文风
                  </Button>
                  <Button size="small" onClick={() => handleGetSuggestions("clarity")} disabled={!serviceStatus?.configured || isLoading} style={{ fontSize: "11px" }}>
                    💡 清晰度
                  </Button>
                  <Button size="small" onClick={() => handleGetSuggestions("conciseness")} disabled={!serviceStatus?.configured || isLoading} style={{ fontSize: "11px" }}>
                    🎯 简洁
                  </Button>
                </div>
              </Space>
            )}

            <Divider style={{ margin: "12px 0" }} />
          </div>

          {/* Suggestions List */}
          <div className="suggestions-content">
            {selectedText ? (
              suggestions.length > 0 ? (
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
              ) : isLoading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ display: "block", marginTop: "8px", fontSize: "12px" }}>
                    AI正在分析您的文本...
                  </Text>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="正在为您生成写作建议" style={{ margin: "20px 0" }} />
              )
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      选择文本后点击"获取AI写作建议"
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      💡 支持语法、文风、清晰度、简洁性优化
                    </Text>
                  </div>
                }
                style={{ margin: "20px 0" }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Quick Improvement Modal */}
      <Modal title="✨ 快速优化文本" open={improvementModalVisible} onCancel={() => setImprovementModalVisible(false)} footer={null} width={500}>
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
            <TextArea rows={4} placeholder="粘贴或输入要优化的文本..." style={{ fontSize: "14px" }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="improvementType" label="优化重点">
                <Select size="small">
                  <Option value="general">🔄 综合优化</Option>
                  <Option value="grammar">📝 语法修正</Option>
                  <Option value="clarity">💡 提高清晰度</Option>
                  <Option value="style">✍️ 改善文风</Option>
                  <Option value="conciseness">🎯 精简表达</Option>
                  <Option value="expansion">📈 扩展内容</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetAudience" label="目标读者">
                <Select size="small">
                  <Option value="academic">🎓 学术读者</Option>
                  <Option value="general">👥 一般读者</Option>
                  <Option value="expert">🔬 专业专家</Option>
                  <Option value="student">📚 学生群体</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ margin: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setImprovementModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={isLoading} icon={<BookOutlined />}>
                开始优化
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* AI Service Configuration Modal */}
      <Modal title="🤖 AI服务配置" open={configModalVisible} onCancel={() => setConfigModalVisible(false)} footer={null} width={600}>
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "6px",
              marginBottom: "16px",
            }}
          >
            <Space>
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
              <Text strong>当前状态: </Text>
              <Text style={{ color: serviceStatus?.configured ? "#52c41a" : "#faad14" }}>{serviceStatus?.configured ? "已配置" : "未配置"}</Text>
              {serviceStatus?.configured && <Text type="secondary">| 模型: {serviceStatus?.model}</Text>}
            </Space>
          </div>

          <Text type="secondary" style={{ fontSize: "14px" }}>
            💡 请配置您自己的AI服务API，我们不提供默认的API Key。支持OpenAI兼容的API服务。
          </Text>
        </div>

        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
          initialValues={{
            model: "gpt-4",
          }}
        >
          <Form.Item
            name="baseURL"
            label="API Base URL"
            rules={[
              { required: true, message: "请输入API Base URL" },
              { type: "url", message: "请输入有效的URL" },
            ]}
          >
            <Input placeholder="例如: https://api.openai.com/v1" style={{ fontFamily: "Monaco, monospace", fontSize: "13px" }} />
          </Form.Item>

          <Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: "请输入API Key" }]}>
            <Input.Password placeholder="sk-..." style={{ fontFamily: "Monaco, monospace", fontSize: "13px" }} />
          </Form.Item>

          <Form.Item name="model" label="模型名称" rules={[{ required: true, message: "请输入模型名称" }]}>
            <Input placeholder="例如: gpt-4, claude-3-sonnet, gemini-pro" style={{ fontFamily: "Monaco, monospace", fontSize: "13px" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存配置
              </Button>
              <Button onClick={testConnection} loading={isTestingConnection} icon={<CheckCircleOutlined />}>
                测试连接
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ padding: "12px", backgroundColor: "#fafafa", borderRadius: "6px" }}>
          <Text strong style={{ fontSize: "14px" }}>
            💡 配置提示
          </Text>
          <div style={{ marginTop: "8px" }}>
            <Space direction="vertical" size={4}>
              <Text style={{ fontSize: "12px" }}>
                <strong>OpenAI官方:</strong> https://api.openai.com/v1
              </Text>
              <Text style={{ fontSize: "12px" }}>
                <strong>国内镜像:</strong> 支持OpenAI格式的API接口
              </Text>
              <Text style={{ fontSize: "11px", color: "#666" }}>⚠️ 请确保您的API密钥有足够的余额和权限</Text>
            </Space>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default AISuggestionsPanel;
