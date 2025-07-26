import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, Typography, Steps, Card, Space, Tag, message, Upload } from "antd";
import { RocketOutlined, FileTextOutlined, GlobalOutlined, ShareAltOutlined, UploadOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import irysService from "../../../services/irysService";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProjectPublisher = ({
  visible,
  onClose,
  group,
  documents,
  onPublishSuccess,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [projectData, setProjectData] = useState({});
  const [previewHtml, setPreviewHtml] = useState("");

  // 项目类别选项
  const projectCategories = [
    { value: "research", label: "Research Paper", icon: "🔬" },
    { value: "review", label: "Literature Review", icon: "📚" },
    { value: "thesis", label: "Thesis/Dissertation", icon: "🎓" },
    { value: "conference", label: "Conference Paper", icon: "🎤" },
    { value: "journal", label: "Journal Article", icon: "📄" },
    { value: "preprint", label: "Preprint", icon: "📝" },
    { value: "book", label: "Book Chapter", icon: "📖" },
    { value: "report", label: "Technical Report", icon: "📊" },
  ];

  // 项目阶段选项
  const projectStages = [
    { value: "draft", label: "Draft", color: "orange" },
    { value: "review", label: "Under Review", color: "blue" },
    { value: "revision", label: "Revision", color: "purple" },
    { value: "accepted", label: "Accepted", color: "green" },
    { value: "published", label: "Published", color: "red" },
  ];

  // 步骤配置
  const steps = [
    {
      title: "Project Info",
      description: "Basic project information",
      icon: <FileTextOutlined />,
    },
    {
      title: "Select Documents",
      description: "Choose documents to include",
      icon: <FileTextOutlined />,
    },
    {
      title: "Preview & Publish",
      description: "Review and publish project",
      icon: <RocketOutlined />,
    },
  ];

  // 生成HTML模板
  const generateProjectHTML = (data, docs) => {
    const documentsHtml = docs.map(doc => `
      <section class="document-section">
        <h2>${doc.title}</h2>
        <div class="document-meta">
          <span class="author">By ${doc.author}</span>
          <span class="date">${new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="document-content">
          ${doc.content.replace(/\n/g, '<br>')}
        </div>
      </section>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - SCAI Press</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 2rem; 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 20px;
            margin-top: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 3rem; 
            padding-bottom: 2rem;
            border-bottom: 2px solid #eee;
        }
        .title { 
            font-size: 2.5rem; 
            font-weight: 700; 
            margin-bottom: 1rem; 
            color: #2c3e50;
        }
        .subtitle { 
            font-size: 1.2rem; 
            color: #7f8c8d; 
            margin-bottom: 1rem; 
        }
        .meta-info { 
            display: flex; 
            justify-content: center; 
            gap: 2rem; 
            flex-wrap: wrap; 
            margin-bottom: 1rem;
        }
        .meta-item { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            color: #666;
        }
        .category-tag { 
            background: linear-gradient(45deg, #FF3314, #FF6B47); 
            color: white; 
            padding: 0.5rem 1rem; 
            border-radius: 20px; 
            font-weight: 600;
        }
        .stage-tag { 
            padding: 0.3rem 0.8rem; 
            border-radius: 15px; 
            font-size: 0.9rem; 
            font-weight: 600;
        }
        .abstract { 
            background: #f8f9fa; 
            padding: 2rem; 
            border-radius: 10px; 
            margin: 2rem 0; 
            border-left: 4px solid #FF3314;
        }
        .document-section { 
            margin: 3rem 0; 
            padding: 2rem 0; 
            border-top: 1px solid #eee;
        }
        .document-section h2 { 
            color: #2c3e50; 
            margin-bottom: 1rem; 
        }
        .document-meta { 
            color: #666; 
            margin-bottom: 1.5rem; 
            font-size: 0.9rem;
        }
        .document-content { 
            font-size: 1.1rem; 
            line-height: 1.8; 
        }
        .footer { 
            text-align: center; 
            margin-top: 4rem; 
            padding-top: 2rem; 
            border-top: 2px solid #eee; 
            color: #666;
        }
        .scai-logo { 
            font-weight: 700; 
            color: #FF3314; 
        }
        @media (max-width: 768px) {
            .container { padding: 1rem; margin: 1rem; }
            .title { font-size: 2rem; }
            .meta-info { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1 class="title">${data.title}</h1>
            <p class="subtitle">${data.subtitle || ''}</p>
            <div class="meta-info">
                <div class="meta-item">
                    <span>👥</span>
                    <span>Group: ${group?.name}</span>
                </div>
                <div class="meta-item">
                    <span>📅</span>
                    <span>Published: ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="meta-item">
                    <span>📄</span>
                    <span>${docs.length} Document${docs.length > 1 ? 's' : ''}</span>
                </div>
            </div>
            <div style="margin-top: 1rem;">
                <span class="category-tag">${projectCategories.find(c => c.value === data.category)?.label || data.category}</span>
                <span class="stage-tag" style="background: ${projectStages.find(s => s.value === data.stage)?.color || '#ccc'}; color: white; margin-left: 1rem;">
                    ${projectStages.find(s => s.value === data.stage)?.label || data.stage}
                </span>
            </div>
        </header>

        ${data.abstract ? `
        <section class="abstract">
            <h3 style="margin-bottom: 1rem; color: #2c3e50;">Abstract</h3>
            <p>${data.abstract}</p>
        </section>
        ` : ''}

        <main>
            ${documentsHtml}
        </main>

        <footer class="footer">
            <p>Published on <span class="scai-logo">SCAI Press</span> - Decentralized Academic Collaboration Platform</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem;">
                Powered by Irys Network • Permanent Storage • Open Science
            </p>
        </footer>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false}
                ]
            });
        });
    </script>
</body>
</html>`;
  };

  // 处理表单提交
  const handleStepSubmit = async (values) => {
    if (currentStep === 0) {
      setProjectData(values);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (selectedDocuments.length === 0) {
        message.error("Please select at least one document");
        return;
      }
      
      const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
      const html = generateProjectHTML(projectData, selectedDocs);
      setPreviewHtml(html);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await handlePublish();
    }
  };

  // 发布项目
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
      
      // 上传HTML到Irys
      const tags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "text/html" },
        { name: "Data-Type", value: "project" },
        { name: "Group-Id", value: group.id },
        { name: "Project-Title", value: projectData.title },
        { name: "Project-Category", value: projectData.category },
        { name: "Project-Stage", value: projectData.stage },
        { name: "Document-Count", value: selectedDocs.length.toString() },
        { name: "Published-At", value: Date.now().toString() },
      ];

      if (projectData.keywords) {
        tags.push({ name: "Keywords", value: projectData.keywords });
      }

      const result = await irysService.uploadData(previewHtml, tags);
      
      message.success("Project published successfully!");
      
      if (onPublishSuccess) {
        onPublishSuccess({
          txId: result.id,
          url: `https://gateway.irys.xyz/${result.id}`,
          title: projectData.title,
          category: projectData.category,
          stage: projectData.stage,
        });
      }
      
      onClose();
    } catch (error) {
      console.error("Error publishing project:", error);
      message.error("Failed to publish project. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form form={form} layout="vertical" onFinish={handleStepSubmit}>
            <Form.Item
              name="title"
              label="Project Title"
              rules={[{ required: true, message: "Please enter project title" }]}
            >
              <Input placeholder="Enter your project title" size="large" />
            </Form.Item>

            <Form.Item name="subtitle" label="Subtitle (Optional)">
              <Input placeholder="Enter project subtitle" size="large" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Project Category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select placeholder="Select project category" size="large">
                {projectCategories.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    <span style={{ marginRight: "8px" }}>{cat.icon}</span>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="stage"
              label="Project Stage"
              rules={[{ required: true, message: "Please select project stage" }]}
            >
              <Select placeholder="Select project stage" size="large">
                {projectStages.map(stage => (
                  <Option key={stage.value} value={stage.value}>
                    <Tag color={stage.color}>{stage.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="abstract" label="Abstract (Optional)">
              <TextArea
                rows={4}
                placeholder="Enter project abstract or summary"
              />
            </Form.Item>

            <Form.Item name="keywords" label="Keywords (Optional)">
              <Input placeholder="Enter keywords separated by commas" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                Next: Select Documents
              </Button>
            </Form.Item>
          </Form>
        );

      case 1:
        return (
          <div>
            <Title level={4} style={{ marginBottom: "16px" }}>
              Select Documents to Include
            </Title>
            <Text type="secondary" style={{ marginBottom: "24px", display: "block" }}>
              Choose the documents you want to include in your published project.
            </Text>

            <div style={{ marginBottom: "24px" }}>
              {documents.map(doc => (
                <Card
                  key={doc.id}
                  size="small"
                  style={{
                    marginBottom: "12px",
                    border: selectedDocuments.includes(doc.id) ? "2px solid #1890ff" : "1px solid #d9d9d9",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (selectedDocuments.includes(doc.id)) {
                      setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                    } else {
                      setSelectedDocuments(prev => [...prev, doc.id]);
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {doc.title}
                      </Title>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        By {doc.author} • {new Date(doc.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                    <div>
                      {selectedDocuments.includes(doc.id) && (
                        <Tag color="blue">Selected</Tag>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button
                type="primary"
                onClick={() => handleStepSubmit()}
                disabled={selectedDocuments.length === 0}
              >
                Next: Preview & Publish
              </Button>
            </Space>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4} style={{ marginBottom: "16px" }}>
              Preview & Publish
            </Title>
            <Text type="secondary" style={{ marginBottom: "24px", display: "block" }}>
              Review your project before publishing to the Irys network.
            </Text>

            <div style={{
              border: "1px solid #d9d9d9",
              borderRadius: "8px",
              height: "400px",
              overflow: "auto",
              marginBottom: "24px",
            }}>
              <iframe
                srcDoc={previewHtml}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="Project Preview"
              />
            </div>

            <Space>
              <Button onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                loading={publishing}
                onClick={handlePublish}
                style={{
                  background: "linear-gradient(45deg, #FF3314, #FF6B47)",
                  border: "none",
                }}
              >
                Publish Project
              </Button>
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <RocketOutlined style={{ fontSize: "20px", color: "#FF3314" }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Publish Project
            </Title>
            <Text type="secondary">Create a permanent project showcase</Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: "800px" }}
      bodyStyle={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: "32px" }}
        />
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderStepContent()}
      </motion.div>
    </Modal>
  );
};

export default ProjectPublisher;
