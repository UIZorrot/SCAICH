import React, { useState } from "react";
import { Card, Steps, Typography, Space, Tag, Button, Alert, Collapse } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  RocketOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const WorkflowValidator = ({ 
  user, 
  needsProfileSetup, 
  userGroups, 
  allGroups, 
  selectedGroup, 
  groupDocuments 
}) => {
  const [currentWorkflow, setCurrentWorkflow] = useState(0);

  // 定义 5 个核心工作流程
  const workflows = [
    {
      title: "用户认证和初始化流程",
      icon: <UserOutlined />,
      steps: [
        {
          title: "页面加载",
          description: "检查 Clerk 身份认证状态",
          status: user ? "finish" : "wait",
          details: user ? `已登录: ${user.firstName} ${user.lastName}` : "等待用户登录"
        },
        {
          title: "学者档案验证",
          description: "验证用户是否完成学者档案设置",
          status: needsProfileSetup ? "error" : "finish",
          details: needsProfileSetup ? "需要完成档案设置" : "档案已完成"
        },
        {
          title: "界面初始化",
          description: "加载用户群组数据和界面",
          status: (!needsProfileSetup && userGroups) ? "finish" : "wait",
          details: `已加载 ${userGroups?.length || 0} 个群组`
        }
      ]
    },
    {
      title: "群组创建流程",
      icon: <TeamOutlined />,
      steps: [
        {
          title: "点击创建群组",
          description: "用户点击创建群组按钮",
          status: "process",
          details: "触发创建群组模态框"
        },
        {
          title: "填写群组信息",
          description: "输入群组名称、描述、类型等",
          status: "wait",
          details: "支持公开和私有群组类型"
        },
        {
          title: "上传到 Irys",
          description: "将群组数据永久存储到区块链",
          status: "wait",
          details: "私有群组会生成 hashPrefix 邀请码"
        },
        {
          title: "刷新群组列表",
          description: "更新用户群组列表显示",
          status: "wait",
          details: "显示新创建的群组"
        }
      ]
    },
    {
      title: "群组加入流程",
      icon: <TeamOutlined />,
      steps: [
        {
          title: "选择加入方式",
          description: "公开群组直接加入，私有群组需要邀请码",
          status: "process",
          details: "支持两种加入方式"
        },
        {
          title: "验证权限",
          description: "检查用户权限和邀请码有效性",
          status: "wait",
          details: "私有群组验证 hashPrefix"
        },
        {
          title: "更新成员列表",
          description: "将用户添加到群组成员列表",
          status: "wait",
          details: "更新群组数据到 Irys"
        }
      ]
    },
    {
      title: "文档协作流程",
      icon: <FileTextOutlined />,
      steps: [
        {
          title: "进入群组工作区",
          description: "选择群组进入协作环境",
          status: selectedGroup ? "finish" : "wait",
          details: selectedGroup ? `当前群组: ${selectedGroup.name}` : "未选择群组"
        },
        {
          title: "创建/编辑文档",
          description: "使用 KaTeX 数学编辑器创建文档",
          status: "process",
          details: "支持 Markdown + 数学公式"
        },
        {
          title: "添加元数据",
          description: "设置文档标题、标签等信息",
          status: "wait",
          details: "包含作者、创建时间等"
        },
        {
          title: "上传到 Irys",
          description: "永久存储文档内容",
          status: "wait",
          details: "支持版本控制和协作编辑"
        },
        {
          title: "更新文档列表",
          description: "刷新群组文档显示",
          status: "wait",
          details: `当前文档数: ${groupDocuments?.length || 0}`
        }
      ]
    },
    {
      title: "项目发布流程",
      icon: <RocketOutlined />,
      steps: [
        {
          title: "选择项目数据",
          description: "选择要发布的文档和项目信息",
          status: "process",
          details: "支持多文档项目发布"
        },
        {
          title: "生成 HTML 模板",
          description: "自动生成项目展示页面",
          status: "wait",
          details: "包含 KaTeX 数学公式渲染"
        },
        {
          title: "添加样式和交互",
          description: "应用 SCAI Press 设计系统",
          status: "wait",
          details: "响应式设计和交互功能"
        },
        {
          title: "上传到 Irys",
          description: "发布到区块链永久存储",
          status: "wait",
          details: "生成永久访问链接"
        },
        {
          title: "项目展示页面",
          description: "可通过永久链接访问",
          status: "wait",
          details: "支持社区互动功能"
        }
      ]
    }
  ];

  // 获取步骤状态图标
  const getStepIcon = (status) => {
    switch (status) {
      case "finish":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "process":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "error":
        return <WarningOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#d9d9d9" }} />;
    }
  };

  // 渲染工作流程
  const renderWorkflow = (workflow, index) => (
    <Panel
      header={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {workflow.icon}
          <span style={{ fontWeight: "600" }}>{workflow.title}</span>
          <Tag color={index === currentWorkflow ? "blue" : "default"}>
            {workflow.steps.filter(step => step.status === "finish").length}/{workflow.steps.length} 完成
          </Tag>
        </div>
      }
      key={index}
    >
      <Steps
        direction="vertical"
        size="small"
        current={workflow.steps.findIndex(step => step.status === "process")}
        items={workflow.steps.map((step, stepIndex) => ({
          title: step.title,
          description: (
            <div>
              <div style={{ marginBottom: "4px" }}>{step.description}</div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {step.details}
              </Text>
            </div>
          ),
          status: step.status,
          icon: getStepIcon(step.status),
        }))}
      />
    </Panel>
  );

  // 计算总体完成度
  const totalSteps = workflows.reduce((sum, workflow) => sum + workflow.steps.length, 0);
  const completedSteps = workflows.reduce((sum, workflow) => 
    sum + workflow.steps.filter(step => step.status === "finish").length, 0
  );
  const completionRate = Math.round((completedSteps / totalSteps) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}
    >
      <Card
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Title level={2} style={{ color: "#333", marginBottom: "8px" }}>
            SCAI Press 工作流程验证
          </Title>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            验证所有核心业务流程的实现状态
          </Text>
          
          <div style={{ marginTop: "20px" }}>
            <Space size="large">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1890ff" }}>
                  {completionRate}%
                </div>
                <Text type="secondary">总体完成度</Text>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#52c41a" }}>
                  {completedSteps}/{totalSteps}
                </div>
                <Text type="secondary">已完成步骤</Text>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#722ed1" }}>
                  {workflows.length}
                </div>
                <Text type="secondary">核心流程</Text>
              </div>
            </Space>
          </div>
        </div>
      </Card>

      {/* 系统状态概览 */}
      <Card
        title="系统状态概览"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          marginBottom: "24px",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Alert
            message="用户认证状态"
            description={user ? `已登录: ${user.firstName} ${user.lastName} (${user.primaryEmailAddress?.emailAddress})` : "未登录"}
            type={user ? "success" : "warning"}
            showIcon
          />
          
          <Alert
            message="学者档案状态"
            description={needsProfileSetup ? "需要完成档案设置才能使用 SCAI Press 功能" : "档案已完成，可以正常使用所有功能"}
            type={needsProfileSetup ? "warning" : "success"}
            showIcon
          />
          
          <Alert
            message="群组数据状态"
            description={`用户群组: ${userGroups?.length || 0} 个 | 公开群组: ${allGroups?.length || 0} 个 | 当前群组文档: ${groupDocuments?.length || 0} 个`}
            type="info"
            showIcon
          />
        </Space>
      </Card>

      {/* 工作流程详情 */}
      <Card
        title="工作流程详情"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
        }}
      >
        <Collapse
          defaultActiveKey={["0"]}
          ghost
        >
          {workflows.map((workflow, index) => renderWorkflow(workflow, index))}
        </Collapse>
      </Card>
    </motion.div>
  );
};

export default WorkflowValidator;
