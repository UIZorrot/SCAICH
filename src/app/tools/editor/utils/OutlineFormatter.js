import NumberingManager from "./NumberingManager.js";

/**
 * OutlineFormatter - 简化的大纲格式化工具
 *
 * 将复杂的formatOutlineForEditor函数拆分为多个小函数
 * 每个函数负责格式化大纲的一个特定部分
 */
class OutlineFormatter {
  constructor() {
    this.numberingManager = new NumberingManager();
  }

  /**
   * 格式化完整的大纲数据
   * @param {Object|string} outlineData - 大纲数据
   * @returns {string} 格式化后的HTML内容
   */
  formatOutline(outlineData) {
    try {
      // 解析数据
      const parsedData = this.parseOutlineData(outlineData);

      // 重置编号管理器
      this.numberingManager.reset();

      let formattedContent = "";

      // 1. 标题建议
      if (parsedData.titleSuggestions) {
        formattedContent += this.formatTitleSuggestions(parsedData.titleSuggestions);
      }

      // 2. 摘要结构
      if (parsedData.abstractStructure) {
        formattedContent += this.formatAbstractStructure(parsedData.abstractStructure);
      }

      // 3. 主体内容
      if (parsedData.mainBody) {
        formattedContent += this.formatMainBody(parsedData.mainBody);
      }

      // 4. 研究方法
      if (parsedData.suggestedMethodology) {
        formattedContent += this.formatMethodology(parsedData.suggestedMethodology);
      }

      // 5. 参考文献结构
      if (parsedData.referencesStructure) {
        formattedContent += this.formatReferencesStructure(parsedData.referencesStructure);
      }

      return formattedContent;
    } catch (error) {
      console.error("Error formatting outline:", error);
      return this.formatError(error, outlineData);
    }
  }

  /**
   * 解析大纲数据
   * @param {Object|string} outlineData - 原始大纲数据
   * @returns {Object} 解析后的数据
   */
  parseOutlineData(outlineData) {
    if (typeof outlineData === "string") {
      // 处理被markdown代码块包装的JSON
      let cleanedData = outlineData.trim();

      // 移除markdown代码块标记
      if (cleanedData.startsWith("```json")) {
        cleanedData = cleanedData.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanedData.startsWith("```")) {
        cleanedData = cleanedData.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      try {
        const parsed = JSON.parse(cleanedData);

        // 检查是否是TipTap格式的文档
        if (parsed.type === "doc" && parsed.content) {
          return this.convertTipTapToOutline(parsed);
        }

        return parsed;
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        throw new Error(`JSON解析失败: ${error.message}`);
      }
    }
    return outlineData;
  }

  /**
   * 格式化标题建议
   * @param {Array} titleSuggestions - 标题建议数组
   * @returns {string} HTML内容
   */
  formatTitleSuggestions(titleSuggestions) {
    if (!Array.isArray(titleSuggestions) || titleSuggestions.length === 0) {
      return "";
    }

    let content = `<p><strong style="font-size: 1.5em; color: #ee1d1d;">标题建议</strong></p>\n`;

    titleSuggestions.forEach((title, index) => {
      content += `<p><strong>选项 ${index + 1}</strong></p>\n`;
      content += `<p>${title}</p>\n\n`;
    });

    return content;
  }

  /**
   * 格式化摘要结构
   * @param {Object} abstractStructure - 摘要结构对象
   * @returns {string} HTML内容
   */
  formatAbstractStructure(abstractStructure) {
    if (!abstractStructure || typeof abstractStructure !== "object") {
      return "";
    }

    let content = `<p><strong style="font-size: 1.5em; color: #ee1d1d;">摘要结构</strong></p>\n`;

    const sections = [
      { key: "background", label: "背景 (Background)" },
      { key: "objective", label: "目的 (Objective)" },
      { key: "methodology", label: "方法 (Methodology)" },
      { key: "keyFindings", label: "主要发现 (Key Findings)" },
      { key: "implications", label: "意义 (Implications)" },
    ];

    sections.forEach((section) => {
      if (abstractStructure[section.key]) {
        content += `<p><strong>${section.label}</strong></p>\n`;
        content += `<p>${abstractStructure[section.key]}</p>\n`;
      }
    });

    content += `\n`;
    return content;
  }

  /**
   * 格式化主体内容
   * @param {Array} mainBody - 主体内容数组
   * @returns {string} HTML内容
   */
  formatMainBody(mainBody) {
    if (!Array.isArray(mainBody) || mainBody.length === 0) {
      return "";
    }

    let content = "";

    mainBody.forEach((section) => {
      // 生成一级标题
      const h1Title = section.sectionTitle || "未命名章节";
      content += this.numberingManager.generateHeadingHTML(1, h1Title);
      content += "\n";

      // 处理子章节
      if (section.subsections && Array.isArray(section.subsections)) {
        section.subsections.forEach((subsection) => {
          // 生成二级标题
          const h2Title = subsection.subsectionTitle || "未命名小节";
          content += this.numberingManager.generateHeadingHTML(2, h2Title);
          content += "\n";

          // 添加要点列表
          if (subsection.keyPoints && Array.isArray(subsection.keyPoints)) {
            content += `<ul>\n`;
            subsection.keyPoints.forEach((point) => {
              content += `<li>${point}</li>\n`;
            });
            content += `</ul>\n`;
          }
        });
      }

      content += `\n`;
    });

    return content;
  }

  /**
   * 格式化研究方法
   * @param {Object} methodology - 研究方法对象
   * @returns {string} HTML内容
   */
  formatMethodology(methodology) {
    if (!methodology || typeof methodology !== "object") {
      return "";
    }

    let content = `<p><strong style="font-size: 1.3em; color: #2a2a2a;">研究方法`;
    if (methodology.approach) {
      content += ` (${methodology.approach})`;
    }
    content += `</strong></p>\n`;

    if (methodology.methods && Array.isArray(methodology.methods)) {
      content += `<ol>\n`;
      methodology.methods.forEach((method) => {
        const methodName = method.methodName || "未命名方法";
        const description = method.description || "";
        content += `<li><strong>${methodName}</strong><br>${description}</li>\n`;
      });
      content += `</ol>\n`;
    }

    content += `\n`;
    return content;
  }

  /**
   * 格式化参考文献结构
   * @param {Object} referencesStructure - 参考文献结构对象
   * @returns {string} HTML内容
   */
  formatReferencesStructure(referencesStructure) {
    if (!referencesStructure || typeof referencesStructure !== "object") {
      return "";
    }

    let content = `<p><strong style="font-size: 1.3em; color: #2a2a2a;">参考文献结构</strong></p>\n`;

    if (referencesStructure.citationStyle) {
      content += `<p><strong>引用格式</strong></p>\n`;
      content += `<p>${referencesStructure.citationStyle}</p>\n`;
    }

    if (referencesStructure.sourceCategories && Array.isArray(referencesStructure.sourceCategories)) {
      content += `<p><strong>文献来源类别</strong></p>\n`;
      content += `<ul>\n`;
      referencesStructure.sourceCategories.forEach((category) => {
        content += `<li>${category}</li>\n`;
      });
      content += `</ul>\n`;
    }

    return content;
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 错误对象
   * @param {*} originalData - 原始数据
   * @returns {string} 错误HTML内容
   */
  formatError(error, originalData) {
    return `<p style="color: red;">大纲格式化时出现问题：${error.message}</p>
<details>
<summary>原始数据</summary>
<pre>${JSON.stringify(originalData, null, 2)}</pre>
</details>`;
  }

  /**
   * 将TipTap格式转换为标准大纲格式
   * @param {Object} tipTapDoc - TipTap文档对象
   * @returns {Object} 标准大纲格式
   */
  convertTipTapToOutline(tipTapDoc) {
    if (!tipTapDoc.content || !Array.isArray(tipTapDoc.content)) {
      throw new Error("Invalid TipTap document structure");
    }

    const outline = {
      mainBody: [],
    };

    let currentSection = null;
    let currentSubsection = null;

    tipTapDoc.content.forEach((node) => {
      if (node.type === "numberedHeading") {
        const level = node.attrs?.level || 1;
        const title = this.extractTextFromNode(node);

        if (level === 1) {
          // 新的一级标题
          currentSection = {
            sectionTitle: title,
            subsections: [],
          };
          outline.mainBody.push(currentSection);
          currentSubsection = null;
        } else if (level === 2 && currentSection) {
          // 二级标题
          currentSubsection = {
            subsectionTitle: title,
            keyPoints: [],
          };
          currentSection.subsections.push(currentSubsection);
        }
      } else if (node.type === "paragraph" && currentSubsection) {
        // 段落内容作为要点
        const text = this.extractTextFromNode(node);
        if (text.trim()) {
          currentSubsection.keyPoints.push(text.trim());
        }
      }
    });

    return outline;
  }

  /**
   * 从TipTap节点中提取文本内容
   * @param {Object} node - TipTap节点
   * @returns {string} 提取的文本
   */
  extractTextFromNode(node) {
    if (!node.content) return "";

    return node.content
      .map((child) => {
        if (child.type === "text") {
          return child.text || "";
        }
        return "";
      })
      .join("");
  }

  /**
   * 获取当前编号管理器状态
   * @returns {NumberingManager} 编号管理器实例
   */
  getNumberingManager() {
    return this.numberingManager;
  }
}

export default OutlineFormatter;
