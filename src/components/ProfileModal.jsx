import React, { useState, useEffect } from "react";
import { Modal, notification, Button, Input, Avatar, Space, Card, Row, Col, Typography, Divider } from "antd";
import { CopyOutlined, UploadOutlined, HistoryOutlined, ExportOutlined, LogoutOutlined, WalletOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const { Title, Text } = Typography;

const ProfileModal = ({ visible, onClose, isMobile, setHisVisible }) => {
  const { logout, walletAddress, user: userInfo, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("logo512.png");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showFullAddress, setShowFullAddress] = useState(false);

  // Initialize username from userInfo or localStorage
  useEffect(() => {
    if (userInfo?.username) {
      setUsername(userInfo.username);
    } else {
      const savedUsername = localStorage.getItem("username");
      if (savedUsername) {
        setUsername(savedUsername);
      } else if (walletAddress) {
        setUsername(`User_${walletAddress.slice(0, 6)}`);
      }
    }
  }, [userInfo, walletAddress]);

  // Initialize avatar from localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem("avatar");
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const handleSaveUsername = () => {
    if (!username.trim()) {
      notification.error({ message: "Username cannot be empty" });
      return;
    }
    if (username.length > 20) {
      notification.error({ message: "Username cannot exceed 20 characters" });
      return;
    }
    localStorage.setItem("username", username);
    setIsEditingUsername(false);
    notification.success({ message: "Username updated!" });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notification.error({ message: "Please upload an image file" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setAvatar(base64);
      localStorage.setItem("avatar", base64);
      notification.success({ message: "Avatar updated!" });
    };
    reader.onerror = () => {
      notification.error({ message: "Failed to upload avatar" });
    };
    reader.readAsDataURL(file);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    notification.success({
      message: "Wallet address copied!",
      icon: <CopyOutlined style={{ color: "#FF3314", animation: "shake 0.3s" }} />,
    });
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      content: "Are you sure you want to disconnect your wallet?",
      okText: "Disconnect",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await logout();
          // Clear local storage
          localStorage.removeItem("username");
          localStorage.removeItem("theme");
          localStorage.removeItem("avatar");
          notification.success({ message: "Wallet disconnected successfully" });
          onClose();
        } catch (error) {
          console.error('Logout failed:', error);
          notification.error({ message: "Failed to disconnect wallet, please try again" });
        }
      },
    });
  };

  const handleExportProfile = () => {
    const profileData = {
      walletAddress,
      username,
      userInfo,
      theme,
      avatar,
      exportTime: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(profileData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scai_wallet_profile.json";
    link.click();
    URL.revokeObjectURL(url);
    notification.success({ message: "Profile data exported!" });
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.style.backgroundColor = newTheme === "dark" ? "#1f1f1f" : "#e7e3f4";
  };

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "90%" : 700}
      style={{ borderRadius: "16px" }}
      bodyStyle={{
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "0",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "400px" }}>
          {/* Left side: Avatar, username, theme */}
          <div
            style={{
              flex: isMobile ? "none" : "0 0 200px",
              background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
              borderTopLeftRadius: "16px",
              borderBottomLeftRadius: isMobile ? "0" : "16px",
              borderTopRightRadius: isMobile ? "16px" : "0",
              borderBottomRightRadius: isMobile ? "0" : "0",
              padding: "24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Avatar src={avatar} size={80} style={{ border: "2px solid #fff" }} />
              <label
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  background: "#fff",
                  borderRadius: "50%",
                  padding: "4px",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              >
                <UploadOutlined />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
              </label>
            </div>
            {isEditingUsername ? (
              <Space direction="vertical">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  style={{
                    background: "rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    color: "#fff",
                    border: "none",
                  }}
                />
                <Space>
                  <Button type="primary" size="small" onClick={handleSaveUsername} style={{ background: "#fff", color: "#FF3314", border: "none" }}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setIsEditingUsername(false)} style={{ background: "#fff", color: "#FF3314", border: "none" }}>
                    Cancel
                  </Button>
                </Space>
              </Space>
            ) : (
              <div>
                <Title level={5} style={{ color: "#fff", margin: "8px 0" }}>
                  {username}
                </Title>
                <Button type="default" onClick={() => setIsEditingUsername(true)}>
                  Edit
                </Button>
              </div>
            )}
            
            <div style={{ marginTop: "16px", color: "#fff", fontSize: "12px" }}>
              <WalletOutlined style={{ marginRight: "4px" }} />
              Connected via Phantom
            </div>
          </div>

          {/* Right side: Information and functions */}
          <div style={{ flex: 1, padding: "24px" }}>
            <Card
              title="Wallet Information"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                border: "none",
                marginBottom: "16px",
              }}
              headStyle={{ color: "#333", borderBottom: "1px solid rgba(255, 255, 255, 0.2)" }}
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text style={{ color: "#666" }}>Wallet Address</Text>
                  <div style={{ marginTop: "8px" }}>
                    <Text 
                      strong 
                      style={{ 
                        color: "#333", 
                        cursor: "pointer", 
                        fontFamily: "monospace",
                        fontSize: "12px"
                      }} 
                      onClick={() => setShowFullAddress(!showFullAddress)}
                    >
                      {showFullAddress ? walletAddress : truncateAddress(walletAddress)}
                    </Text>
                    <Button type="link" icon={<CopyOutlined />} onClick={handleCopyAddress} style={{ padding: "0 8px", margin: 0 }} />
                  </div>
                </Col>
                
                {userInfo && (
                  <>
                    <Col span={12}>
                      <Text style={{ color: "#666" }}>Role</Text>
                      <div style={{ marginTop: "6px" }}>
                        <Text strong style={{ color: "#333" }}>
                          {userInfo.role || "User"}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ color: "#666" }}>Registered</Text>
                      <div style={{ marginTop: "6px" }}>
                        <Text strong style={{ color: "#333" }}>
                          {formatDate(userInfo.created_at)}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ color: "#666" }}>Last Login</Text>
                      <div style={{ marginTop: "6px" }}>
                        <Text strong style={{ color: "#333" }}>
                          {formatDate(userInfo.last_login)}
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Text style={{ color: "#666" }}>SOL Balance</Text>
                      <div style={{ marginTop: "6px" }}>
                        <Text strong style={{ color: "#333" }}>
                          {userInfo.sol_balance ? `${userInfo.sol_balance} SOL` : "N/A"}
                        </Text>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            </Card>

            <Card
              title="Account Actions"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                border: "none",
              }}
              headStyle={{ color: "#333", borderBottom: "1px solid rgba(255, 255, 255, 0.2)" }}
            >
              <Button
                type="default"
                icon={<HistoryOutlined />}
                onClick={() => {
                  onClose();
                  setHisVisible(true);
                }}
                style={{
                  borderRadius: "8px",
                  color: "#333",
                  width: "100%",
                  marginTop: 14,
                }}
              >
                View History
              </Button>
              <Button
                type="default"
                icon={<ExportOutlined />}
                onClick={handleExportProfile}
                style={{
                  borderRadius: "8px",
                  color: "#333",
                  width: "100%",
                  marginTop: 14,
                }}
              >
                Export Data
              </Button>
              <Button
                icon={<LogoutOutlined />}
                danger
                onClick={handleLogout}
                loading={isLoading}
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  width: "100%",
                  marginTop: 14,
                }}
              >
                Disconnect Wallet
              </Button>
            </Card>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default ProfileModal;
