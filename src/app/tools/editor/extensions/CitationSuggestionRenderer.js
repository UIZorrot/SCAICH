import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import CitationSearchList from "../components/CitationSearchList";

/**
 * Citation Suggestion Renderer
 * 处理引用建议的渲染和交互逻辑
 */
export const renderCitationSuggestions = () => {
  let component;
  let popup;

  return {
    onStart: (props) => {
      // 创建 React 组件实例
      component = new ReactRenderer(CitationSearchList, {
        props: {
          ...props,
          loading: false,
        },
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      // 使用 tippy.js 创建弹出层
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        theme: "citation-suggestion",
        maxWidth: 500,
        offset: [0, 8],
        hideOnClick: false,
        animation: "fade",
        duration: [200, 150],
      });
    },

    onUpdate(props) {
      if (!component || !popup) return;

      // 检查是否正在加载（items 为空但 query 不为空且不在缓存中）
      const trimmedQuery = props.query?.trim();
      const hasValidQuery = trimmedQuery && trimmedQuery.length >= 2;
      const hasItems = props.items && props.items.length > 0;

      // 只有在有有效查询但没有结果时才显示加载状态
      const isLoading = hasValidQuery && !hasItems;

      // 更新组件属性
      component.updateProps({
        ...props,
        loading: isLoading,
      });

      if (!props.clientRect) {
        return;
      }

      // 更新弹出层位置
      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props) {
      if (!component) return false;

      // ESC 键关闭建议
      if (props.event.key === "Escape") {
        popup?.[0]?.hide();
        return true;
      }

      // 将键盘事件传递给组件
      return component.ref?.onKeyDown?.(props) || false;
    },

    onExit() {
      // 清理资源
      if (popup?.[0]) {
        popup[0].destroy();
      }
      if (component) {
        component.destroy();
      }

      popup = null;
      component = null;
    },
  };
};

// 配置 tippy.js 主题
const style = document.createElement("style");
style.textContent = `
  .tippy-box[data-theme~="citation-suggestion"] {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  .tippy-box[data-theme~="citation-suggestion"] .tippy-content {
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .tippy-box[data-theme~="citation-suggestion"] .tippy-arrow {
    display: none;
  }
`;

// 确保样式只添加一次
if (!document.querySelector("style[data-citation-suggestion-theme]")) {
  style.setAttribute("data-citation-suggestion-theme", "true");
  document.head.appendChild(style);
}

export default renderCitationSuggestions;
