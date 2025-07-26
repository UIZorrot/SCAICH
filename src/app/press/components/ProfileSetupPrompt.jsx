import React from "react";
import { Card, Button, Typography, Space, Alert } from "antd";
import { UserOutlined, ArrowRightOutlined, BookOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const ProfileSetupPrompt = ({ user }) => {
  const navigate = useNavigate();

  const handleGoToBox = () => {
    navigate("/app/box");
  };

  return (
    <div style={{ 
      minHeight: "60vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "2rem"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <Card
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <UserOutlined 
              style={{ 
                fontSize: "64px", 
                color: "#FF3314",
                marginBottom: "1rem",
                display: "block"
              }} 
            />
            <Title level={2} style={{ color: "#333", marginBottom: "0.5rem" }}>
              Complete Your Scholar Profile
            </Title>
            <Text type="secondary" style={{ fontSize: "16px" }}>
              Welcome to SCAI Press! To start collaborating on research documents, 
              please complete your scholar profile first.
            </Text>
          </div>

          <Alert
            message="Profile Setup Required"
            description={
              <div style={{ textAlign: "left", marginTop: "1rem" }}>
                <Paragraph style={{ marginBottom: "1rem" }}>
                  SCAI Press requires a complete scholar profile to ensure quality academic collaboration. 
                  Please provide the following information in SCAI Box:
                </Paragraph>
                <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
                  <li><strong>Display Name</strong> - Your academic name</li>
                  <li><strong>Institution</strong> - Your affiliated organization</li>
                  <li><strong>Research Fields</strong> - Your areas of expertise</li>
                  <li><strong>Email</strong> - Your contact information</li>
                </ul>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  This information helps other researchers find and collaborate with you effectively.
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ 
              textAlign: "left",
              marginBottom: "2rem",
              background: "rgba(24, 144, 255, 0.05)",
              border: "1px solid rgba(24, 144, 255, 0.2)"
            }}
          />

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Button
              type="primary"
              size="large"
              icon={<BookOutlined />}
              onClick={handleGoToBox}
              style={{
                background: "linear-gradient(45deg, #FF3314, #FF6B47)",
                border: "none",
                borderRadius: "12px",
                height: "50px",
                fontSize: "16px",
                fontWeight: "600",
                width: "100%",
              }}
            >
              Go to SCAI Box to Setup Profile
              <ArrowRightOutlined style={{ marginLeft: "8px" }} />
            </Button>

            <div style={{ 
              background: "rgba(0, 0, 0, 0.02)", 
              padding: "1rem", 
              borderRadius: "8px",
              border: "1px solid rgba(0, 0, 0, 0.05)"
            }}>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                <strong>Current User:</strong> {user?.firstName} {user?.lastName}
                <br />
                <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </div>

            <Text type="secondary" style={{ fontSize: "12px", lineHeight: "1.6" }}>
              After completing your profile in SCAI Box, return to SCAI Press to start 
              creating research groups and collaborating on academic documents with 
              mathematical formula support.
            </Text>
          </Space>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPrompt;
