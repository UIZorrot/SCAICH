import { Node, mergeAttributes } from "@tiptap/core";

// NumberedHeading - 使用JavaScript编号系统
export const NumberedHeading = Node.create({
  name: "numberedHeading",

  group: "block",

  content: "inline*",

  defining: true,

  addOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
      number: {
        default: "",
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [1, 2, 3, 4, 5, 6].map((level) => ({
      tag: `h${level}`,
      attrs: { level },
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];
    const number = node.attrs.number || "";

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-level": level,
        "data-number": number,
        class: "numbered-heading",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setNumberedHeading:
        (attributes) =>
        ({ commands }) => {
          // NumberedHeading has content: "inline*", so it should work with setNode
          // But let's use toggleNode for better compatibility
          return commands.toggleNode(this.name, "paragraph", attributes);
        },
      toggleNumberedHeading:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph", attributes);
        },
    };
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce(
      (items, level) => ({
        ...items,
        [`Mod-Alt-${level}`]: () => this.editor.commands.toggleNumberedHeading({ level }),
      }),
      {}
    );
  },
});

// Figure with Caption Node
export const FigureWithCaption = Node.create({
  name: "figureWithCaption",

  group: "block",

  content: "block+",

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      caption: {
        default: "",
      },
      number: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="figure-with-caption"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-type": "figure-with-caption",
        "data-number": node.attrs.number,
      }),
      [
        "img",
        {
          src: node.attrs.src,
          alt: node.attrs.alt,
          title: node.attrs.title,
        },
      ],
      ["figcaption", {}, `Figure ${node.attrs.number}: ${node.attrs.caption}`],
    ];
  },

  addCommands() {
    return {
      setFigureWithCaption:
        (attributes = {}) =>
        ({ commands }) => {
          const { src = "", alt = "", title = "", caption = "", number = "" } = attributes;

          // Use insertContent with HTML string for better compatibility
          const figureHTML = `
            <figure data-type="figure-with-caption" data-number="${number}">
              <img src="${src}" alt="${alt}" title="${title}" />
              <figcaption>Figure ${number}: ${caption}</figcaption>
            </figure>
          `;

          return commands.insertContent(figureHTML);
        },
    };
  },
});

// Custom Equation Block Node - Using TipTap Mathematics extension instead
// This provides a wrapper command for compatibility with existing code
export const EquationBlock = Node.create({
  name: "equationBlockWrapper",

  addCommands() {
    return {
      setEquationBlock:
        (attributes = {}) =>
        ({ commands }) => {
          const { latex = "" } = attributes;
          // Use insertBlockMath from Mathematics extension
          return commands.insertBlockMath({ latex });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-e": () => {
        const latex = window.prompt("请输入LaTeX公式:", "E = mc^2");
        if (latex) {
          return this.editor.commands.setEquationBlock({ latex });
        }
        return false;
      },
    };
  },
});

// Theorem Block Node
export const TheoremBlock = Node.create({
  name: "theoremBlock",

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      type: {
        default: "theorem",
      },
      title: {
        default: "",
      },
      number: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="theorem-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "theorem-block",
        "data-theorem-type": node.attrs.type,
        "data-number": node.attrs.number,
      }),
      ["div", { class: "theorem-header" }, `${node.attrs.type.charAt(0).toUpperCase() + node.attrs.type.slice(1)} ${node.attrs.number}${node.attrs.title ? `: ${node.attrs.title}` : ""}`],
      ["div", { class: "theorem-content" }, 0],
    ];
  },

  addCommands() {
    return {
      setTheoremBlock:
        (attributes = {}) =>
        ({ commands }) => {
          const { type = "theorem", title = "", number = "" } = attributes;

          // Use insertContent with HTML string for better compatibility
          const theoremHTML = `
            <div data-type="theorem-block" data-theorem-type="${type}" data-number="${number}">
              <div class="theorem-header">${type.charAt(0).toUpperCase() + type.slice(1)} ${number}${title ? `: ${title}` : ""}</div>
              <div class="theorem-content">
                <p>在此输入定理内容...</p>
              </div>
            </div>
          `;

          return commands.insertContent(theoremHTML);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-t": () => this.editor.commands.setTheoremBlock(),
    };
  },
});

// Enhanced Blockquote
export const EnhancedBlockquote = Node.create({
  name: "enhancedBlockquote",

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      citation: {
        default: "",
      },
      author: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote[data-type="enhanced"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "blockquote",
      mergeAttributes(HTMLAttributes, {
        "data-type": "enhanced",
      }),
      0,
      node.attrs.author || node.attrs.citation ? ["cite", {}, node.attrs.author ? `— ${node.attrs.author}` : "", node.attrs.citation ? ` (${node.attrs.citation})` : ""] : null,
    ].filter(Boolean);
  },

  addCommands() {
    return {
      setEnhancedBlockquote:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleEnhancedBlockquote:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      // 提供标准的blockquote命令以兼容工具栏
      toggleBlockquote:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-b": () => this.editor.chain().focus().toggleWrap(this.name).run(),
    };
  },
});
