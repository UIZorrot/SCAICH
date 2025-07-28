# 修复 TipTap 公式节点问题

## 问题描述
1. TipTap 编辑器出现警告："Currently 'setNode()' only supports text block nodes"，来自 AcademicNodes.js:197
2. 公式无法正确显示

## 问题分析
- EquationBlock 节点使用了不兼容的 `commands.setNode()` 方法
- 公式渲染逻辑没有正确处理 LaTeX 公式与 KaTeX 的集成
- 节点定义为空内容节点（`content: ""`），不适合使用 setNode()

## 解决方案：修复现有 EquationBlock 节点实现

### 执行计划
1. **修复 setNode() 警告**
   - 文件：`src/app/tools/editor/extensions/AcademicNodes.js`
   - 将 `commands.setNode()` 替换为 `commands.insertContent()`

2. **添加 KaTeX 渲染支持**
   - 创建自定义 NodeView 类处理数学公式渲染
   - 使用 KaTeX 库渲染 LaTeX 公式到 DOM

3. **更新节点定义**
   - 添加 `addNodeView()` 方法
   - 优化 `renderHTML()` 方法

4. **更新编辑器调用**
   - 确保 `addEquation` 函数使用正确的命令

5. **测试验证**
   - 测试公式插入、显示和编辑功能

## 预期结果
- 消除 TipTap 警告信息
- 公式能够正确显示为渲染后的数学表达式
- 保持现有的编号和样式功能
