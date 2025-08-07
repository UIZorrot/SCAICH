import React, { useState, useImperativeHandle, forwardRef } from "react";
import { List, Typography, Tag, Spin, Empty } from "antd";
import { FileTextOutlined, UserOutlined, CalendarOutlined, LinkOutlined } from "@ant-design/icons";
import "./CitationSearchList.css";

const { Text, Paragraph } = Typography;

/**
 * CitationSearchList - 文献搜索结果列表组件
 * 用于在 Tiptap 编辑器中显示引用建议
 */
const CitationSearchList = forwardRef(({ items, command, loading }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 处理键盘导航
  const onKeyDown = ({ event }) => {
    if (event.key === "ArrowUp") {
      setSelectedIndex((prevIndex) => (prevIndex <= 0 ? items.length - 1 : prevIndex - 1));
      return true;
    }

    if (event.key === "ArrowDown") {
      setSelectedIndex((prevIndex) => (prevIndex >= items.length - 1 ? 0 : prevIndex + 1));
      return true;
    }

    if (event.key === "Enter") {
      if (items[selectedIndex]) {
        selectItem(selectedIndex);
      }
      return true;
    }

    return false;
  };

  // 选择文献项
  const selectItem = (index) => {
    const item = items[index];
    if (item && command) {
      command(item);
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    onKeyDown,
  }));

  // 渲染加载状态
  if (loading) {
    return (
      <div className="citation-search-list">
        <div className="search-loading">
          <Spin size="small" />
          <Text style={{ marginLeft: 8 }}>正在搜索文献...</Text>
        </div>
      </div>
    );
  }

  // 渲染防抖提示
  if (items && items.length === 0 && !loading) {
    return (
      <div className="citation-search-list">
        <div className="search-loading">
          <Text type="secondary">输入至少2个字符开始搜索，停止输入后自动搜索...</Text>
        </div>
      </div>
    );
  }

  // 渲染空状态
  if (!items || items.length === 0) {
    return (
      <div className="citation-search-list">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到相关文献" style={{ padding: "16px" }} />
      </div>
    );
  }

  // 格式化作者名称
  const formatAuthors = (paper) => {
    // 适配实际 API 返回格式
    if (paper.author && paper.author.trim()) {
      return paper.author;
    }
    if (paper.authors && paper.authors.length > 0) {
      const firstAuthor = paper.authors[0].name || paper.displayAuthor;
      if (paper.authors.length > 1) {
        return `${firstAuthor} et al.`;
      }
      return firstAuthor;
    }
    return paper.displayAuthor || "未知作者";
  };

  // 格式化年份
  const formatYear = (paper) => {
    return paper.year || paper.displayYear || paper.publicationDate?.substring(0, 4) || "未知年份";
  };

  // 渲染单个文献项
  const renderPaperItem = (paper, index) => {
    const isSelected = index === selectedIndex;
    const authors = formatAuthors(paper);
    const year = formatYear(paper);
    const title = paper.title || paper.displayTitle || "无标题";
    const journal = paper.source || paper.journal || paper.containerTitle || "";
    const doi = paper.doi;

    return (
      <List.Item
        key={paper.id || index}
        className={`citation-item ${isSelected ? "selected" : ""}`}
        onClick={() => selectItem(index)}
        style={{
          backgroundColor: isSelected ? "#f0f9ff" : "transparent",
          border: isSelected ? "2px solid #1890ff" : "2px solid transparent",
          borderRadius: "8px",
          margin: "4px 0",
          padding: "12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div className="citation-item-content">
          {/* 标题 */}
          <div className="citation-title">
            <FileTextOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            <Text strong style={{ fontSize: "14px" }}>
              {title}
            </Text>
          </div>

          {/* 作者和年份 */}
          <div className="citation-meta" style={{ margin: "8px 0" }}>
            <span className="citation-authors">
              <UserOutlined style={{ marginRight: 4, color: "#666" }} />
              <Text type="secondary">{authors}</Text>
            </span>
            <span className="citation-year" style={{ marginLeft: 16 }}>
              <CalendarOutlined style={{ marginRight: 4, color: "#666" }} />
              <Text type="secondary">{year}</Text>
            </span>
          </div>

          {/* 期刊信息 */}
          {journal && (
            <div className="citation-journal" style={{ marginBottom: 8 }}>
              <Text italic style={{ fontSize: "12px", color: "#888" }}>
                {journal}
              </Text>
            </div>
          )}

          {/* DOI 和标签 */}
          <div className="citation-tags">
            {doi && doi !== "loi" && (
              <Tag icon={<LinkOutlined />} color="blue" style={{ fontSize: "11px" }}>
                DOI
              </Tag>
            )}
            {paper.is_oa && (
              <Tag color="green" style={{ fontSize: "11px" }}>
                开放获取
              </Tag>
            )}
          </div>
        </div>
      </List.Item>
    );
  };

  return (
    <div className="citation-search-list">
      <div className="search-header">
        <Text strong style={{ fontSize: "12px", color: "#666" }}>
          找到 {items.length} 篇文献 (使用 ↑↓ 导航，Enter 选择)
        </Text>
      </div>

      <List
        size="small"
        dataSource={items.slice(0, 8)} // 最多显示8个结果
        renderItem={renderPaperItem}
        style={{
          maxHeight: "300px",
          overflowY: "auto",
        }}
      />
    </div>
  );
});

CitationSearchList.displayName = "CitationSearchList";

export default CitationSearchList;
