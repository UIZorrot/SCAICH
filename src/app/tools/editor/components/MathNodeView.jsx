// 第三方数学扩展的自定义 NodeView
import React, { useRef, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import BlockNodeActions from "./BlockNodeActions";
import katex from "katex";
import "katex/dist/katex.min.css";

const MathNodeView = ({ node, updateAttributes, deleteNode, editor, getPos }) => {
  debugger;
  const mathRef = useRef(null);

  useEffect(() => {
    if (mathRef.current) {
      // 第三方扩展可能使用不同的属性名
      const latex = node.attrs.latex || node.attrs.content || node.textContent || "";
      const isDisplayMode = latex.includes("$$") || node.attrs.displayMode || false;

      if (latex) {
        try {
          katex.render(latex.replace(/\$\$/g, ""), mathRef.current, {
            displayMode: isDisplayMode,
            throwOnError: false,
          });
        } catch (error) {
          mathRef.current.innerHTML = `<span style="color: red;">LaTeX Error: ${error.message}</span>`;
        }
      } else {
        mathRef.current.innerHTML = `<span style="color: #999; font-style: italic;">数学公式</span>`;
      }
    }
  }, [node.attrs, node.textContent]);

  const handleDelete = () => {
    deleteNode();
  };

  const handleMoveUp = () => {
    const pos = getPos();
    if (pos > 0) {
      const tr = editor.state.tr;
      const nodeSize = node.nodeSize;

      const $pos = tr.doc.resolve(pos);
      const prevNode = $pos.nodeBefore;

      if (prevNode) {
        tr.delete(pos, pos + nodeSize);
        tr.insert(pos - prevNode.nodeSize, node);
        editor.view.dispatch(tr);
      }
    }
  };

  const handleMoveDown = () => {
    const pos = getPos();
    const tr = editor.state.tr;
    const nodeSize = node.nodeSize;

    const $pos = tr.doc.resolve(pos + nodeSize);
    const nextNode = $pos.nodeAfter;

    if (nextNode) {
      tr.delete(pos, pos + nodeSize);
      tr.insert(pos + nextNode.nodeSize, node);
      editor.view.dispatch(tr);
    }
  };

  const handleEdit = () => {
    const currentLatex = node.attrs.latex || node.attrs.content || node.textContent || "";
    const cleanLatex = currentLatex.replace(/\$\$/g, "");
    const latex = window.prompt("编辑 LaTeX 公式:", cleanLatex);
    if (latex !== null) {
      updateAttributes({ latex, content: latex });
    }
  };

  // 检测是否为块级公式（包含 $$ 或者是显示模式）
  const latex = node.attrs.latex || node.attrs.content || node.textContent || "";
  const isBlock = latex.includes("$$") || node.attrs.displayMode || false;
  const wrapperClass = isBlock ? "math-block-wrapper" : "math-inline-wrapper";

  return (
    <NodeViewWrapper className={`block-node-wrapper ${wrapperClass}`}>
      <div className="math-container">
        <BlockNodeActions onDelete={handleDelete} onMoveUp={handleMoveUp} onMoveDown={handleMoveDown} onEdit={handleEdit} editTooltip="编辑公式" />
        <div className={isBlock ? "math-block" : "math-inline"} ref={mathRef} style={isBlock ? { textAlign: "center", display: "block" } : { display: "inline-block" }}>
          {/* 内容由 KaTeX 渲染 */}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default MathNodeView;
