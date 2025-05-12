import React, { useEffect } from "react";
import { Button, Typography, Space } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PictureOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const AdPage = ({ isMobile, backgroundImage, handleBackgroundSwitch }) => {
  const navigate = useNavigate();

  // Load Google AdSense script dynamically
  useEffect(() => {
    // Ensure the script is only added once
    if (!document.querySelector('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-ad-client", "ca-pub-YOUR_ADSENSE_PUBLISHER_ID"); // Replace with your AdSense Publisher ID
      document.head.appendChild(script);

      // Push ad unit to adsbygoogle
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }, []);

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
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginLeft: 30 }}>
          <img src="/rocket-icon.png" alt="SCAICH" style={{ height: "32px", marginRight: "8px", borderRadius: "32px" }} />
          <Title level={4} style={{ margin: 0 }}>
            SCAICH
          </Title>
          <Text style={{ margin: "0 8px" }}>|</Text>
          <Text>Support Us</Text>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center", marginRight: "20px" }}>
          {!isMobile && (
            <Button
              type="default"
              ghost
              icon={<PictureOutlined />}
              onClick={handleBackgroundSwitch}
              style={{ borderRadius: "4px" }}
            >
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
          width: isMobile ? "90%" : "80%",
          margin: "auto",
          padding: isMobile ? "16px" : "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(6px)",
          borderRadius: "32px",
          zIndex: 10,
        }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Space direction="vertical" size="large" style={{ width: "100%", textAlign: "center" }}>
            <Title level={isMobile ? 3 : 2} style={{ color: "#333", margin: 0 }}>
              Support SCAICH
            </Title>
            <Text style={{ color: "#666", fontSize: isMobile ? "14px" : "16px" }}>
              Your support keeps SCAICH free and accessible to everyone. View our ads to help fund open-access research!
            </Text>
            {/* Ad Container */}
            <div
              style={{
                width: "100%",
                maxWidth: isMobile ? "100%" : "728px",
                margin: "16px 0",
                textAlign: "center",
              }}
            >
              <Text style={{ color: "#666", fontSize: "12px", marginBottom: "8px" }}>Advertisement</Text>
              <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-7621002352509779" // Replace with your AdSense Publisher ID
                data-ad-slot="YOUR_AD_SLOT_ID" // Replace with your Ad Unit Slot ID
                data-ad-format="auto"
                data-full-width-responsive="true"
              ></ins>
            </div>
            <Button
              type="primary"
              block
              onClick={() => navigate("/search")}
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
              Back to Search
            </Button>
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

export default AdPage;