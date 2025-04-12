import { useState } from "react";
import { Switch, List, Space, Typography, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

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
  pro, // 接收 pro 状态
  setModalVisible, // 接收 setModalVisible 函数
}) {
  const [showScihub, setShowScihub] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);

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

  const filteredResults = results.filter(
    (result) => !showScihub || result.source === "scihub"
  );
  const displayedResults = filteredResults.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 5);
  };

  // 处理“Deep Research Full Paper”按钮点击
  const handleFullPaperClick = (doi, source) => {
    if (pro) {
      // 如果是会员，调用 onReadFullText 打开 ChatModal
      onReadFullText(doi, source);
    } else {
      // 如果不是会员，打开 SciHubModal
      setModalVisible(true);
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
          <Space
            style={{ marginLeft: isMobile ? 0 : 20 }}
            className={isMobile ? "" : "switch-container"}
          >
            {isMobile ? (
              <>
                <Switch
                  checked={showScihub}
                  onChange={toggleScihub}
                  checkedChildren="On"
                  unCheckedChildren="Off"
                  style={{
                    backgroundColor: showScihub ? "#ff4d4f" : "#bfbfbf",
                    borderColor: showScihub ? "#ff4d4f" : "#bfbfbf",
                  }}
                />
                <Text style={{ marginRight: "8px" }}>Scihub Result</Text>
              </>
            ) : (
              <>
                <Text style={{ marginRight: "8px" }}>Scihub Result</Text>
                <Switch
                  checked={showScihub}
                  onChange={toggleScihub}
                  checkedChildren="On"
                  unCheckedChildren="Off"
                  style={{
                    backgroundColor: showScihub ? "#ff4d4f" : "#bfbfbf",
                    borderColor: showScihub ? "#ff4d4f" : "#bfbfbf",
                  }}
                />
              </>
            )}
          </Space>
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
              {result.url.includes("bnbchain") && (
                <img
                  src="bnblogo.png"
                  alt="bnblogo"
                  height={14}
                  width={12}
                  style={{ marginRight: 10 }}
                />
              )}
              {result.source === "pubmed" && (
                <img
                  src="PubMedlogo.png"
                  alt="pubmedlogo"
                  height={14}
                  width={10}
                  style={{ marginRight: 10 }}
                />
              )}
              {(result.source === "arxiv" || result.location.includes("arXiv")) && (
                <img
                  src="arxiv-logomark-small@2x.png"
                  alt="arxivlogo"
                  height={14}
                  width={10}
                  style={{ marginRight: 10 }}
                />
              )}
              {result.source === "scihub" && (
                <img
                  src="Sci-Hub_logo.png"
                  alt="scihublogo"
                  height={14}
                  width={10}
                  style={{ marginRight: 10 }}
                />
              )}
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
              {result.location > 30
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
            <p>            <Text type="secondary"
              style={{ fontSize: "12px" }}><i>DOI: {result.doi}</i>
            </Text></p>
            {(result.source === "scihub" || result.source === "arxiv") && (
              <Button
                type="outlined"
                style={{
                  marginTop: 8,
                  color: "#575dff",
                  borderColor: "#575dff",
                }}
                onClick={() => handleFullPaperClick(result.doi, result.source)} // 使用新的点击处理函数
              >
                Deep Research Full Paper 👑
              </Button>
            )}
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