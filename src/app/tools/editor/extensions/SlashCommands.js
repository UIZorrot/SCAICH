import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "prosemirror-state";

const pluginKey = new PluginKey("slashCommands");

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey, // 使用 PluginKey 实例
      }),
    ];
  },
});

// 命令列表配置
export const slashCommandItems = [
  {
    title: "标题 1",
    description: "大标题",
    searchTerms: ["h1", "heading", "标题"],
    icon: "📝",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "标题 2",
    description: "中等标题",
    searchTerms: ["h2", "heading", "标题"],
    icon: "📄",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "标题 3",
    description: "小标题",
    searchTerms: ["h3", "heading", "标题"],
    icon: "📃",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "无序列表",
    description: "创建一个简单的无序列表",
    searchTerms: ["ul", "list", "列表", "bullet"],
    icon: "•",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "有序列表",
    description: "创建一个带编号的列表",
    searchTerms: ["ol", "list", "列表", "numbered"],
    icon: "1.",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "引用",
    description: "创建一个引用块",
    searchTerms: ["quote", "blockquote", "引用"],
    icon: "💬",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "代码块",
    description: "创建一个代码块",
    searchTerms: ["code", "codeblock", "代码"],
    icon: "💻",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "表格",
    description: "插入一个表格",
    searchTerms: ["table", "表格"],
    icon: "📊",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "定理",
    description: "插入定理块",
    searchTerms: ["theorem", "定理", "lemma"],
    icon: "📐",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTheoremBlock({ type: "theorem", title: "" }).run();
    },
  },
  {
    title: "分割线",
    description: "插入水平分割线",
    searchTerms: ["hr", "divider", "分割线", "line"],
    icon: "➖",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "引用文献",
    description: "搜索并插入学术文献引用",
    searchTerms: ["citation", "reference", "引用", "文献", "参考"],
    icon: "📚",
    command: ({ editor, range }) => {
      // 删除斜杠命令文本并插入引用触发符
      editor.chain().focus().deleteRange(range).insertContent("[").run();
    },
  },
];
