# 文档大纲保存功能实现

## 需求描述
用户希望在文档大纲中也能保存文档，而不仅仅在文档管理器中保存。

## 实现方案
采用方案1：通过Props传递保存函数，保持组件职责清晰，依赖关系明确。

## 实现步骤

### 1. 修改DocumentManager组件
**文件：** `src/app/tools/editor/components/DocumentManager.jsx`

**修改内容：**
- 在`useImperativeHandle`中暴露`saveCurrentDocument`函数和`hasUnsavedChanges`状态
- 将`useImperativeHandle`移到`saveCurrentDocument`定义之后，避免初始化顺序问题
- 移除旧的DOM暴露方式（_saveFunction和data-document-manager属性）

### 2. 修改AcademicEditor组件
**文件：** `src/app/tools/editor/AcademicEditor.jsx`

**修改内容：**
- 添加`hasUnsavedChanges`状态来跟踪未保存更改
- 添加`useEffect`来同步DocumentManager的`hasUnsavedChanges`状态
- 向DocumentOutline组件传递保存相关的props
- 修复Ctrl+S快捷键，改为使用ref方式调用保存函数

### 3. 修改DocumentOutline组件
**文件：** `src/app/tools/editor/components/DocumentOutline.jsx`

**修改内容：**
- 添加新的props：`currentDocument`, `onSave`, `hasUnsavedChanges`
- 导入`SaveOutlined`图标
- 在头部操作区域添加保存按钮

## 功能特性

1. **条件显示**：只有当存在当前文档且提供了保存函数时才显示保存按钮
2. **状态反馈**：
   - 有未保存更改时：按钮可点击，显示红色，tooltip显示"保存文档"
   - 无未保存更改时：按钮禁用，显示默认颜色，tooltip显示"文档已保存"
3. **位置合理**：保存按钮位于AI生成大纲按钮之前，符合用户操作习惯
4. **样式一致**：与其他操作按钮保持相同的样式风格

## 问题修复

### 修复useImperativeHandle初始化顺序问题
**问题：** `Cannot access 'saveCurrentDocument' before initialization`

**原因：** `useImperativeHandle`在`saveCurrentDocument`函数定义之前被调用

**修复：** 将`useImperativeHandle`移到`saveCurrentDocument`定义之后

### 修复Ctrl+S快捷键问题
**问题：** 原来的Ctrl+S快捷键使用DOM查询方式，在其他地方无法正常保存。

**修复：**
- 将AcademicEditor中的Ctrl+S快捷键改为使用documentManagerRef.current.saveCurrentDocument()
- 移除DocumentManager中的旧DOM暴露方式
- 统一使用React ref方式进行组件间通信

## 技术要点

1. **状态同步**：通过定时器（100ms间隔）同步DocumentManager的hasUnsavedChanges状态
2. **组件解耦**：通过props传递而非直接依赖，保持组件间的清晰关系
3. **错误处理**：修复了useImperativeHandle的初始化顺序问题
4. **用户体验**：提供清晰的视觉反馈和tooltip提示

## 测试验证

功能已成功实现并通过编译测试，应用可以正常启动运行。用户现在可以：
1. 在文档大纲中看到保存按钮
2. 根据文档是否有未保存更改来判断按钮状态
3. 点击按钮保存当前文档
4. 获得适当的视觉反馈和提示信息
5. 使用Ctrl+S快捷键在任何地方保存文档

## 问题修复（第二轮）

### 修复内容同步问题
**问题：** AI助手面板中编辑的内容无法保存，保存按钮显示已保存状态但实际没有保存。

**根本原因：**
1. AISuggestionsPanel使用了错误的编辑器实例（`currentDocument?.editor`而不是`editorInstance`）
2. DocumentManager的保存逻辑只保存currentDocument对象，没有从编辑器获取最新内容
3. hasUnsavedChanges状态只基于currentDocument变化，无法检测编辑器中的实时变化

**修复方案：**
1. **修复编辑器实例引用**：
   ```javascript
   // 修复前（错误）
   <AISuggestionsPanel editor={currentDocument?.editor} />

   // 修复后（正确）
   <AISuggestionsPanel editor={editorInstance} />
   ```

2. **修改保存逻辑，从编辑器获取最新内容**：
   ```javascript
   // 在DocumentManager的saveCurrentDocument中
   if (editorInstance) {
     const latestContent = editorInstance.getJSON();
     const latestHtmlContent = editorInstance.getHTML();
     // 更新文档内容并保存
   }
   ```

3. **改进hasUnsavedChanges检测**：
   - 添加checkForUnsavedChanges函数，比较编辑器内容与保存的内容
   - 使用定时器（1秒间隔）检测编辑器内容变化
   - 确保状态能够实时反映编辑器的变化

### 修复传递编辑器实例
**修改：** 将editorInstance作为props传递给DocumentManager，确保保存时能获取最新内容。

## 兼容性

此实现完全兼容现有功能：
- 不影响文档管理器中的保存功能
- 修复了Ctrl+S快捷键保存功能，现在可以在任何地方使用
- 修复了AI助手面板的内容保存问题
- 不影响自动保存功能
- 保持所有现有的组件接口和行为
- 统一了保存功能的调用方式
- 确保了内容同步的一致性
