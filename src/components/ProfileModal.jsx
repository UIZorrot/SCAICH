import React, { useState, useEffect } from "react";
import { Modal, notification, Button, Input, Avatar, Space, Card, Row, Col, Typography, Upload } from "antd";
import { CopyOutlined, UploadOutlined, HistoryOutlined, ExportOutlined, LogoutOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAuthService } from "../services/authService";

const { Title, Text } = Typography;

const ProfileModal = ({ visible, onClose, userId, isMobile, setUserId, setIsLoggedIn, setLoginModalVisible, setHisVisible }) => {
  const { logout, user } = useAuthService();
  const [username, setUsername] = useState(localStorage.getItem("username") || `User_${userId.slice(0, 4)}`);
  const [avatar, setAvatar] = useState(localStorage.getItem("avatar") || "logo512.png");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showFullId, setShowFullId] = useState(false);
  const loginTime = localStorage.getItem("loginTime");
  const registerTime = localStorage.getItem("registerTime") || loginTime;

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

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    notification.success({
      message: "User ID copied!",
      icon: <CopyOutlined style={{ color: "#FF3314", animation: "shake 0.3s" }} />,
    });
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "确认登出",
      content: "您确定要登出吗？登出后需要重新登录。",
      okText: "登出",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await logout();
          // 清理本地存储的旧数据
          localStorage.removeItem("userId");
          localStorage.removeItem("loginTime");
          localStorage.removeItem("registerTime");
          localStorage.removeItem("username");
          localStorage.removeItem("theme");
          localStorage.removeItem("avatar");
          setUserId("");
          setIsLoggedIn(false);
          setLoginModalVisible(true);
          notification.success({ message: "登出成功" });
          onClose();
        } catch (error) {
          console.error('登出失败:', error);
          notification.error({ message: "登出失败，请重试" });
        }
      },
    });
  };

  const handleExportProfile = () => {
    const profileData = {
      userId,
      username,
      loginTime,
      registerTime,
      theme,
      avatar,
    };
    const dataStr = JSON.stringify(profileData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scaich_profile.json";
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

  useEffect(() => {
    if (!localStorage.getItem("registerTime") && loginTime) {
      localStorage.setItem("registerTime", loginTime);
    }
  }, [loginTime]);

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
          {/* 左侧：头像、用户名、主题切换 */}
          <div
            style={{
              flex: isMobile ? "none" : "0 0 200px",
              background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
              borderTopLeftRadius: "16px",
              borderBottomLeftRadius: isMobile ? "0" : "16px",
              borderTopRightRadius: isMobile ? "0" : "0",
              borderBottomRightRadius: isMobile ? "16px" : "0",
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
          </div>

          {/* 右侧：信息和功能 */}
          <div style={{ flex: 1, padding: "24px" }}>
            <Card
              title="Information"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                border: "none",
                marginBottom: "16px",
              }}
              headStyle={{ color: "#333", borderBottom: "1px solid rgba(255, 255, 255, 0.2)" }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text style={{ color: "#666" }}>User ID</Text>
                  <div>
                    <Text strong style={{ color: "#333", cursor: "pointer" }} onClick={() => setShowFullId(!showFullId)}>
                      {showFullId ? userId : `${userId.slice(0, 4)}...${userId.slice(-4)}`}
                    </Text>
                    <Button type="link" icon={<CopyOutlined />} onClick={handleCopyId} style={{ padding: "0 8px", margin: 0 }} />
                  </div>
                </Col>
                <Col span={12}>
                  <Text style={{ color: "#666" }}>Registered</Text>
                  <div style={{ marginTop: 6 }}>
                    <Text strong style={{ color: "#333" }}>
                      {registerTime ? new Date(registerTime).toLocaleString() : "N/A"}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text style={{ color: "#666" }}>Last Login</Text>
                  <div style={{ marginTop: 6 }}>
                    <Text strong style={{ color: "#333" }}>
                      {loginTime ? new Date(loginTime).toLocaleString() : "N/A"}
                    </Text>
                  </div>
                </Col>
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
                style={{
                  background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  width: "100%",
                  marginTop: 14,
                }}
              >
                Logout
              </Button>
            </Card>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default ProfileModal;
