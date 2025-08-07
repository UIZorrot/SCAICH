import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { createPaperStructureNode, PaperStructureUtils, PaperStructureConfig } from "./PaperStructureNodes";

// 导入NodeView组件
import { AbstractNodeView, KeywordsNodeView, AffiliationNodeView } from "../components/PaperStructureNodeViewsExtended";

/**
 * Abstract - 摘要节点
 * 包含字数统计、结构化编辑、多语言支持功能
 */
export const Abstract = createPaperStructureNode({
  name: "abstract",
  group: "block",
  content: "block+",
  isolating: true,
  defining: true,

  attributes: {
    content: {
      default: "",
      rendered: false,
    },
    language: {
      default: "en",
      rendered: false,
    },
    wordCount: {
      default: 0,
      rendered: false,
    },
    maxWords: {
      default: 500,
      rendered: false,
    },
    minWords: {
      default: 100,
      rendered: false,
    },
    showWordCount: {
      default: true,
      rendered: false,
    },
    structured: {
      default: false, // 是否使用结构化摘要（背景、方法、结果、结论）
      rendered: false,
    },
    sections: {
      default: [], // 结构化摘要的各个部分
      rendered: false,
    },
    required: {
      default: true,
      rendered: false,
    },
  },

  parseHTML: [
    {
      tag: 'div[data-type="abstract"]',
      getAttrs: (dom) => {
        try {
          const sectionsData = dom.getAttribute("data-sections");
          return {
            content: dom.textContent || "",
            language: dom.getAttribute("data-language") || "en",
            wordCount: parseInt(dom.getAttribute("data-word-count")) || 0,
            maxWords: parseInt(dom.getAttribute("data-max-words")) || 500,
            minWords: parseInt(dom.getAttribute("data-min-words")) || 100,
            showWordCount: dom.getAttribute("data-show-word-count") !== "false",
            structured: dom.getAttribute("data-structured") === "true",
            sections: sectionsData ? JSON.parse(sectionsData) : [],
          };
        } catch (e) {
          return { content: "", sections: [] };
        }
      },
    },
  ],

  renderHTML: ({ node, HTMLAttributes }) => {
    const { content, language, wordCount, maxWords, minWords, showWordCount, structured, sections } = node.attrs;

    const wordCountStatus = wordCount < minWords ? "insufficient" : wordCount > maxWords ? "excessive" : "good";

    const elements = [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "abstract",
        "data-id": node.attrs.id,
        "data-language": language,
        "data-word-count": wordCount,
        "data-max-words": maxWords,
        "data-min-words": minWords,
        "data-show-word-count": showWordCount,
        "data-structured": structured,
        "data-sections": JSON.stringify(sections),
        class: `paper-abstract-container language-${language} ${structured ? "structured" : "unstructured"}`,
      }),
      ["div", { class: "abstract-header" }, ["h3", { class: "abstract-title" }, "摘要 / Abstract"], showWordCount ? ["div", { class: `abstract-word-count status-${wordCountStatus}` }, `字数: ${wordCount} / ${minWords}-${maxWords}`] : null].filter(Boolean),
    ];

    if (structured && sections.length > 0) {
      // 结构化摘要
      const sectionElements = sections.map((section, index) => [
        "div",
        { class: "abstract-section", "data-section-index": index },
        ["strong", { class: "section-title" }, `${section.title}: `],
        [
          "span",
          {
            class: "section-content",
            contenteditable: "true",
            "data-placeholder": section.placeholder || `请输入${section.title}...`,
          },
          section.content || "",
        ],
      ]);

      elements.push(["div", { class: "abstract-structured-content" }, ...sectionElements]);
    } else {
      // 非结构化摘要
      elements.push([
        "div",
        {
          class: "abstract-content",
          contenteditable: "true",
          "data-placeholder": "请输入摘要内容...",
          "data-language": language,
        },
        content || "",
      ]);
    }

    return elements;
  },

  addCommands: () => ({
    setAbstract:
      (attributes = {}) =>
      ({ commands }) => {
        const defaultSections = [
          { title: "背景", content: "", placeholder: "研究背景和问题" },
          { title: "方法", content: "", placeholder: "研究方法和数据" },
          { title: "结果", content: "", placeholder: "主要发现和结果" },
          { title: "结论", content: "", placeholder: "结论和意义" },
        ];

        return commands.insertContent({
          type: "abstract",
          attrs: {
            content: attributes.content || "",
            language: attributes.language || "en",
            wordCount: attributes.wordCount || 0,
            maxWords: attributes.maxWords || 500,
            minWords: attributes.minWords || 100,
            showWordCount: attributes.showWordCount !== false,
            structured: attributes.structured || false,
            sections: attributes.structured ? attributes.sections || defaultSections : [],
            updated: new Date().toISOString(),
          },
        });
      },

    updateAbstract:
      (attributes = {}) =>
      ({ commands }) => {
        // 如果更新了内容，重新计算字数
        if (attributes.content !== undefined) {
          attributes.wordCount = PaperStructureUtils.countWords(attributes.content);
        }

        return commands.updateAttributes("abstract", {
          ...attributes,
          updated: new Date().toISOString(),
        });
      },

    toggleAbstractStructure:
      () =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("abstract");
        const isStructured = !currentAttrs.structured;

        const defaultSections = [
          { title: "背景", content: "", placeholder: "研究背景和问题" },
          { title: "方法", content: "", placeholder: "研究方法和数据" },
          { title: "结果", content: "", placeholder: "主要发现和结果" },
          { title: "结论", content: "", placeholder: "结论和意义" },
        ];

        return commands.updateAttributes("abstract", {
          structured: isStructured,
          sections: isStructured ? defaultSections : [],
          updated: new Date().toISOString(),
        });
      },

    updateAbstractSection:
      (sectionIndex, sectionData) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("abstract");
        const updatedSections = [...(currentAttrs.sections || [])];

        if (updatedSections[sectionIndex]) {
          updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], ...sectionData };

          // 重新计算总字数
          const totalContent = updatedSections.map((s) => s.content || "").join(" ");
          const wordCount = PaperStructureUtils.countWords(totalContent);

          return commands.updateAttributes("abstract", {
            sections: updatedSections,
            wordCount,
            updated: new Date().toISOString(),
          });
        }

        return false;
      },

    setAbstractLanguage:
      (language) =>
      ({ commands }) => {
        return commands.updateAttributes("abstract", {
          language,
          updated: new Date().toISOString(),
        });
      },
  }),

  addKeyboardShortcuts: () => ({
    "Mod-Shift-b": () => {
      // 插入摘要
      return this.editor.commands.setAbstract();
    },
    "Mod-Alt-s": () => {
      // 切换结构化摘要
      return this.editor.commands.toggleAbstractStructure();
    },
  }),

  // 添加NodeView组件
  NodeViewComponent: AbstractNodeView,
});

/**
 * Keywords - 关键词节点
 * 支持标签式管理、自动建议、分类功能
 */
export const Keywords = createPaperStructureNode({
  name: "keywords",
  group: "block",
  content: "block*",
  isolating: true,
  defining: true,

  attributes: {
    keywords: {
      default: [],
      rendered: false,
    },
    language: {
      default: "en",
      rendered: false,
    },
    maxKeywords: {
      default: 10,
      rendered: false,
    },
    minKeywords: {
      default: 3,
      rendered: false,
    },
    showCount: {
      default: true,
      rendered: false,
    },
    categories: {
      default: [], // 关键词分类
      rendered: false,
    },
    suggestions: {
      default: [], // AI建议的关键词
      rendered: false,
    },
    required: {
      default: true,
      rendered: false,
    },
  },

  parseHTML: [
    {
      tag: 'div[data-type="keywords"]',
      getAttrs: (dom) => {
        try {
          const keywordsData = dom.getAttribute("data-keywords");
          const categoriesData = dom.getAttribute("data-categories");
          const suggestionsData = dom.getAttribute("data-suggestions");

          return {
            keywords: keywordsData ? JSON.parse(keywordsData) : [],
            language: dom.getAttribute("data-language") || "en",
            maxKeywords: parseInt(dom.getAttribute("data-max-keywords")) || 10,
            minKeywords: parseInt(dom.getAttribute("data-min-keywords")) || 3,
            showCount: dom.getAttribute("data-show-count") !== "false",
            categories: categoriesData ? JSON.parse(categoriesData) : [],
            suggestions: suggestionsData ? JSON.parse(suggestionsData) : [],
          };
        } catch (e) {
          return { keywords: [], categories: [], suggestions: [] };
        }
      },
    },
  ],

  renderHTML: ({ node, HTMLAttributes }) => {
    const { keywords, language, maxKeywords, minKeywords, showCount, categories, suggestions } = node.attrs;

    const keywordCount = keywords.length;
    const countStatus = keywordCount < minKeywords ? "insufficient" : keywordCount > maxKeywords ? "excessive" : "good";

    const keywordElements = keywords.map((keyword, index) => [
      "span",
      {
        class: "keyword-tag",
        "data-keyword-index": index,
        "data-category": keyword.category || "general",
      },
      keyword.text || keyword,
      [
        "button",
        {
          class: "keyword-remove",
          type: "button",
          "data-keyword-index": index,
        },
        "×",
      ],
    ]);

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "keywords",
        "data-id": node.attrs.id,
        "data-keywords": JSON.stringify(keywords),
        "data-language": language,
        "data-max-keywords": maxKeywords,
        "data-min-keywords": minKeywords,
        "data-show-count": showCount,
        "data-categories": JSON.stringify(categories),
        "data-suggestions": JSON.stringify(suggestions),
        class: `paper-keywords-container language-${language}`,
      }),
      ["div", { class: "keywords-header" }, ["h3", { class: "keywords-title" }, "关键词 / Keywords"], showCount ? ["div", { class: `keywords-count status-${countStatus}` }, `关键词数量: ${keywordCount} / ${minKeywords}-${maxKeywords}`] : null].filter(Boolean),
      [
        "div",
        { class: "keywords-content" },
        ["div", { class: "keywords-list" }, ...keywordElements],
        [
          "input",
          {
            class: "keyword-input",
            type: "text",
            placeholder: "输入关键词后按回车添加...",
            "data-language": language,
          },
        ],
      ],
    ];
  },

  addCommands: () => ({
    setKeywords:
      (attributes = {}) =>
      ({ commands }) => {
        return commands.insertContent({
          type: "keywords",
          attrs: {
            keywords: attributes.keywords || [],
            language: attributes.language || "en",
            maxKeywords: attributes.maxKeywords || 10,
            minKeywords: attributes.minKeywords || 3,
            showCount: attributes.showCount !== false,
            categories: attributes.categories || [],
            suggestions: attributes.suggestions || [],
            updated: new Date().toISOString(),
          },
        });
      },

    addKeyword:
      (keywordData) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("keywords");
        const currentKeywords = currentAttrs.keywords || [];

        // 检查是否已存在
        const keywordText = typeof keywordData === "string" ? keywordData : keywordData.text;
        const exists = currentKeywords.some((k) => (typeof k === "string" ? k : k.text) === keywordText);

        if (exists || currentKeywords.length >= currentAttrs.maxKeywords) {
          return false;
        }

        const newKeyword = typeof keywordData === "string" ? { text: keywordData, category: "general" } : keywordData;

        const updatedKeywords = [...currentKeywords, newKeyword];

        return commands.updateAttributes("keywords", {
          keywords: updatedKeywords,
          updated: new Date().toISOString(),
        });
      },

    removeKeyword:
      (keywordIndex) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("keywords");
        const updatedKeywords = (currentAttrs.keywords || []).filter((_, index) => index !== keywordIndex);

        return commands.updateAttributes("keywords", {
          keywords: updatedKeywords,
          updated: new Date().toISOString(),
        });
      },

    updateKeyword:
      (keywordIndex, keywordData) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("keywords");
        const updatedKeywords = [...(currentAttrs.keywords || [])];

        if (updatedKeywords[keywordIndex]) {
          updatedKeywords[keywordIndex] = typeof keywordData === "string" ? { text: keywordData, category: "general" } : { ...updatedKeywords[keywordIndex], ...keywordData };

          return commands.updateAttributes("keywords", {
            keywords: updatedKeywords,
            updated: new Date().toISOString(),
          });
        }

        return false;
      },

    setKeywordSuggestions:
      (suggestions) =>
      ({ commands }) => {
        return commands.updateAttributes("keywords", {
          suggestions,
          updated: new Date().toISOString(),
        });
      },
  }),

  addKeyboardShortcuts: () => ({
    "Mod-Shift-k": () => {
      // 插入关键词
      return this.editor.commands.setKeywords();
    },
  }),

  // 添加NodeView组件
  NodeViewComponent: KeywordsNodeView,
});

/**
 * Affiliation - 机构信息节点
 * 支持多机构、地址、部门等详细信息管理
 */
export const Affiliation = createPaperStructureNode({
  name: "affiliation",
  group: "block",
  content: "block*",
  isolating: true,
  defining: true,

  attributes: {
    affiliations: {
      default: [],
      rendered: false,
    },
    displayFormat: {
      default: "numbered", // numbered, lettered, symbols
      rendered: false,
    },
    showAddresses: {
      default: true,
      rendered: false,
    },
    showDepartments: {
      default: true,
      rendered: false,
    },
    showCountries: {
      default: true,
      rendered: false,
    },
    language: {
      default: "en",
      rendered: false,
    },
    required: {
      default: false,
      rendered: false,
    },
  },

  parseHTML: [
    {
      tag: 'div[data-type="affiliation"]',
      getAttrs: (dom) => {
        try {
          const affiliationsData = dom.getAttribute("data-affiliations");
          return {
            affiliations: affiliationsData ? JSON.parse(affiliationsData) : [],
            displayFormat: dom.getAttribute("data-display-format") || "numbered",
            showAddresses: dom.getAttribute("data-show-addresses") !== "false",
            showDepartments: dom.getAttribute("data-show-departments") !== "false",
            showCountries: dom.getAttribute("data-show-countries") !== "false",
            language: dom.getAttribute("data-language") || "en",
          };
        } catch (e) {
          return { affiliations: [] };
        }
      },
    },
  ],

  renderHTML: ({ node, HTMLAttributes }) => {
    const { affiliations, displayFormat, showAddresses, showDepartments, showCountries, language } = node.attrs;

    const getMarker = (index) => {
      switch (displayFormat) {
        case "lettered":
          return String.fromCharCode(97 + index); // a, b, c...
        case "symbols":
          const symbols = ["*", "†", "‡", "§", "¶", "#"];
          return symbols[index % symbols.length];
        default:
          return (index + 1).toString(); // 1, 2, 3...
      }
    };

    const affiliationElements = affiliations.map((affiliation, index) => {
      const parts = [];

      // 机构标识
      parts.push(["sup", { class: "affiliation-marker" }, getMarker(index)]);

      // 机构名称
      parts.push(["span", { class: "affiliation-name" }, affiliation.name || "未命名机构"]);

      // 部门信息
      if (showDepartments && affiliation.department) {
        parts.push(["span", { class: "affiliation-department" }, `, ${affiliation.department}`]);
      }

      // 地址信息
      if (showAddresses && affiliation.address) {
        parts.push(["span", { class: "affiliation-address" }, `, ${affiliation.address}`]);
      }

      // 国家信息
      if (showCountries && affiliation.country) {
        parts.push(["span", { class: "affiliation-country" }, `, ${affiliation.country}`]);
      }

      return [
        "div",
        {
          class: "affiliation-item",
          "data-affiliation-index": index,
          "data-affiliation-id": affiliation.id,
        },
        ...parts,
      ];
    });

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "affiliation",
        "data-id": node.attrs.id,
        "data-affiliations": JSON.stringify(affiliations),
        "data-display-format": displayFormat,
        "data-show-addresses": showAddresses,
        "data-show-departments": showDepartments,
        "data-show-countries": showCountries,
        "data-language": language,
        class: `paper-affiliation-container format-${displayFormat} language-${language}`,
      }),
      ["div", { class: "affiliation-header" }, ["h3", { class: "affiliation-title" }, "机构信息 / Affiliations"]],
      ["div", { class: "affiliation-list" }, ...affiliationElements],
    ];
  },

  addCommands: () => ({
    setAffiliation:
      (attributes = {}) =>
      ({ commands }) => {
        const defaultAffiliation = {
          id: PaperStructureUtils.generateId("affiliation"),
          name: "",
          department: "",
          address: "",
          city: "",
          country: "",
          postalCode: "",
          email: "",
          website: "",
        };

        return commands.insertContent({
          type: "affiliation",
          attrs: {
            affiliations: attributes.affiliations || [defaultAffiliation],
            displayFormat: attributes.displayFormat || "numbered",
            showAddresses: attributes.showAddresses !== false,
            showDepartments: attributes.showDepartments !== false,
            showCountries: attributes.showCountries !== false,
            language: attributes.language || "en",
            updated: new Date().toISOString(),
          },
        });
      },

    addAffiliation:
      (affiliationData = {}) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("affiliation");
        const newAffiliation = {
          id: PaperStructureUtils.generateId("affiliation"),
          name: affiliationData.name || "",
          department: affiliationData.department || "",
          address: affiliationData.address || "",
          city: affiliationData.city || "",
          country: affiliationData.country || "",
          postalCode: affiliationData.postalCode || "",
          email: affiliationData.email || "",
          website: affiliationData.website || "",
        };

        const updatedAffiliations = [...(currentAttrs.affiliations || []), newAffiliation];

        return commands.updateAttributes("affiliation", {
          affiliations: updatedAffiliations,
          updated: new Date().toISOString(),
        });
      },

    removeAffiliation:
      (affiliationId) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("affiliation");
        const updatedAffiliations = (currentAttrs.affiliations || []).filter((affiliation) => affiliation.id !== affiliationId);

        return commands.updateAttributes("affiliation", {
          affiliations: updatedAffiliations,
          updated: new Date().toISOString(),
        });
      },

    updateAffiliation:
      (affiliationId, affiliationData) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("affiliation");
        const updatedAffiliations = (currentAttrs.affiliations || []).map((affiliation) => (affiliation.id === affiliationId ? { ...affiliation, ...affiliationData } : affiliation));

        return commands.updateAttributes("affiliation", {
          affiliations: updatedAffiliations,
          updated: new Date().toISOString(),
        });
      },

    setAffiliationDisplayFormat:
      (format) =>
      ({ commands }) => {
        return commands.updateAttributes("affiliation", {
          displayFormat: format,
          updated: new Date().toISOString(),
        });
      },
  }),

  addKeyboardShortcuts: () => ({
    "Mod-Shift-f": () => {
      // 插入机构信息
      return this.editor.commands.setAffiliation();
    },
  }),

  // 添加NodeView组件
  NodeViewComponent: AffiliationNodeView,
});

export default {
  Abstract,
  Keywords,
  Affiliation,
};
