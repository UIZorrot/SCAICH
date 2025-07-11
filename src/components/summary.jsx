import { useState, useEffect } from "react";
import { Typography } from "antd";
import ReactMarkdown from "react-markdown";
import { UpOutlined, DownOutlined, CaretUpOutlined, CaretDownOutlined, RobotOutlined } from "@ant-design/icons";
import { useBackground } from "../contexts/BackgroundContext";
const { Title } = Typography;

function ExpandAbstract({ abstract }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(isExpanded ? abstract : abstract.slice(0, 100));
      return;
    }

    let currentText = "";
    const interval = setInterval(() => {
      if (currentText.length < abstract.length) {
        currentText = abstract.slice(0, currentText.length + 5);
        setDisplayedText(currentText);
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [abstract, isExpanded, isStreaming]);

  return (
    <div className="abstract-container" style={{ flexDirection: "column" }}>
      <ReactMarkdown className={isExpanded ? "abstract-content-expanded" : "abstract-content-summary"}>
        {isExpanded ? displayedText : displayedText.slice(0, 100)}
      </ReactMarkdown>
      <div
        className="abstract-expand"
        style={{ color: "#5258FF", cursor: "pointer" }}
        onClick={() => {
          setIsExpanded(!isExpanded);
          setIsStreaming(true);
        }}
      >
        {isExpanded ? (
          <p style={{ display: "flex", alignItems: "end", gap: "4px" }}>
            show less
            <CaretUpOutlined />
          </p>
        ) : (
          <p style={{ display: "flex", alignItems: "end", gap: "4px" }}>
            show more
            <CaretDownOutlined />
          </p>
        )}
      </div>
    </div>
  );
}

function Summary({
  summary,
  pro,
  isCollapsed,
  handleToggle,
  handleDownloadImage,
  handleShareImage,
  searchResultHeight,
  isMobile,
  isLocal = false, // 新增 isLocal 参数，默认 false
}) {
  const [displayedSummary, setDisplayedSummary] = useState("");
  const [isStreaming, setIsStreaming] = useState(!isLocal); // 如果 isLocal 为 true，则不流式
  const { currentTheme } = useBackground();

  useEffect(() => {
    // 检查 localStorage 中是否已有 summary.sum
    const storedSummary = localStorage.getItem(`summary_${summary.sum}`);
    if (storedSummary) {
      setDisplayedSummary(storedSummary); // 直接使用存储的内容
      setIsStreaming(false); // 不触发流式
      return;
    }

    // 如果没有存储，且 isLocal 为 false，则重置流式状态
    if (!isLocal) {
      setDisplayedSummary("");
      setIsStreaming(true);
    } else {
      setDisplayedSummary(summary.sum); // 如果 isLocal 为 true，直接显示
      setIsStreaming(false);
    }
  }, [summary.sum, isLocal]);

  useEffect(() => {
    if (!isStreaming || isMobile) {
      setDisplayedSummary(summary.sum);
      // 如果是首次且不在 localStorage 中，保存到 localStorage
      if (!localStorage.getItem(`summary_${summary.sum}`)) {
        localStorage.setItem(`summary_${summary.sum}`, summary.sum);
      }
      return;
    }

    let currentText = "";
    const interval = setInterval(() => {
      if (currentText.length < summary.sum.length) {
        currentText = summary.sum.slice(0, currentText.length + 4);
        setDisplayedSummary(currentText);
      } else {
        clearInterval(interval);
        setIsStreaming(false);
        // 流式完成后保存到 localStorage
        localStorage.setItem(`summary_${summary.sum}`, summary.sum);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [summary.sum, isStreaming, isMobile]);

  return (
    <div
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "10px", gap: "8px" }}>

        {handleDownloadImage && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src="/share-icon.png"
              alt="Share"
              style={{ cursor: "pointer", width: "20px", height: "20px" }}
              onClick={handleShareImage}
            />
            <img
              src="/download-icon.png"
              alt="Download"
              style={{ cursor: "pointer", width: "20px", height: "20px" }}
              onClick={handleDownloadImage}
            />
          </div>
        )}
      </div>
      <div className="results-list" style={{ paddingRight: "10px" }}>
        <div style={{
          color: currentTheme.isDark ? "rgba(255, 255, 255, 0.9)" : "#1C1C1C",
          marginBottom: 15
        }}>
          {pro && summary.cot !== "" ? (
            <>
              <Title level={5} style={{
                margin: 0,
                color: currentTheme.isDark ? "#fff" : "#000000",
                fontSize: "20px"
              }} onClick={handleToggle}>
                Think{" "}
                {isCollapsed ? (
                  <DownOutlined style={{
                    fontSize: "14px",
                    color: currentTheme.isDark ? "#888" : "#888"
                  }} />
                ) : (
                  <UpOutlined style={{
                    fontSize: "14px",
                    color: currentTheme.isDark ? "#888" : "#888"
                  }} />
                )}
              </Title>
              {!isCollapsed && (
                <ReactMarkdown style={{
                  opacity: 0.75,
                  fontSize: "16px",
                  color: currentTheme.isDark ? "rgba(255, 255, 255, 0.8)" : "#333"
                }}>{summary.cot}</ReactMarkdown>
              )}
            </>
          ) : (
            <></>
          )}
        </div>
        <div style={{
          color: currentTheme.isDark ? "rgba(255, 255, 255, 0.9)" : "#1C1C1C"
        }}>
          <Title level={5} style={{
            margin: 0,
            color: currentTheme.isDark ? "#fff" : "#000000",
            fontSize: "20px"
          }}>
            Result
          </Title>
          {isMobile ? (
            <ExpandAbstract abstract={summary.sum} />
          ) : (
            <ReactMarkdown style={{ opacity: 0.75, color: "#222222", fontSize: "16px" }}>
              {displayedSummary}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

export default Summary;