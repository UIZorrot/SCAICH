import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input, Button, Typography, Spin, List, Modal } from "antd";
import io from "socket.io-client";
import { SendOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../contexts/AuthContext";

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
  
  // 使用认证服务
  const { isAuthenticated, getBackendToken } = useAuth();

  // 清理所有WebSocket相关状态和连接的函数
  const cleanupWebSocket = () => {
    console.log("🧹 Cleaning up WebSocket connection and state");
    if (socketRef.current) {
      const socketId = socketRef.current.id;
      console.log(`🔌 Disconnecting WebSocket ${socketId}`);
      
      // 移除所有事件监听器
      socketRef.current.removeAllListeners();
      
      // 强制断开连接
      if (socketRef.current.connected) {
        socketRef.current.disconnect(true); // 强制断开
      }
      
      // 清空引用
      socketRef.current = null;
      console.log(`✅ WebSocket ${socketId} cleaned up`);
    }
    
    // 重置所有状态
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
  };

  // 创建WebSocket连接的函数
  const createWebSocketConnection = useCallback(async () => {
    // 防止重复连接
    if (socketRef.current && socketRef.current.connected) {
      console.log("⚠️ WebSocket already connected, skipping new connection");
      return;
    }
    
    console.log("🔌 Creating new WebSocket connection");
    
    // 验证和清理参数
    const validSources = ["arxiv", "scihub"];
    const cleanSource = validSources.includes(source) ? source : "scihub";
    const cleanPaperId = paperId ? paperId.toString().trim() : "";

    if (!cleanPaperId) {
      setError("Invalid paper ID");
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setError("请先登录后再使用深度研究功能");
      setLoading(false);
      return;
    }

    try {
      const token = await getBackendToken();
      if (!token) {
        setError("认证失败，请重新登录");
        setLoading(false);
        return;
      }

      console.log("Connecting to WebSocket with:", { id: cleanPaperId, source: cleanSource });
      
      const newSocket = io(url, {
        query: { id: cleanPaperId, source: cleanSource },
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 0, // 禁用自动重连，避免多个连接
        forceNew: true, // 强制创建新连接
        timeout: 10000, // 设置连接超时
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // 设置WebSocket事件监听器
      setupSocketListeners(newSocket);
    } catch (error) {
      console.error("Failed to connect with authentication:", error);
      setError("连接失败，请检查网络或重新登录");
      setLoading(false);
    }
  }, [isAuthenticated, getBackendToken, paperId, source]);

  // 设置WebSocket事件监听器的函数
  const setupSocketListeners = (socket) => {
    socket.on("connect", () => {
      console.log("✅ WebSocket connected, SID:", socket.id);
    });

    socket.on("session_id", (data) => {
      console.log("📋 Session ID received:", data.session_id);
      setSessionId(data.session_id);
      setMessages((prev) => [...prev, { role: "system", content: "Agent connected" }]);
      setLoading(false);
    });

    socket.on("response", (data) => {
      console.log("📨 Received response chunk:", data.chunk);
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.chunk }];
        }
        return [...prev, { role: "assistant", content: data.chunk }];
      });
      setLoading(false);
    });

    socket.on("error", (data) => {
      console.error("❌ WebSocket error:", data.message);
      setError(data.message);
      setLoading(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected, reason:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ WebSocket connect error:", err.message);
      setError("连接失败，请稍后重试");
      setLoading(false);
    });
  };

  // 处理Modal可见性变化
  useEffect(() => {
    if (visible && paperId) {
      // Modal打开且有paperId时，清理旧连接并创建新连接
      cleanupWebSocket();
      setLoading(true);
      createWebSocketConnection();
    } else if (!visible) {
      // Modal关闭时，立即清理所有连接和状态
      cleanupWebSocket();
    }

    // 清理函数：组件卸载或依赖项变化时执行
    return () => {
      cleanupWebSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, paperId, source]); // 故意移除 createWebSocketConnection 依赖，避免重复连接

  const sendQuery = () => {
    // 检查认证状态
    if (!isAuthenticated) {
      setError("请先登录后再发送消息");
      return;
    }
    
    if (!sessionId) {
      setError("会话未初始化，请稍等...");
      return;
    }
    if (!query.trim()) {
      setError("请输入您的问题");
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
