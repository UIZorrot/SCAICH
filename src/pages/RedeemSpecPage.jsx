import React, { useState } from "react";
import { Button, Input, Typography, Space } from "antd";
import { KeyOutlined, CopyOutlined, PictureOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

// Custom Alert Component
const Alert = ({ message, type, onClose }) => {
  // Auto-dismiss after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      style={{
        position: "fixed",
        top: 20,
        transform: "translateX(-50%)",
        padding: "12px 24px",
        borderRadius: "8px",
        color: "#fff",
        background: type === "success" ? "#52c41a" : "#FF3314",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 1000,
        maxWidth: "90%",
        textAlign: "center",
      }}
    >
      {message}
    </motion.div>
  );
};

const RedeemSpecPage = ({ isMobile, backgroundImage, handleBackgroundSwitch }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [alert, setAlert] = useState(null); // State to manage alert
  const navigate = useNavigate();

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      showAlert("Please enter a KOL code", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://api.scai.sh/kolspec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (data.success) {
        setUserId(data.user_id);
        showAlert("User ID redeemed successfully!", "success");
      } else {
        showAlert(data.message || "Invalid KOL code or no remaining user IDs", "error");
      }
    } catch (error) {
      showAlert("Failed to redeem code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(userId);
      showAlert("User ID copied to clipboard!", "success");
    } catch (error) {
      showAlert("Failed to copy User ID", "error");
    }
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
        alignContent: "center",
      }}
    >
      {/* Render Alert if it exists */}
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      <div className="body">
        <img
          src={backgroundImage}
          alt="Background"
          style={{
            backgroundSize: "cover",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
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
        <div style={{ display: "flex", alignItems: "center", marginLeft: 30 }}>
          <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "32px", marginRight: "8px", borderRadius: "32px" }} />
          <Title level={4} style={{ margin: 0 }}>
            SCAICH
          </Title>
          <Text style={{ margin: "0 8px" }}>|</Text>
          <Text>KOL Redeem</Text>
        </div>
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            marginRight: "20px",
            zIndex: 10,
          }}
        >
          {!isMobile && (
            <Button type="default" ghost icon={<PictureOutlined />} onClick={handleBackgroundSwitch} style={{ borderRadius: "4px" }}>
              Switch Background
            </Button>
          )}
          <Button type="default" ghost onClick={() => navigate("/search")} style={{ borderRadius: "4px" }}>
            Back to Search
          </Button>
        </div>
      </div>
      <div
        style={{
          width: isMobile ? "87%" : "80%",
          margin: "auto",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(6px)",
          borderRadius: "32px",
        }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Space direction="vertical" size="large" style={{ width: "100%", textAlign: "center" }}>
            <Title level={isMobile ? 3 : 2} style={{ color: "#333", margin: 0 }}>
              Redeem KOL Code
            </Title>
            <Text style={{ color: "#666", fontSize: isMobile ? "14px" : "16px" }}>Enter your exclusive KOL code to receive a SCAICH User ID.</Text>
            <Input
              placeholder="Enter KOL code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              prefix={<KeyOutlined style={{ color: "#999" }} />}
              style={{
                background: "rgba(255, 255, 255, 1)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "10px",
                color: "#333",
                width: isMobile ? "100%" : "400px",
              }}
            />
            <Button
              type="primary"
              block
              loading={loading}
              onClick={handleRedeem}
              style={{
                background: "linear-gradient(45deg, rgb(255, 24, 24), rgb(254, 100, 113))",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                height: "40px",
                transition: "transform 0.2s",
                width: isMobile ? "100%" : "400px",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Redeem
            </Button>
            {userId && (
              <Space direction="vertical" style={{ marginTop: "16px" }}>
                <Text strong style={{ color: "#333" }}>
                  Your SCAICH User ID:
                </Text>
                <Input
                  value={userId}
                  disabled
                  style={{
                    background: "rgba(255, 255, 255, 1)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "8px",
                    padding: "10px",
                    color: "#333",
                    textAlign: "center",
                    width: isMobile ? "100%" : "400px",
                  }}
                />
                <Button
                  type="default"
                  icon={<CopyOutlined />}
                  onClick={handleCopyCode}
                  style={{
                    borderRadius: "8px",
                    width: isMobile ? "100%" : "400px",
                  }}
                >
                  Copy User ID
                </Button>
              </Space>
            )}
          </Space>
        </motion.div>
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
        <img src="/logo5.png" alt="Milvus" className="footer-logo" />
        <img src="/logo6.png" alt="Deepseek" className="footer-logo" />
        <img src="/logo7.png" alt="SCI-HUB" className="footer-logo" />
        <img src="/logo8.png" alt="Scihub Community" className="footer-logo" />
        <img src="/logo9.png" alt="zc" className="footer-logo" />
        <img src="/logobnbgf.png" alt="Milvus" className="footer-logo" />
      </div>
    </div>
  );
};

export default RedeemSpecPage;
