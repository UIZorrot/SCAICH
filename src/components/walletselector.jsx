// WalletSelector.jsx
import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Card, Space, Typography, message } from "antd";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "./wallet";
import { WalletOutlined } from "@ant-design/icons";
import { useAccount, useDisconnect } from "wagmi"; // For BSC
import { useWallet } from "@solana/wallet-adapter-react"; // For Solana

// Images for BSC and Solana
const bscImage = "/bnblogo.png";
const solanaImage = "/sollogo.png";

const { Title, Text } = Typography;

export const WalletSelector = ({ Connected }) => {
  const [isModalVisible, setIsModalVisible] = useState(false); // Network selection modal
  const [isDisconnectModalVisible, setIsDisconnectModalVisible] = useState(false); // Disconnect confirmation modal
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedNetwork, setSelectedNetwork] = useState(null); // Track the selected network
  const connectButtonRef = useRef(null); // Ref for ConnectButton (BSC)
  const walletRef = useRef(null); // Ref for Wallet (Solana)

  // Wagmi for BSC
  const { address: bscAddress, isConnected: isBscConnected } = useAccount();
  const { disconnect: disconnectBsc } = useDisconnect();

  // Solana Wallet Adapter
  const { publicKey: solanaPublicKey, connected: isSolanaConnected, disconnect: disconnectSolana } = useWallet();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // // Notify parent of successful connection
  // useEffect(() => {
  //   if (isBscConnected && selectedNetwork === "bsc") {
  //     if (Connected) {
  //       if (onNetworkSelected) onNetworkSelected("bsc"); // 传递给父组件
  //     }
  //     setSelectedNetwork(null); // Reset selection after successful connection
  //   }
  //   if (isSolanaConnected && selectedNetwork === "solana") {
  //     if (Connected) {
  //       if (onNetworkSelected) onNetworkSelected("solana"); // 传递给父组件("solana");
  //     }
  //     setSelectedNetwork(null); // Reset selection after successful connection
  //   }
  // }, [isBscConnected, isSolanaConnected, selectedNetwork, Connected]);

  // Show network selection modal
  const showModal = () => {
    setIsModalVisible(true);
    setSelectedNetwork(null);
  };

  // Close network selection modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedNetwork(null);
  };

  // Show disconnect confirmation modal
  const showDisconnectModal = () => {
    setIsDisconnectModalVisible(true);
  };

  // Close disconnect confirmation modal
  const handleDisconnectCancel = () => {
    setIsDisconnectModalVisible(false);
  };

  // Handle button click: either show network selection or disconnect modal
  const handleButtonClick = () => {
    if (isBscConnected || isSolanaConnected) {
      showDisconnectModal();
    } else {
      showModal();
    }
  };

  // Select BSC wallet and trigger ConnectButton
  const handleSelectBsc = () => {
    setSelectedNetwork("bsc");
    setIsModalVisible(false);
    setTimeout(() => {
      if (connectButtonRef.current) {
        const button = connectButtonRef.current.querySelector("button");
        if (button) {
          button.click();
        } else {
          console.error("ConnectButton button not found");
        }
      }
    }, 100);
  };

  // Select Solana wallet and trigger Wallet
  const handleSelectSolana = () => {
    setSelectedNetwork("solana");
    setIsModalVisible(false);
    setTimeout(() => {
      if (walletRef.current) {
        const button = walletRef.current.querySelector("button") || walletRef.current;
        if (button) {
          button.click();
        } else {
          console.error("Wallet clickable element not found");
        }
      }
    }, 100);
  };

  // Handle disconnection
  const handleDisconnect = () => {
    if (isBscConnected) {
      disconnectSolana();
      message.success("Disconnected from BSC");
    } else if (isSolanaConnected) {
      disconnectBsc();
      disconnectSolana();
      message.success("Disconnected from Solana");
    }
    setIsDisconnectModalVisible(false);
  };

  // Truncate wallet address for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Determine button text based on connection status
  const buttonText = () => {
    if (isBscConnected && !isSolanaConnected) {
      return truncateAddress(bscAddress);
    } else if (isSolanaConnected) {
      return truncateAddress(solanaPublicKey?.toString());
    }
    return "Connect Wallet";
  };

  return (
    <>
      {/* Connect Wallet Button */}
      <Button
        type="primary"
        size="medium"
        icon={<WalletOutlined />}
        onClick={handleButtonClick}
        style={{
          borderRadius: "6px",
          padding: "0 24px",
          height: "36px",
          fontSize: "16px",
          fontWeight: "500",
          background: "linear-gradient(90deg, rgb(255, 62, 24) 0%, rgb(251, 92, 92) 100%)",
          border: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {buttonText()}
      </Button>

      {/* Hidden Wallet Connection Components */}
      <div style={{ display: "none" }}>
        {/* Hidden ConnectButton for BSC */}
        <div ref={connectButtonRef}>
          <ConnectButton />
        </div>
        {/* Hidden Wallet for Solana */}
        <div ref={walletRef}>
          <Wallet isMobile={isMobile} />
        </div>
      </div>

      {/* Modal for Network Selection */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, textAlign: "center" }}>
            Choose Your Network
          </Title>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        width={600}
        styles={{
          borderRadius: "12px", body: { padding: "16px", borderRadius: "12px", textAlign: "center" }, // 替换 bodyStyle
        }}
      >
        <Text
          style={{
            display: "block",
            marginBottom: "24px",
            color: "#666",
            fontSize: "16px",
          }}
        >
          We support Solana and BSC network, which one would you prefer?
        </Text>

        {/* Network Options */}
        <Space
          direction="horizontal"
          size="large"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginTop: 0,
          }}
        >
          {/* BSC Option */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Card
              hoverable
              style={{
                padding: "20px",
                width: 180,
                borderRadius: "12px",
                textAlign: "center",
                border: "1px solid #e8e8e8",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onClick={handleSelectBsc}
            >
              <img
                src={bscImage}
                alt="BSC Network"
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "contain",
                }}
              />
            </Card>
            <Text
              strong
              style={{
                fontSize: "16px",
                color: "#333",
                marginTop: "12px",
              }}
            >
              BSC
            </Text>
          </div>

          {/* Solana Option */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Card
              hoverable
              style={{
                padding: "20px",
                width: 180,
                borderRadius: "12px",
                textAlign: "center",
                border: "1px solid #e8e8e8",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onClick={handleSelectSolana}
            >
              <img
                src={solanaImage}
                alt="Solana Network"
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "contain",
                }}
              />
            </Card>
            <Text
              strong
              style={{
                fontSize: "16px",
                color: "#333",
                marginTop: "12px",
              }}
            >
              Solana
            </Text>
          </div>
        </Space>
      </Modal>

      {/* Modal for Disconnect Confirmation */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, textAlign: "center" }}>
            Disconnect Wallet
          </Title>
        }
        open={isDisconnectModalVisible}
        onCancel={handleDisconnectCancel}
        centered
        footer={[

        ]}
        width={400}
        styles={{

          body: {
            padding: "16px", borderRadius: "12px",
            textAlign: "center",
          }
        }}
      >
        <Text
          style={{
            display: "block",
            marginBottom: "16px",
            color: "#666",
            fontSize: "16px",
          }}
        >
          Are you sure you want to disconnect your wallet?
        </Text>
        <div style={{ marginTop: 35, display: "flex", justifyContent: "center", gap: "10px" }}>
          <Button style={{ width: "40%" }} key="cancel" onClick={handleDisconnectCancel}>
            Cancel
          </Button>
          <Button style={{ width: "40%" }} key="disconnect" type="primary" danger onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </Modal>
    </>
  );
};