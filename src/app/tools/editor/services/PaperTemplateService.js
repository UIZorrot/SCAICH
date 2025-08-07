/**
 * 论文模板服务
 * 提供标准论文模板和快速创建功能
 */

import { PaperStructureUtils } from '../extensions/PaperStructureNodes';

export class PaperTemplateService {
  /**
   * 获取标准学术论文模板
   */
  static getStandardPaperTemplate() {
    return {
      type: "doc",
      content: [
        // 论文标题
        {
          type: "paperTitle",
          attrs: {
            id: PaperStructureUtils.generateId('paperTitle'),
            mainTitle: "请输入论文标题",
            subtitle: "",
            language: "en",
            titleCase: "title",
            alignment: "center",
            required: true,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        // 作者信息
        {
          type: "authorInfo",
          attrs: {
            id: PaperStructureUtils.generateId('authorInfo'),
            authors: [
              {
                id: PaperStructureUtils.generateId('author'),
                firstName: "",
                lastName: "",
                email: "",
                orcid: "",
                affiliations: [1],
                roles: ["first"],
                isCorresponding: true
              }
            ],
            displayFormat: "standard",
            showAffiliations: true,
            showEmails: false,
            showORCID: true,
            required: true,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        // 机构信息
        {
          type: "affiliation",
          attrs: {
            id: PaperStructureUtils.generateId('affiliation'),
            affiliations: [
              {
                id: PaperStructureUtils.generateId('affiliation'),
                name: "",
                department: "",
                address: "",
                city: "",
                country: "",
                postalCode: "",
                email: "",
                website: ""
              }
            ],
            displayFormat: "numbered",
            showAddresses: true,
            showDepartments: true,
            showCountries: true,
            language: "en",
            required: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        // 摘要
        {
          type: "abstract",
          attrs: {
            id: PaperStructureUtils.generateId('abstract'),
            content: "",
            language: "en",
            wordCount: 0,
            maxWords: 500,
            minWords: 100,
            showWordCount: true,
            structured: false,
            sections: [],
            required: true,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        // 关键词
        {
          type: "keywords",
          attrs: {
            id: PaperStructureUtils.generateId('keywords'),
            keywords: [],
            language: "en",
            maxKeywords: 10,
            minKeywords: 3,
            showCount: true,
            categories: [],
            suggestions: [],
            required: true,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        // 1. 引言
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "1. 引言" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "在此处介绍研究背景、问题陈述和研究目标..." }]
        },
        // 2. 相关工作
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "2. 相关工作" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "回顾和分析相关的研究工作..." }]
        },
        // 3. 方法
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "3. 方法" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "详细描述研究方法和实验设计..." }]
        },
        // 4. 实验结果
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "4. 实验结果" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "展示和分析实验结果..." }]
        },
        // 5. 讨论
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "5. 讨论" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "讨论结果的意义和局限性..." }]
        },
        // 6. 结论
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "6. 结论" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "总结研究贡献和未来工作方向..." }]
        },
        // 致谢
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "致谢" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "感谢对本研究提供帮助的人员和机构..." }]
        }
      ]
    };
  }

  /**
   * 获取结构化摘要模板
   */
  static getStructuredAbstractTemplate() {
    return {
      type: "abstract",
      attrs: {
        id: PaperStructureUtils.generateId('abstract'),
        content: "",
        language: "en",
        wordCount: 0,
        maxWords: 500,
        minWords: 100,
        showWordCount: true,
        structured: true,
        sections: [
          { title: "背景", content: "", placeholder: "研究背景和问题" },
          { title: "方法", content: "", placeholder: "研究方法和数据" },
          { title: "结果", content: "", placeholder: "主要发现和结果" },
          { title: "结论", content: "", placeholder: "结论和意义" }
        ],
        required: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    };
  }

  /**
   * 获取会议论文模板
   */
  static getConferencePaperTemplate() {
    const template = this.getStandardPaperTemplate();
    
    // 调整会议论文的特殊要求
    template.content[3].attrs.maxWords = 300; // 会议论文摘要通常更短
    template.content[4].attrs.maxKeywords = 6; // 关键词数量限制
    
    return template;
  }

  /**
   * 获取期刊论文模板
   */
  static getJournalPaperTemplate() {
    const template = this.getStandardPaperTemplate();
    
    // 调整期刊论文的特殊要求
    template.content[3].attrs.maxWords = 500; // 期刊论文摘要可以更长
    template.content[3].attrs.structured = true; // 使用结构化摘要
    template.content[3].attrs.sections = [
      { title: "Background", content: "", placeholder: "研究背景和问题" },
      { title: "Methods", content: "", placeholder: "研究方法和数据" },
      { title: "Results", content: "", placeholder: "主要发现和结果" },
      { title: "Conclusions", content: "", placeholder: "结论和意义" }
    ];
    
    return template;
  }

  /**
   * 获取学位论文模板
   */
  static getThesisPaperTemplate() {
    const template = this.getStandardPaperTemplate();
    
    // 学位论文的特殊结构
    const thesisContent = [
      ...template.content.slice(0, 5), // 保留标题、作者、机构、摘要、关键词
      
      // 目录（占位符）
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "目录" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "（此处将自动生成目录）" }]
      },
      
      // 第一章 绪论
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "第一章 绪论" }]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1.1 研究背景" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "介绍研究背景..." }]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "1.2 研究意义" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "阐述研究意义..." }]
      },
      
      // 第二章 文献综述
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "第二章 文献综述" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "综述相关研究..." }]
      },
      
      // 第三章 研究方法
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "第三章 研究方法" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "详述研究方法..." }]
      },
      
      // 第四章 实验与分析
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "第四章 实验与分析" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "实验设计与结果分析..." }]
      },
      
      // 第五章 结论与展望
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "第五章 结论与展望" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "总结研究成果和未来展望..." }]
      },
      
      // 致谢
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "致谢" }]
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "感谢导师和同学的帮助..." }]
      }
    ];
    
    template.content = thesisContent;
    template.content[3].attrs.maxWords = 800; // 学位论文摘要更长
    
    return template;
  }

  /**
   * 应用模板到编辑器
   */
  static applyTemplate(editor, templateType = 'standard') {
    let template;
    
    switch (templateType) {
      case 'conference':
        template = this.getConferencePaperTemplate();
        break;
      case 'journal':
        template = this.getJournalPaperTemplate();
        break;
      case 'thesis':
        template = this.getThesisPaperTemplate();
        break;
      default:
        template = this.getStandardPaperTemplate();
    }
    
    // 清空编辑器并插入模板
    editor.commands.clearContent();
    editor.commands.insertContent(template);
    
    // 聚焦到第一个可编辑元素（论文标题）
    setTimeout(() => {
      editor.commands.focus('start');
    }, 100);
    
    return template;
  }

  /**
   * 获取可用的模板列表
   */
  static getAvailableTemplates() {
    return [
      {
        key: 'standard',
        name: '标准学术论文',
        description: '适用于一般学术论文的标准模板',
        icon: 'FileTextOutlined'
      },
      {
        key: 'conference',
        name: '会议论文',
        description: '适用于学术会议的论文模板',
        icon: 'TeamOutlined'
      },
      {
        key: 'journal',
        name: '期刊论文',
        description: '适用于学术期刊的论文模板',
        icon: 'BookOutlined'
      },
      {
        key: 'thesis',
        name: '学位论文',
        description: '适用于硕士/博士学位论文的模板',
        icon: 'TrophyOutlined'
      }
    ];
  }
}

export default PaperTemplateService;
