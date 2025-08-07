import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, List, Button, Select, Typography, Space, Badge, Tooltip, message } from "antd";
import { BookOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined, ExportOutlined, FormatPainterOutlined } from "@ant-design/icons";
import bibliographyService from "../services/BibliographyService";
import { CITATION_CONFIG } from "../config/CitationConfig";
import "./BibliographyPanel.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * BibliographyPanel - 参考文献管理面板
 * 显示文档中的所有引用并生成格式化的参考文献列表
 */
const BibliographyPanel = ({ editor, isVisible = true }) => {
  const [bibliography, setBibliography] = useState(null);
  const [format, setFormat] = useState(CITATION_CONFIG.BIBLIOGRAPHY.DEFAULT_FORMAT);
  const [loading, setLoading] = useState(false);

  // 用于取消请求的引用
  const abortControllerRef = useRef(null);

  // 刷新参考文献列表
  const refreshBibliography = useCallback(async () => {
    if (!editor) return;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      const editorJSON = editor.getJSON();
      const generatedBibliography = bibliographyService.generateBibliography(editorJSON, format);

      // 检查请求是否被取消
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setBibliography(generatedBibliography);
    } catch (error) {
      // 忽略取消的请求错误
      if (error.name !== "AbortError") {
        console.error("生成参考文献失败:", error);
        message.error(CITATION_CONFIG.MESSAGES.GENERATE_FAILED);
      }
    } finally {
      setLoading(false);
    }
  }, [editor, format]);

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editor) return;

    // 初始生成
    refreshBibliography();

    let timeoutId = null;

    // 监听编辑器更新事件
    const handleUpdate = () => {
      // 清除之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 防抖：避免频繁更新
      timeoutId = setTimeout(() => {
        refreshBibliography();
      }, CITATION_CONFIG.BIBLIOGRAPHY.UPDATE_DELAY);
    };

    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      // 清理定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [editor, format]);

  // 格式变化时重新生成
  useEffect(() => {
    refreshBibliography();
  }, [format]);

  // 复制参考文献列表 (改进错误处理)
  const copyToClipboard = async () => {
    if (!bibliography) {
      message.warning(CITATION_CONFIG.MESSAGES.NO_BIBLIOGRAPHY);
      return;
    }

    try {
      const text = bibliographyService.exportAsText(bibliography);

      // 检查剪贴板API是否可用
      if (!navigator.clipboard) {
        // 降级到传统方法
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(text);
      }

      message.success(CITATION_CONFIG.SUCCESS_MESSAGES.COPY_SUCCESS);
    } catch (error) {
      console.error("复制失败:", error);
      message.error(CITATION_CONFIG.MESSAGES.COPY_FAILED);
    }
  };

  // 导出为文本文件 (改进错误处理)
  const exportAsFile = () => {
    if (!bibliography) {
      message.warning("没有可导出的参考文献");
      return;
    }

    try {
      const text = bibliographyService.exportAsText(bibliography);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      if (!link) {
        throw new Error("无法创建下载链接");
      }

      link.href = url;
      link.download = `参考文献_${format}_${new Date().toISOString().split("T")[0]}.txt`;

      // 安全的DOM操作
      document.body.appendChild(link);
      link.click();

      // 清理DOM和URL
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);

      message.success("参考文献列表已导出");
    } catch (error) {
      console.error("导出文件失败:", error);
      message.error("导出失败，请稍后重试");
    }
  };

  // 插入参考文献到编辑器 (安全版本)
  const insertIntoEditor = () => {
    if (!editor || !bibliography) return;

    try {
      // 使用纯文本而不是HTML，避免XSS风险
      const textContent = bibliographyService.exportAsText(bibliography);

      // 构建安全的结构化内容
      const safeContent = [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "参考文献" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: textContent }],
        },
      ];

      editor.chain().focus().insertContent(safeContent).run();
      message.success("参考文献列表已插入到文档中");
    } catch (error) {
      console.error("插入参考文献失败:", error);
      message.error("插入参考文献失败，请稍后重试");
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card
      className="bibliography-panel"
      title={
        <Space>
          <BookOutlined />
          <span>参考文献</span>
          <Badge count={bibliography?.count || 0} style={{ backgroundColor: "#52c41a" }} />
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Select value={format} onChange={setFormat} size="small" style={{ width: 80 }}>
            <Option value="APA">APA</Option>
            <Option value="MLA">MLA</Option>
          </Select>
          <Tooltip title="刷新">
            <Button type="text" size="small" icon={<ReloadOutlined />} onClick={refreshBibliography} loading={loading} />
          </Tooltip>
        </Space>
      }
    >
      <div className="bibliography-content">
        {/* 操作按钮 */}
        <div className="bibliography-actions">
          <Space wrap>
            <Button size="small" icon={<CopyOutlined />} onClick={copyToClipboard} disabled={!bibliography || bibliography.count === 0}>
              复制
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={exportAsFile} disabled={!bibliography || bibliography.count === 0}>
              导出
            </Button>
            <Button size="small" icon={<ExportOutlined />} onClick={insertIntoEditor} disabled={!bibliography || bibliography.count === 0}>
              插入文档
            </Button>
          </Space>
        </div>

        {/* 引用列表 */}
        {bibliography && bibliography.count > 0 ? (
          <List
            className="bibliography-list"
            size="small"
            dataSource={bibliography.citations}
            renderItem={(citation) => (
              <List.Item key={citation.id} className="bibliography-item">
                <div className="citation-content">
                  <Text className="citation-number">{citation.index}.</Text>
                  <Paragraph
                    className="citation-text"
                    ellipsis={{
                      rows: 3,
                      expandable: true,
                      symbol: "展开",
                    }}
                  >
                    {citation.formatted}
                  </Paragraph>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="bibliography-empty">
            <FormatPainterOutlined style={{ fontSize: 32, color: "#ccc", marginBottom: 8 }} />
            <Text type="secondary">文档中暂无引用文献</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              使用 [ 搜索并添加文献引用
            </Text>
          </div>
        )}

        {/* 统计信息 */}
        {bibliography && (
          <div className="bibliography-stats">
            <Text type="secondary" style={{ fontSize: "11px" }}>
              格式: {bibliography.format} | 引用数: {bibliography.count} | 更新时间: {new Date(bibliography.generated).toLocaleTimeString()}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BibliographyPanel;
