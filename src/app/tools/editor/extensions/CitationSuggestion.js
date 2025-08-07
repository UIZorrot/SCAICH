import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "prosemirror-state";
import searchService from "../services/SearchService";
import { renderCitationSuggestions } from "./CitationSuggestionRenderer";

// 在顶层创建唯一的 PluginKey 实例 - 修复核心 Bug！
export const CitationSuggestionKey = new PluginKey("citationSuggestion");

// 带TTL的搜索结果缓存
class SearchCache {
  constructor(ttl = 5 * 60 * 1000) {
    // 默认5分钟TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();

/**
 * 带有缓存的文献搜索函数
 * @param {string} query 查询字符串
 * @returns {Promise<Array>} 格式化后的结果数组
 */
const fetchPapers = async (query) => {
  // 1. 直接检查缓存
  if (searchCache.has(query)) {
    console.log(`📋 使用缓存结果: "${query}"`);
    return searchCache.get(query);
  }

  // 2. 如果无缓存，则调用 API
  try {
    console.log(`🔍 正在搜索文献: "${query}"`);
    const searchResult = await searchService.searchPapers({
      query: query,
      limit: 10,
      openAccessOnly: false,
    });

    if (searchResult.success) {
      console.log(`✅ 找到 ${searchResult.results.length} 篇文献`);
      const formattedResults = searchResult.results.map((paper, index) => ({
        id: `search_${index}`,
        ...paper,
        // 根据实际 API 返回格式处理字段
        displayTitle: paper.title || "无标题",
        displayAuthor: paper.author || "未知作者",
        displayYear: paper.year || "未知年份",
        // 添加其他可能需要的字段
        authors: paper.author ? [{ name: paper.author }] : [],
        publicationDate: paper.year ? `${paper.year}-01-01` : null,
        doi: paper.doi || "",
        journal: paper.source || "",
        openAccess: paper.is_oa || false,
      }));

      // 3. 缓存新结果
      searchCache.set(query, formattedResults);
      return formattedResults;
    } else {
      console.warn("❌ 搜索失败:", searchResult.error);
      return []; // 失败时返回空数组
    }
  } catch (error) {
    console.error("🚨 引用搜索出错:", error);
    return []; // 异常时返回空数组
  }
};

// 创建一个改进的防抖版本的搜索函数
class DebouncedSearch {
  constructor(delay = 500) {
    this.delay = delay;
    this.timeoutId = null;
    this.pendingPromises = new Map();
  }

  search(query) {
    // 如果已有相同查询的pending请求，返回现有的Promise
    if (this.pendingPromises.has(query)) {
      return this.pendingPromises.get(query);
    }

    // 清除之前的定时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // 创建新的Promise
    const promise = new Promise((resolve) => {
      this.timeoutId = setTimeout(async () => {
        try {
          const results = await fetchPapers(query);
          resolve(results);
        } catch (error) {
          console.error("搜索出错:", error);
          resolve([]);
        } finally {
          // 清理pending状态
          this.pendingPromises.delete(query);
        }
      }, this.delay);
    });

    // 存储pending的Promise
    this.pendingPromises.set(query, promise);
    return promise;
  }
}

const debouncedSearcher = new DebouncedSearch(500);
const debouncedFetchPapers = (query) => debouncedSearcher.search(query);

/**
 * Citation Suggestion Extension
 * 使用 "[" 触发文献搜索，集成现有的 SearchService
 */
export const CitationSuggestion = Extension.create({
  name: "citationSuggestion",

  addOptions() {
    return {
      suggestion: {
        char: "[",
        command: ({ editor, range, props }) => {
          // 当用户选择一篇文献时，插入引用节点
          const citationData = props;

          // 从搜索结果中提取关键信息，适配实际 API 格式
          const authorName = citationData.author || citationData.displayAuthor || "Unknown";
          const year = citationData.year || citationData.displayYear || "n.d.";
          const title = citationData.title || citationData.displayTitle || "Untitled";
          const doi = citationData.doi || "";

          // 生成唯一的引用ID (使用更安全的方法)
          const timestamp = Date.now();
          const randomPart = Math.random().toString(36).substring(2, 11);
          const citationId = `cite_${timestamp}_${randomPart}`;

          // 生成显示文本（可以根据需要自定义格式）
          const displayText = `(${authorName}, ${year})`;

          // 存储完整数据供后续使用
          const fullData = JSON.stringify(citationData);

          // 执行插入引用的命令
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setCitation({
              citationId,
              displayText,
              title,
              author: authorName,
              year,
              doi,
              fullData,
            })
            .run();
        },

        items: ({ query }) => {
          if (query.trim().length < 2) {
            return []; // 输入太短则不搜索
          }
          return debouncedFetchPapers(query.trim());
        },

        render: renderCitationSuggestions,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey: CitationSuggestionKey, // 使用正确的 Key
      }),
    ];
  },
});

export default CitationSuggestion;
