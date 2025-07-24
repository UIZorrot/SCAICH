import React, { useState, useEffect, useCallback } from "react";
import { Input, Typography, Button, notification, Modal, Card, List, Row, Col, Select, message } from "antd";
import { SearchOutlined, RobotOutlined, DownOutlined, UpOutlined, ShareAltOutlined, DownloadOutlined, FileTextOutlined, DatabaseOutlined } from "@ant-design/icons";
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
  const [latestPapers, setLatestPapers] = useState([]);
  const [showLatestPapers, setShowLatestPapers] = useState(false);
  const [totalPapersCount, setTotalPapersCount] = useState("--");
  const [irysStatus, setIrysStatus] = useState("checking"); // "checking", "available", "unavailable"
  const navigate = useNavigate();

  // 检查是否为重复历史记录
  const isDuplicateHistory = (newQuery) => {
    return searchHistory.some((item) => item.query === newQuery);
  };

  // GraphQL查询函数
  const executeGraphQLQuery = async (query) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch("/api/irys/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 如果是504或502错误，说明Irys服务不可用
        if (response.status === 504 || response.status === 502) {
          console.warn('Irys service is currently unavailable');
          setIrysStatus("unavailable");
          return { data: { transactions: { edges: [] } } }; // 返回空结果
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setIrysStatus("available");
      return result;
    } catch (error) {
      console.error('GraphQL query error:', error);
      setIrysStatus("unavailable");
      if (error.name === 'AbortError') {
        console.warn('Irys query timeout - service may be unavailable');
        return { data: { transactions: { edges: [] } } }; // 返回空结果而不是抛出错误
      }
      // 对于其他网络错误，也返回空结果而不是让整个搜索失败
      console.warn('Irys query failed, continuing without Irys results:', error.message);
      return { data: { transactions: { edges: [] } } };
    }
  };

  // 查询PDF版本
  const queryPdfVersions = async (doi) => {
    if (!doi) return [];

    const query1_0_3 = `
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["scivault"] },
            { name: "Content-Type", values: ["application/pdf"] },
            { name: "Version", values: ["1.0.3"] },
            { name: "doi", values: ["${doi}"] }
          ]
        ) {
          edges {
            node {
              id
              tags { name value }
            }
          }
        }
      }
    `;

    try {
      const result = await executeGraphQLQuery(query1_0_3);
      const versions = [];

      if (result.data?.transactions?.edges?.length > 0) {
        versions.push({
          version: "1.0.3",
          ids: result.data.transactions.edges.map((edge) => edge.node.id),
        });
      }

      return versions;
    } catch (error) {
      console.error("Error querying PDF versions:", error);
      return [];
    }
  };

  // 处理论文元数据
  const processPaperMetadata = async (edge) => {
    try {
      const id = edge.node.id;
      console.log(`📄 Processing paper metadata: ${id}`);

      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

      const metadataResponse = await fetch(`https://gateway.irys.xyz/${id}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!metadataResponse.ok) {
        console.warn(`⚠️ Failed to fetch metadata for ${id}: ${metadataResponse.status}`);
        return null;
      }

      const paper = await metadataResponse.json();
      const doi = edge.node.tags.find((tag) => tag.name === "doi")?.value;

      if (doi) {
        paper.pdfVersions = await queryPdfVersions(doi);
      } else {
        paper.pdfVersions = [];
      }

      console.log(`✅ Successfully processed paper: ${paper.title || 'Untitled'}`);
      return paper;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏱️ Timeout processing paper metadata: ${edge.node.id}`);
      } else {
        console.error("❌ Error processing paper metadata:", error);
      }
      return null;
    }
  };

  // 加载最新论文
  const loadLatestPapers = useCallback(async () => {
    setLoading(true); // 使用共用的loading状态
    try {
      // 只获取最新论文的查询
      const latestPapersQuery = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["scivault"] },
              { name: "Content-Type", values: ["application/json"] }
            ],
            limit: 20,
            order: DESC
          ) {
            edges {
              node {
                id
                tags { name value }
                timestamp
              }
            }
          }
        }
      `;

      console.log("🔍 Querying Irys for latest papers...");
      const result = await executeGraphQLQuery(latestPapersQuery);
      const metadataNodes = result.data?.transactions?.edges || [];

      console.log(`📊 Found ${metadataNodes.length} metadata nodes from Irys`);

      if (metadataNodes.length === 0) {
        console.warn("⚠️ No papers found on Irys - service may be unavailable");
        setLatestPapers([]);
        return;
      }

      const papers = await Promise.all(metadataNodes.map((edge) => processPaperMetadata(edge)));
      const validPapers = papers.filter((paper) => paper !== null);

      console.log(`✅ Successfully processed ${validPapers.length} papers`);

      // 转换为搜索结果格式
      const formattedPapers = validPapers.map((paper) => ({
        title: paper.title || "Untitled",
        author: paper.authors || "Unknown authors",
        year: new Date().getFullYear().toString(),
        abstract: paper.abstract || "No abstract available",
        doi: paper.doi || "",
        url: `https://uploader.irys.xyz/7NTozL367vtp2i1REuTKncHvnPjeZTdGMbUxYB4wJGnv?doi=${encodeURIComponent(paper.doi || "")}`,
        similarity: "1.0",
        location: "SCAI Box",
        source: "scai-box",
        is_oa: true,
        referencecount: 0,
      }));

      setLatestPapers(formattedPapers);
    } catch (error) {
      console.error("❌ Error loading latest papers:", error);
      console.warn("🔄 Irys service appears to be unavailable, showing empty results");
      setLatestPapers([]);
      // 不显示错误消息，因为这是正常的降级行为
    } finally {
      setLoading(false); // 使用共用的loading状态
    }
  }, []);

  // 异步加载总论文数量 - 从Irys统计数据获取
  const loadTotalPapersCount = useCallback(async () => {
    try {
      console.log("📊 Loading total papers count from Irys...");

      // 查询最新的统计数据
      const statisticsQuery = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["scivault"] },
              { name: "Content-Type", values: ["application/json"] },
              { name: "Version", values: ["2.0.0"] },
              { name: "type", values: ["statistics"] }
            ],
            limit: 1,
            order: DESC
          ) {
            edges {
              node {
                id
                tags { name value }
              }
            }
          }
        }
      `;

      const result = await executeGraphQLQuery(statisticsQuery);
      const edges = result.data?.transactions?.edges || [];

      if (edges.length === 0) {
        console.warn("⚠️ No statistics data found on Irys");
        setTotalPapersCount("--");
        return;
      }

      // 从tags中直接获取count值
      const node = edges[0].node;
      const countTag = node.tags.find(tag => tag.name === "count");

      if (countTag && countTag.value) {
        console.log(`✅ Found paper count in tags: ${countTag.value}`);
        setTotalPapersCount(countTag.value);
      } else {
        // 如果tags中没有count，则下载统计文件获取详细数据
        console.log("📥 Downloading statistics file...");
        const statsId = node.id;
        const statsResponse = await fetch(`https://gateway.irys.xyz/${statsId}`);

        if (!statsResponse.ok) {
          throw new Error("Failed to fetch statistics file");
        }

        const statsData = await statsResponse.json();
        const totalCount = statsData.root?.totalCount || statsData.totalCount || 0;
        console.log(`✅ Found paper count in file: ${totalCount}`);
        setTotalPapersCount(totalCount.toString());
      }
    } catch (error) {
      console.error("❌ Error loading total papers count:", error);
      console.warn("🔄 Using fallback count due to Irys unavailability");
      setTotalPapersCount("--");
    }
  }, []);

  // 处理Latest Papers按钮点击
  const handleLatestPapersClick = () => {
    if (!showLatestPapers) {
      // 清空搜索结果，确保互斥显示
      setResults([]);
      setSummary("");
      setQuery("");
      setTotalPapersCount("--"); // 重置计数显示
      loadLatestPapers();
      // 异步加载论文数量，不阻塞主要内容的显示
      setTimeout(() => {
        loadTotalPapersCount();
      }, 100);
    }
    setShowLatestPapers(!showLatestPapers);
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
    // 隐藏Latest Papers，确保互斥显示
    setShowLatestPapers(false);
    setLatestPapers([]);

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
    // 隐藏Latest Papers，确保互斥显示
    setShowLatestPapers(false);
    setLatestPapers([]);
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

  // 检查URL参数，自动触发Deep Research
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const deepResearchDoi = urlParams.get("deepResearch");
    const source = urlParams.get("source");
    const title = urlParams.get("title");

    if (deepResearchDoi) {
      // 自动触发Deep Research
      handleReadFullText(deepResearchDoi, source || "scihub");

      // 清理URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  return (
    // ${currentTheme.name}
    <Layout showFooter={true}>
      <div className={`search-page light-theme`}>
        {/* 主要内容区域 */}
        <div className="main-container">
          {/* 标题和搜索区域 */}
          <div className="search-header">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="title-section">
              <Title level={1} className="hero-title">
                SCAI Search
              </Title>
              <Text className="hero-subtitle">Your AI Gateway to Open-Access Scientific Research</Text>
            </motion.div>

            {/* 搜索输入框 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="search-input-section1">
              <Input.Search placeholder="Search for papers, authors, or topics..." value={query} onChange={(e) => setQuery(e.target.value)} onSearch={handleSearch} size="large" loading={loading} className="main-search-input" />

              {/* 开放获取选项和历史记录 */}
              <div className="search-options">
                <label className="oa-checkbox">
                  <input type="checkbox" checked={openAccessOnly} onChange={(e) => setOpenAccessOnly(e.target.checked)} />
                  <span>Open Access Only</span>
                </label>

                {/* Latest Papers按钮 */}
                {/* <Button type={showLatestPapers ? "primary" : "default"} icon={<DatabaseOutlined />} onClick={handleLatestPapersClick} loading={loading && showLatestPapers} className="latest-papers-btn">
                  {showLatestPapers ? "Hide Latest Papers" : "Show Latest Papers"}
                </Button> */}

                {/* 历史记录展开按钮 */}
                {searchHistory.length > 0 && (
                  <Button type="primary" icon={historyExpanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setHistoryExpanded(!historyExpanded)} className="history-toggle-btn">
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

              {/* 搜索结果区域 */}
              {loading && (
                <div className="results-section" id="search-results">
                  {/* 加载状态 */}
                  <div className="loading-section">
                    <LoadingComponent
                      loading={loading}
                      style={{
                        color: "#fff",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 搜索结果区域 - 只在有搜索结果且不显示Latest Papers时显示 */}
              {!loading && results.length > 0 && !showLatestPapers && (
                <div className="results-section" id="search-results" style={{ textAlign: "left" }}>
                  {/* 摘要部分 - 可折叠 */}
                  <div className="summary-section">
                    <div className="summary-header">
                      <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <RobotOutlined style={{ color: "#1890ff" }} />
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
                        <SearchOutlined style={{ color: "#1890ff" }} />
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

              {/* Latest Papers区域 - 只在显示Latest Papers且没有搜索结果时显示 */}
              {!loading && showLatestPapers && results.length === 0 && latestPapers.length > 0 && (
                <div className="results-section" id="latest-papers" style={{ textAlign: "left", marginTop: "2rem" }}>
                  <div className="results-container">
                    <div className="results-header">
                      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between", width: "100%" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <DatabaseOutlined style={{ color: "#1890ff" }} />
                          Latest Papers from SCAI Box
                          {irysStatus === "unavailable" && (
                            <span style={{
                              fontSize: "12px",
                              color: "#ff4d4f",
                              backgroundColor: "#fff2f0",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid #ffccc7"
                            }}>
                              Irys Offline
                            </span>
                          )}
                          {irysStatus === "available" && (
                            <span style={{
                              fontSize: "12px",
                              color: "#52c41a",
                              backgroundColor: "#f6ffed",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid #b7eb8f"
                            }}>
                              Irys Online
                            </span>
                          )}
                        </span>
                        <span className="papers-count-badge">{totalPapersCount} papers</span>
                      </h3>
                    </div>
                    <SearchResult results={latestPapers} onReadFullText={handleReadFullText} isMobile={isMobile} pro={true} setModalVisible={setModalVisible} />
                  </div>
                </div>
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
