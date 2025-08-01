import { useState, useEffect } from "react";
import { Switch, List, Space, Typography, Button, message, Modal } from "antd";
import { FileTextOutlined, PlayCircleOutlined, LinkOutlined, DownOutlined, HeartOutlined, HeartFilled, BookOutlined } from "@ant-design/icons";
import articlesMerged from "../articles_merged.json";
import { useBackground } from "../contexts/BackgroundContext";

const { Title, Text } = Typography;

// 收藏管理工具函数
const getFavorites = () => {
  try {
    const favorites = localStorage.getItem("scai_favorites");
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
};

const saveFavorites = (favorites) => {
  try {
    localStorage.setItem("scai_favorites", JSON.stringify(favorites));
  } catch (error) {
    console.error("Error saving favorites:", error);
  }
};

const addToFavorites = (paper) => {
  const favorites = getFavorites();
  const isAlreadyFavorited = favorites.some((fav) => fav.doi === paper.doi);

  if (!isAlreadyFavorited) {
    const favoriteItem = {
      ...paper,
      favoriteDate: new Date().toISOString(),
      id: paper.doi || Date.now().toString(),
    };
    favorites.push(favoriteItem);
    saveFavorites(favorites);
    return true;
  }
  return false;
};

const removeFromFavorites = (doi) => {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((fav) => fav.doi !== doi);
  saveFavorites(updatedFavorites);
};

const isFavorited = (doi) => {
  const favorites = getFavorites();
  return favorites.some((fav) => fav.doi === doi);
};

function ExpandAbstract({ abstract }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentTheme } = useBackground();

  return (
    <div className="abstract-container">
      <div
        className={isExpanded ? "abstract-content-expanded" : "abstract-content"}
        style={{
          color: currentTheme.isDark ? "rgba(255, 255, 255, 0.9)" : "#333",
        }}
        dangerouslySetInnerHTML={{ __html: isExpanded ? abstract : abstract }}
      ></div>
      <p
        className="abstract-expand"
        style={{
          color: currentTheme.isDark ? "#40a9ff" : "#1890ff",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Collapse" : "Expand"}
      </p>
    </div>
  );
}

function SearchResult({ query, results, classOver, onReadFullText, pro, setModalVisible }) {
  const [showScihub, setShowScihub] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [matchedArticles, setMatchedArticles] = useState({});
  const [sortField, setSortField] = useState("similarity");
  const [sortDirection, setSortDirection] = useState("desc");
  const [defaultSort, setDefaultSort] = useState({ field: "similarity", direction: "desc" });
  const [favoritedPapers, setFavoritedPapers] = useState(new Set());
  const [bibtexModalVisible, setBibtexModalVisible] = useState(false);
  const [currentBibtex, setCurrentBibtex] = useState("");
  const [currentPaperTitle, setCurrentPaperTitle] = useState("");
  const { currentTheme } = useBackground();

  useEffect(() => {
    const articleMap = {};
    articlesMerged.forEach((article) => {
      if (article.title) {
        articleMap[article.title.toLowerCase()] = {
          id: article.id,
          paperid: article.paperid,
        };
      }
    });
    setMatchedArticles(articleMap);

    setDefaultSort({ field: "similarity", direction: "desc" });
    setSortField("similarity");
    setSortDirection("desc");

    // 初始化收藏状态
    const favorites = getFavorites();
    const favoritedDois = new Set(favorites.map((fav) => fav.doi));
    setFavoritedPapers(favoritedDois);
  }, []);

  // 监听results变化，更新收藏状态
  useEffect(() => {
    const favorites = getFavorites();
    const favoritedDois = new Set(favorites.map((fav) => fav.doi));
    setFavoritedPapers(favoritedDois);
  }, [results]);

  function highlight(res) {
    if (!res || !query) return res || "";
    let res_r = res.split(" ").map((word) => {
      if (query.toLowerCase().includes(word.toLowerCase())) {
        return `<span style="font-weight: 800;">${word}</span>`;
      } else {
        return word;
      }
    });
    return res_r.join(" ");
  }

  const similarityOrder = {
    "highly relevant": 3,
    "somewhat relevant": 2,
    "barely related": 1,
  };

  const sortResults = (results) => {
    return [...results].sort((a, b) => {
      let valueA, valueB;
      switch (sortField) {
        case "similarity":
          valueA = similarityOrder[a.similarity] || 0;
          valueB = similarityOrder[b.similarity] || 0;
          return sortDirection === "asc" ? valueB - valueA : valueA - valueB;
        case "year":
          valueA = a.year || 0;
          valueB = b.year || 0;
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

      if (sortField === "title") {
        return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });
  };

  const filteredResults = results.filter((result) => !showScihub || result.source === "scihub");
  const sortedResults = sortResults(filteredResults);
  const displayedResults = sortedResults.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 5);
  };

  const handleFullPaperClick = (doi, source) => {
    // 未来再考虑pro
     onReadFullText(doi, source);
    // if (pro) {
    //   onReadFullText(doi, source);
    // } else {
    //   setModalVisible(true);
    // }
  };



  // 智能全文打开：立即打开新标签，后台检查API，失败时重定向到DOI页面
  const handleFulltextOpen = async (result) => {
    const cleanDoi = result.doi.replace(/^https?:\/\/doi\.org\//i, "");
    const encodedDoi = encodeURIComponent(cleanDoi);

    // 构建代理URL和DOI URL
    const proxyUrl = `https://api.scai.sh/api/fulltext/proxy/${encodedDoi}`;
    const doiUrl = `https://doi.org/${cleanDoi}`;

    console.log(`Attempting to open fulltext for DOI: ${cleanDoi}`);
    console.log(`Proxy URL: ${proxyUrl}`);

    // 立即打开新标签页，先尝试代理URL
    const newTab = window.open(proxyUrl, '_blank', 'noopener,noreferrer');

    // 在后台检查代理API是否会返回错误
    try {
      const response = await fetch(proxyUrl, {
        redirect: 'manual' // 不自动跟随重定向
      });

      // 如果是重定向响应（3xx）或成功的PDF/HTML响应，代理成功，无需处理
      if (response.status >= 300 && response.status < 400) {
        console.log('Proxy redirect successful');
        return;
      }

      if (response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        // 如果返回的是JSON，可能是错误响应
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          // 检查是否包含错误信息
          if (responseData.error || responseData.message) {
            console.log('Proxy API returned error response:', responseData);
            message.warning('Paper not found in proxy, redirecting to DOI page');
            // 重定向已打开的标签页到DOI URL
            if (newTab && !newTab.closed) {
              newTab.location.href = doiUrl;
            }
            return;
          }
        }
        
        // 如果返回的是PDF或HTML，说明代理成功
        if (contentType && (contentType.includes('pdf') || contentType.includes('html'))) {
          console.log('Proxy returned valid content');
          return;
        }
      }

      // 如果状态码表明有错误，重定向到DOI页面
      if (response.status >= 400) {
        console.log('Proxy API returned error status:', response.status);
        message.warning('Paper not found in proxy, redirecting to DOI page');
        // 重定向已打开的标签页到DOI URL
        if (newTab && !newTab.closed) {
          newTab.location.href = doiUrl;
        }
        return;
      }

    } catch (error) {
      console.log('Error checking proxy API, redirecting to DOI URL:', error);
      message.warning('Unable to access proxy, redirecting to DOI page');
      // 重定向已打开的标签页到DOI URL
      if (newTab && !newTab.closed) {
        newTab.location.href = doiUrl;
      }
    }
  };

  // DOI模式打开：直接打开DOI官方页面
  const handleDoiOpen = (result) => {
    const cleanDoi = result.doi.replace(/^https?:\/\/doi\.org\//i, "");
    const doiUrl = `https://doi.org/${cleanDoi}`;

    console.log(`Opening DOI page for: ${cleanDoi}`);
    console.log(`DOI URL: ${doiUrl}`);

    window.open(doiUrl, '_blank', 'noopener,noreferrer');
  };



  // 处理收藏/取消收藏
  const handleFavoriteClick = (result) => {
    const isCurrentlyFavorited = favoritedPapers.has(result.doi);

    if (isCurrentlyFavorited) {
      removeFromFavorites(result.doi);
      setFavoritedPapers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(result.doi);
        return newSet;
      });
      message.success("Removed from favorites");
    } else {
      const success = addToFavorites(result);
      if (success) {
        setFavoritedPapers((prev) => new Set(prev).add(result.doi));
        message.success("Added to favorites");
      } else {
        message.info("Already in favorites");
      }
    }
  };

  // 获取BibTeX引用
  const handleBibTexClick = async (result) => {
    try {
      const cleanDoi = result.doi.replace(/^https?:\/\/doi\.org\//i, "");

      // 使用CrossRef API获取BibTeX
      const response = await fetch(`https://api.crossref.org/works/${cleanDoi}/transform/application/x-bibtex`, {
        headers: {
          Accept: "application/x-bibtex",
        },
      });

      if (response.ok) {
        const bibtex = await response.text();

        // 设置弹窗内容并显示
        setCurrentBibtex(bibtex);
        setCurrentPaperTitle(result.title);
        setBibtexModalVisible(true);
      } else {
        throw new Error("Failed to fetch BibTeX");
      }
    } catch (error) {
      console.error("Error fetching BibTeX:", error);
      message.error("Failed to get BibTeX citation");
    }
  };

  // 复制BibTeX到剪贴板
  const copyBibtexToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentBibtex);
      } else {
        // 降级方案
        const textarea = document.createElement("textarea");
        textarea.value = currentBibtex;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      message.success("BibTeX copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      message.error("Failed to copy BibTeX");
    }
  };

  const handleSortChange = (value) => {
    if (value === "default") {
      setSortField(defaultSort.field);
      setSortDirection(defaultSort.direction);
    } else {
      const [field, direction] = value.split("_");
      setSortField(field);
      setSortDirection(direction);
    }
  };

  return (
    <>
      <div
        id="search-container"
        style={{
          borderRadius: "32px",
          padding: "24px",
        }}
      >
        <List
          style={{ paddingRight: "10px" }}
          className={classOver}
          itemLayout="vertical"
          dataSource={displayedResults}
          renderItem={(result, index) => {
            const cleanDoi = result.doi.replace(/^https?:\/\/doi\.org\//i, "");
            const hasIrys = result.irys_available === true;
            const buttonText = result.scinet ? "Fulltext Sci-Net" : hasIrys || result.is_oa || result.source === "scihub" || result.source === "arixv" ? "View Fulltext" : "View Source";
            const buttonColor = result.scinet ? "#52c41a" : hasIrys || result.is_oa || result.source === "scihub" || result.source === "arixv" ? "#52c41a" : "#1890ff";
            const buttonUrl = result.scinet ? `https://sci-net.xyz/${cleanDoi}` : result.url || `https://doi.org/${cleanDoi}`;

            return (
              <List.Item
                style={{
                  background: currentTheme.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                  border: currentTheme.isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  padding: "1rem",
                }}
              >
                <Title
                  onClick={() => {
                    handleFulltextOpen(result);
                  }}
                  level={5}
                  style={{
                    marginBottom: "0.5vw",
                    color: currentTheme.isDark ? "#40a9ff" : "#1890ff",
                    marginTop: "0",
                    cursor: "pointer",
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: highlight(result.title) }} />
                </Title>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "14px",
                    color: currentTheme.isDark ? "#52c41a" : "#389e0d",
                  }}
                >
                  {result.author.length > 50 ? result.author.slice(0, 50) + "..." : result.author.slice(0, 50)} - {result.year} - {result.location.length > 30 ? result.location.slice(0, 30) + "..." : result.location.slice(0, 30)}
                </Text>
                <Text style={{ color: currentTheme.isDark ? "rgba(255, 255, 255, 0.8)" : "#666" }}>
                  {" "}
                  | <i>Similarity: {result.similarity}</i>{" "}
                </Text>
                {pro ? (
                  <ExpandAbstract abstract={result.abstract.replace("Abstract", "")} />
                ) : (
                  <div
                    style={{
                      color: currentTheme.isDark ? "rgba(255, 255, 255, 0.9)" : "#333",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: result.abstract.replace("Abstract", ""),
                    }}
                  />
                )}
                <p>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      color: currentTheme.isDark ? "rgba(255, 255, 255, 0.6)" : "#999",
                    }}
                  >
                    <i>DOI: {result.doi}</i>
                  </Text>
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: 8, flexWrap: "wrap" }}>
                  {/* 根据按钮文本决定样式和行为 */}
                  {buttonText === "View Fulltext" ? (
                    // View Fulltext 按钮：绿色，使用智能API逻辑
                    <Button
                      type="primary"
                      icon={<FileTextOutlined style={{ color: "#ffffff" }} />}
                      style={{
                        color: "#ffffff",
                        background: "#52c41a",
                        borderColor: "#52c41a",
                      }}
                      onClick={() => handleFulltextOpen(result)}
                    >
                      View Fulltext
                    </Button>
                  ) : buttonText === "View Source" ? (
                    // View Source 按钮：黑色outlined样式，直接使用DOI
                    <Button
                      type="default"
                      icon={<FileTextOutlined style={{ color: "#000" }} />}
                      style={{
                        color: "#000",
                        borderColor: "#000",
                        background: "transparent",
                      }}
                      onClick={() => handleFulltextOpen(result)}
                    >
                      View Source
                    </Button>
                  ) : (
                    // 其他按钮（如Sci-Net）：保持原有逻辑
                    <Button
                      type="primary"
                      icon={<FileTextOutlined style={{ color: "#ffffff" }} />}
                      style={{
                        color: "#ffffff",
                        background: buttonColor,
                        borderColor: buttonColor,
                      }}
                      onClick={() => {
                        if (result.scinet) {
                          window.open(buttonUrl, "_blank");
                        } else {
                          handleFulltextOpen(result);
                        }
                      }}
                    >
                      {buttonText}
                    </Button>
                  )}



                  {/* 收藏按钮 */}
                  <Button
                    type={favoritedPapers.has(result.doi) ? "primary" : "default"}
                    icon={favoritedPapers.has(result.doi) ? <HeartFilled style={{ color: "#fff" }} /> : <HeartOutlined style={{ color: currentTheme.isDark ? "#fff" : "#666" }} />}
                    style={{
                      borderColor: favoritedPapers.has(result.doi) ? "#FF3314" : currentTheme.isDark ? "#444" : "#d9d9d9",
                      color: favoritedPapers.has(result.doi) ? "#fff" : currentTheme.isDark ? "#fff" : "#666",
                      background: favoritedPapers.has(result.doi) ? "#FF3314" : "transparent",
                    }}
                    onClick={() => handleFavoriteClick(result)}
                  >
                    {favoritedPapers.has(result.doi) ? "Saved" : "Save"}
                  </Button>

                  {/* BibTeX按钮 */}
                  <Button
                    icon={<BookOutlined />}
                    style={{
                      borderColor: currentTheme.isDark ? "#444" : "#d9d9d9",
                      color: currentTheme.isDark ? "#fff" : "#666",
                      background: "transparent",
                    }}
                    onClick={() => handleBibTexClick(result)}
                  >
                    BibTeX
                  </Button>

                  {(result.source === "scihub" || result.source === "arxiv" || buttonText === "View Fulltext" || result.irys_available === true) && (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined color="#fff" style={{ color: "#fff" }} />}
                      style={{
                        color: "#ffffff",
                        background: "#FF3314",
                        border: 0,
                      }}
                      onClick={() => handleFullPaperClick(result.doi, result.source)}
                    >
                      Deep Research
                    </Button>
                  )}
                  {result.title && matchedArticles[result.title.toLowerCase()] && (
                    <Button
                      type="primary"
                      icon={<LinkOutlined style={{ color: "#ffffff" }} />}
                      style={{
                        color: "#ffffff",
                        background: "#000000",
                      }}
                      onClick={() => {
                        const { id, paperid } = matchedArticles[result.title.toLowerCase()];
                        window.open(`https://yesnoerror.com/d/${paperid}/${id}`, "_blank");
                      }}
                    >
                      View YNE Result
                    </Button>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
        {displayCount < filteredResults.length && (
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            <Button
              type="default"
              shape="round"
              icon={<DownOutlined />}
              onClick={handleLoadMore}
              style={{
                backgroundColor: "#F4F4F9",
                borderColor: "#575dff",
                color: "#575dff",
                padding: "6px 20px",
                fontWeight: "500",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#575dff";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#F4F4F9";
                e.currentTarget.style.color = "#575dff";
              }}
            >
              More Results
            </Button>
          </div>
        )}
      </div>

      {/* BibTeX弹窗 */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOutlined style={{ color: "#1890ff" }} />
            <span>BibTeX Citation</span>
          </div>
        }
        open={bibtexModalVisible}
        onCancel={() => setBibtexModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={copyBibtexToClipboard}>
            Copy to Clipboard
          </Button>,
          <Button key="close" onClick={() => setBibtexModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
        centered
      >
        <div style={{ marginBottom: "1rem" }}>
          <Typography.Title level={5} style={{ margin: 0, color: "#666" }}>
            Paper: {currentPaperTitle}
          </Typography.Title>
        </div>

        <div
          style={{
            background: currentTheme.isDark ? "#1f1f1f" : "#f5f5f5",
            border: `1px solid ${currentTheme.isDark ? "#444" : "#d9d9d9"}`,
            borderRadius: "6px",
            padding: "1rem",
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: "13px",
            lineHeight: "1.5",
            maxHeight: "400px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {currentBibtex || "Loading BibTeX..."}
        </div>

        <div style={{ marginTop: "1rem", fontSize: "12px", color: "#999" }}>
          <Typography.Text type="secondary">Citation format provided by CrossRef API</Typography.Text>
        </div>
      </Modal>
    </>
  );
}

export default SearchResult;
