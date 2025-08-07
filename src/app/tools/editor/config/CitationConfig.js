/**
 * Citation System Configuration
 * 集中管理引用系统的配置参数
 */

export const CITATION_CONFIG = {
  // 搜索相关配置
  SEARCH: {
    DEBOUNCE_DELAY: 500, // 搜索防抖延迟 (毫秒)
    MIN_QUERY_LENGTH: 2, // 最小查询长度
    MAX_RESULTS: 8, // 最大显示结果数
    CACHE_TTL: 5 * 60 * 1000, // 缓存TTL (5分钟)
  },

  // 参考文献面板配置
  BIBLIOGRAPHY: {
    UPDATE_DELAY: 1000, // 编辑器更新后的延迟 (毫秒)
    DEFAULT_FORMAT: "APA", // 默认引用格式
    SUPPORTED_FORMATS: ["APA", "MLA"], // 支持的格式
  },

  // 引用节点配置
  CITATION_NODE: {
    TRIGGER_CHAR: "[", // 触发字符
    ID_PREFIX: "cite_", // ID前缀
  },

  // 错误消息
  MESSAGES: {
    SEARCH_FAILED: "搜索文献失败，请稍后重试",
    GENERATE_FAILED: "生成参考文献失败，请稍后重试",
    COPY_FAILED: "复制失败，请检查浏览器权限",
    EXPORT_FAILED: "导出失败，请稍后重试",
    INSERT_FAILED: "插入参考文献失败，请稍后重试",
    NO_BIBLIOGRAPHY: "没有可操作的参考文献",
    INVALID_DATA: "引用数据无效",
  },

  // 成功消息
  SUCCESS_MESSAGES: {
    COPY_SUCCESS: "参考文献列表已复制到剪贴板",
    EXPORT_SUCCESS: "参考文献列表已导出",
    INSERT_SUCCESS: "参考文献列表已插入到文档中",
  },
};

export default CITATION_CONFIG;
