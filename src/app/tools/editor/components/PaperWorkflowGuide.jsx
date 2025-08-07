import React, { useState, useCallback, useEffect } from "react";
import { Modal, Steps, Button, Card, Space, Typography, Row, Col, Select, Input, Form, message, Progress, Alert, Tooltip, Divider } from "antd";
import { FileTextOutlined, UserOutlined, BulbOutlined, EditOutlined, CheckCircleOutlined, InfoCircleOutlined, RocketOutlined } from "@ant-design/icons";
import PaperTemplateService from "../services/PaperTemplateService";
import PaperStructureIntegration from "../services/PaperStructureIntegration";
import { PaperStructureConfig } from "../extensions/PaperStructureNodes";
import "./PaperWorkflowGuide.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 新建论文向导组件
 * 引导用户完成：模板选择 → 基础信息 → 准备完成 → 开始写作
 */
const NewPaperWizard = ({ visible, onClose, editor, onComplete, initialStep = 0 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [workflowData, setWorkflowData] = useState({
    template: null,
    basicInfo: {},
    outlineParams: {},
    completed: false,
  });
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 工作流程步骤定义
  const steps = [
    {
      title: "选择模板",
      icon: <FileTextOutlined />,
      description: "选择适合的论文模板",
    },
    {
      title: "基础信息",
      icon: <UserOutlined />,
      description: "填写论文基本信息",
    },
    {
      title: "准备完成",
      icon: <CheckCircleOutlined />,
      description: "确认配置信息",
    },
    {
      title: "开始写作",
      icon: <EditOutlined />,
      description: "创建论文结构",
    },
  ];

  // 获取可用模板
  const availableTemplates = PaperTemplateService.getAvailableTemplates();

  // 步骤1：模板选择
  const renderTemplateSelection = () => (
    <div className="workflow-step">
      <Title level={4}>
        <FileTextOutlined style={{ color: "#1890ff", marginRight: 8 }} />
        选择论文模板
      </Title>
      <Paragraph type="secondary">选择最适合您研究的论文模板，我们会为您创建标准的学术结构。</Paragraph>

      <Row gutter={[16, 16]}>
        {availableTemplates.map((template) => (
          <Col span={12} key={template.key}>
            <Card
              hoverable
              className={`template-card ${workflowData.template?.key === template.key ? "selected" : ""}`}
              onClick={() => setWorkflowData((prev) => ({ ...prev, template }))}
              style={{
                border: workflowData.template?.key === template.key ? "2px solid #1890ff" : "1px solid #d9d9d9",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  {template.key === "standard" && "📄"}
                  {template.key === "conference" && "🎤"}
                  {template.key === "journal" && "📚"}
                  {template.key === "thesis" && "🎓"}
                </div>
                <Title level={5}>{template.name}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {template.description}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {workflowData.template && <Alert message="模板已选择" description={`您选择了"${workflowData.template.name}"模板，这将为您创建标准的学术论文结构。`} type="success" showIcon style={{ marginTop: 16 }} />}
    </div>
  );

  // 步骤2：基础信息填写
  const renderBasicInfo = () => (
    <div className="workflow-step">
      <Title level={4}>
        <UserOutlined style={{ color: "#52c41a", marginRight: 8 }} />
        填写基础信息
      </Title>
      <Paragraph type="secondary">填写论文的基本信息，这些信息将自动填入对应的结构节点。</Paragraph>

      <Form
        form={form}
        layout="vertical"
        initialValues={workflowData.basicInfo}
        onValuesChange={(changedValues, allValues) => {
          setWorkflowData((prev) => ({ ...prev, basicInfo: allValues }));
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="title" label="论文标题" rules={[{ required: true, message: "请输入论文标题" }]}>
              <Input placeholder="请输入您的论文标题..." size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="firstName" label="名" rules={[{ required: true, message: "请输入您的名" }]}>
              <Input placeholder="名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lastName" label="姓" rules={[{ required: true, message: "请输入您的姓" }]}>
              <Input placeholder="姓" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="email" label="邮箱" rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}>
              <Input placeholder="your.email@university.edu" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="affiliation" label="机构" rules={[{ required: true, message: "请输入您的机构" }]}>
              <Input placeholder="您的大学或研究机构" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="keywords" label="关键词" rules={[{ required: true, message: "请输入关键词" }]}>
          <Input
            placeholder="请输入3-10个关键词，用逗号分隔"
            suffix={
              <Tooltip title="关键词将用于AI大纲生成">
                <InfoCircleOutlined style={{ color: "#1890ff" }} />
              </Tooltip>
            }
          />
        </Form.Item>

        <Form.Item name="researchField" label="研究领域">
          <Select placeholder="选择您的研究领域">
            <Option value="computer_science">计算机科学</Option>
            <Option value="engineering">工程学</Option>
            <Option value="medicine">医学</Option>
            <Option value="physics">物理学</Option>
            <Option value="chemistry">化学</Option>
            <Option value="biology">生物学</Option>
            <Option value="mathematics">数学</Option>
            <Option value="economics">经济学</Option>
            <Option value="psychology">心理学</Option>
            <Option value="other">其他</Option>
          </Select>
        </Form.Item>
      </Form>
    </div>
  );

  // 步骤3：准备完成
  const renderPreparationComplete = () => (
    <div className="workflow-step">
      <Title level={4}>
        <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
        准备完成
      </Title>
      <Paragraph type="secondary">您的论文配置已准备就绪，即将创建论文结构。</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>配置摘要：</Title>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>研究主题：</Text>
            <br />
            <Text>{workflowData.basicInfo.title || "未填写"}</Text>
          </Col>
          <Col span={12}>
            <Text strong>关键词：</Text>
            <br />
            <Text>{workflowData.basicInfo.keywords || "未填写"}</Text>
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>论文模板：</Text>
            <br />
            <Text>{workflowData.template?.name || "未选择"}</Text>
          </Col>
          <Col span={12}>
            <Text strong>研究领域：</Text>
            <br />
            <Text>{workflowData.basicInfo.researchField || "未选择"}</Text>
          </Col>
        </Row>
      </Card>

      <Alert
        message="下一步操作"
        description={
          <div>
            <p>点击"创建论文结构"将会：</p>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>应用选定的论文模板</li>
              <li>填入您的基础信息</li>
              <li>创建标准的学术论文结构</li>
            </ul>
            <Divider />
            <Text strong style={{ color: "#1890ff" }}>
              💡 提示：结构创建完成后，您可以在左侧"文档大纲"面板中使用AI生成详细的论文大纲。
            </Text>
          </div>
        }
        type="info"
        showIcon
      />
    </div>
  );

  // 步骤4：完成设置
  const renderCompletion = () => (
    <div className="workflow-step">
      <Title level={4}>
        <RocketOutlined style={{ color: "#52c41a", marginRight: 8 }} />
        准备就绪！
      </Title>
      <Paragraph type="secondary">所有设置已完成，点击"创建论文结构"将为您搭建完整的学术写作环境。</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>
          <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
          配置摘要
        </Title>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>模板类型：</Text>
            <br />
            <Text>{workflowData.template?.name}</Text>
          </Col>
          <Col span={8}>
            <Text strong>论文标题：</Text>
            <br />
            <Text>{workflowData.basicInfo.title}</Text>
          </Col>
          <Col span={8}>
            <Text strong>作者：</Text>
            <br />
            <Text>{`${workflowData.basicInfo.firstName} ${workflowData.basicInfo.lastName}`}</Text>
          </Col>
        </Row>
        <Divider />
        <Text strong>即将执行的操作：</Text>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>应用 {workflowData.template?.name} 模板</li>
          <li>填入您的基础信息</li>
          <li>创建标准的学术论文结构</li>
        </ul>
      </Card>

      <Alert
        message="📝 下一步：生成论文大纲"
        description={
          <div>
            <p>论文结构创建完成后，建议您：</p>
            <ol style={{ marginBottom: 8, paddingLeft: 20 }}>
              <li>在左侧切换到"文档大纲"面板</li>
              <li>点击"AI生成论文大纲"按钮</li>
              <li>根据您的研究主题生成详细的学术大纲</li>
            </ol>
            <Text type="secondary">💡 专业的大纲生成工具提供更丰富的配置选项和实时预览功能</Text>
          </div>
        }
        type="success"
        showIcon
      />
    </div>
  );

  // 下一步处理
  const handleNext = useCallback(async () => {
    if (currentStep === 0 && !workflowData.template) {
      message.warning("请先选择一个论文模板");
      return;
    }

    if (currentStep === 1) {
      try {
        await form.validateFields();
      } catch (error) {
        message.warning("请完善必填的基础信息");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, workflowData.template, form, steps.length]);

  // 上一步处理
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // 完成工作流程
  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 应用模板
      await PaperStructureIntegration.smartApplyTemplate(editor, workflowData.template.key);

      // 2. 填入基础信息
      if (workflowData.basicInfo.title) {
        editor.commands.updatePaperTitle({ mainTitle: workflowData.basicInfo.title });
      }

      if (workflowData.basicInfo.firstName && workflowData.basicInfo.lastName) {
        const author = {
          firstName: workflowData.basicInfo.firstName,
          lastName: workflowData.basicInfo.lastName,
          email: workflowData.basicInfo.email || "",
          affiliations: [1],
          roles: ["first", "corresponding"],
        };
        editor.commands.updateAuthorInfo({ authors: [author] });
      }

      if (workflowData.basicInfo.keywords) {
        const keywords = workflowData.basicInfo.keywords.split(",").map((k) => k.trim());
        editor.commands.updateKeywords({ keywords });
      }

      if (workflowData.basicInfo.affiliation) {
        const affiliation = {
          name: workflowData.basicInfo.affiliation,
          department: "",
          address: "",
          country: "",
        };
        editor.commands.updateAffiliation({ affiliations: [affiliation] });
      }

      // 3. 准备AI大纲参数（实际生成由用户在大纲面板中触发）
      const outlineParams = {
        topic: workflowData.basicInfo.title,
        keywords: workflowData.basicInfo.keywords?.split(",").map((k) => k.trim()) || [],
        researchFocus: workflowData.outlineParams.researchFocus,
        paperType: workflowData.template.key,
        targetLength: workflowData.outlineParams.targetLength || "medium",
      };

      message.success("🎉 论文结构已创建完成！建议您在左侧「文档大纲」面板中生成详细的AI大纲。");

      onComplete?.(outlineParams);
      onClose();
    } catch (error) {
      console.error("工作流程完成失败:", error);
      message.error("创建论文结构失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [editor, workflowData, onComplete, onClose]);

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderTemplateSelection();
      case 1:
        return renderBasicInfo();
      case 2:
        return renderPreparationComplete();
      case 3:
        return renderCompletion();
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <RocketOutlined style={{ color: "#1890ff" }} />
          新建论文向导
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          {currentStep > 0 && <Button onClick={handlePrev}>上一步</Button>}
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          ) : (
            <Button type="primary" loading={loading} onClick={handleComplete}>
              创建论文结构
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </div>

      <div style={{ minHeight: 400 }}>{renderStepContent()}</div>
    </Modal>
  );
};

export default NewPaperWizard;
