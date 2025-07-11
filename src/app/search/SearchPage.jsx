import React, { useState, useEffect } from "react";
import { Input, Typography, Button, notification, Modal, Card, List, Row, Col, Select } from "antd";
import { SearchOutlined, RobotOutlined, DownOutlined, UpOutlined, ShareAltOutlined, DownloadOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import { LoadingComponent } from "../../components/Loading.jsx";
import Summary from "../../components/summary.jsx";
import SearchResult from "../../components/searchResult.jsx";
import { UserGuidelineModal } from "../../components/guild.jsx";
import { UpdateModal } from "../../components/updatelog.jsx";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import ChatModal from "../../components/chatpage.jsx";
import { motion } from "framer-motion";
import ProfileModal from "../../components/ProfileModal.jsx";
import { InviteCodeGuideModal } from "../../components/InviteCodeGuideModal.jsx";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/layout/Layout";

import { useBackground } from "../../contexts/BackgroundContext";
import "./SearchPage.css";

const { Title, Text } = Typography;

export default function SearchPage() {
  const [canvasResults, setCanvasResults] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [upVisible, setUpVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hisVisible, sethisVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const storedHistory = localStorage.getItem("searchHistory");
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [isFromLocal, setIsFromLocal] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [sortField, setSortField] = useState("similarity");
  const [sortDirection, setSortDirection] = useState("desc");
  const navigate = useNavigate();
  const { currentTheme } = useBackground();

  // 检查是否为重复历史记录
  const isDuplicateHistory = (newQuery) => {
    return searchHistory.some((item) => item.query === newQuery);
  };

  // 搜索功能
  const handleSearch = async () => {
    if (query.replace(" ", "") === "") {
      return;
    }
    setLoading(true);
    // 清空之前的结果，确保显示加载状态
    setResults([]);
    setSummary("");

    try {
      const response = await fetch(`https://api.scai.sh/search?query=${encodeURIComponent(query)}&limit=10&oa=${openAccessOnly}`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Access-Control-Allow-Origin": true,
          "ngrok-skip-browser-warning": true,
          "Content-Type": "Authorization",
        },
      });
      const data = await response.json();
      setIsFromLocal(false);
      setResults(data.results);
      setSummary(data.summary);

      if (!isDuplicateHistory(query)) {
        const newHistory = [{ query, results: data.results, summary: data.summary }, ...searchHistory];
        const trimmedHistory = newHistory.slice(0, 20);
        setSearchHistory(trimmedHistory);
        localStorage.setItem("searchHistory", JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      notification.error({ message: "Failed to fetch search results" });
    } finally {
      setLoading(false);
    }
  };

  // 删除历史记录
  const deleteHistory = (index) => {
    const updatedHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  // 从历史记录搜索
  const searchFromHistory = (historyItem) => {
    setQuery(historyItem.query);
    // 确保结果中的每个项目都有必要的字段
    const safeResults =
      historyItem.results?.map((result) => ({
        ...result,
        title: result.title || "Untitled",
        authors: result.authors || [],
        abstract: result.abstract || "",
        doi: result.doi || "",
        source: result.source || "unknown",
      })) || [];
    setResults(safeResults);
    setSummary(historyItem.summary || "");
    setIsFromLocal(true);
    sethisVisible(false);
  };

  // 排序功能
  const handleSortChange = (value) => {
    const [field, direction] = value.split("_");
    setSortField(field);
    setSortDirection(direction);

    // 对结果进行排序
    const sortedResults = [...results].sort((a, b) => {
      let valueA, valueB;

      switch (field) {
        case "similarity":
          valueA = parseFloat(a.similarity) || 0;
          valueB = parseFloat(b.similarity) || 0;
          break;
        case "year":
          valueA = parseInt(a.year) || 0;
          valueB = parseInt(b.year) || 0;
          break;
        case "referencecount":
          valueA = a.referencecount || 0;
          valueB = b.referencecount || 0;
          break;
        case "title":
          valueA = (a.title || "").toLowerCase();
          valueB = (b.title || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (direction === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    setResults(sortedResults);
  };

  // 分享功能
  const handleShareResults = async () => {
    try {
      const element = document.getElementById("search-results");
      if (element) {
        const canvas = await html2canvas(element, { useCORS: true });
        canvas.toBlob(async (blob) => {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], "search-results.png", { type: "image/png" })] })) {
            await navigator.share({
              title: "SCAI Search Results",
              text: `Search results for "${query}"`,
              files: [new File([blob], "search-results.png", { type: "image/png" })],
            });
          } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
              }),
            ]);
            notification.success({
              message: "Copied to Clipboard",
              description: "Search results image has been copied to clipboard.",
            });
          }
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
      notification.error({
        message: "Share Failed",
        description: "Failed to share search results.",
      });
    }
  };

  // 导出搜索结果为图片
  const exportAsImage = () => {
    setTimeout(() => {
      const element = document.getElementById("search-results");
      if (element) {
        html2canvas(element, { useCORS: true }).then((canvas) => {
          const link = document.createElement("a");
          link.href = canvas.toDataURL();
          link.download = "search_results.png";
          link.click();
          notification.success({
            message: "Export Successful",
            description: "Search results have been exported as image.",
          });
        });
      }
    }, 0);
  };

  // 深度研究功能
  const handleReadFullText = async (paperId, source) => {
    console.log("Opening chat for paper:", paperId, "source:", source);
    setSelectedPaperId(paperId);
    setSelectedSource(source);
    setChatModalVisible(true);
  };

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setIsMobile(isMobile);
  }, [windowWidth]);

  return (
    <Layout showFooter={true}>
      <div className={`search-page ${currentTheme.name}-theme`}>
        {/* 主要内容区域 */}
        <div className="main-container">
          {/* 标题和搜索区域 */}
          <div className="search-header">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="title-section">
              <Title level={1} className="main-title">
                SCAI Search
              </Title>
              <Text className="subtitle">Your AI Gateway to Open-Access Scientific Research</Text>
            </motion.div>

            {/* 搜索输入框 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="search-input-section">
              <Input.Search placeholder="Search for papers, authors, or topics..." value={query} onChange={(e) => setQuery(e.target.value)} onSearch={handleSearch} size="large" loading={loading} className="main-search-input" style={{ maxWidth: 1200, width: "80%" }} />

              {/* 开放获取选项和历史记录 */}
              <div className="search-options">
                <label className="oa-checkbox">
                  <input type="checkbox" checked={openAccessOnly} onChange={(e) => setOpenAccessOnly(e.target.checked)} />
                  <span>Open Access Only</span>
                </label>

                {/* 历史记录展开按钮 */}
                {searchHistory.length > 0 && (
                  <Button type="text" icon={historyExpanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setHistoryExpanded(!historyExpanded)} className="history-toggle-btn">
                    Search History ({searchHistory.length})
                  </Button>
                )}
              </div>

              {/* 历史记录列表 */}
              {historyExpanded && searchHistory.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="history-dropdown">
                  <List
                    size="small"
                    dataSource={searchHistory.slice(0, 5)} // 只显示最近5条
                    renderItem={(item, index) => (
                      <List.Item
                        className="history-item"
                        actions={[
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              searchFromHistory(item);
                              setHistoryExpanded(false);
                            }}
                          >
                            Search
                          </Button>,
                          <Button type="link" size="small" danger onClick={() => deleteHistory(index)}>
                            Delete
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <span
                              className="history-query"
                              onClick={() => {
                                searchFromHistory(item);
                                setHistoryExpanded(false);
                              }}
                            >
                              {item.query}
                            </span>
                          }
                          description={`${item.results?.length || 0} results`}
                        />
                      </List.Item>
                    )}
                  />
                  {searchHistory.length > 5 && (
                    <div className="history-footer">
                      <Button type="link" size="small" onClick={() => sethisVisible(true)}>
                        View All History
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* 功能特性卡片 */}
          {/* {!results.length && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="features-section"
            >
              <Row gutter={[24, 24]} justify="center">
                {features.map((feature, index) => (
                  <Col xs={24} sm={12} lg={8} key={index}>
                    <Card
                      className="feature-card"
                      hoverable
                      onClick={() => feature.link && window.open(feature.link, '_blank')}
                    >
                      <div className="feature-icon">{feature.icon}</div>
                      <Title level={4} className="feature-title">{feature.title}</Title>
                      <Text className="feature-description">{feature.description}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </motion.div>
          )} */}

          {/* 搜索结果区域 */}
          {loading && (
            <div className="results-section" id="search-results">
              {/* 加载状态 */}
              <div className="loading-section">
                <LoadingComponent loading={loading} />
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="results-section" id="search-results">
              {/* 摘要部分 - 可折叠 */}
              <div className="summary-section">
                <div className="summary-header">
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <RobotOutlined style={{ color: currentTheme.isDark ? "#40a9ff" : "#1890ff" }} />
                    SCAI Assistant
                  </h3>
                  <Button type="text" icon={summaryCollapsed ? <DownOutlined /> : <UpOutlined />} onClick={() => setSummaryCollapsed(!summaryCollapsed)} className="collapse-btn">
                    {summaryCollapsed ? "Expand" : "Collapse"}
                  </Button>
                </div>
                {!summaryCollapsed && (
                  <div className="summary-container">
                    <Summary summary={summary} />
                  </div>
                )}
              </div>

              {/* 搜索结果列表 */}
              <div className="results-container">
                <div className="results-header">
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <SearchOutlined style={{ color: currentTheme.isDark ? "#40a9ff" : "#1890ff" }} />
                    Search Results
                  </h3>
                  <div className="results-controls">
                    <Select
                      defaultValue="similarity_desc"
                      style={{ width: 200, marginRight: 8 }}
                      onChange={handleSortChange}
                      options={[
                        { value: "default", label: "Default Sort" },
                        { value: "similarity_desc", label: "Relevance (High to Low)" },
                        { value: "similarity_asc", label: "Relevance (Low to High)" },
                        { value: "year_desc", label: "Year (Newest First)" },
                        { value: "year_asc", label: "Year (Oldest First)" },
                        { value: "referencecount_desc", label: "References (High to Low)" },
                        { value: "referencecount_asc", label: "References (Low to High)" },
                        { value: "title_asc", label: "Title (A to Z)" },
                        { value: "title_desc", label: "Title (Z to A)" },
                      ]}
                    />
                    <Button type="text" icon={<ShareAltOutlined />} onClick={handleShareResults} title="Share Results" style={{ marginRight: 4 }} />
                    <Button type="text" icon={<DownloadOutlined />} onClick={exportAsImage} title="Download Results" />
                  </div>
                </div>
                <SearchResult results={results} onReadFullText={handleReadFullText} isMobile={isMobile} pro={true} setModalVisible={setModalVisible} />
              </div>
              {/* 导出按钮 */}
              {/* {results.length > 0 && !loading && (
                <div className="export-section">
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={exportAsImage}
                    className="export-btn"
                  >
                    Export as Image
                  </Button>
                </div>
              )} */}
            </div>
          )}
        </div>

        {/* 历史记录模态框 - 仅在点击"View All History"时显示 */}
        <Modal title="All Search History" open={hisVisible} onCancel={() => sethisVisible(false)} footer={null} width={isMobile ? "95%" : 800} className="history-modal">
          <List
            dataSource={searchHistory}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    onClick={() => {
                      searchFromHistory(item);
                      sethisVisible(false);
                    }}
                  >
                    Search Again
                  </Button>,
                  <Button type="link" danger onClick={() => deleteHistory(index)}>
                    Delete
                  </Button>,
                ]}
              >
                <List.Item.Meta title={item.query} description={`${item.results?.length || 0} results found`} />
              </List.Item>
            )}
            locale={{ emptyText: "No search history" }}
          />
        </Modal>

        {/* 其他模态框 */}
        <UserGuidelineModal visible={modalVisible} onClose={() => setModalVisible(false)} />
        <UpdateModal visible={upVisible} onClose={() => setUpVisible(false)} />
        {/* ChatModal只在有选中的论文ID时显示 */}
        {selectedPaperId && (
          <ChatModal
            visible={chatModalVisible}
            onClose={() => {
              setChatModalVisible(false);
              setSelectedPaperId(null);
              setSelectedSource(null);
            }}
            paperId={selectedPaperId}
            source={selectedSource}
          />
        )}
      </div>
    </Layout>
  );
}
