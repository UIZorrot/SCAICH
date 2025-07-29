# AI 功能使用指南

## 问题修复

### ✅ 已修复的问题
- **AIServiceClass is not a constructor** 错误已修复
- 将动态导入的构造函数调用改为直接使用单例实例

## AI 功能概览

### 1. 文本优化 (handleAIOptimize)

**功能描述：** 改善文本的表达和逻辑结构

**需要的参数：**
```javascript
{
  content: string,           // 必需：要优化的文本内容
  improvementType: "general", // 优化类型：general, grammar, clarity, style, conciseness, expansion
  targetAudience: "academic"  // 目标受众：academic, general
}
```

**是否需要上下文：** 
- **不强制需要**，但有上下文会更好
- 当前实现只传入选中的文本
- 建议增强：可以传入段落或章节上下文

### 2. 文本润色 (handleAIPolish)

**功能描述：** 提升学术写作风格和语言质量

**需要的参数：**
```javascript
{
  content: string,           // 必需：要润色的文本内容
  improvementType: "style",  // 润色类型：style, clarity, academic
  targetAudience: "academic" // 目标受众：academic
}
```

**是否需要上下文：**
- **建议提供上下文**，特别是学术写作
- 上下文有助于保持术语一致性和写作风格

## 功能增强建议

### 当前实现的局限性

1. **只使用选中文本**：
   - 缺少段落或章节上下文
   - 可能导致术语不一致
   - 无法理解文本在整体结构中的作用

2. **缺少文档信息**：
   - 没有论文主题信息
   - 没有研究领域背景
   - 没有目标期刊或会议要求

### 建议的增强方案

#### 方案 1：增加上下文参数
```javascript
// 增强的 AI 优化参数
{
  content: string,              // 选中的文本
  context: {
    beforeText: string,         // 前文内容（可选）
    afterText: string,          // 后文内容（可选）
    sectionTitle: string,       // 当前章节标题
    documentTitle: string,      // 文档标题
    researchField: string,      // 研究领域
    keywords: string[],         // 关键词
  },
  improvementType: string,
  targetAudience: string,
  additionalRequirements: {     // 额外要求
    citationStyle: "APA",       // 引用格式
    wordLimit: number,          // 字数限制
    formalityLevel: "high",     // 正式程度
  }
}
```

#### 方案 2：智能上下文提取
```javascript
// 在 TipTapEditor 中自动提取上下文
const getContextForAI = (editor, selectedText) => {
  const { from, to } = editor.state.selection;
  
  // 获取前后文本
  const beforeText = editor.state.doc.textBetween(Math.max(0, from - 500), from);
  const afterText = editor.state.doc.textBetween(to, Math.min(editor.state.doc.content.size, to + 500));
  
  // 获取当前章节信息
  const currentSection = getCurrentSection(editor, from);
  
  return {
    selectedText,
    beforeText,
    afterText,
    sectionTitle: currentSection?.title,
    sectionType: currentSection?.type, // 引言、方法、结果等
  };
};
```

## 实现建议

### 1. 立即可实现的改进

**修改 TipTapEditor.jsx 中的 AI 调用：**
```javascript
const handleAIOptimize = useCallback(() => {
  if (selectedText && onAIOptimize) {
    // 获取更多上下文信息
    const context = {
      selectedText,
      documentTitle: currentDocument?.title || "",
      sectionTitle: getCurrentSectionTitle(editor),
      beforeText: getBeforeText(editor, 200), // 前200字符
      afterText: getAfterText(editor, 200),   // 后200字符
    };
    
    onAIOptimize(context);
  }
}, [selectedText, onAIOptimize, editor, currentDocument]);
```

### 2. 中期改进

**添加文档级别的 AI 配置：**
```javascript
// 在文档设置中添加 AI 配置
const documentAIConfig = {
  researchField: "计算机科学",
  keywords: ["机器学习", "深度学习"],
  citationStyle: "APA",
  targetJournal: "Nature",
  formalityLevel: "high",
};
```

### 3. 长期改进

**集成文献搜索和引用：**
- 在优化过程中自动搜索相关文献
- 建议添加引用和参考文献
- 检查术语一致性和学术规范

## 使用建议

### 最佳实践

1. **选择合适的文本长度**：
   - 建议选择 50-500 字的文本段落
   - 避免选择过短的片段（如单个词语）
   - 避免选择过长的文本（如整个章节）

2. **提供清晰的上下文**：
   - 确保选中文本在逻辑上完整
   - 包含必要的背景信息
   - 明确文本在文档中的作用

3. **迭代优化**：
   - 可以对同一段文本多次优化
   - 比较不同的优化结果
   - 根据需要调整优化类型

现在 AI 功能应该能正常工作了！
