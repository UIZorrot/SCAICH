import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Mathematics from "@tiptap/extension-mathematics";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Button, Tooltip, Divider, Dropdown } from "antd";
import { BoldOutlined, ItalicOutlined, StrikethroughOutlined, LinkOutlined, PictureOutlined, TableOutlined, FunctionOutlined, ExperimentOutlined, QuestionCircleOutlined, BulbOutlined, HighlightOutlined, FontSizeOutlined, DownOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import "katex/dist/katex.min.css";
import "./TipTapEditor.css";

// Import custom academic nodes
import { NumberedHeading, FigureWithCaption, EquationBlock, TheoremBlock, EnhancedBlockquote } from "../extensions/AcademicNodes";
import { SlashCommands, slashCommandItems } from "../extensions/SlashCommands";
import { renderSlashCommands } from "../extensions/SlashCommandsRenderer";
import { createHeadingNumberingPlugin, addNumberingCommands } from "../extensions/HeadingNumberingPlugin";

// Import EditorToolbar
import EditorToolbar from "./EditorToolbar";

const TipTapEditor = ({ initialContent, onChange, onSelectionUpdate, onTextSelection, onAIOptimize, onAIPolish, onEditorReady, placeholder = "开始写作您的学术论文...", editable = true }) => {
  const [selectedText, setSelectedText] = useState("");

  // 稳定化回调函数，避免重渲染
  const handleUpdate = useCallback(
    ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      onChange?.(json, html);
    },
    [onChange]
  );

  const handleSelectionUpdate = useCallback(
    ({ editor }) => {
      onSelectionUpdate?.(editor);

      // Get selected text for AI suggestions
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      setSelectedText(text);
      onTextSelection?.(text);
    },
    [onSelectionUpdate, onTextSelection]
  );

  // 稳定化扩展配置
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        // Enable standard heading for our use case
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Underline,
      CharacterCount,
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
          displayMode: true,
        },
        blockOptions: {
          onClick: (node, pos) => {
            const latex = window.prompt("编辑 LaTeX 公式:", node.attrs.latex);
            if (latex) {
              editor.chain().setNodeSelection(pos).updateBlockMath({ latex }).focus().run();
            }
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      // Custom academic nodes
      FigureWithCaption,
      EquationBlock,
      TheoremBlock,
      EnhancedBlockquote,
      // Slash commands
      SlashCommands.configure({
        suggestion: {
          items: ({ query }) => {
            return slashCommandItems.filter((item) => {
              if (!query) return true;
              const searchQuery = query.toLowerCase();
              return item.title.toLowerCase().includes(searchQuery) || item.description.toLowerCase().includes(searchQuery) || item.searchTerms.some((term) => term.toLowerCase().includes(searchQuery));
            });
          },
          render: renderSlashCommands,
        },
      }),
    ],
    [placeholder]
  );

  // 核心：useEditor只在组件首次挂载时创建一次
  const editor = useEditor({
    extensions,
    content: initialContent, // 只用于初始化，不会变化
    editable,
    onUpdate: handleUpdate,
    onSelectionUpdate: handleSelectionUpdate,
    onCreate: ({ editor }) => {
      // Debug: Log available commands and extensions
      console.log("TipTap Editor created with commands:", Object.keys(editor.commands));
      console.log(
        "Available extensions:",
        editor.extensionManager.extensions.map((ext) => ext.name)
      );

      // Make editor available globally for debugging
      window.editor = editor;

      onEditorReady?.(editor);
    },
  });

  // 移除了有问题的setContent useEffect - 这是光标跳转的根源！

  // 更新可编辑状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  const addImage = useCallback(() => {
    const url = window.prompt("请输入图片URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("请输入链接URL:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addEquation = useCallback(() => {
    const latex = window.prompt("请输入LaTeX公式:", "E = mc^2");
    if (latex) {
      editor.chain().focus().setEquationBlock({ latex }).run();
    }
  }, [editor]);

  const addTheorem = useCallback(() => {
    const type = window.prompt("定理类型 (theorem/lemma/corollary/definition):", "theorem");
    const title = window.prompt("定理标题 (可选):");
    if (type) {
      editor
        .chain()
        .focus()
        .setTheoremBlock({ type, title: title || "" })
        .run();
    }
  }, [editor]);

  // Heading functions
  const setHeading = useCallback(
    (level) => {
      if (level === 0) {
        // Convert to paragraph
        editor.chain().focus().setParagraph().run();
      } else {
        // Set numbered heading
        editor.chain().focus().toggleNumberedHeading({ level }).run();
      }
    },
    [editor]
  );

  // Get current heading level
  const getCurrentHeadingLevel = useCallback(() => {
    if (!editor) return 0;

    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("numberedHeading", { level })) {
        return level;
      }
    }
    return 0; // Not a heading (paragraph)
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleAIOptimize = useCallback(() => {
    if (selectedText && onAIOptimize) {
      onAIOptimize(selectedText);
    }
  }, [selectedText, onAIOptimize]);

  const handleAIPolish = useCallback(() => {
    if (selectedText && onAIPolish) {
      onAIPolish(selectedText);
    }
  }, [selectedText, onAIPolish]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-container">
      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Bubble Menu for text formatting */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bubble-menu">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bubble-menu-content">
          <Tooltip title="加粗">
            <Button size="small" type={editor.isActive("bold") ? "primary" : "text"} icon={<BoldOutlined />} onClick={() => editor.chain().focus().toggleBold().run()} />
          </Tooltip>

          <Tooltip title="斜体">
            <Button size="small" type={editor.isActive("italic") ? "primary" : "text"} icon={<ItalicOutlined />} onClick={() => editor.chain().focus().toggleItalic().run()} />
          </Tooltip>

          <Tooltip title="删除线">
            <Button size="small" type={editor.isActive("strike") ? "primary" : "text"} icon={<StrikethroughOutlined />} onClick={() => editor.chain().focus().toggleStrike().run()} />
          </Tooltip>

          <Divider type="vertical" />

          {/* Heading Dropdown */}
          <Dropdown
            menu={{
              items: [
                {
                  key: "0",
                  label: "正文",
                  onClick: () => setHeading(0),
                },
                {
                  key: "1",
                  label: "一级标题",
                  onClick: () => setHeading(1),
                },
                {
                  key: "2",
                  label: "二级标题",
                  onClick: () => setHeading(2),
                },
                {
                  key: "3",
                  label: "三级标题",
                  onClick: () => setHeading(3),
                },
                {
                  key: "4",
                  label: "四级标题",
                  onClick: () => setHeading(4),
                },
                {
                  key: "5",
                  label: "五级标题",
                  onClick: () => setHeading(5),
                },
                {
                  key: "6",
                  label: "六级标题",
                  onClick: () => setHeading(6),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Tooltip title="设置标题级别">
              <Button size="small" type={getCurrentHeadingLevel() > 0 ? "primary" : "text"} icon={<FontSizeOutlined />}>
                {getCurrentHeadingLevel() > 0 ? `H${getCurrentHeadingLevel()}` : "H"}
                <DownOutlined style={{ fontSize: "10px", marginLeft: "2px" }} />
              </Button>
            </Tooltip>
          </Dropdown>

          <Divider type="vertical" />

          <Tooltip title="添加链接">
            <Button size="small" type={editor.isActive("link") ? "primary" : "text"} icon={<LinkOutlined />} onClick={addLink} />
          </Tooltip>

          <Tooltip title="插入图片">
            <Button size="small" icon={<PictureOutlined />} onClick={addImage} />
          </Tooltip>

          <Tooltip title="插入表格">
            <Button size="small" icon={<TableOutlined />} onClick={addTable} />
          </Tooltip>

          <Divider type="vertical" />

          <Tooltip title="插入公式">
            <Button size="small" icon={<FunctionOutlined />} onClick={addEquation} />
          </Tooltip>

          <Tooltip title="插入定理">
            <Button size="small" icon={<ExperimentOutlined />} onClick={addTheorem} />
          </Tooltip>

          <Tooltip title="增强引用">
            <Button
              size="small"
              type={editor.isActive("enhancedBlockquote") ? "primary" : "text"}
              icon={<QuestionCircleOutlined />}
              onClick={() => {
                try {
                  editor.chain().focus().toggleWrap("enhancedBlockquote").run();
                } catch (error) {
                  console.warn("Enhanced blockquote command not available:", error);
                }
              }}
            />
          </Tooltip>

          {/* AI Optimization Buttons - Only show when text is selected */}
          {selectedText && selectedText.trim().length > 0 && (
            <>
              <Divider type="vertical" />

              <Tooltip title="AI优化文本 - 改善表达和逻辑">
                <Button size="small" icon={<BulbOutlined />} onClick={handleAIOptimize} type="primary" ghost style={{ color: "#1890ff", borderColor: "#1890ff" }} />
              </Tooltip>

              <Tooltip title="AI润色文本 - 提升学术写作风格">
                <Button size="small" icon={<HighlightOutlined />} onClick={handleAIPolish} type="primary" ghost style={{ color: "#52c41a", borderColor: "#52c41a" }} />
              </Tooltip>
            </>
          )}
        </motion.div>
      </BubbleMenu>

      {/* Main Editor */}
      <div className="editor-wrapper">
        <EditorContent editor={editor} className="editor-content" />
      </div>

      {/* Editor Status Bar */}
      <div className="editor-status-bar">
        <div className="editor-stats">
          <span>字符数: {editor?.storage?.characterCount?.characters?.() || 0}</span>
          <span>单词数: {editor?.storage?.characterCount?.words?.() || 0}</span>
        </div>
        <div className="editor-mode">
          <Button size="small" type={editable ? "primary" : "default"}>
            {editable ? "编辑模式" : "预览模式"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// 使用React.memo避免不必要的重渲染
export default React.memo(TipTapEditor);
