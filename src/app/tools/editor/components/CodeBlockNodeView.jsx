import React, { useRef } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import BlockNodeActions from "./BlockNodeActions";

const CodeBlockNodeView = ({ node, updateAttributes, deleteNode, editor, getPos }) => {
  const nodeRef = useRef(null);

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
    // For code blocks, we could add language selection or other options
    const language = window.prompt("编程语言 (可选):", node.attrs.language || "");
    if (language !== null) {
      updateAttributes({ language });
    }
  };

  return (
    <NodeViewWrapper className="block-node-wrapper code-block-wrapper">
      <div ref={nodeRef} className="code-block-container">
        <BlockNodeActions onDelete={handleDelete} onMoveUp={handleMoveUp} onMoveDown={handleMoveDown} onEdit={handleEdit} editTooltip="设置语言" />
        <pre className="code-block">
          <NodeViewContent as="code" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
};

export default CodeBlockNodeView;
