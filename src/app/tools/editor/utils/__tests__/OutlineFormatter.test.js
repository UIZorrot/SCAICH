/**
 * OutlineFormatter 测试文件
 * 验证大纲格式化功能的正确性
 */

import OutlineFormatter from '../OutlineFormatter.js';

describe('OutlineFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new OutlineFormatter();
  });

  test('应该正确格式化标准大纲数据', () => {
    const outlineData = {
      titleSuggestions: ['机器学习在医疗诊断中的应用'],
      mainBody: [
        {
          sectionTitle: '引言',
          subsections: [
            {
              subsectionTitle: '研究背景',
              keyPoints: ['传统诊断方法的局限性', 'AI技术的发展机遇']
            }
          ]
        }
      ]
    };

    const result = formatter.formatOutline(outlineData);
    
    expect(result).toContain('标题建议');
    expect(result).toContain('机器学习在医疗诊断中的应用');
    expect(result).toContain('<h1');
    expect(result).toContain('1. 引言');
    expect(result).toContain('<h2');
    expect(result).toContain('1.1. 研究背景');
    expect(result).toContain('<li>传统诊断方法的局限性</li>');
  });

  test('应该正确处理TipTap格式数据', () => {
    const tipTapData = {
      type: 'doc',
      content: [
        {
          type: 'numberedHeading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '引言' }]
        },
        {
          type: 'numberedHeading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '研究背景' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '这是一个段落内容' }]
        }
      ]
    };

    const result = formatter.formatOutline(tipTapData);
    
    expect(result).toContain('<h1');
    expect(result).toContain('1. 引言');
    expect(result).toContain('<h2');
    expect(result).toContain('1.1. 研究背景');
    expect(result).toContain('<li>这是一个段落内容</li>');
  });

  test('应该正确处理JSON字符串输入', () => {
    const outlineData = JSON.stringify({
      mainBody: [
        {
          sectionTitle: '测试章节',
          subsections: []
        }
      ]
    });

    const result = formatter.formatOutline(outlineData);
    expect(result).toContain('1. 测试章节');
  });

  test('应该正确处理markdown包装的JSON', () => {
    const markdownWrappedJson = '```json\n{"mainBody":[{"sectionTitle":"测试","subsections":[]}]}\n```';
    
    const result = formatter.formatOutline(markdownWrappedJson);
    expect(result).toContain('1. 测试');
  });

  test('应该正确格式化摘要结构', () => {
    const outlineData = {
      abstractStructure: {
        background: '研究背景描述',
        objective: '研究目标描述',
        methodology: '研究方法描述'
      }
    };

    const result = formatter.formatOutline(outlineData);
    
    expect(result).toContain('摘要结构');
    expect(result).toContain('背景 (Background)');
    expect(result).toContain('研究背景描述');
    expect(result).toContain('目的 (Objective)');
    expect(result).toContain('研究目标描述');
  });

  test('应该正确处理错误情况', () => {
    const invalidJson = '{ invalid json }';
    
    const result = formatter.formatOutline(invalidJson);
    expect(result).toContain('大纲格式化时出现问题');
    expect(result).toContain('JSON解析失败');
  });

  test('应该正确提取TipTap节点文本', () => {
    const node = {
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'World' }
      ]
    };

    const text = formatter.extractTextFromNode(node);
    expect(text).toBe('Hello World');
  });

  test('应该处理空内容', () => {
    const emptyData = {};
    const result = formatter.formatOutline(emptyData);
    expect(result).toBe('');
  });

  test('应该正确格式化研究方法', () => {
    const outlineData = {
      suggestedMethodology: {
        approach: '定量研究',
        methods: [
          {
            methodName: '实验设计',
            description: '随机对照试验'
          }
        ]
      }
    };

    const result = formatter.formatOutline(outlineData);
    expect(result).toContain('研究方法 (定量研究)');
    expect(result).toContain('实验设计');
    expect(result).toContain('随机对照试验');
  });
});
