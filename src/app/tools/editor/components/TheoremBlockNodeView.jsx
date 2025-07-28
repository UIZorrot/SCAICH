import React from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import BlockNodeActions from "./BlockNodeActions";

const TheoremBlockNodeView = ({ node, updateAttributes, deleteNode, editor, getPos }) => {
  const handleDelete = () => {
    deleteNode();
  };

  const handleMoveUp = () => {
    const pos = getPos();
    if (pos > 0) {
      const tr = editor.state.tr;
      const nodeSize = node.nodeSize;
      
      // Find the previous node
      const $pos = tr.doc.resolve(pos);
      const prevNode = $pos.nodeBefore;
      
      if (prevNode) {
        // Move current node before the previous node
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
    
    // Find the next node
    const $pos = tr.doc.resolve(pos + nodeSize);
    const nextNode = $pos.nodeAfter;
    
    if (nextNode) {
      // Move current node after the next node
      tr.delete(pos, pos + nodeSize);
      tr.insert(pos + nextNode.nodeSize, node);
      editor.view.dispatch(tr);
    }
  };

  const handleEdit = () => {
    const type = window.prompt("定理类型:", node.attrs.type || "theorem");
    const title = window.prompt("定理标题 (可选):", node.attrs.title || "");
    const number = window.prompt("定理编号 (可选):", node.attrs.number || "");
    
    if (type !== null) {
      updateAttributes({ 
        type: type || "theorem", 
        title: title || "", 
        number: number || "" 
      });
    }
  };

  const getTheoremTypeDisplay = (type) => {
    const typeMap = {
      theorem: "定理",
      lemma: "引理", 
      corollary: "推论",
      definition: "定义",
      proposition: "命题",
      proof: "证明"
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <NodeViewWrapper className="block-node-wrapper theorem-block-wrapper">
      <div 
        className="theorem-block-container"
        data-type="theorem-block"
        data-theorem-type={node.attrs.type}
        data-title={node.attrs.title}
        data-number={node.attrs.number}
      >
        <BlockNodeActions
          onDelete={handleDelete}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onEdit={handleEdit}
          editTooltip="编辑定理"
        />
        
        <div className="theorem-header">
          {getTheoremTypeDisplay(node.attrs.type)} {node.attrs.number}
          {node.attrs.title && `: ${node.attrs.title}`}
        </div>
        
        <div className="theorem-content">
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default TheoremBlockNodeView;
