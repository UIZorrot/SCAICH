import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Typography, Spin, List, Modal } from "antd";
import io from "socket.io-client";
import { SendOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";

const { Paragraph } = Typography;

//http://localhost:7788
const url = "https://api.scai.sh/";

function ChatModal({ visible, paperId, source, onClose }) {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "Initialize Session and Download Fulltext",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null); // 使用 ref 存储 socket 实例

  useEffect(() => {
    if (!visible) {
      // 如果 Modal 不可见，清理状态但不创建新连接
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setSessionId(null);
        setMessages([
          {
            role: "system",
            content: "Initialize Session and Download Fulltext",
          },
        ]);
        setLoading(true);
        setError(null);
        console.log("WebSocket cleanup due to visibility change");
      }
      return;
    }

    // 避免重复创建 socket
    if (socketRef.current) {
      console.log("Socket already exists, skipping creation");
      return;
    }

    setLoading(true);

    // 验证和清理参数
    const validSources = ["arxiv", "scihub"];
    const cleanSource = validSources.includes(source) ? source : "scihub";
    const cleanPaperId = paperId ? paperId.toString().trim() : "";

    if (!cleanPaperId) {
      setError("Invalid paper ID");
      setLoading(false);
      return;
    }

    console.log("Connecting to WebSocket with:", { id: cleanPaperId, source: cleanSource });

    const newSocket = io(url, {
      query: { id: cleanPaperId, source: cleanSource },
      transports: ["websocket"], // 强制使用 WebSocket，避免 polling 重连
      reconnectionAttempts: 3, // 限制重连次数
      reconnectionDelay: 1000,
    });
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("WebSocket connected, SID:", newSocket.id);
    });

    newSocket.on("session_id", (data) => {
      console.log("Session ID received:", data.session_id);
      setSessionId(data.session_id);
      setMessages((prev) => [...prev, { role: "system", content: "Agent connected" }]);
      setLoading(false);
    });

    newSocket.on("response", (data) => {
      console.log("Received response chunk:", data.chunk);
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.chunk }];
        }
        return [...prev, { role: "assistant", content: data.chunk }];
      });
      setLoading(false);
    });

    newSocket.on("error", (data) => {
      console.error("WebSocket error:", data.message);
      setError(data.message);
      setLoading(false);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    newSocket.on("connect_error", (err) => {
      console.error("WebSocket connect error:", err.message);
      setError("Failed to connect to server. Please try again.");
      setLoading(false);
    });

    return () => {
      // 清理函数只在组件卸载时执行
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setSessionId(null);
        setMessages([
          {
            role: "system",
            content: "Initialize Session and Download Fulltext",
          },
        ]);
        setLoading(true);
        setError(null);
        console.log("WebSocket cleanup on unmount");
      }
    };
  }, [visible, paperId, source]); // 依赖项不变，但逻辑优化

  const sendQuery = () => {
    if (!sessionId) {
      setError("Session not initialized yet. Please wait...");
      return;
    }
    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }
    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    socket.emit("chat", { query });
    console.log("Sent query:", query);
    setQuery("");
  };

  return (
    <Modal
      title="SCAI Assistant - Paper Analysis"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 1000 }}
      bodyStyle={{
        padding: 0,
        height: "70vh",
        display: "flex",
        flexDirection: "column",
      }}
      className="chat-modal"
    >
      <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%" }}>
        {error && <Paragraph style={{ color: "red", marginBottom: 16 }}>{error}</Paragraph>}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: 16,
            padding: 16,
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e8e8e8",
          }}
        >
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item
                style={{
                  border: "none",
                  padding: "8px 16px",
                  margin: "8px 0",
                  borderRadius: 16,
                  background: item.role === "user" ? "#e6f7ff" : item.role === "system" ? "#f0f0f0" : "#f9f9f9",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  maxWidth: "70%", // 限制气泡宽度
                  alignSelf: item.role === "user" ? "flex-end" : "flex-start", // 控制气泡对齐
                  transition: "all 0.3s ease",
                  display: "flex", // 确保内部内容可以正确布局
                  justifyContent: item.role === "user" ? "flex-end" : "flex-start", // 控制内容对齐
                }}
              >
                <div style={{ width: "100%" }}>
                  {item.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            style={{
                              margin: "8px 0",
                              fontSize: 14,
                              color: "#333",
                              lineHeight: 1.5, // 增加行高，确保段落清晰
                            }}
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{
                              paddingLeft: 20,
                              margin: "8px 0",
                              listStyleType: "disc",
                            }}
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            style={{
                              paddingLeft: 20,
                              margin: "8px 0",
                              listStyleType: "decimal",
                            }}
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li
                            style={{
                              margin: "4px 0",
                              fontSize: 14,
                              color: "#333",
                            }}
                            {...props}
                          />
                        ),
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  ) : (
                    <Paragraph style={{ margin: 0, fontSize: 14, color: "#333" }}>{item.content}</Paragraph>
                  )}
                </div>
              </List.Item>
            )}
            style={{ display: "flex", flexDirection: "column" }}
          />
          {loading && (
            <div style={{ textAlign: "center", margin: "16px 0" }}>
              <Spin tip="Processing..." />
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Input.TextArea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about the paper..."
            disabled={!sessionId || loading}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendQuery();
              }
            }}
            style={{
              borderRadius: 8,
              border: "1px solid #d9d9d9",
              resize: "none",
              fontSize: 14,
              padding: "4px 12px", // 调整 padding，确保内容居中
              height: 60, // 与 Button 高度一致
              lineHeight: "32px", // 确保文本垂直居中（height - 上下 padding）
            }}
          ></Input.TextArea>
          <Button
            type="primary"
            onClick={sendQuery}
            disabled={!sessionId || loading}
            loading={loading}
            style={{
              backgroundColor: "#FF3314",
              borderColor: "#FF3314",
              height: 60, // 保持高度一致
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px",
            }}
          >
            <SendOutlined style={{ fontSize: 24 }} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ChatModal;
