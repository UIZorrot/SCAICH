import { useState, useEffect } from "react";
import { Switch, List, Space, Typography, Button, Select } from "antd";
import { FileTextOutlined, SearchOutlined, LinkOutlined, DownOutlined } from "@ant-design/icons";
import axios from "axios"; // Add axios for API requests
import articlesMerged from "../articles_merged.json";

const { Title, Text } = Typography;

// ExpandAbstract component remains unchanged
function ExpandAbstract({ abstract }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="abstract-container">
      <div
        className={isExpanded ? "abstract-content-expanded" : "abstract-content"}
        dangerouslySetInnerHTML={{ __html: isExpanded ? abstract : abstract }}
      ></div>
      <p className="abstract-expand" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? "Collapse" : "Expand"}
      </p>
    </div>
  );
}

function SearchResult({
  query,
  results,
  classOver,
  handleDownloadImageSearch,
  handleShareImageSearch,
  isMobile,
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
  const [sciNetAvailability, setSciNetAvailability] = useState({}); // New state for Sci-Net full-text

  // Build title-to-article mapping and check Sci-Net availability
  useEffect(() => {
    const articleMap = {};
    articlesMerged.forEach((article) => {
      articleMap[article.title.toLowerCase()] = {
        id: article.id,
        paperid: article.paperid,
      };
    });
    setMatchedArticles(articleMap);

    // Reset sort
    setDefaultSort({ field: "similarity", direction: "desc" });
    setSortField("similarity");
    setSortDirection("desc");

    // Check Sci-Net availability for articles without full-text
    const checkSciNet = async () => {
      const articlesToCheck = results.filter(
        (result) => result.doi && result.source !== "scihub" && result.source !== "arxiv"
      );

      const availabilityMap = { ...sciNetAvailability };
      for (const article of articlesToCheck) {
        // Skip if already checked
        if (article.doi in availabilityMap) continue;

        try {
          const response = await axios.post("https://sci-net.xyz/search", {
            doi: article.doi,
          });
          // Store true if sci-net is true, false otherwise
          availabilityMap[article.doi] = response.data?.["sci-net"] === true;
        } catch (error) {
          console.error(`Error checking Sci-Net for DOI ${article.doi}:`, error);
          availabilityMap[article.doi] = false; // Assume unavailable on error
        }
      }
      setSciNetAvailability(availabilityMap);
    };

    if (results.length > 0) {
      checkSciNet();
    }
  }, [results]);

  const toggleScihub = (checked) => {
    setShowScihub(checked);
  };

  function highlight(res) {
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
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
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
    <div
      id="search-container"
      style={{
        backgroundColor: "white",
        borderRadius: "32px",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "8px",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#F4F4F9",
              borderRadius: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/search-results-icon.png"
              alt="Search Results"
              style={{ width: "20px", height: "20px" }}
            />
          </div>
          <Title
            level={5}
            style={{ margin: 0, color: "#000000", fontSize: "20px" }}
          >
            Search Results
          </Title>
        </div>
        <div
          className={isMobile ? "switch-container-mobile" : ""}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Select
            defaultValue="similarity_desc"
            style={{ width: isMobile ? "100%" : 200, marginRight: 5 }}
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
          {handleDownloadImageSearch && (
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <img
                src="/share-icon.png"
                alt="Share"
                style={{ cursor: "pointer", width: "20px", height: "20px" }}
                onClick={handleShareImageSearch}
              />
              <img
                src="/download-icon.png"
                alt="Download"
                style={{ cursor: "pointer", width: "20px", height: "20px" }}
                onClick={handleDownloadImageSearch}
              />
            </div>
          )}
        </div>
      </div>
      <List
        style={{ paddingRight: "10px" }}
        className={classOver}
        itemLayout="vertical"
        dataSource={displayedResults}
        renderItem={(result, index) => (
          <List.Item>
            <Title
              onClick={() => {
                window.open(result.url, "_blank");
              }}
              level={5}
              style={{
                marginBottom: "0.5vw",
                color: "#575dff",
                marginTop: "0",
                cursor: "pointer",
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: highlight(result.title) }} />
            </Title>
            <Text
              type="secondary"
              style={{ fontSize: "14px", color: "#42e57e" }}
            >
              {result.author.length > 50
                ? result.author.slice(0, 50) + "..."
                : result.author.slice(0, 50)}{" "}
              - {result.year} -{" "}
              {result.location.length > 30
                ? result.location.slice(0, 30) + "..."
                : result.location.slice(0, 30)}
            </Text>
            <Text>
              {" "}
              | <i>Similarity: {result.similarity}</i>{" "}
            </Text>
            {handleDownloadImageSearch ? (
              <ExpandAbstract abstract={result.abstract.replace("Abstract", "")} />
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: result.abstract.replace("Abstract", ""),
                }}
              />
            )}
            <p>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <i>DOI: {result.doi}</i>
              </Text>
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: 8 }}>
              <Button
                type="primary"
                icon={<FileTextOutlined style={{ color: "#ffffff" }} />}
                style={{
                  color: "#ffffff",
                  background:
                    sciNetAvailability[result.doi] === true
                      ? "#52c41a" // Green for Sci-Net full-text
                      : "#1890ff", // Default blue
                }}
                onClick={() => {
                  const url =
                    sciNetAvailability[result.doi] === true
                      ? `https://sci-net.xyz/${result.doi}` // Sci-Net full-text URL
                      : result.url; // Original URL
                  window.open(url, "_blank");
                }}
              >
                {sciNetAvailability[result.doi] === true
                  ? "Fulltext Sci-Net"
                  : result.source === "scihub" || result.source === "arxiv"
                  ? "View Fulltext"
                  : "View Source"}
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
              {matchedArticles[result.title.toLowerCase()] && (
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
        )}
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
  );
}

export default SearchResult;