import React, { useState, useEffect } from "react";
import { Card, Button, Space, Typography, notification, Modal, Input, Tooltip } from "antd";
import { SaveOutlined, EyeOutlined, EditOutlined, CopyOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import MDEditor from "@uiw/react-md-editor";
import { motion } from "framer-motion";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

const { Title, Text } = Typography;

const MarkdownEditor = ({
  initialValue = "# Welcome to Markdown Editor with KaTeX Support\n\nStart writing your markdown content here...\n\n## Math Examples\n\n### Inline Math\nThe quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$\n\n### Block Math\n$$\n\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$\n\n### Matrix\n$$\n\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}\n$$",
  height = 400,
  preview = "edit",
  hideToolbar = false,
  enableSave = true,
  enableExport = true,
  enableImport = true,
  onSave,
  onContentChange,
  title = "Markdown Editor",
  isMobile = false,
  style = {},
  className = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const [previewMode, setPreviewMode] = useState(preview);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [fileName, setFileName] = useState("document");

  // Handle content changes
  useEffect(() => {
    if (onContentChange) {
      onContentChange(value);
    }
  }, [value, onContentChange]);

  // Save functionality
  const handleSave = () => {
    if (onSave) {
      onSave(value, fileName);
      notification.success({
        message: "Content Saved",
        description: "Your markdown content has been saved successfully.",
      });
    } else {
      setSaveModalVisible(true);
    }
  };

  // Export to file
  const handleExport = () => {
    const blob = new Blob([value], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notification.success({
      message: "File Exported",
      description: `${fileName}.md has been downloaded successfully.`,
    });
  };

  // Import from file
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      notification.error({
        message: "Invalid File Type",
        description: "Please select a .md or .txt file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setValue(e.target.result);
      setFileName(file.name.replace(/\.(md|txt)$/, ''));
      notification.success({
        message: "File Imported",
        description: `${file.name} has been imported successfully.`,
      });
    };
    reader.onerror = () => {
      notification.error({
        message: "Import Failed",
        description: "Failed to read the selected file.",
      });
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Copy content to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      notification.success({
        message: "Content Copied",
        description: "Markdown content has been copied to clipboard.",
        icon: <CopyOutlined style={{ color: "#FF3314" }} />,
      });
    }).catch(() => {
      notification.error({
        message: "Copy Failed",
        description: "Failed to copy content to clipboard.",
      });
    });
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    const modes = ["edit", "live", "preview"];
    const currentIndex = modes.indexOf(previewMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setPreviewMode(nextMode);
  };

  // Save modal confirm
  const handleSaveConfirm = () => {
    if (!fileName.trim()) {
      notification.error({ message: "Please enter a file name" });
      return;
    }
    handleExport();
    setSaveModalVisible(false);
  };

  // Custom toolbar buttons
  const customToolbarButtons = (
    <Space size="small" style={{ marginLeft: "auto" }}>
      {enableImport && (
        <Tooltip title="Import File">
          <label style={{ cursor: "pointer" }}>
            <Button
              type="text"
              icon={<UploadOutlined />}
              size="small"
              style={{ color: "#666" }}
            />
            <input
              type="file"
              accept=".md,.txt"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </label>
        </Tooltip>
      )}
      <Tooltip title="Copy Content">
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          size="small"
          style={{ color: "#666" }}
        />
      </Tooltip>
      <Tooltip title="Toggle Preview Mode">
        <Button
          type="text"
          icon={previewMode === "edit" ? <EyeOutlined /> : <EditOutlined />}
          onClick={togglePreviewMode}
          size="small"
          style={{ color: "#666" }}
        />
      </Tooltip>
      {enableSave && (
        <Tooltip title="Save">
          <Button
            type="text"
            icon={<SaveOutlined />}
            onClick={handleSave}
            size="small"
            style={{ color: "#666" }}
          />
        </Tooltip>
      )}
      {enableExport && (
        <Tooltip title="Export File">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            size="small"
            style={{ color: "#666" }}
          />
        </Tooltip>
      )}
    </Space>
  );

  const editorStyle = {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(12px)",
    ...style,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Title level={4} style={{ margin: 0, color: "#333" }}>
              {title}
            </Title>
            {!hideToolbar && customToolbarButtons}
          </div>
        }
        style={editorStyle}
        bodyStyle={{ padding: "16px" }}
      >
        <MDEditor
          value={value}
          onChange={setValue}
          preview={previewMode}
          height={height}
          data-color-mode="light"
          style={{
            backgroundColor: "transparent",
          }}
          previewOptions={{
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
          }}
        />
      </Card>

      {/* Save Modal */}
      <Modal
        title="Save Document"
        open={saveModalVisible}
        onOk={handleSaveConfirm}
        onCancel={() => setSaveModalVisible(false)}
        okText="Save"
        cancelText="Cancel"
        style={{ borderRadius: "16px" }}
        bodyStyle={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>Enter a name for your document:</Text>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Document name"
            suffix=".md"
            style={{
              borderRadius: "8px",
            }}
          />
        </Space>
      </Modal>
    </motion.div>
  );
};

export default MarkdownEditor;
