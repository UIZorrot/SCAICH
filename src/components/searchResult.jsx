import { useState, useEffect } from "react";
import { Switch, List, Space, Typography, Button } from "antd";
import { FileTextOutlined, SearchOutlined, LinkOutlined, DownOutlined } from "@ant-design/icons";
import articlesMerged from "../articles_merged.json";
import { useBackground } from "../contexts/BackgroundContext";

const { Title, Text } = Typography;

function ExpandAbstract({ abstract }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentTheme } = useBackground();

  return (
    <div className="abstract-container">
      <div
        className={isExpanded ? "abstract-content-expanded" : "abstract-content"}
        style={{
          color: currentTheme.isDark ? 'rgba(255, 255, 255, 0.9)' : '#333'
        }}
        dangerouslySetInnerHTML={{ __html: isExpanded ? abstract : abstract }}
      ></div>
      <p
        className="abstract-expand"
        style={{
          color: currentTheme.isDark ? '#40a9ff' : '#1890ff'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Collapse" : "Expand"}
      </p>
    </div>
  );
}

function SearchResult({
  query,
  results,
  classOver,
  onReadFullText,
  pro,
  setModalVisible,
}) {
  const [showScihub, setShowScihub] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [matchedArticles, setMatchedArticles] = useState({});
  const [sortField, setSortField] = useState("similarity");
  const [sortDirection, setSortDirection] = useState("desc");
  const [defaultSort, setDefaultSort] = useState({ field: "similarity", direction: "desc" });
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
  }, []);



  function highlight(res) {
    if (!res || !query) return res || '';
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
          valueA = (a.title || '').toLowerCase();
          valueB = (b.title || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortField === "title") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    });
  };

  const filteredResults = results.filter(
    (result) => !showScihub || result.source === "scihub"
  );
  const sortedResults = sortResults(filteredResults);
  const displayedResults = sortedResults.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 5);
  };

  const handleFullPaperClick = (doi, source) => {
    if (pro) {
      onReadFullText(doi, source);
    } else {
      setModalVisible(true);
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
            const buttonText = result.scinet
              ? "Fulltext Sci-Net"
              : (result.is_oa || result.source === "scihub" || result.source === "arixv")
                ? "View Fulltext"
                : "View Source";
            const buttonColor = result.scinet ? "#52c41a" : (result.is_oa || result.source === "scihub" || result.source === "arixv") ? "#52c41a" : "#1890ff";
            const buttonUrl = result.scinet
              ? `https://sci-net.xyz/${cleanDoi}`
              : result.url;

            return (
              <List.Item
                style={{
                  background: currentTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                  border: currentTheme.isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  padding: '1rem'
                }}
              >
                <Title
                  onClick={() => {
                    window.open(result.url, "_blank");
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
                    color: currentTheme.isDark ? "#52c41a" : "#389e0d"
                  }}
                >
                  {result.author.length > 50
                    ? result.author.slice(0, 50) + "..."
                    : result.author.slice(0, 50)}{" "}
                  - {result.year} -{" "}
                  {result.location.length > 30
                    ? result.location.slice(0, 30) + "..."
                    : result.location.slice(0, 30)}
                </Text>
                <Text style={{ color: currentTheme.isDark ? 'rgba(255, 255, 255, 0.8)' : '#666' }}>
                  {" "}
                  | <i>Similarity: {result.similarity}</i>{" "}
                </Text>
                {pro ? (
                  <ExpandAbstract abstract={result.abstract.replace("Abstract", "")} />
                ) : (
                  <div
                    style={{
                      color: currentTheme.isDark ? 'rgba(255, 255, 255, 0.9)' : '#333'
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
                      color: currentTheme.isDark ? 'rgba(255, 255, 255, 0.6)' : '#999'
                    }}
                  >
                    <i>DOI: {result.doi}</i>
                  </Text>
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: 8 }}>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined style={{ color: "#ffffff" }} />}
                    style={{
                      color: "#ffffff",
                      background: buttonColor,
                    }}
                    onClick={() => {
                      window.open(buttonUrl, "_blank");
                    }}
                  >
                    {buttonText}
                  </Button>
                  {(result.source === "scihub" || result.source === "arxiv") && (
                    <Button
                      type="primary"
                      icon={<SearchOutlined style={{ color: "#ffffff" }} />}
                      style={{
                        color: "#ffffff",
                        background: "#ff4d4f",
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
                        window.open(
                          `https://yesnoerror.com/d/${paperid}/${id}`,
                          "_blank"
                        );
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
      </div></>
  );
}

export default SearchResult;