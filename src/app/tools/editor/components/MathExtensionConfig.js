// 第三方数学扩展配置文件
import MathExtension from "@aarkue/tiptap-math-extension";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MathNodeView from "./MathNodeView";

// 配置第三方数学扩展
export const configureMathExtension = () => {
  return MathExtension.configure({
    evaluation: false, // 禁用计算功能，专注于公式渲染
    delimiters: "dollar", // 使用 $ 和 $$ 分隔符
    katexOptions: {
      throwOnError: false,
      displayMode: false, // 行内公式不使用 display 模式
    },
    // 自定义文本输出模式
    renderTextMode: "raw-latex",
  }).extend({
    // 为 inlineMath 节点添加自定义 NodeView
    addNodeView() {
      return ReactNodeViewRenderer(MathNodeView);
    },
  });
};

// 简单配置版本（不带悬浮操作栏）
export const configureSimpleMathExtension = () => {
  return MathExtension.configure({
    evaluation: false,
    delimiters: "dollar",
    katexOptions: {
      throwOnError: false,
    },
    renderTextMode: "raw-latex",
  });
};
