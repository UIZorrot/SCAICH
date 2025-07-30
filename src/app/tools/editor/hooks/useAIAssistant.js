import { useState, useCallback, useRef } from "react";
import { message } from "antd";
import aiService from "../services/AIService";

/**
 * Custom hook for AI assistant functionality
 */
export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [outlineData, setOutlineData] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [citations, setCitations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = useRef(null);

  // Generic error handler
  const handleError = useCallback((error, operation) => {
    console.error(`AI Assistant Error (${operation}):`, error);
    setLastError(error);

    let errorMessage = "操作失败，请稍后重试";

    if (error.message?.includes("API call failed")) {
      errorMessage = "AI服务暂时不可用，请检查网络连接";
    } else if (error.message?.includes("401")) {
      errorMessage = "API密钥无效，请检查配置";
    } else if (error.message?.includes("429")) {
      errorMessage = "API调用频率过高，请稍后重试";
    }

    message.error(errorMessage);
  }, []);

  // Cancel ongoing operations
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // Generate enhanced outline with literature search
  const generateEnhancedOutline = useCallback(
    async (params) => {
      if (!aiService.isConfigured()) {
        message.warning("请先配置AI服务API密钥");
        return null;
      }

      setIsLoading(true);
      setLastError(null);
      abortControllerRef.current = new AbortController();

      try {
        message.loading("正在搜索相关文献并生成大纲...", 0);

        const response = await aiService.generateEnhancedOutline(params);
        const content = response.choices?.[0]?.message?.content;

        if (content) {
          try {
            // Try to parse as JSON first
            const outlineJson = JSON.parse(content);
            setOutlineData(outlineJson);

            // Store citations if available
            if (response.citations) {
              setCitations(response.citations);
            }

            message.destroy();
            message.success("增强大纲生成成功！已包含相关文献");
            return outlineJson;
          } catch (parseError) {
            // If not JSON, treat as plain text
            const textOutline = {
              content,
              type: "text",
              citations: response.citations || [],
            };
            setOutlineData(textOutline);

            if (response.citations) {
              setCitations(response.citations);
            }

            message.destroy();
            message.success("增强大纲生成成功！已包含相关文献");
            return textOutline;
          }
        } else {
          throw new Error("AI服务返回空内容");
        }
      } catch (error) {
        message.destroy();
        handleError(error, "generateEnhancedOutline");
        return null;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [handleError]
  );

  // Generate section content
  const generateSectionContent = useCallback(
    async (params) => {
      if (!aiService.isConfigured()) {
        message.warning("请先配置AI服务API密钥");
        return null;
      }

      setIsLoading(true);
      setLastError(null);

      try {
        message.loading("正在生成内容...", 0);

        const response = await aiService.generateSectionContent(params);
        const content = response.choices?.[0]?.message?.content;

        if (content) {
          message.destroy();
          message.success("内容生成成功！");
          return content;
        } else {
          throw new Error("AI服务返回空内容");
        }
      } catch (error) {
        message.destroy();
        handleError(error, "generateSectionContent");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Improve content
  const improveContent = useCallback(
    async (params) => {
      if (!aiService.isConfigured()) {
        message.warning("请先配置AI服务API密钥");
        return null;
      }

      setIsLoading(true);
      setLastError(null);

      try {
        message.loading("正在优化内容...", 0);

        const response = await aiService.improveContent(params);
        const content = response.choices?.[0]?.message?.content;

        if (content) {
          message.destroy();
          message.success("内容优化完成！");
          return content;
        } else {
          throw new Error("AI服务返回空内容");
        }
      } catch (error) {
        message.destroy();
        handleError(error, "improveContent");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Get writing suggestions
  const getWritingSuggestions = useCallback(
    async (params) => {
      if (!aiService.isConfigured()) {
        message.warning("请先配置AI服务API密钥");
        return [];
      }

      setIsLoading(true);
      setLastError(null);

      try {
        const response = await aiService.getWritingSuggestions(params);
        const content = response.choices?.[0]?.message?.content;

        if (content) {
          // Parse suggestions from the response
          const suggestionsList = content.split("\n").filter((line) => line.trim());
          setSuggestions(suggestionsList);
          return suggestionsList;
        } else {
          throw new Error("AI服务返回空内容");
        }
      } catch (error) {
        handleError(error, "getWritingSuggestions");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Clear outline
  const clearOutline = useCallback(() => {
    setOutlineData(null);
  }, []);

  // Get service status
  const getServiceStatus = useCallback(() => {
    return aiService.getStatus();
  }, []);

  // Search literature
  const searchLiterature = useCallback(
    async (params) => {
      setIsSearching(true);
      setLastError(null);

      try {
        message.loading("正在搜索相关文献...", 0);

        const result = await aiService.searchLiterature(params);

        if (result.success) {
          setSearchResults(result.papers);
          setCitations(result.citations);
          message.destroy();
          message.success(`找到 ${result.total} 篇相关文献`);
          return result;
        } else {
          throw new Error(result.error || "文献搜索失败");
        }
      } catch (error) {
        message.destroy();
        handleError(error, "searchLiterature");
        return { success: false, error: error.message, citations: [], papers: [] };
      } finally {
        setIsSearching(false);
      }
    },
    [handleError]
  );

  // Clear citations
  const clearCitations = useCallback(() => {
    setCitations([]);
    setSearchResults([]);
  }, []);

  return {
    // State
    isLoading,
    isSearching,
    suggestions,
    outlineData,
    lastError,
    citations,
    searchResults,

    // Actions
    generateEnhancedOutline,
    generateSectionContent,
    improveContent,
    getWritingSuggestions,
    searchLiterature,
    cancelOperation,
    clearSuggestions,
    clearOutline,
    clearCitations,
    getServiceStatus,
  };
};
