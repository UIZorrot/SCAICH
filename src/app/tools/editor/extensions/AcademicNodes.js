import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

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

  isolating: true,

  defining: true,

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
        getAttrs: (dom) => ({
          type: dom.getAttribute("data-theorem-type") || "theorem",
          title: dom.getAttribute("data-title") || "",
          number: dom.getAttribute("data-number") || "",
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "theorem-block",
        "data-theorem-type": node.attrs.type,
        "data-title": node.attrs.title,
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
        ({ commands, state }) => {
          const { type = "theorem", title = "", number = "" } = attributes;

          // Create the theorem block node
          const theoremNode = state.schema.nodes.theoremBlock.create({ type, title, number }, state.schema.nodes.paragraph.create({}, state.schema.text("在此输入定理内容...")));

          // Insert the node
          return commands.insertContent(theoremNode.toJSON());
        },

      // Add delete command for better deletion support
      deleteTheoremBlock:
        () =>
        ({ commands }) => {
          return commands.deleteNode("theoremBlock");
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-t": () => this.editor.commands.setTheoremBlock(),
      // Add delete shortcut when inside theorem block
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        // Check if we're at the start of a theorem block
        if ($from.parent.type.name === "theoremBlock" && $from.parentOffset === 0) {
          return editor.commands.deleteTheoremBlock();
        }

        return false;
      },
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
        getAttrs: (dom) => ({
          author: dom.getAttribute("data-author") || "",
          citation: dom.getAttribute("data-citation") || "",
        }),
      },
      // Also support standard blockquote for compatibility
      {
        tag: "blockquote",
        getAttrs: (dom) => {
          // Only match if it doesn't have data-type="enhanced" already
          if (dom.getAttribute("data-type") === "enhanced") return false;
          return {
            author: dom.getAttribute("data-author") || "",
            citation: dom.getAttribute("data-citation") || "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const elements = [
      "blockquote",
      mergeAttributes(HTMLAttributes, {
        "data-type": "enhanced",
        "data-author": node.attrs.author,
        "data-citation": node.attrs.citation,
      }),
      0,
    ];

    // Add citation element if author or citation exists
    if (node.attrs.author || node.attrs.citation) {
      const citeText = [node.attrs.author ? `— ${node.attrs.author}` : "", node.attrs.citation ? ` (${node.attrs.citation})` : ""].filter(Boolean).join("");

      elements.push(["cite", {}, citeText]);
    }

    return elements;
  },

  addCommands() {
    return {
      setEnhancedBlockquote:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleEnhancedBlockquote:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      // 提供标准的blockquote命令以兼容工具栏
      toggleBlockquote:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      // Add command to set citation info
      setBlockquoteCitation:
        (attributes = {}) =>
        ({ commands }) => {
          const { author = "", citation = "" } = attributes;
          return commands.updateAttributes(this.name, { author, citation });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-b": () => this.editor.chain().focus().toggleWrap(this.name).run(),
    };
  },
});
