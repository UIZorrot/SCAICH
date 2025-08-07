import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

// 扩展节点在 PaperStructureNodesExtended.js 中定义

// 导入NodeView组件
import { PaperTitleNodeView, AuthorInfoNodeView } from "../components/PaperStructureNodeViews";

/**
 * 论文结构节点基础架构
 * 提供所有论文结构节点的通用功能和接口
 */

// 通用工具函数
export const PaperStructureUtils = {
  /**
   * 生成唯一ID
   */
  generateId: (prefix = "paper") => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * 验证必填字段
   */
  validateRequired: (value, fieldName) => {
    if (!value || value.trim() === "") {
      throw new Error(`${fieldName} is required`);
    }
    return true;
  },

  /**
   * 清理HTML标签
   */
  stripHtml: (html) => {
    return html.replace(/<[^>]*>/g, "").trim();
  },

  /**
   * 格式化作者姓名
   */
  formatAuthorName: (firstName, lastName) => {
    return `${firstName} ${lastName}`.trim();
  },

  /**
   * 验证邮箱格式
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * 验证ORCID格式
   */
  validateORCID: (orcid) => {
    const orcidRegex = /^(\d{4}-){3}\d{3}[\dX]$/;
    return orcidRegex.test(orcid);
  },

  /**
   * 统计字数（支持中英文）
   */
  countWords: (text) => {
    if (!text) return 0;
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    // 中文字符计数
    const chineseChars = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length;
    // 英文单词计数
    const englishWords = cleanText
      .replace(/[\u4e00-\u9fff]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    return chineseChars + englishWords;
  },

  /**
   * 格式化关键词
   */
  formatKeywords: (keywords) => {
    if (Array.isArray(keywords)) {
      return keywords.map((k) => k.trim()).filter((k) => k.length > 0);
    }
    if (typeof keywords === "string") {
      return keywords
        .split(/[,;，；]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }
    return [];
  },
};

// 论文结构节点基类
export const createPaperStructureNode = (config) => {
  const { name, group = "block", content = "block+", isolating = true, defining = true, attributes = {}, parseHTML = [], renderHTML, addCommands, addKeyboardShortcuts, NodeViewComponent } = config;

  return Node.create({
    name,
    group,
    content,
    isolating,
    defining,

    addOptions() {
      return {
        HTMLAttributes: {},
        ...config.options,
      };
    },

    addAttributes() {
      return {
        id: {
          default: () => PaperStructureUtils.generateId(name),
          rendered: false,
        },
        created: {
          default: () => new Date().toISOString(),
          rendered: false,
        },
        updated: {
          default: () => new Date().toISOString(),
          rendered: false,
        },
        ...attributes,
      };
    },

    parseHTML() {
      return [
        {
          tag: `div[data-type="${name}"]`,
          getAttrs: (dom) => {
            const attrs = { id: dom.getAttribute("data-id") };
            // 解析自定义属性
            Object.keys(attributes).forEach((key) => {
              const value = dom.getAttribute(`data-${key}`);
              if (value !== null) {
                attrs[key] = value;
              }
            });
            return attrs;
          },
        },
        ...parseHTML,
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      if (renderHTML) {
        return renderHTML({ node, HTMLAttributes });
      }

      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": name,
          "data-id": node.attrs.id,
          class: `paper-structure-node ${name}-node`,
        }),
        0,
      ];
    },

    addCommands() {
      const baseCommands = {
        [`set${name.charAt(0).toUpperCase() + name.slice(1)}`]:
          (attributes = {}) =>
          ({ commands }) => {
            return commands.insertContent({
              type: name,
              attrs: {
                ...attributes,
                updated: new Date().toISOString(),
              },
            });
          },
        [`update${name.charAt(0).toUpperCase() + name.slice(1)}`]:
          (attributes = {}) =>
          ({ commands }) => {
            return commands.updateAttributes(name, {
              ...attributes,
              updated: new Date().toISOString(),
            });
          },
      };

      return addCommands ? { ...baseCommands, ...addCommands() } : baseCommands;
    },

    addKeyboardShortcuts() {
      return addKeyboardShortcuts ? addKeyboardShortcuts() : {};
    },

    addNodeView() {
      return NodeViewComponent ? ReactNodeViewRenderer(NodeViewComponent) : null;
    },
  });
};

// 论文结构节点样式类名
export const PaperStructureStyles = {
  container: "paper-structure-container",
  header: "paper-structure-header",
  content: "paper-structure-content",
  footer: "paper-structure-footer",
  required: "paper-structure-required",
  optional: "paper-structure-optional",
  error: "paper-structure-error",
  success: "paper-structure-success",
  editing: "paper-structure-editing",
  preview: "paper-structure-preview",
};

// 论文结构节点配置常量
export const PaperStructureConfig = {
  // 字数限制
  WORD_LIMITS: {
    title: { min: 5, max: 200 },
    abstract: { min: 100, max: 500 },
    keywords: { min: 3, max: 10 },
  },

  // 支持的语言
  LANGUAGES: [
    { code: "en", name: "English" },
    { code: "zh", name: "中文" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
  ],

  // 学术期刊格式
  CITATION_STYLES: [
    { code: "apa", name: "APA" },
    { code: "mla", name: "MLA" },
    { code: "chicago", name: "Chicago" },
    { code: "ieee", name: "IEEE" },
    { code: "nature", name: "Nature" },
  ],

  // 作者角色
  AUTHOR_ROLES: [
    { code: "first", name: "第一作者" },
    { code: "corresponding", name: "通讯作者" },
    { code: "co-first", name: "共同第一作者" },
    { code: "co-corresponding", name: "共同通讯作者" },
    { code: "equal", name: "同等贡献" },
  ],
};

// ==================== 具体节点实现 ====================

/**
 * PaperTitle - 论文标题节点
 * 支持主标题、副标题、多语言、自动格式化
 */
export const PaperTitle = createPaperStructureNode({
  name: "paperTitle",
  group: "block",
  content: "inline*",
  isolating: true,
  defining: true,

  attributes: {
    mainTitle: {
      default: "",
      rendered: false,
    },
    subtitle: {
      default: "",
      rendered: false,
    },
    language: {
      default: "en",
      rendered: false,
    },
    titleCase: {
      default: "title", // title, sentence, upper, lower
      rendered: false,
    },
    alignment: {
      default: "center", // left, center, right
      rendered: false,
    },
    required: {
      default: true,
      rendered: false,
    },
  },

  parseHTML: [
    {
      tag: 'h1[data-paper-title="true"]',
      getAttrs: (dom) => ({
        mainTitle: dom.textContent || "",
        subtitle: dom.getAttribute("data-subtitle") || "",
        language: dom.getAttribute("data-language") || "en",
        titleCase: dom.getAttribute("data-title-case") || "title",
        alignment: dom.getAttribute("data-alignment") || "center",
      }),
    },
  ],

  renderHTML: ({ node, HTMLAttributes }) => {
    const { mainTitle, subtitle, language, titleCase, alignment } = node.attrs;

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "paperTitle",
        "data-id": node.attrs.id,
        "data-language": language,
        "data-alignment": alignment,
        class: `paper-title-container alignment-${alignment}`,
      }),
      [
        "h1",
        {
          "data-paper-title": "true",
          "data-subtitle": subtitle,
          "data-language": language,
          "data-title-case": titleCase,
          "data-alignment": alignment,
          class: `paper-main-title case-${titleCase}`,
          contenteditable: "true",
          "data-placeholder": "请输入论文标题...",
        },
        mainTitle || "请输入论文标题...",
      ],
      subtitle
        ? [
            "h2",
            {
              class: "paper-subtitle",
              contenteditable: "true",
              "data-placeholder": "副标题（可选）",
            },
            subtitle,
          ]
        : null,
    ].filter(Boolean);
  },

  addCommands: () => ({
    setPaperTitle:
      (attributes = {}) =>
      ({ commands }) => {
        return commands.insertContent({
          type: "paperTitle",
          attrs: {
            mainTitle: attributes.mainTitle || "请输入论文标题...",
            subtitle: attributes.subtitle || "",
            language: attributes.language || "en",
            titleCase: attributes.titleCase || "title",
            alignment: attributes.alignment || "center",
            updated: new Date().toISOString(),
          },
        });
      },

    updatePaperTitle:
      (attributes = {}) =>
      ({ commands }) => {
        return commands.updateAttributes("paperTitle", {
          ...attributes,
          updated: new Date().toISOString(),
        });
      },

    toggleTitleCase:
      () =>
      ({ commands, editor }) => {
        const { titleCase } = editor.getAttributes("paperTitle");
        const cases = ["title", "sentence", "upper", "lower"];
        const currentIndex = cases.indexOf(titleCase);
        const nextCase = cases[(currentIndex + 1) % cases.length];

        return commands.updateAttributes("paperTitle", {
          titleCase: nextCase,
          updated: new Date().toISOString(),
        });
      },

    setTitleAlignment:
      (alignment) =>
      ({ commands }) => {
        return commands.updateAttributes("paperTitle", {
          alignment,
          updated: new Date().toISOString(),
        });
      },
  }),

  addKeyboardShortcuts: () => ({
    "Mod-Shift-t": () => {
      // 插入论文标题
      return this.editor.commands.setPaperTitle();
    },
    "Mod-Alt-t": () => {
      // 切换标题格式
      return this.editor.commands.toggleTitleCase();
    },
  }),

  // 添加NodeView组件
  NodeViewComponent: PaperTitleNodeView,
});

/**
 * AuthorInfo - 作者信息节点
 * 支持多作者、邮箱、ORCID、机构关联等信息管理
 */
export const AuthorInfo = createPaperStructureNode({
  name: "authorInfo",
  group: "block",
  content: "block*",
  isolating: true,
  defining: true,

  attributes: {
    authors: {
      default: [],
      rendered: false,
    },
    displayFormat: {
      default: "standard", // standard, compact, detailed
      rendered: false,
    },
    showAffiliations: {
      default: true,
      rendered: false,
    },
    showEmails: {
      default: false,
      rendered: false,
    },
    showORCID: {
      default: true,
      rendered: false,
    },
    required: {
      default: true,
      rendered: false,
    },
  },

  parseHTML: [
    {
      tag: 'div[data-type="authorInfo"]',
      getAttrs: (dom) => {
        try {
          const authorsData = dom.getAttribute("data-authors");
          return {
            authors: authorsData ? JSON.parse(authorsData) : [],
            displayFormat: dom.getAttribute("data-display-format") || "standard",
            showAffiliations: dom.getAttribute("data-show-affiliations") === "true",
            showEmails: dom.getAttribute("data-show-emails") === "true",
            showORCID: dom.getAttribute("data-show-orcid") === "true",
          };
        } catch (e) {
          return { authors: [] };
        }
      },
    },
  ],

  renderHTML: ({ node, HTMLAttributes }) => {
    const { authors, displayFormat, showAffiliations, showEmails, showORCID } = node.attrs;

    const authorElements = authors.map((author, index) => {
      const authorElement = ["div", { class: "paper-author-item", "data-author-index": index }, ["span", { class: "author-name" }, `${author.firstName} ${author.lastName}`]];

      // 添加角色标识
      if (author.roles && author.roles.length > 0) {
        authorElement.push([
          "sup",
          { class: "author-roles" },
          author.roles
            .map((role) => {
              const roleConfig = PaperStructureConfig.AUTHOR_ROLES.find((r) => r.code === role);
              return roleConfig ? roleConfig.name.charAt(0) : role.charAt(0);
            })
            .join(","),
        ]);
      }

      // 添加机构信息
      if (showAffiliations && author.affiliations && author.affiliations.length > 0) {
        authorElement.push(["sup", { class: "author-affiliations" }, author.affiliations.join(",")]);
      }

      // 添加邮箱
      if (showEmails && author.email) {
        authorElement.push(["span", { class: "author-email" }, ` (${author.email})`]);
      }

      // 添加ORCID
      if (showORCID && author.orcid) {
        authorElement.push([
          "a",
          {
            class: "author-orcid",
            href: `https://orcid.org/${author.orcid}`,
            target: "_blank",
            title: "ORCID",
          },
          "🔗",
        ]);
      }

      return authorElement;
    });

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "authorInfo",
        "data-id": node.attrs.id,
        "data-authors": JSON.stringify(authors),
        "data-display-format": displayFormat,
        "data-show-affiliations": showAffiliations,
        "data-show-emails": showEmails,
        "data-show-orcid": showORCID,
        class: `paper-author-container format-${displayFormat}`,
      }),
      ["div", { class: "paper-authors-list" }, ...authorElements],
    ];
  },

  addCommands: () => ({
    setAuthorInfo:
      (attributes = {}) =>
      ({ commands }) => {
        const defaultAuthor = {
          id: PaperStructureUtils.generateId("author"),
          firstName: "",
          lastName: "",
          email: "",
          orcid: "",
          affiliations: [],
          roles: [],
          isCorresponding: false,
        };

        return commands.insertContent({
          type: "authorInfo",
          attrs: {
            authors: attributes.authors || [defaultAuthor],
            displayFormat: attributes.displayFormat || "standard",
            showAffiliations: attributes.showAffiliations !== false,
            showEmails: attributes.showEmails || false,
            showORCID: attributes.showORCID !== false,
            updated: new Date().toISOString(),
          },
        });
      },

    addAuthor:
      (authorData = {}) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("authorInfo");
        const newAuthor = {
          id: PaperStructureUtils.generateId("author"),
          firstName: authorData.firstName || "",
          lastName: authorData.lastName || "",
          email: authorData.email || "",
          orcid: authorData.orcid || "",
          affiliations: authorData.affiliations || [],
          roles: authorData.roles || [],
          isCorresponding: authorData.isCorresponding || false,
        };

        const updatedAuthors = [...(currentAttrs.authors || []), newAuthor];

        return commands.updateAttributes("authorInfo", {
          authors: updatedAuthors,
          updated: new Date().toISOString(),
        });
      },

    removeAuthor:
      (authorId) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("authorInfo");
        const updatedAuthors = (currentAttrs.authors || []).filter((author) => author.id !== authorId);

        return commands.updateAttributes("authorInfo", {
          authors: updatedAuthors,
          updated: new Date().toISOString(),
        });
      },

    updateAuthor:
      (authorId, authorData) =>
      ({ commands, editor }) => {
        const currentAttrs = editor.getAttributes("authorInfo");
        const updatedAuthors = (currentAttrs.authors || []).map((author) => (author.id === authorId ? { ...author, ...authorData } : author));

        return commands.updateAttributes("authorInfo", {
          authors: updatedAuthors,
          updated: new Date().toISOString(),
        });
      },

    setAuthorDisplayFormat:
      (format) =>
      ({ commands }) => {
        return commands.updateAttributes("authorInfo", {
          displayFormat: format,
          updated: new Date().toISOString(),
        });
      },
  }),

  addKeyboardShortcuts: () => ({
    "Mod-Shift-a": () => {
      // 插入作者信息
      return this.editor.commands.setAuthorInfo();
    },
  }),

  // 添加NodeView组件
  NodeViewComponent: AuthorInfoNodeView,
});

// 导出所有节点供外部使用

export default {
  PaperStructureUtils,
  createPaperStructureNode,
  PaperStructureStyles,
  PaperStructureConfig,
  // 具体节点
  PaperTitle,
  AuthorInfo,
};
