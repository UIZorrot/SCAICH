import React, { useState, useEffect } from "react";
import { Input, Typography, Button, Drawer, notification, Modal, Card, List, Space, Radio, Avatar, Row, Col } from "antd";
import { MenuOutlined, HomeOutlined, GlobalOutlined, KeyOutlined, HistoryOutlined, LinkOutlined, CommentOutlined, DatabaseOutlined, LockOutlined, CopyOutlined, UserOutlined, UploadOutlined, ExportOutlined, LogoutOutlined } from "@ant-design/icons";
import "./App.css";
import html2canvas from "html2canvas";
import { LoadingComponent } from "./components/Loading.jsx";
import Summary from "./components/summary.jsx";
import SearchResult from "./components/searchResult.jsx";
import { UserGuidelineModal } from "./components/guild.jsx";
import { UpdateModal } from "./components/updatelog.jsx";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import ChatModal from "./components/chatpage.jsx";
import { color, motion } from "framer-motion";
import ProfileModal from "./components/ProfileModal.jsx"; // 新增导入
import { InviteCodeGuideModal } from "./components/InviteCodeGuideModal.jsx"; // 新增导入
import { useNavigate } from "react-router-dom"; // 新增导入

const { Title, Text } = Typography;


const LoginModal = ({ visible, onClose, setUserId, setIsLoggedIn, isMobile }) => {
  const [loginType, setLoginType] = useState("invite"); // invite 或 userId
  const [inviteCode, setInviteCode] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [tempUserId, setTempUserId] = useState("");
  const [inviteGuideVisible, setInviteGuideVisible] = useState(false); // 新增状态

  const handleLogin = async () => {
    if (loginType === "invite" && !inviteCode) {
      notification.error({ message: "Please enter an invite code" });
      return;
    }
    if (loginType === "userId" && !userIdInput) {
      notification.error({ message: "Please enter a user ID" });
      return;
    }

    setLoading(true);
    try {
      if (loginType === "invite") {
        const response = await fetch(`https://api.scai.sh/invite?code=${encodeURIComponent(inviteCode)}`);
        const data = await response.json();
        if (data.success) {
          setTempUserId(data.user_id);
          setShowIdModal(true);
        } else {
          notification.error({ message: data.message });
        }
      } else {
        const response = await fetch(`https://api.scai.sh/verify-user?user_id=${encodeURIComponent(userIdInput)}`);
        const data = await response.json();
        if (data.success) {
          setUserId(userIdInput);
          setIsLoggedIn(true);
          localStorage.setItem("userId", userIdInput);
          localStorage.setItem("loginTime", new Date().toISOString());
          notification.success({ message: "Logged in successfully!" });
          onClose();
        } else {
          notification.error({ message: data.message });
        }
      }
    } catch (error) {
      notification.error({ message: `Failed to ${loginType === "invite" ? "verify invite code" : "verify user ID"}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveId = () => {
    setUserId(tempUserId);
    setIsLoggedIn(true);
    localStorage.setItem("userId", tempUserId);
    localStorage.setItem("loginTime", new Date().toISOString());
    notification.success({ message: "Logged in successfully! Please save your User ID." });
    setShowIdModal(false);
    onClose();
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(tempUserId);
    notification.success({ message: "User ID copied to clipboard!" });
  };

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={isMobile ? "90%" : 450}
        style={{ borderRadius: "16px" }}
        bodyStyle={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%", textAlign: "center" }}>
            <LockOutlined style={{ fontSize: "32px", color: "#ff2222" }} />
            <Title level={4} style={{ color: "#333", margin: 0 }}>
              Login to SCAICH
            </Title>
            <Text style={{ color: "#666" }}>
              {loginType === "invite"
                ? "Enter your invite code to unlock SCAICH. Contact admin for a code."
                : "Enter your user ID to log in."}
            </Text>
            <Radio.Group
              value={loginType}
              onChange={(e) => setLoginType(e.target.value)}
              style={{ marginBottom: 16 }}
            >
              <Radio.Button value="invite">Invite Code</Radio.Button>
              <Radio.Button value="userId">User ID</Radio.Button>
            </Radio.Group>
            <Input
              placeholder={loginType === "invite" ? "Enter your invite code" : "Enter your user ID"}
              value={loginType === "invite" ? inviteCode : userIdInput}
              onChange={(e) => (loginType === "invite" ? setInviteCode(e.target.value) : setUserIdInput(e.target.value))}
              prefix={<KeyOutlined style={{ color: "#999" }} />}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "10px",
                color: "#333",
              }}
            />
            <Button
              type="primary"
              block
              loading={loading}
              onClick={handleLogin}
              style={{
                background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                height: "40px",
                transition: "transform 0.2s",
                marginBottom: 0,
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {loginType === "invite" ? "Verify and Login" : "Login"}
            </Button>
            <Button
              type="default"
              block
              onClick={() => setInviteGuideVisible(true)} // 打开模态框
              style={{
                marginTop: 0,
                border: "1px solid rgba(255, 24, 24, 0.8)",
                color: "#ff4d4f",
                borderRadius: "8px",
                padding: "10px",
                height: "40px",
                background: "transparent",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 24, 24, 0.1)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              How to Get Invite Code
            </Button>
          </Space>
        </motion.div>
      </Modal>
      <Modal
        open={showIdModal}
        onCancel={() => setShowIdModal(false)}
        footer={null}
        width={isMobile ? "90%" : 450}
        style={{ borderRadius: "16px" }}
        bodyStyle={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%", textAlign: "center" }}>
            <Title level={4} style={{ color: "#333", margin: 0 }}>
              Your User ID
            </Title>
            <Text style={{ color: "#ff4d4f" }}>
              Please save this User ID securely. You'll need it to log in again.
            </Text>
            <Input
              value={tempUserId}
              disabled
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "10px",
                color: "#333",
                textAlign: "center",
              }}
            />
            <Space>
              <Button
                type="default"
                icon={<CopyOutlined />}
                onClick={handleCopyId}
                style={{ borderRadius: "8px" }}
              >
                Copy ID
              </Button>
              <Button
                type="primary"
                onClick={handleSaveId}
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                  borderRadius: "8px",
                }}
              >
                Save and Continue
              </Button>
            </Space>
          </Space>
        </motion.div>
      </Modal>
      <InviteCodeGuideModal visible={inviteGuideVisible} onClose={() => setInviteGuideVisible(false)} /> {/* 新增模态框 */}
    </>
  );
};


export default function SearchApp() {
  const [canvasResults, setCanvasResults] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userId"));
  const [upVisible, setUpVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hisVisible, sethisVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const storedHistory = localStorage.getItem("searchHistory");
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [isFromLocal, setIsFromLocal] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const navigate = useNavigate();

  // 验证用户 ID
  const verifyUserId = async (userId) => {
    try {
      const response = await fetch(`https://api.scai.sh/verify-user?user_id=${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (!data.success) {
        localStorage.removeItem("userId");
        localStorage.removeItem("loginTime");
        setUserId("");
        setIsLoggedIn(false);
        setLoginModalVisible(true);
        notification.error({ message: "Invalid user ID. Please log in again." });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error verifying user ID:", error);
      localStorage.removeItem("userId");
      localStorage.removeItem("loginTime");
      setUserId("");
      setIsLoggedIn(false);
      setLoginModalVisible(true);
      notification.error({ message: "Failed to verify user ID. Please log in again." });
      return false;
    }
  };

  // 页面加载时验证用户 ID
  useEffect(() => {
    if (userId) {
      verifyUserId(userId).then((isValid) => {
        if (isValid) {
          setIsLoggedIn(true);
        } else {
          setLoginModalVisible(true);
        }
      });
    } else {
      setLoginModalVisible(true);
    }
  }, [userId]);

  // 处理 URL 参数
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsFromLocal(false);
    if (queryParams.get("result")) {
      const compressedResults = queryParams.get("result");
      const decompressedResults = decompressFromEncodedURIComponent(compressedResults);
      setResults(JSON.parse(decompressedResults));
    }
    if (queryParams.get("summary")) {
      const compressedSummary = queryParams.get("summary");
      const decompressedSummary = decompressFromEncodedURIComponent(compressedSummary);
      setSummary(JSON.parse(decompressedSummary));
    }
    if (queryParams.get("query")) {
      const compressedQuery = queryParams.get("query");
      const decompressedQuery = decompressFromEncodedURIComponent(compressedQuery);
      setQuery(decompressedQuery);
    }
  }, []);

  const [api, contextHolder] = notification.useNotification();

  const handleShareImage = () => {
    const truncateData = (data) => {
      return data.map((item) => ({
        ...item,
        abstract: item.abstract.length > 240 ? item.abstract.slice(0, 240) + "..." : item.abstract,
        author: item.author.length > 40 ? item.author.slice(0, 40) + "..." : item.author,
        scihub_url: "",
      }));
    };
    const compressAndEncode = (data) => {
      const compressedData = compressToEncodedURIComponent(JSON.stringify(data));
      return compressedData;
    };
    const truncatedResults = truncateData(results.slice(0, 3));
    const compressedQuery = compressAndEncode(query);
    const compressedResults = compressAndEncode(truncatedResults);
    const compressedSummary = compressAndEncode(summary);
    const link = `${window.location.origin}/search?query=${compressedQuery}&result=${compressedResults}&summary=${compressedSummary}`;
    api.open({
      message: "Link Copied",
      description: "You can share it to others via link",
      placement: "bottomRight",
      duration: 2,
    });
    navigator.clipboard.writeText(link);
  };

  const handleSuffixClick = () => {
    setOpenAccessOnly(!openAccessOnly);
  };

  const iconColor = openAccessOnly ? "#FF4D4F" : "#BFBFBF";

  const isDuplicateHistory = (query) => {
    return searchHistory.some((historyItem) => historyItem.query === query);
  };

  const handleDownloadImage = () => {
    setCanvasResults(0);
    setTimeout(() => {
      const resultsElement = document.getElementById("result-container");
      if (resultsElement) {
        html2canvas(resultsElement).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "assist_results.png";
          link.click();
        });
      }
    }, 0);
  };

  const handleDownloadImageSearch = () => {
    setCanvasResults(1);
    setTimeout(() => {
      const resultsElement = document.getElementById("search-container");
      if (resultsElement) {
        html2canvas(resultsElement).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "search_results.png";
          link.click();
        });
      }
    }, 0);
  };

  const handleSearch = async () => {
    if (!isLoggedIn || !userId) {
      notification.error({ message: "Please log in to use the app" });
      setLoginModalVisible(true);
      return;
    }

    const isValid = await verifyUserId(userId);
    if (!isValid) return;

    if (query.replace(" ", "") === "") {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.scai.sh/search?query=${encodeURIComponent(query)}&limit=10&oa=${openAccessOnly}`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Access-Control-Allow-Origin": true,
            "ngrok-skip-browser-warning": true,
            "Content-Type": "Authorization",
          },
        }
      );
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

  const deleteHistory = (index) => {
    const updatedHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  const [searchLoadingIndex, setSearchLoadingIndex] = useState(0);

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

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setSearchLoadingIndex((prevIndex) => (prevIndex + 1) % 4);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const getLoadingIcon = () => {
    return <img src={`/search_loading_${searchLoadingIndex + 1}.png`} alt="loading" style={{ width: 20, height: 20 }} />;
  };

  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => {
    setIsCollapsed((prevState) => !prevState);
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const showUpModal = () => {
    setUpVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleUpCancel = () => {
    setUpVisible(false);
  };

  const handleReadFullText = async (paperId, source) => {
    if (!isLoggedIn || !userId) {
      notification.error({ message: "Please log in to use Deep Research" });
      setLoginModalVisible(true);
      return;
    }

    const isValid = await verifyUserId(userId);
    if (!isValid) return;

    setSelectedPaperId(paperId);
    setChatModalVisible(true);
    setSelectedSource(source);
  };

  const features = [
    {
      title: "Desci Integration",
      description: "Access detailed paper analysis via Web3 Desci integration.",
      icon: <LinkOutlined style={{ fontSize: "24px", color: "#1890ff" }} />,
    },
    {
      title: "Deep Research",
      description: "Engage in AI-driven conversations with the fulltext papers.",
      icon: <CommentOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />,
    },
    {
      title: "Multi-Database Search",
      description: "Search across Sci-Hub, OpenAlex, arXiv, and PubMed.",
      icon: <DatabaseOutlined style={{ fontSize: "24px", color: "#000000" }} />,
    },
  ];


  const [backgroundImage, setBackgroundImage] = useState("/bg4.jpg"); // 初始背景

  const handleBackgroundSwitch = () => {
    const backgrounds = ["/bg2.jpg", "/bg3.jpg", "/bg4.jpg"];
    const currentIndex = backgrounds.indexOf(backgroundImage);
    const nextIndex = (currentIndex + 1) % backgrounds.length; // 循环切换
    setBackgroundImage(backgrounds[nextIndex]);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#e7e3f4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {contextHolder}
      <div className="body">
        <img
          src={backgroundImage}
          alt="Background"
          style={{ backgroundSize: "cover", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
        />
      </div>
      <div
        className="navbar"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "transparent",
          boxShadow: "none",
          marginBottom: 12,
        }}
      >
        <div className="nav-links" style={{ display: "flex", gap: "20px", alignItems: "center", marginLeft: 30 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <HistoryOutlined onClick={() => sethisVisible(true)} style={{ fontSize: "22px", marginRight: "20px" }} />
            <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "32px", marginRight: "8px", borderRadius: "32px" }} />
            <Title level={4} style={{ margin: 0 }}>
              SCAICH
            </Title>
            <Text style={{ margin: "0 8px" }}>|</Text>
            <Text>SCAI search engine</Text>
          </div>
        </div>
        <Drawer title="Search History" placement="left" onClose={() => sethisVisible(false)} open={hisVisible}>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {searchHistory.length > 0 ? (
              searchHistory.map((historyItem, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                  <Button
                    style={{ width: "74%" }}
                    onClick={() => {
                      setQuery(historyItem.query);
                      setResults(historyItem.results);
                      setSummary(historyItem.summary);
                    }}
                  >
                    {historyItem.query.length > 30 ? historyItem.query.slice(0, 30) + " .." : historyItem.query}
                  </Button>
                  <Button type="primary" danger block style={{ width: "24%" }} onClick={() => deleteHistory(index)}>
                    Delete
                  </Button>
                </div>
              ))
            ) : (
              <Text>No search history available</Text>
            )}
          </div>
        </Drawer>
        <Text type="text" className="menu-button" onClick={() => setMenuVisible(true)} style={{ marginLeft: 15, marginBottom: "6px", display: "none", alignItems: "center", textAlign: "center" }}>
          <Title level={4} style={{ margin: 0 }}>
            <MenuOutlined style={{ fontSize: "20px", marginRight: "10px" }} />
            <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "28px", marginLeft: "4px", marginRight: "12px", position: "relative", top: 5, borderRadius: "12px" }} />
            SCAICH
          </Title>
        </Text>
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "20px", zIndex: 10 }}>

            {isLoggedIn && (
              <Button
                icon={<LogoutOutlined />}
                danger
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                onClick={() => {
                  localStorage.removeItem("userId");
                  localStorage.removeItem("loginTime");
                  setUserId("");
                  setIsLoggedIn(false);
                  setLoginModalVisible(true);
                  notification.info({ message: "Logged out successfully" });
                }}
              >
                Logout
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "20px", alignItems: "center", marginRight: "20px", zIndex: 10 }}>

            <Button type="default" ghost style={{ borderRadius: "4px" }} onClick={showModal}>
              Guidelines
            </Button>
            {/* <Button type="default" ghost style={{ borderRadius: "4px" }} onClick={showUpModal}>
              Update Logs
            </Button> */}
            <Button
              type="default"
              ghost
              onClick={handleBackgroundSwitch}
              style={{ borderRadius: "4px" }}
            >
              Switch Background
            </Button>
            <Button
              type="default"
              ghost
              onClick={() => (isLoggedIn ? setProfileModalVisible(true) : setLoginModalVisible(true))}
            >
              {isLoggedIn ? "Profile" : "Login"}
            </Button>
            {isLoggedIn && (
              <Button
                icon={<LogoutOutlined />}
                danger
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                onClick={() => {
                  localStorage.removeItem("userId");
                  localStorage.removeItem("loginTime");
                  setUserId("");
                  setIsLoggedIn(false);
                  setLoginModalVisible(true);
                  notification.info({ message: "Logged out successfully" });
                }}
              >
                Logout
              </Button>
            )}
          </div>
        )}
        <Drawer title="Menu" placement="left" onClose={() => setMenuVisible(false)} open={menuVisible} bodyStyle={{ padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {/* <Button href="https://sci-hub.se/">
              <HomeOutlined /> Scihub Official
            </Button>
            <Button href="https://www.scihub.fans/">
              <GlobalOutlined /> Scihub Community
            </Button> */}
            <Button style={{ borderRadius: "4px" }} onClick={showModal}>
              Guidelines
            </Button>
            {/* <Button style={{ borderRadius: "4px" }} onClick={showUpModal}>
              Update Logs
            </Button> */}
            <Button
              type="default"
              onClick={handleBackgroundSwitch}
              style={{ borderRadius: "4px" }}
            >Switch Background</Button>
            <Button
              type="default"
              style={{ borderRadius: "4px" }}
              onClick={() => (isLoggedIn ? setProfileModalVisible(true) : setLoginModalVisible(true))}
            >
              {isLoggedIn ? "Profile" : "Login"}
            </Button>
            {isLoggedIn && (
              <Button
                icon={<LogoutOutlined />}
                danger
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                onClick={() => {
                  localStorage.removeItem("userId");
                  localStorage.removeItem("loginTime");
                  setUserId("");
                  setIsLoggedIn(false);
                  setLoginModalVisible(true);
                  notification.info({ message: "Logged out successfully" });
                }}
              >
                Logout
              </Button>
            )}
            <Title level={5} style={{ marginTop: 10 }}>
              Search History
            </Title>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {searchHistory.length > 0 ? (
                searchHistory.map((historyItem, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                    <Button
                      style={{ width: "74%" }}
                      onClick={() => {
                        setQuery(historyItem.query);
                        setResults(historyItem.results);
                        setSummary(historyItem.summary);
                        setIsFromLocal(true);
                      }}
                    >
                      {historyItem.query.length > 30 ? historyItem.query.slice(0, 30) + " .." : historyItem.query}
                    </Button>
                    <Button type="primary" danger block style={{ width: "24%" }} onClick={() => deleteHistory(index)}>
                      Delete
                    </Button>
                  </div>
                ))
              ) : (
                <Text>No search history available</Text>
              )}
            </div>
          </div>
        </Drawer>
      </div>
      {!isLoggedIn ? (
        <div
          style={{
            width: "80%",
            margin: "auto",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(6px)",
            borderRadius: "32px",
          }}
        >
          <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "30px 0" }}>
            <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "72px", marginBottom: "12px", borderRadius: "72px" }} />
            <Title level={2} style={{ margin: 0, fontSize: isMobile ? "28px" : "36px", fontWeight: "800", color: "#333" }}>
              SCAICH
            </Title>
            <Text style={{ margin: "8px 0", fontSize: isMobile ? "16px" : "20px", fontWeight: "300", color: "#333" }}>
              SCAI Search Engine
            </Text>
            <Text style={{ margin: 0, fontSize: isMobile ? "12px" : "16px", fontWeight: "300", color: "#333" }}>
              Your AI Gateway to Open-Access Scientific Research
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            onClick={() => setLoginModalVisible(true)}
            style={{ background: "linear-gradient(45deg, rgba(255, 24, 55, 0.95), rgb(255, 96, 131))", borderRadius: "8px", marginBottom: "24px" }}
          >
            Login with Invite Code or User ID
          </Button>
          <div className="features-container">
            <Title level={3} style={{ margin: "0 0 28px 0", textAlign: "center", color: "#333" }}>
              Discover Our Features
            </Title>
            <List
              grid={{ gutter: 24, xs: 1, sm: 2, md: 3 }}
              dataSource={features}
              renderItem={(item, index) => (
                <List.Item>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      hoverable
                      className="feature-card"
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "16px",
                        border: "2px solid transparent",
                        backgroundClip: "padding-box",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05)",
                        backdropFilter: "blur(10px)",
                      }}
                      bodyStyle={{ padding: "16px", textAlign: "center" }}
                    >
                      <div style={{ background: item.gradient, padding: "2px", borderRadius: "12px", display: "inline-block" }}>
                        {item.icon}
                      </div>
                      <Title level={5} style={{ margin: "12px 0 8px", color: "#333", fontWeight: 700 }}>
                        {item.title}
                      </Title>
                      <Text style={{ color: "#333", fontWeight: 300 }}>{item.description}</Text>
                    </Card>
                  </motion.div>
                </List.Item>
              )}
            />
          </div>
        </div>
      ) : (
        <div
          className="SearchArea"
          style={{
            margin: results.length === 0 ? "auto" : "2vw",
            paddingBottom: results.length === 0 ? "16px" : "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(6px)",
          }}
        >
          {results.length === 0 && (
            <div>
              {!isMobile ? (
                <div style={{ zIndex: 2, display: "flex", alignItems: "center", margin: "30px", marginTop: 44 }}>
                  <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "72px", marginRight: "12px", borderRadius: "72px" }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Title level={4} style={{ margin: 0, fontSize: "36px", fontWeight: "800" }}>
                        SCAICH
                      </Title>
                      <Text style={{ margin: 0, marginLeft: "12px", fontSize: "32px", fontWeight: "300" }}>
                        | SCAI search engine
                      </Text>
                    </div>
                    <Text style={{ margin: 0, fontSize: "16px", fontWeight: "300" }}>
                      Your AI Gateway to Open-Access Scientific Research
                    </Text>
                  </div>
                </div>
              ) : (
                <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "72px", marginRight: "12px", borderRadius: "72px" }} />
                  <Title level={4} style={{ margin: 0, fontSize: "32px", fontWeight: "800" }}>
                    SCAICH
                  </Title>
                  <Text style={{ margin: 0, marginLeft: "12px", fontSize: "20px", fontWeight: "300" }}>
                    SCAI search engine
                  </Text>
                  <Text style={{ margin: 0, fontSize: "12px", fontWeight: "300" }}>
                    Your AI Gateway to Open-Access Scientific Research
                  </Text>
                </div>
              )}
            </div>
          )}
          <div style={{ width: results.length > 0 ? "100%" : "100%", marginTop: (results.length === 0 || isMobile) ? "0px" : "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px" }}>
            <Input.Search
              placeholder="Search from 140,672,733 of open-access scientific papers across all fields"
              enterButton={loading ? getLoadingIcon() : <img src="/search.png" alt="search" style={{ width: 20, height: 20, border: "none" }} />}
              size="large"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSearch={handleSearch}
              loading={false}
              addonBefore={
                <KeyOutlined
                  style={{
                    fontSize: 20,
                    color: iconColor,
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                  onClick={handleSuffixClick}
                />
              }
              style={{
                width: "96%",
                marginBottom: "10px",
              }}
            />
            {!loading && results.length === 0 && (
              <div className="features-container" style={{ padding: '0 16px' }}>
                <Title level={3} style={{ margin: '0 0 28px 0', textAlign: 'center', color: '#333' }}>
                  Discover Our Features
                </Title>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  flexWrap: 'wrap',
                  margin: '0 auto'
                }}>
                  {features.slice(0, 3).map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      style={{
                        flex: '1 1 0',
                        minWidth: 250,
                      }}
                    >
                      <Card
                        hoverable
                        className="feature-card"
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          borderRadius: '16px',
                          border: '2px solid transparent',
                          backgroundClip: 'padding-box',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                          backdropFilter: 'blur(10px)',
                          padding: '16px',
                          textAlign: 'center',
                          height: '100%'
                        }}
                      >
                        <div style={{
                          background: item.gradient,
                          padding: '2px',
                          borderRadius: '12px',
                          display: 'inline-block'
                        }}>
                          {item.icon}
                        </div>
                        <Title level={5} style={{ margin: '12px 0 8px', color: '#333', fontWeight: 700 }}>
                          {item.title}
                        </Title>
                        <Text style={{ color: '#333', fontWeight: 300 }}>
                          {item.description}
                        </Text>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {!loading && results.length === 0 && (
              <div>
                <Text style={{ marginBottom: 30, display: "flex", textAlign: "center", alignContent: "center", alignItems: "center", color: "#6B6B6B" }}>
                  <a>
                    {/* <span onClick={() => navigate("/ad")}> You Can Support Us by Viewing Few Ads Here</span>{" "} */}
                    <span onClick={() => navigate("/ad")} style={{ color: "#fff" }}> Try: </span>{" "}
                    <span
                      style={{ cursor: "pointer", color: "#383FFF" }}
                      onClick={() => setQuery("The History of Scihub")}
                    >
                      The History of Sci-hub
                    </span>{" "}
                    <span style={{ color: "#333" }}>·</span>{" "}
                    <span
                      style={{ cursor: "pointer", color: "#383FFF" }}
                      onClick={() => setQuery("The Principle of Deep Learning")}
                    >
                      The Principle of Deep Learning
                    </span>
                  </a>
                </Text>
              </div>
            )}
          </div>
          {loading && <LoadingComponent loading={loading} />}
          {results.length > 0 && (
            <div style={{ width: "96%" }}>
              <div className="respanel">
                <div className="respanel1">
                  {summary && (
                    <Summary
                      isLocal={isFromLocal}
                      summary={summary}
                      pro={true}
                      isCollapsed={isCollapsed}
                      handleToggle={handleToggle}
                      handleDownloadImage={handleDownloadImage}
                      handleShareImage={handleShareImage}
                      isMobile={isMobile}
                    />
                  )}
                </div>
                <div className="respanel2">
                  <SearchResult
                    query={query}
                    results={results}
                    classOver="results-list"
                    handleDownloadImageSearch={handleDownloadImageSearch}
                    handleShareImageSearch={handleShareImage}
                    isMobile={isMobile}
                    onReadFullText={handleReadFullText}
                    pro={true}
                    setModalVisible={setModalVisible}
                  />
                </div>
              </div>
              <div style={{ width: "100%", alignContent: "center", alignItems: "center", textAlign: "center", marginTop: "15px" }}>
                <Text style={{ marginBottom: "15px", color: "#999999", opacity: 0.7 }}>
                  Due to the network condition, the base model can be switch from Deepseek to GPT accordingly.
                </Text>
              </div>
            </div>
          )}
        </div>
      )
      }
      <div
        className="footer"
        style={{
          zIndex: 10,
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          width: "95%",
          flexWrap: "wrap",
        }}
      >
        <img src="/logo2.png" alt="Deepseek" className="footer-logo" />
        <img src="/logo3.png" alt="SCI-HUB" className="footer-logo" />
        {/* <img src="/logo4.png" alt="Scihub Community" className="footer-logo" /> */}
        <img src="/logo5.png" alt="Milvus" className="footer-logo" />
        <img src="/logo6.png" alt="Deepseek" className="footer-logo" />
        <img src="/logo7.png" alt="SCI-HUB" className="footer-logo" />
        <img src="/logo8.png" alt="Scihub Community" className="footer-logo" />
        <img src="/logo9.png" alt="zc" className="footer-logo" />
        <img src="/logobnbgf.png" alt="Milvus" className="footer-logo" />
      </div>
      <UpdateModal visible={upVisible} onClose={handleUpCancel} />
      <UserGuidelineModal visible={isModalVisible} onClose={handleCancel} />
      <Modal
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        maxwidth={1200}
        width={"80%"}
        destroyOnClose
      >
        <Title level={4} style={{ marginLeft: 20 }}>
          Fulltext Deep Research
        </Title>
        <Text style={{ marginLeft: 20, marginBottom: 20, fontSize: "16px", fontWeight: "300" }}>
          The initialization of the paper may take about 1 minute
        </Text>
        <ChatModal
          visible={chatModalVisible}
          paperId={selectedPaperId}
          source={selectedSource}
          onClose={() => setChatModalVisible(false)}
        />
      </Modal>
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        setUserId={setUserId}
        setIsLoggedIn={setIsLoggedIn}
        isMobile={isMobile}
      />
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        userId={userId}
        isMobile={isMobile}
        setUserId={setUserId}
        setIsLoggedIn={setIsLoggedIn}
        setLoginModalVisible={setLoginModalVisible}
        setHisVisible={sethisVisible}
      />
    </div >
  );
}