/**
 * Bibliography Service
 * 处理参考文献列表的生成和格式化
 */

class BibliographyService {
  /**
   * 从编辑器内容中提取所有引用
   * @param {Object} editorJSON - 编辑器的JSON内容
   * @returns {Array} 引用列表
   */
  extractCitationsFromContent(editorJSON) {
    const citations = [];
    const citationIds = new Set(); // 避免重复

    // 递归遍历内容节点
    const traverseNode = (node) => {
      if (node.type === "citation" && node.attrs) {
        const citationId = node.attrs.citationId;

        // 避免重复添加
        if (!citationIds.has(citationId)) {
          citationIds.add(citationId);
          citations.push({
            id: citationId,
            ...node.attrs,
            // 尝试解析完整数据
            fullDataParsed: this.parseFullData(node.attrs.fullData),
          });
        }
      }

      // 递归处理子节点
      if (node.content) {
        node.content.forEach(traverseNode);
      }
    };

    if (editorJSON.content) {
      editorJSON.content.forEach(traverseNode);
    }

    return citations;
  }

  /**
   * 解析存储的完整引用数据 (改进安全性)
   * @param {string} fullDataString - JSON字符串
   * @returns {Object|null} 解析后的数据或null
   */
  parseFullData(fullDataString) {
    if (!fullDataString || typeof fullDataString !== "string") {
      return null;
    }

    try {
      const parsed = JSON.parse(fullDataString);

      // 基本的数据验证
      if (typeof parsed !== "object" || parsed === null) {
        console.warn("引用数据格式无效:", parsed);
        return null;
      }

      // 清理潜在的危险字段
      const safeParsed = { ...parsed };
      delete safeParsed.__proto__;
      delete safeParsed.constructor;

      return safeParsed;
    } catch (error) {
      console.warn("无法解析引用的完整数据:", error);
      return null;
    }
  }

  /**
   * 格式化单个引用为APA格式
   * @param {Object} citation - 引用对象
   * @returns {string} 格式化的引用字符串
   */
  formatCitationAPA(citation) {
    if (!citation || typeof citation !== "object") {
      return "引用数据无效";
    }

    const fullData = citation.fullDataParsed;

    // 安全地获取字段，提供默认值
    const title = this.sanitizeText(citation.title) || "无标题";
    const author = this.sanitizeText(citation.author) || "未知作者";
    const year = this.sanitizeText(citation.year) || "未知年份";

    // 如果有完整数据，使用更详细的格式
    if (fullData && typeof fullData === "object") {
      const journal = this.sanitizeText(fullData.journal || fullData.containerTitle) || "";
      const volume = this.sanitizeText(fullData.volume) || "";
      const issue = this.sanitizeText(fullData.issue) || "";
      const pages = this.sanitizeText(fullData.page) || "";
      const doi = this.sanitizeText(fullData.doi || citation.doi) || "";

      let formatted = `${author} (${year}). ${title}`;

      if (journal) {
        formatted += `. *${journal}*`;

        if (volume) {
          formatted += `, ${volume}`;
          if (issue) {
            formatted += `(${issue})`;
          }
        }

        if (pages) {
          formatted += `, ${pages}`;
        }
      }

      if (doi) {
        // 清理DOI格式
        const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
        formatted += `. https://doi.org/${cleanDoi}`;
      }

      return formatted;
    }

    // 简化格式
    return `${author} (${year}). ${title}.`;
  }

  /**
   * 格式化单个引用为MLA格式
   * @param {Object} citation - 引用对象
   * @returns {string} 格式化的引用字符串
   */
  formatCitationMLA(citation) {
    const fullData = citation.fullDataParsed;
    const title = citation.title || "无标题";
    const author = citation.author || "未知作者";
    const year = citation.year || "未知年份";

    if (fullData) {
      const journal = fullData.journal || fullData.containerTitle || "";
      const volume = fullData.volume || "";
      const issue = fullData.issue || "";
      const pages = fullData.page || "";

      let formatted = `${author}. "${title}."`;

      if (journal) {
        formatted += ` *${journal}*`;

        if (volume) {
          formatted += `, vol. ${volume}`;
          if (issue) {
            formatted += `, no. ${issue}`;
          }
        }

        formatted += `, ${year}`;

        if (pages) {
          formatted += `, pp. ${pages}`;
        }
      } else {
        formatted += ` ${year}`;
      }

      formatted += ".";
      return formatted;
    }

    return `${author}. "${title}." ${year}.`;
  }

  /**
   * 生成完整的参考文献列表
   * @param {Object} editorJSON - 编辑器的JSON内容
   * @param {string} format - 引用格式 ('APA' 或 'MLA')
   * @returns {Object} 包含引用列表和统计信息的对象
   */
  generateBibliography(editorJSON, format = "APA") {
    const citations = this.extractCitationsFromContent(editorJSON);

    // 按作者姓名排序
    const sortedCitations = citations.sort((a, b) => {
      const authorA = (a.author || "").toLowerCase();
      const authorB = (b.author || "").toLowerCase();
      return authorA.localeCompare(authorB);
    });

    // 格式化引用
    const formattedCitations = sortedCitations.map((citation, index) => {
      const formatted = format === "MLA" ? this.formatCitationMLA(citation) : this.formatCitationAPA(citation);

      return {
        id: citation.id,
        index: index + 1,
        formatted,
        original: citation,
      };
    });

    return {
      citations: formattedCitations,
      count: citations.length,
      format,
      generated: new Date().toISOString(),
    };
  }

  /**
   * 导出参考文献为纯文本
   * @param {Object} bibliography - 生成的参考文献对象
   * @returns {string} 纯文本格式的参考文献列表
   */
  exportAsText(bibliography) {
    const header = `参考文献 (${bibliography.format} 格式)\n${"=".repeat(30)}\n\n`;
    const entries = bibliography.citations.map((citation) => `${citation.index}. ${citation.formatted}`).join("\n\n");

    return header + entries;
  }

  /**
   * 导出参考文献为HTML
   * @param {Object} bibliography - 生成的参考文献对象
   * @returns {string} HTML格式的参考文献列表
   */
  exportAsHTML(bibliography) {
    const header = `<h2>参考文献 (${bibliography.format} 格式)</h2>`;
    const entries = bibliography.citations.map((citation) => `<p>${citation.index}. ${citation.formatted}</p>`).join("");

    return `<div class="bibliography">${header}<div class="bibliography-entries">${entries}</div></div>`;
  }

  /**
   * 清理和验证文本内容
   * @param {any} text - 要清理的文本
   * @returns {string} 清理后的文本
   */
  sanitizeText(text) {
    if (typeof text !== "string") {
      return "";
    }

    // 移除潜在的HTML标签和危险字符
    return text
      .replace(/<[^>]*>/g, "") // 移除HTML标签
      .replace(/[<>'"&]/g, "") // 移除危险字符
      .trim();
  }
}

// 创建单例实例
const bibliographyService = new BibliographyService();

export default bibliographyService;
