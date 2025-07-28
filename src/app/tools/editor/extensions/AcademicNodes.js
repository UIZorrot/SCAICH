import { Node, mergeAttributes } from "@tiptap/core";

// 简化的NumberedHeading - 使用CSS计数器避免React重渲染问题
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

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-level": level,
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
          return commands.setNode(this.name, attributes);
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
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
    };
  },
});

// Equation Block Node
export const EquationBlock = Node.create({
  name: "equationBlock",

  group: "block",

  content: "",

  marks: "",

  addAttributes() {
    return {
      latex: {
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
        tag: 'div[data-type="equation-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "equation-block",
        "data-latex": node.attrs.latex,
        "data-number": node.attrs.number,
      }),
      node.attrs.latex,
    ];
  },

  addCommands() {
    return {
      setEquationBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-e": () => this.editor.commands.setEquationBlock(),
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
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
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
