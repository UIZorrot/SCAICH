import React, { useState, useEffect } from "react";
import { Button, Drawer, Modal, message } from "antd";
import { MenuOutlined, CloseOutlined, UserOutlined, WalletOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, walletAddress, isLoading, login, logout } = useAuth();

  // Navigation items
  const navigation = [
    { name: "Search", href: "/app/search", key: "search" },
    { name: "Box", href: "/app/box", key: "box" },
    { name: "Settings", href: "/app/settings", key: "settings" },
    // { name: "Press (Building)", href: "/app/press", key: "press" },
    { name: "Foundation", href: "https://foundation.scai.sh/", external: true },
    { name: "Community", href: "https://t.me/+AMy9MvWuVqhlNDY1", external: true },
  ];

  // 判断滚动
  const [isScroll, setIsScroll] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScroll(window.scrollY > 50);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Set active section based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/app/search")) {
      setActiveSection("search");
    } else if (path.includes("/app/box")) {
      setActiveSection("box");
    } else if (path.includes("/app/settings")) {
      setActiveSection("settings");
    } else if (path.includes("/app/press")) {
      setActiveSection("press");
    } else if (path.includes("/app/tools")) {
      setActiveSection("tools");
    } else {
      setActiveSection("");
    }
  }, [location.pathname]);

  // Handle navigation click
  const handleNavClick = (item) => {
    setMobileMenuOpen(false);

    if (item.external) {
      window.open(item.href, "_blank", "noopener noreferrer");
    } else {
      navigate(item.href);
    }
  };

  // Handle wallet login
  const handleLogin = async () => {
    try {
      await login();
      message.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Login failed:", error);
      message.error(error.message || "Failed to connect wallet");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      message.success("Wallet disconnected");
      setUserModalVisible(false);
    } catch (error) {
      console.error("Logout failed:", error);
      message.error("Failed to disconnect wallet");
    }
  };

  // Truncate wallet address for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <header className={`unified-header ${isScroll ? "unified-header-next" : ""}`}>
        <nav className="header-nav">
          <div className="header-content">
            {/* Logo */}
            <div className="header-logo">
              <div className="logo-container" onClick={() => navigate("/app/search")} style={{ cursor: "pointer" }}>
                <img src="/rocket-icon.png" alt="SCAI Logo" className="logo-image" />
                <span className="logo-text">SCAI</span>
              </div>
            </div>

            {/* Desktop Navigation - Centered */}
            {!isMobile && (
              <div className="desktop-nav-center">
                <div className="nav-links">
                  {navigation.map((item) => (
                    <button key={item.key || item.name} onClick={() => handleNavClick(item)} className={`nav-link ${activeSection === item.key ? "active" : ""}`}>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right side - Wallet Button */}
            {!isMobile && (
              <div className="header-right">
                {!isAuthenticated ? (
                  <Button type="text" className="login-btn" onClick={handleLogin} loading={isLoading} icon={<WalletOutlined />}>
                    Connect Wallet
                  </Button>
                ) : (
                  <Button type="text" className="login-btn" onClick={() => setUserModalVisible(true)} icon={<UserOutlined />}>
                    {truncateAddress(walletAddress)}
                  </Button>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            {isMobile && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-button" aria-expanded={mobileMenuOpen}>
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <CloseOutlined className="menu-icon" /> : <MenuOutlined className="menu-icon" />}
              </button>
            )}
          </div>

          {/* Mobile menu */}
          <Drawer title="Navigation" placement="left" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen} className="mobile-drawer">
            <div className="mobile-nav-links">
              {navigation.map((item) => (
                <Button key={item.key || item.name} type="text" block onClick={() => handleNavClick(item)} className={`mobile-nav-link ${activeSection === item.key ? "active" : ""}`}>
                  {item.name}
                </Button>
              ))}

              {/* Mobile Wallet Button */}
              <div style={{ marginTop: "16px" }}>
                {!isAuthenticated ? (
                  <Button type="text" block icon={<WalletOutlined />} className="mobile-nav-link" onClick={handleLogin} loading={isLoading}>
                    Connect Wallet
                  </Button>
                ) : (
                  <Button type="text" block icon={<UserOutlined />} className="mobile-nav-link" onClick={() => setUserModalVisible(true)}>
                    {truncateAddress(walletAddress)}
                  </Button>
                )}
              </div>
            </div>
          </Drawer>
        </nav>
      </header>

      {/* User Modal */}
      <Modal
        title="Wallet Information"
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={[
          <Button key="logout" type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout} loading={isLoading}>
            Disconnect Wallet
          </Button>,
        ]}
        width={400}
      >
        <div style={{ padding: "16px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <strong>Wallet Address:</strong>
            <div style={{ marginTop: "8px", padding: "8px", backgroundColor: "#f5f5f5", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all" }}>
              {walletAddress}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Connected via Phantom Wallet
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Header;
