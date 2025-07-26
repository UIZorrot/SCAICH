import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Input, Typography, notification, Space, Tag } from "antd";
import { SaveOutlined, EditOutlined, FunctionOutlined } from "@ant-design/icons";
import MarkdownEditor from "./MarkdownEditor";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { TextArea } = Input;

const GroupMarkdownEditor = ({
  visible,
  onClose,
  group,
  onSave,
  loading = false,
  initialData = null,
  mode = "create", // "create" or "edit"
}) => {
  const [form] = Form.useForm();
  const [content, setContent] = useState("");

  // Sample content with KaTeX examples
  const sampleContent = `# ${group?.name || "Group"} Document

## Introduction

This document demonstrates **KaTeX math rendering** capabilities in our markdown editor.

### Inline Math Examples

Here are some inline math expressions:
- The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$
- Einstein's equation: $E = mc^2$
- Pythagorean theorem: $a^2 + b^2 = c^2$

### Block Math Examples

Here's a more complex equation:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Matrix representation:

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

### Research Content

Write your research content here using markdown syntax. You can include:

- **Bold text** and *italic text*
- Lists and numbered items
- Code blocks with syntax highlighting
- Mathematical equations using LaTeX syntax
- Tables and other markdown elements

## Methodology

Describe your research methodology here...

## Results

Present your findings with mathematical formulas:

The probability density function of a normal distribution:

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}
$$

## Conclusion

Summarize your research conclusions...

---

*Document created in SCAI Press - Research Collaboration Platform*`;

  // Initialize form data
  useEffect(() => {
    if (visible) {
      if (mode === "edit" && initialData) {
        form.setFieldsValue({
          title: initialData.title,
          tags: initialData.tags?.join(", ") || "",
        });
        setContent(initialData.content || "");
      } else {
        form.setFieldsValue({
          title: "",
          tags: "",
        });
        setContent(sampleContent);
      }
    }
  }, [visible, mode, initialData, form, group?.name, sampleContent]);

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!content.trim()) {
      notification.error({
        message: "Content Required",
        description: "Please enter some content for the document.",
      });
      return;
    }

    const documentData = {
      title: values.title,
      content: content,
      tags: values.tags ? values.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
      groupId: group?.id,
      groupName: group?.name,
    };

    if (onSave) {
      await onSave(documentData);
    }
  };

  // Handle content change
  const handleContentChange = (newContent) => {
    setContent(newContent);
  };

  // Math examples for help
  const mathExamples = [
    { label: "Inline Math", syntax: "$E = mc^2$", description: "Wrap with single $" },
    { label: "Block Math", syntax: "$$\\int_0^1 x^2 dx$$", description: "Wrap with double $$" },
    { label: "Fraction", syntax: "$\\frac{a}{b}$", description: "Use \\frac{numerator}{denominator}" },
    { label: "Square Root", syntax: "$\\sqrt{x}$", description: "Use \\sqrt{expression}" },
    { label: "Superscript", syntax: "$x^2$", description: "Use ^ for superscript" },
    { label: "Subscript", syntax: "$x_1$", description: "Use _ for subscript" },
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <EditOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
            <div>
              <Title level={3} style={{ margin: 0, color: "inherit" }}>
                {mode === "edit" ? "Edit Group Document" : "Create Group Document"}
              </Title>
              <Text type="secondary">
                {group?.name} • Math-enabled Markdown Editor
              </Text>
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ maxWidth: "1200px", top: "20px" }}
      className="group-markdown-editor-modal"
      destroyOnClose
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: "1rem" }}
        >
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <Form.Item
              name="title"
              label="Document Title"
              rules={[{ required: true, message: "Please enter document title" }]}
              style={{ flex: 1 }}
            >
              <Input
                placeholder="e.g., Research Proposal with Mathematical Models"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="tags"
              label="Tags (Optional)"
              style={{ flex: 1 }}
            >
              <Input
                placeholder="research, mathematics, analysis"
                size="large"
              />
            </Form.Item>
          </div>

          {/* Math Help Section */}
          <div style={{ 
            background: "rgba(24, 144, 255, 0.05)", 
            padding: "12px", 
            borderRadius: "8px", 
            marginBottom: "1rem",
            border: "1px solid rgba(24, 144, 255, 0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <FunctionOutlined style={{ color: "#1890ff" }} />
              <Text strong style={{ color: "#1890ff" }}>KaTeX Math Support</Text>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {mathExamples.map((example, index) => (
                <Tag
                  key={index}
                  color="blue"
                  style={{ cursor: "help" }}
                  title={`${example.description}: ${example.syntax}`}
                >
                  {example.label}
                </Tag>
              ))}
            </div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Click tags for syntax help. Use LaTeX syntax for mathematical expressions.
            </Text>
          </div>

          {/* Markdown Editor */}
          <div style={{ marginBottom: "1rem" }}>
            <MarkdownEditor
              title="Document Content (Markdown + Math)"
              initialValue={content}
              height={500}
              onContentChange={handleContentChange}
              enableSave={false}
              enableExport={false}
              enableImport={true}
              hideToolbar={false}
              preview="live"
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            paddingTop: "1rem",
            borderTop: "1px solid #f0f0f0"
          }}>
            <div>
              <Text type="secondary">
                Content length: {content.length} characters
              </Text>
            </div>
            
            <Space>
              <Button onClick={onClose} size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                }}
              >
                {mode === "edit" ? "Update Document" : "Create Document"}
              </Button>
            </Space>
          </div>
        </Form>
      </motion.div>
    </Modal>
  );
};

export default GroupMarkdownEditor;
