import React, { useState, useEffect } from "react";
import { Input, Typography, Button, Drawer, notification, Modal } from "antd";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SciHubModal } from "./components/getpro.jsx";
import { MenuOutlined, HomeOutlined, GlobalOutlined, KeyOutlined, HistoryOutlined } from "@ant-design/icons";
import "./App.css";
import { WalletSelector } from "./components/walletselector.jsx";
import html2canvas from "html2canvas";
import { LoadingComponent } from "./components/Loading.jsx";
import Summary from "./components/summary.jsx";
import SearchResult from "./components/searchResult.jsx";
import { UserGuidelineModal } from "./components/guild.jsx";
import { UpdateModal } from "./components/updatelog.jsx";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { useAccount, useSignMessage, useReadContract } from "wagmi";
import { bscTestnet } from "wagmi/chains"; // 引入 BNB Testnet 链配置
import ChatModal from "./components/chatpage.jsx";

const { Title, Text, Paragraph } = Typography;

// ERC-20/BEP-20 代币的 ABI（包括 balanceOf 和 decimals）
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

export default function SearchApp() {
  const network = WalletAdapterNetwork.Devnet;
  const [canvasResults, setCanvasResults] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const { connection } = useConnection();
  const [balance, setBalance] = useState(0); // Solana 代币余额
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [solanaSignature, setSolanaSignature] = useState(null);
  const [solanaAddress, setSolanaAddress] = useState(null);
  const [bnbSignature, setBnbSignature] = useState(null);
  const [bnbAddress, setBnbAddress] = useState(null);
  const { publicKey, signMessage, connected } = useWallet();
  const { address: bnbAccount } = useAccount();
  const { signMessage: signBnbMessage } = useSignMessage();
  const [pro, setPro] = useState(false); // 会员状态
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

  // BNB Testnet 代币地址
  const BNB_TOKEN_ADDRESS = "0x8082B8b47D92E4AC80aa205Eace902C5ee6BeCEe";
  const REQUIRED_AMOUNT = 10000; // 会员要求的代币数量（1000 个代币）

  // 获取小数位
  const { data: decimalsData, error: decimalsError } = useReadContract({
    address: BNB_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: bscTestnet.id,
    enabled: !!bnbAccount,
  });

  const decimals = decimalsData ? Number(decimalsData) : 18;

  // 获取 BNB Testnet 代币余额
  const { data: bnbBalanceData, error: bnbBalanceError } = useReadContract({
    address: BNB_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [bnbAccount],
    chainId: bscTestnet.id,
    enabled: !!bnbAccount,
  });

  const bnbBalance = bnbBalanceData ? Number(bnbBalanceData) / Math.pow(10, decimals) : 0;

  useEffect(() => {
    console.log("BNB Account:", bnbAccount);
    console.log("BNB Decimals:", decimals);
    console.log("Raw BNB Balance Data:", bnbBalanceData);
    console.log("BNB Balance (tokens):", bnbBalance);

    if (decimalsError) {
      console.error("Error fetching decimals:", decimalsError);
      alert("Failed to fetch token decimals. Using default value (18).");
    }

    if (bnbBalanceError) {
      console.error("Error fetching BNB balance:", bnbBalanceError);
      alert("Failed to fetch BNB Testnet balance. Please ensure your wallet is connected to BNB Testnet.");
    }
  }, [bnbAccount, decimals, bnbBalanceData, decimalsError, bnbBalanceError]);

  useEffect(() => {
    const signSolanaMessage = async () => {
      if (publicKey && signMessage) {
        try {
          const message = publicKey.toString();
          const encodedMessage = new TextEncoder().encode(message);
          const signature = await signMessage(encodedMessage);
          setSolanaAddress(publicKey.toString());
          setSolanaSignature(Buffer.from(signature).toString("base64"));
          console.log("Solana Address:", publicKey.toString());
          console.log("Solana Signature:", Buffer.from(signature).toString("base64"));
        } catch (error) {
          console.error("Solana signing error:", error);
        }
      }
    };
    signSolanaMessage();
  }, [signMessage]);

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
                console.log("BNB Address:", bnbAccount);
                console.log("BNB Signature:", signature);
              },
              onError: (error) => {
                console.error("BNB signing error:", error);
              },
            }
          );
        } catch (error) {
          console.error("BNB signing error:", error);
        }
      }
    };
    signBnb();
  }, [bnbAccount, signBnbMessage]);

  const openNotification = () => {
    api.open({
      message: "Link Copied",
      description: "You can share it to others via link",
      placement: "bottomRight",
      duration: 2,
    });
  };

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
    openNotification();
    navigator.clipboard.writeText(link);
  };

  const handleSuffixClick = () => {
    setOpenAccessOnly(!openAccessOnly);
  };

  const iconColor = openAccessOnly ? "#FF4D4F" : "#BFBFBF";

  const TOKEN_MINT_ADDRESS = "GxdTh6udNstGmLLk9ztBb6bkrms7oLbrJp5yzUaVpump";

  // 获取 Solana 代币余额
  useEffect(() => {
    if (publicKey) {
      (async function getBalanceEvery10Seconds() {
        try {
          const newBalance = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            {
              mint: new PublicKey(TOKEN_MINT_ADDRESS),
            }
          );
          const tokenAmount = newBalance.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount || 0;
          setBalance(Number(tokenAmount) / Math.pow(10, 6)); // Solana 代币有 6 位小数
          console.log("Solana SciHub balance:", tokenAmount);
        } catch (error) {
          console.error("Error fetching Solana balance:", error);
          setBalance(0);
        }
      })();
    } else {
      setBalance(0);
    }
  }, [publicKey, connection]);

  // 判断会员状态
  useEffect(() => {
    const solanaBalanceInTokens = balance; // Solana 余额（已转换为代币单位）
    const bnbBalanceInTokens = bnbBalance; // BNB 余额（已转换为代币单位）

    console.log("Solana Balance (tokens):", solanaBalanceInTokens);
    console.log("BNB Balance (tokens):", bnbBalanceInTokens);

    // 如果任一余额 >= 1000，则为会员
    const isPro = solanaBalanceInTokens >= REQUIRED_AMOUNT || bnbBalanceInTokens >= REQUIRED_AMOUNT;
    setPro(isPro);
    console.log("Is Pro:", isPro);
  }, [balance, bnbBalance]);

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
    if (query.replace(" ", "") === "") {
      return;
    }
    setLoading(true);
    try {
      let res_limit = 5;
      if (pro) {
        res_limit = 10;
      }
      const response = await fetch(
        `https://api.scai.sh/search?query=${encodeURIComponent(query)}&limit=${res_limit}&oa=${openAccessOnly}`,
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
      console.log(data);
      setIsFromLocal(false);
      setResults(data.results);
      setSummary(data.summary);

      if (!isDuplicateHistory(query)) {
        const newHistory = [{ query, results: data.results, summary: data.summary }, ...searchHistory];
        const trimmedHistory = newHistory.slice(0, maxHistory);
        setSearchHistory(trimmedHistory);
        localStorage.setItem("searchHistory", JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
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
  const maxHistory = pro ? 20 : 5;

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

  const handleReadFullText = (paperId, source) => {
    setSelectedPaperId(paperId);
    setChatModalVisible(true);
    setSelectedSource(source);
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
        <img src="/bg.png" alt="Background" style={{ backgroundSize: "cover", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />
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
              <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
        {results.length > 0 && (
          <div style={{ width: "100%" }}>
            <div className="respanel">
              <div className="respanel1">
                {summary && (
                  <Summary
                    isLocal={isFromLocal}
                    summary={summary}
                    pro={pro}
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
                  pro={pro} // 传递 pro 状态
                  setModalVisible={setModalVisible} // 传递 setModalVisible 函数
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
      <UpdateModal visible={upVisible} onClose={handleUpCancel} />
      <SciHubModal isPro={pro} visible={modalVisible} onClose={() => setModalVisible(false)} />
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
          <Button size="small" style={{ background: "red", border: 0, color: "#fff", marginLeft: 8, fontSize: 14, fontWeight: "bold" }}>
            Pro 👑
          </Button>
        </Title>
        <Text style={{ marginLeft: 20, marginBottom: 20, fontSize: "16px", fontWeight: "300" }}>
          The initialization of the paper may takes about 1 minutes
        </Text>
        <ChatModal
          visible={chatModalVisible}
          paperId={selectedPaperId}
          source={selectedSource}
          onClose={() => setChatModalVisible(false)}
        />
      </Modal>
    </div>
  );
}