/**
 * 论文结构集成服务
 * 整合论文模板和AI大纲生成功能，避免冲突
 */

import PaperTemplateService from "./PaperTemplateService";
import { PaperStructureUtils } from "../extensions/PaperStructureNodes";

export class PaperStructureIntegration {
  /**
   * 检查编辑器是否包含论文结构节点
   */
  static hasStructureNodes(editor) {
    if (!editor) return false;

    const doc = editor.state.doc;
    let hasStructure = false;

    doc.descendants((node) => {
      if (["paperTitle", "authorInfo", "abstract", "keywords", "affiliation"].includes(node.type.name)) {
        hasStructure = true;
        return false; // 停止遍历
      }
    });

    return hasStructure;
  }

  /**
   * 检查编辑器是否有内容
   */
  static hasContent(editor) {
    if (!editor) return false;

    const doc = editor.state.doc;
    let hasContent = false;

    doc.descendants((node) => {
      if (node.type.name === "text" && node.text && node.text.trim()) {
        hasContent = true;
        return false; // 停止遍历
      }
      if (node.type.name === "paragraph" && node.content.size > 0) {
        hasContent = true;
        return false;
      }
    });

    return hasContent;
  }

  /**
   * 智能应用模板 - 考虑现有内容
   */
  static async smartApplyTemplate(editor, templateType, options = {}) {
    const { forceOverwrite = false, preserveStructure = true, onConfirm = null } = options;

    // 检查现有内容
    const hasExistingContent = this.hasContent(editor);
    const hasExistingStructure = this.hasStructureNodes(editor);

    // 如果有内容且不强制覆盖，询问用户
    if (hasExistingContent && !forceOverwrite) {
      const shouldProceed = await this.confirmOverwrite(hasExistingStructure);
      if (!shouldProceed) {
        return false;
      }
    }

    // 应用模板
    if (preserveStructure && hasExistingStructure) {
      // 保留现有结构，只添加缺失的节点
      return this.mergeTemplate(editor, templateType);
    } else {
      // 完全替换
      return PaperTemplateService.applyTemplate(editor, templateType);
    }
  }

  /**
   * 确认覆盖对话框
   */
  static confirmOverwrite(hasStructure) {
    return new Promise((resolve) => {
      // 动态导入 antd 以避免服务端渲染问题
      import("antd")
        .then(({ Modal }) => {
          Modal.confirm({
            title: "检测到现有内容",
            content: hasStructure ? "编辑器中已有论文结构节点，应用模板将会覆盖现有内容。是否继续？" : "编辑器中已有内容，应用模板将会清空现有内容。是否继续？",
            okText: "继续应用",
            cancelText: "取消",
            okType: "danger",
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        })
        .catch(() => {
          // 如果无法加载 Modal，默认返回 false
          resolve(false);
        });
    });
  }

  /**
   * 合并模板 - 只添加缺失的结构节点
   */
  static mergeTemplate(editor, templateType) {
    const template = PaperTemplateService.getStandardPaperTemplate();
    const existingNodes = this.getExistingStructureNodes(editor);

    // 找出缺失的节点
    const missingNodes = template.content.filter((node) => {
      if (!["paperTitle", "authorInfo", "abstract", "keywords", "affiliation"].includes(node.type)) {
        return false;
      }
      return !existingNodes.includes(node.type);
    });

    // 在文档开头插入缺失的节点
    if (missingNodes.length > 0) {
      editor.commands.focus("start");
      missingNodes.forEach((node) => {
        editor.commands.insertContent(node);
      });
      return true;
    }

    return false;
  }

  /**
   * 获取现有的结构节点类型
   */
  static getExistingStructureNodes(editor) {
    const existingNodes = [];
    const doc = editor.state.doc;

    doc.descendants((node) => {
      if (["paperTitle", "authorInfo", "abstract", "keywords", "affiliation"].includes(node.type.name)) {
        if (!existingNodes.includes(node.type.name)) {
          existingNodes.push(node.type.name);
        }
      }
    });

    return existingNodes;
  }

  /**
   * 智能大纲生成 - 与模板结构协同
   */
  static async smartGenerateOutline(editor, outlineParams, options = {}) {
    const { preserveStructure = true, insertAfterStructure = true } = options;

    const hasStructure = this.hasStructureNodes(editor);

    if (hasStructure && preserveStructure) {
      // 如果有结构节点，在结构节点后插入大纲
      return this.insertOutlineAfterStructure(editor, outlineParams);
    } else {
      // 正常生成大纲
      return this.generateStandardOutline(editor, outlineParams);
    }
  }

  /**
   * 在结构节点后插入大纲
   */
  static async insertOutlineAfterStructure(editor, outlineParams) {
    // 找到最后一个结构节点的位置
    const doc = editor.state.doc;
    let lastStructurePos = 0;

    doc.descendants((node, pos) => {
      if (["paperTitle", "authorInfo", "abstract", "keywords", "affiliation"].includes(node.type.name)) {
        lastStructurePos = pos + node.nodeSize;
      }
    });

    // 在该位置后插入大纲
    editor.commands.setTextSelection(lastStructurePos);

    // 这里需要调用原有的大纲生成逻辑
    // 由于原有逻辑在DocumentOutline组件中，我们提供一个接口
    return { insertPosition: lastStructurePos, params: outlineParams };
  }

  /**
   * 生成标准大纲
   */
  static async generateStandardOutline(editor, outlineParams) {
    // 调用原有的大纲生成逻辑
    return { insertPosition: 0, params: outlineParams };
  }

  /**
   * 创建混合模板 - 结合模板和大纲
   */
  static createHybridTemplate(templateType, outlineParams) {
    const baseTemplate = PaperTemplateService.getStandardPaperTemplate();

    // 在基础模板后添加大纲结构
    const hybridContent = [
      ...baseTemplate.content,
      // 添加分隔符
      {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
      },
      // 这里可以添加基于outlineParams生成的章节结构
      ...this.generateOutlineStructure(outlineParams),
    ];

    return {
      ...baseTemplate,
      content: hybridContent,
    };
  }

  /**
   * 基于参数生成大纲结构
   */
  static generateOutlineStructure(params) {
    const { paperType = "standard", targetLength = "medium" } = params;

    // 根据论文类型生成不同的章节结构
    const structures = {
      standard: [
        { level: 1, title: "1. 引言" },
        { level: 1, title: "2. 相关工作" },
        { level: 1, title: "3. 方法" },
        { level: 1, title: "4. 实验结果" },
        { level: 1, title: "5. 讨论" },
        { level: 1, title: "6. 结论" },
      ],
      conference: [
        { level: 1, title: "1. 引言" },
        { level: 1, title: "2. 方法" },
        { level: 1, title: "3. 实验" },
        { level: 1, title: "4. 结论" },
      ],
      journal: [
        { level: 1, title: "1. 引言" },
        { level: 1, title: "2. 文献综述" },
        { level: 1, title: "3. 理论框架" },
        { level: 1, title: "4. 研究方法" },
        { level: 1, title: "5. 结果与分析" },
        { level: 1, title: "6. 讨论" },
        { level: 1, title: "7. 结论与展望" },
      ],
    };

    const structure = structures[paperType] || structures.standard;

    return structure.map((section) => ({
      type: "heading",
      attrs: { level: section.level },
      content: [{ type: "text", text: section.title }],
    }));
  }

  /**
   * 获取推荐的工作流程
   */
  static getRecommendedWorkflow() {
    return {
      steps: [
        {
          id: "choose_approach",
          title: "选择创建方式",
          description: "选择使用模板还是AI生成大纲",
          options: [
            { key: "template", label: "使用论文模板", description: "快速创建标准结构" },
            { key: "ai_outline", label: "AI生成大纲", description: "基于主题智能生成" },
            { key: "hybrid", label: "混合模式", description: "模板+AI大纲" },
          ],
        },
        {
          id: "apply_structure",
          title: "应用结构",
          description: "根据选择应用相应的结构",
        },
        {
          id: "customize",
          title: "自定义调整",
          description: "根据需要调整结构和内容",
        },
      ],
    };
  }
}

export default PaperStructureIntegration;
