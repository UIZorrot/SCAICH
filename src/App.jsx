import React, { useState, useEffect } from "react";
import { Input, Typography, Button, Drawer, notification } from "antd";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SciHubModal } from "./components/getpro.jsx";
import { MenuOutlined, HomeOutlined, GlobalOutlined, KeyOutlined, HistoryOutlined } from "@ant-design/icons";
import "./App.css";
import { WalletSelector } from "./components/walletselector.jsx"
import html2canvas from "html2canvas"; // 引入 html2canvas
import { LoadingComponent } from "./components/Loading.jsx";
import Summary from "./components/summary.jsx";
import SearchResult from "./components/searchResult.jsx";
import { UserGuidelineModal } from "./components/guild.jsx";
import { UpdateModal } from "./components/updatelog.jsx";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { useAccount, useSignMessage } from 'wagmi';

const { Title, Text, Paragraph } = Typography;

export default function SearchApp() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  const [canvasResults, setCanvasResults] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0);
  const [openAccessOnly, setOpenAccessOnly] = useState(false); // 用来切换开关

  const [solanaSignature, setSolanaSignature] = useState(null);
  const [solanaAddress, setSolanaAddress] = useState(null);
  const [bnbSignature, setBnbSignature] = useState(null);
  const [bnbAddress, setBnbAddress] = useState(null);

  // Solana 钱包 hooks
  const { publicKey, signMessage, connected } = useWallet();

  // BNB 钱包 hooks
  const { address: bnbAccount } = useAccount();
  const { signMessage: signBnbMessage } = useSignMessage();

  // 处理 Solana 签名
  useEffect(() => {
    const signSolanaMessage = async () => {
      if (publicKey && signMessage) {
        try {
          const message = publicKey.toString();
          const encodedMessage = new TextEncoder().encode(message);
          const signature = await signMessage(encodedMessage);

          setSolanaAddress(publicKey.toString());
          setSolanaSignature(Buffer.from(signature).toString('base64'));

          console.log('Solana Address:', publicKey.toString());
          console.log('Solana Signature:', Buffer.from(signature).toString('base64'));
        } catch (error) {
          console.error('Solana signing error:', error);
        }
      }
    };

    signSolanaMessage();
  }, [signMessage]);

  // 处理 BNB 签名
  useEffect(() => {
    const signBnb = async () => {
      if (bnbAccount && !publicKey) {
        try {
          const message = bnbAccount;

          signBnbMessage(
            { message },
            {
              onSuccess: (signature) => {
                setBnbAddress(bnbAccount);
                setBnbSignature(signature);

                console.log('BNB Address:', bnbAccount);
                console.log('BNB Signature:', signature);
              },
              onError: (error) => {
                console.error('BNB signing error:', error);
              },
            }
          );
        } catch (error) {
          console.error('BNB signing error:', error);
        }
      }
    };

    signBnb();
  }, [bnbAccount, signBnbMessage]);


  const openNotification = () => {
    api.open({
      message: "Link Copied",
      description: "You can share it to others via link",
      placement: "bottomRight", // 消息显示的位置
      duration: 2, // 消息显示时间（秒）
    });
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsFromLocal(false); // 新搜索时设置为非本地加载
    if (queryParams.get("result")) {
      const compressedResults = queryParams.get("result"); // 获取压缩的结果
      const decompressedResults = decompressFromEncodedURIComponent(compressedResults); // 解压缩
      setResults(JSON.parse(decompressedResults)); // 解析 JSON
    }

    if (queryParams.get("summary")) {
      const compressedSummary = queryParams.get("summary"); // 获取压缩的 summary
      const decompressedSummary = decompressFromEncodedURIComponent(compressedSummary); // 解压缩
      setSummary(JSON.parse(decompressedSummary)); // 解析 JSON
    }

    if (queryParams.get("query")) {
      const compressedQuery = queryParams.get("query"); // 获取压缩的 query
      const decompressedQuery = decompressFromEncodedURIComponent(compressedQuery); // 解压缩
      setQuery(decompressedQuery); // 设置 query
    }
  }, []);

  const [api, contextHolder] = notification.useNotification();

  const handleShareImage = () => {
    // 对数据进行截断处理
    const truncateData = (data) => {
      return data.map((item) => ({
        ...item,
        abstract: item.abstract.length > 240 ? item.abstract.slice(0, 240) + "..." : item.abstract,
        author: item.author.length > 40 ? item.author.slice(0, 40) + "..." : item.author,
        scihub_url: "", // 设置为空字符串
      }));
    };

    // 压缩并编码数据
    const compressAndEncode = (data) => {
      const compressedData = compressToEncodedURIComponent(JSON.stringify(data)); // 压缩并编码
      return compressedData;
    };

    // 截断数据并压缩
    const truncatedResults = truncateData(results.slice(0, 3)); // 截断并保留前5个结果
    const compressedQuery = compressAndEncode(query); // 压缩 query
    const compressedResults = compressAndEncode(truncatedResults); // 压缩 results
    const compressedSummary = compressAndEncode(summary); // 压缩 summary

    // 创建链接
    const link = `${window.location.origin}/search?query=${compressedQuery}&result=${compressedResults}&summary=${compressedSummary}`;

    openNotification();
    navigator.clipboard.writeText(link); // 复制链接到剪贴板
  };
  const handleSuffixClick = () => {
    setOpenAccessOnly(!openAccessOnly); // 切换 openAccessOnly 状态
  };

  const iconColor = openAccessOnly ? "#FF4D4F" : "#BFBFBF"; // 红色和灰色

  const TOKEN_MINT_ADDRESS = "GxdTh6udNstGmLLk9ztBb6bkrms7oLbrJp5yzUaVpump"; // 目标合约地址
  const REQUIRED_AMOUNT = 1000 * Math.pow(10, 6); // 1000 枚，精度 6

  useEffect(() => {
    if (publicKey) {
      (async function getBalanceEvery10Seconds() {
        const newBalance = await connection.getParsedTokenAccountsByOwner(
          publicKey, // 钱包地址
          {
            mint: new PublicKey(TOKEN_MINT_ADDRESS), // 目标 Token 的合约地址
          }
        );
        setBalance(newBalance.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount);
        setpro(newBalance.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount >= REQUIRED_AMOUNT);
        console.log("the scihub balance is");
        console.log(newBalance);
      })();
    }
  }, [publicKey]);

  const [pro, setpro] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setpro(false); // 如果钱包没有连接，设置 isPro 为 false
    }
  }, [publicKey]); // 监听 publicKey 的变化

  // 检查历史记录是否已存在
  const isDuplicateHistory = (query) => {
    return searchHistory.some((historyItem) => historyItem.query === query);
  };

  const handleDownloadImage = () => {
    // 使用 html2canvas 将结果区域生成图片
    setCanvasResults(0);
    setTimeout(() => {
      const resultsElement = document.getElementById("result-container");
      console.log(resultsElement);
      if (resultsElement) {
        html2canvas(resultsElement).then((canvas) => {
          // 将画布转换为图片URL
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "assist_results.png"; // 下载文件名
          link.click();
        });
      }
    }, 0);
  };

  const handleDownloadImageSearch = () => {
    // 使用 html2canvas 将结果区域生成图片
    setCanvasResults(1);
    //延迟
    setTimeout(() => {
      const resultsElement = document.getElementById("search-container");
      if (resultsElement) {
        html2canvas(resultsElement).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "search_results.png"; // 设置下载文件名
          link.click();
        });
      }
    }, 0);
  };

  const handleSearch = async () => {
    // setResults([]);
    // setSummary("");
    if (query.replace(" ", "") === "") {
      return;
    }
    setLoading(true);
    try {
      let res_limit = 5;
      if (pro) {
        res_limit = 10;
      }
      const response = await fetch(`https://api.scai.sh/search?query=${encodeURIComponent(query)}&limit=${res_limit}&oa=${openAccessOnly}`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Access-Control-Allow-Origin": true,
          "ngrok-skip-browser-warning": true,
          "Content-Type": "Authorization",
        },
      });
      const data = await response.json();
      console.log(data);
      setIsFromLocal(false); // 新搜索时设置为非本地加载
      setResults(data.results);
      setSummary(data.summary);

      if (!isDuplicateHistory(query)) {
        const newHistory = [{ query, results: data.results, summary: data.summary }, ...searchHistory];
        const trimmedHistory = newHistory.slice(0, maxHistory);
        setSearchHistory(trimmedHistory);
        localStorage.setItem("searchHistory", JSON.stringify(trimmedHistory)); // 持久化到 localStorage
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  // 删除历史记录
  const deleteHistory = (index) => {
    const updatedHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory)); // 更新 localStorage
  };

  const [upVisible, setUpVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hisVisible, sethisVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchIcon = <img src="/search.png" alt="search" style={{ width: 20, height: 20, border: "none" }} />;
  const [searchLoadingIndex, setSearchLoadingIndex] = useState(0);

  const [searchHistory, setSearchHistory] = useState(() => {
    // 从 localStorage 获取历史记录
    const storedHistory = localStorage.getItem("searchHistory");
    return storedHistory ? JSON.parse(storedHistory) : [];
  });

  const maxHistory = pro ? 20 : 5;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // 添加事件监听
    window.addEventListener("resize", handleResize);

    // 清理事件监听器
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // 空依赖数组，意味着此useEffect只会在组件挂载和卸载时运行

  // 判断是否是移动端
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    console.log(isMobile);
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

  const [isCollapsed, setIsCollapsed] = useState(true); // 默认折叠状态

  const handleToggle = () => {
    setIsCollapsed((prevState) => !prevState); // 切换折叠状态
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

  const [isFromLocal, setIsFromLocal] = useState(false); // 新增状态，标记是否从本地加载

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
        {/* 背景图片 */}
        <img src="/bg.png" alt="Background" style={{ backgroundSize: "cover", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />
      </div>
      {/* Navigation Bar */}
      <div
        className="navbar"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "transparent",
          boxShadow: "none",
        }}
      >
        <div className="nav-links" style={{ display: "flex", gap: "20px", alignItems: "center", marginLeft: 30 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Mobile Menu Button */}
            <HistoryOutlined onClick={() => sethisVisible(true)} style={{ fontSize: "22px", marginRight: "20px" }} />
            <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "32px", marginRight: "8px", borderRadius: "32px" }} />
            <Title level={4} style={{ margin: 0 }}>
              SCAICH
            </Title>
            <Text style={{ margin: "0 8px" }}>|</Text>
            <Text>SCAI search engine</Text>
          </div>
        </div>

        {/* Mobile Drawer */}
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
                  <Button type="primary" danger blockstyle={{ width: "24%" }} onClick={() => deleteHistory(index)}>
                    Delete
                  </Button>
                </div>
              ))
            ) : (
              <Text>No search history available</Text>
            )}
          </div>
        </Drawer>

        {/* Mobile Menu Button */}
        <Text type="text" className="menu-button" onClick={() => setMenuVisible(true)} style={{ marginLeft: 15, marginBottom: "6px", display: "none", alignItems: "center", textAlign: "center" }}>
          {" "}
          <Title level={4} style={{ margin: 0 }}>
            {" "}
            <MenuOutlined style={{ fontSize: "20px", marginRight: "10px" }} />
            <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "28px", marginLeft: "4px", marginRight: "12px", position: "relative", top: 5, borderRadius: "12px" }} />
            SCAICH
          </Title>
        </Text>

        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "20px", zIndex: 10 }}>
            <WalletSelector />
          </div>
        ) : (
          <div style={{ display: "flex", gap: "20px", alignItems: "center", marginRight: "20px", zIndex: 10 }}>
            <Button type="default" color="default" ghost style={{ borderRadius: "4px" }} onClick={showModal}>
              Guildlines
            </Button>
            <Button type="default" color="default" ghost style={{ borderRadius: "4px" }} onClick={showUpModal}>
              Update Logs
            </Button>
            <Button type="default" color="default" ghost style={{ borderRadius: "4px" }} onClick={() => setModalVisible(true)}>
              {pro ? "Welcome Scihub Pro 👑" : "Get Pro 👑"}
            </Button>
            <WalletSelector />
          </div>
        )}

        {/* Mobile Drawer */}
        <Drawer title="Menu" placement="left" onClose={() => setMenuVisible(false)} open={menuVisible} bodyStyle={{ padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <Button href="https://sci-hub.se/">
              <HomeOutlined /> Scihub Official
            </Button>
            <Button href="https://www.scihub.fans/">
              <GlobalOutlined /> Scihub Community
            </Button>
            <Button style={{ borderRadius: "4px" }} onClick={showModal}>
              Guildlines
            </Button>
            <Button style={{ borderRadius: "4px" }} onClick={showUpModal}>
              Update Logs
            </Button>
            <Button type="default" color="default" style={{ borderRadius: "4px" }} onClick={() => setModalVisible(true)}>
              {pro ? "👑 Welcome Scihub Pro" : "👑 Get Pro"}
            </Button>
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
                        setIsFromLocal(true); // 点击历史记录时标记为本地加载
                      }}
                    >
                      {historyItem.query.length > 30 ? historyItem.query.slice(0, 30) + " .." : historyItem.query}
                    </Button>
                    <Button type="primary" danger blockstyle={{ width: "24%" }} onClick={() => deleteHistory(index)}>
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

      {/* Main Search Area */}
      <div
        className="SearchArea"
        style={{
          margin: results.length === 0 ? "auto" : "2vw",
          paddingBottom: results.length === 0 ? "16px" : "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: results.length > 0 ? "#E9E7FF" : "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(6px)",
        }}
      >
        {results.length === 0 ? (
          <div>
            {!isMobile ? (
              <div style={{ zIndex: 2, display: "flex", alignItems: "center", margin: "30px", marginTop: 44 }}>
                <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "72px", marginRight: "12px", borderRadius: "72px" }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Title level={4} style={{ margin: 0, fontSize: "36px", fontWeight: "800" }}>
                      SCAICH
                    </Title>
                    <Text style={{ margin: 0, marginLeft: "12px", fontSize: "32px", fontWeight: "300" }}> | SCAI search engine</Text>
                  </div>
                  <Text style={{ margin: 0, fontSize: "16px", fontWeight: "300" }}>Your AI Gateway to Open-Access Scientific Research</Text>
                </div>
              </div>
            ) : (
              <div style={{ Index: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "72px", marginRight: "12px", borderRadius: "72px" }} />
                <Title level={4} style={{ margin: 0, fontSize: "32px", fontWeight: "800" }}>
                  SCAICH
                </Title>
                <Text style={{ margin: 0, marginLeft: "12px", fontSize: "20px", fontWeight: "300" }}>SCAI search engine</Text>
                <Text style={{ margin: 0, fontSize: "12px", fontWeight: "300" }}>Your AI Gateway to Open-Access Scientific Research</Text>
              </div>
            )}
          </div>
        ) : null}

        <div style={{ width: results.length > 0 ? "100%" : "100%", marginTop: results.length > 0 ? "20px" : "0px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px" }}>
          <Input.Search
            placeholder="Search from 140,672,733 of open-access scientific papers across all fields"
            enterButton={loading ? getLoadingIcon() : searchIcon}
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
                  cursor: "pointer", // 鼠标悬停时变为指针
                  marginLeft: 8,
                }}
                onClick={handleSuffixClick} // 点击图标切换状态
              />
            }
            style={{
              width: "100%",
              marginBottom: "10px",
            }}
          />

          {!loading && results.length === 0 && (
            <div>
              <Text style={{ marginBottom: 30, display: "flex", textAlign: "center", alignContent: "center", alignItems: "center", color: "#6B6B6B" }}>
                <a>
                  <span style={{ color: "#333" }}>Try:</span>{" "}
                  <span style={{ cursor: "pointer", color: "#383FFF" }} onClick={(e) => setQuery("The History of Scihub")}>
                    The History of Sci-hub
                  </span>{" "}
                  <span style={{ color: "#333" }}>·</span>{" "}
                  <span style={{ cursor: "pointer", color: "#383FFF" }} onClick={(e) => setQuery("The Principle of Deep Learning")}>
                    The Principle of Deep Learning
                  </span>
                </a>
              </Text>
            </div>
          )}
        </div>

        {loading && <LoadingComponent loading={loading} />}

        {/* Search Results */}
        {results.length > 0 && (
          <div
            style={{
              width: "100%",
            }}
          >
            <div className="respanel">
              <div className="respanel1">{summary && <Summary isLocal={isFromLocal} summary={summary} pro={pro} isCollapsed={isCollapsed} handleToggle={handleToggle} handleDownloadImage={handleDownloadImage} handleShareImage={handleShareImage} isMobile={isMobile} />}</div>
              <div className="respanel2">
                <SearchResult query={query} results={results} classOver="results-list" handleDownloadImageSearch={handleDownloadImageSearch} handleShareImageSearch={handleShareImage} isMobile={isMobile} />
              </div>
            </div>
            <div style={{ width: "100%", alignContent: "center", alignItems: "center", textAlign: "center", marginTop: "15px" }}>
              <Text style={{ marginBottom: "15px", color: "#999999", opacity: 0.7 }}>Due to the network condition, the base model can be switch from Deepseek to GPT accordingly.</Text>
            </div>
          </div>
        )}
      </div>

      {/* Footer Logos */}
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
        <img src="/logo4.png" alt="Scihub Community" className="footer-logo" />
        <img src="/logo5.png" alt="Milvus" className="footer-logo" />
        <img src="/logo6.png" alt="Deepseek" className="footer-logo" />
        <img src="/logo7.png" alt="SCI-HUB" className="footer-logo" />
        <img src="/logo8.png" alt="Scihub Community" className="footer-logo" />
        <img src="/logo9.png" alt="zc" className="footer-logo" />
        <img src="/logobnbgf.png" alt="Milvus" className="footer-logo" />
      </div>

      {/** 用于展示htmlcanvas 全部是的视图， 便于截图 */}
      {/* <div id="htmlcanvas" style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: -1000 }}>
        {results.length > 0 ? canvasResults === 1 ? <SearchResult query={query} results={results} classOver="results-hidden" /> : <Summary summary={summary} pro={pro} isCollapsed={isCollapsed} handleToggle={handleToggle} /> : null}
      </div> */}

      <UpdateModal visible={upVisible} onClose={handleUpCancel} />
      <SciHubModal isPro={pro} visible={modalVisible} onClose={() => setModalVisible(false)} />
      <UserGuidelineModal visible={isModalVisible} onClose={handleCancel} />
    </div>
  );
}
