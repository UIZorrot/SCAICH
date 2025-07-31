import React, { useState } from "react"; // 添加 useState
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import RedeemSpecPage from "./pages/RedeemSpecPage";
import AdPage from "./pages/AdPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { example } from "./example";

// Import new app modules
import SearchPage from "./app/search/SearchPage";
import BoxPage from "./app/box/BoxPage";
import PressPage from "./app/press/PressPage";
import ToolsPage from "./app/tools/ToolsPage";
import IrysViewer from "./app/irys/IrysViewer";
import { BackgroundProvider } from "./contexts/BackgroundContext";
import { AuthProvider } from "./contexts/AuthContext";

// Solana 相关导入
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "./wallet.css";

// BNB Testnet (RainbowKit) 相关导入
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";



// Solana 钱包提供者
const SolanaWalletProvider = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => "https://white-bitter-rain.solana-mainnet.quiknode.pro/4d5cb8fdd5d59fb6555e3d89ebf1ca05b3dbaea4", [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};



// BNB Testnet 配置
const bnbConfig = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http("https://bsc-testnet-dataseed.bnbchain.org"),
  },
  connectors: getDefaultWallets({
    appName: "Scihub BNB Testnet Faucet",
    projectId: "2e6bc42e2496a73ccfd286d2b8b070f8",
  }).connectors,
});

const queryClient = new QueryClient();

// 统一的提供者组件
const UnifiedWalletProvider = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [backgroundImage, setBackgroundImage] = useState("/bg4.jpg"); // 全局背景状态

  const handleBackgroundSwitch = () => {
    const backgrounds = ["/bg2.jpg", "/bg3.jpg", "/bg4.jpg"];
    const currentIndex = backgrounds.indexOf(backgroundImage);
    const nextIndex = (currentIndex + 1) % backgrounds.length;
    setBackgroundImage(backgrounds[nextIndex]);
  };

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <WagmiProvider config={bnbConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <SolanaWalletProvider>
            <AuthProvider>
            <BackgroundProvider>
                <Routes>
                  {/* New unified app routes */}
                  <Route path="/app/search" element={<SearchPage />} />
                  <Route path="/app/box" element={<BoxPage />} />
                  <Route path="/app/press" element={<PressPage />} />
                  <Route path="/app/tools" element={<ToolsPage />} />

                  {/* Irys document viewer */}
                  <Route path="/irys/:txId" element={<IrysViewer />} />

                  {/* Legacy routes for backward compatibility */}
                  <Route path="/search" element={<App isMobile={isMobile} backgroundImage={backgroundImage} handleBackgroundSwitch={handleBackgroundSwitch} />} />
                  <Route path="/redeemspec" element={<RedeemSpecPage isMobile={isMobile} backgroundImage={backgroundImage} handleBackgroundSwitch={handleBackgroundSwitch} />} />

                  {/* Default route - redirect to search */}
                  <Route path="/" element={<SearchPage />} />
                  <Route path="*" element={<SearchPage />} />
                </Routes>
            </BackgroundProvider>
            </AuthProvider>
            </SolanaWalletProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Router>
  );
};

// 渲染
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <UnifiedWalletProvider />
  </React.StrictMode>
);

// 示例数据和历史记录逻辑
const isDuplicateHistory = (query) => {
  return His_res.some((historyItem) => historyItem.query === query);
};

const storedHistory = localStorage.getItem("searchHistory");
const His_res = storedHistory ? JSON.parse(storedHistory) : [];

if (!isDuplicateHistory(example.query)) {
  const newHistory = [{ query: example.query, results: example.results, summary: example.summary }, ...His_res];
  localStorage.setItem("searchHistory", JSON.stringify(newHistory));
}
