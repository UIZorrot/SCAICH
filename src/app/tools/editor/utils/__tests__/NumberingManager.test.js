/**
 * NumberingManager 测试文件
 * 验证编号管理功能的正确性
 */

import NumberingManager from '../NumberingManager.js';

describe('NumberingManager', () => {
  let manager;

  beforeEach(() => {
    manager = new NumberingManager();
  });

  test('应该正确初始化计数器', () => {
    expect(manager.getCounters()).toEqual([0, 0, 0, 0, 0, 0]);
  });

  test('应该正确增加计数器', () => {
    manager.increment(1);
    expect(manager.getNumber(1)).toBe('1');
    
    manager.increment(2);
    expect(manager.getNumber(2)).toBe('1.1');
    
    manager.increment(2);
    expect(manager.getNumber(2)).toBe('1.2');
  });

  test('应该正确重置低级别计数器', () => {
    manager.increment(1);
    manager.increment(2);
    manager.increment(3);
    expect(manager.getNumber(3)).toBe('1.1.1');
    
    // 增加H2时应该重置H3
    manager.increment(2);
    expect(manager.getNumber(2)).toBe('1.2');
    
    manager.increment(3);
    expect(manager.getNumber(3)).toBe('1.2.1');
  });

  test('应该正确生成HTML标题', () => {
    const html = manager.generateHeadingHTML(1, '引言');
    expect(html).toContain('<h1');
    expect(html).toContain('1. 引言');
    expect(html).toContain('data-number="1"');
  });

  test('应该正确解析编号字符串', () => {
    manager.parseAndSet('2.3.1');
    expect(manager.getCounters()).toEqual([2, 3, 1, 0, 0, 0]);
  });

  test('应该正确验证编号序列', () => {
    const numbers = [
      { level: 1, number: '1', content: '引言' },
      { level: 2, number: '1.1', content: '背景' },
      { level: 2, number: '1.2', content: '目标' },
      { level: 1, number: '2', content: '方法' }
    ];
    
    const result = manager.validateNumberSequence(numbers);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('应该检测错误的编号序列', () => {
    const numbers = [
      { level: 1, number: '1', content: '引言' },
      { level: 2, number: '1.1', content: '背景' },
      { level: 2, number: '1.3', content: '目标' }, // 错误：应该是1.2
      { level: 1, number: '2', content: '方法' }
    ];
    
    const result = manager.validateNumberSequence(numbers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].expected).toBe('1.2');
    expect(result.errors[0].actual).toBe('1.3');
  });

  test('应该处理边界情况', () => {
    // 测试无效级别
    expect(() => manager.increment(0)).toThrow();
    expect(() => manager.increment(7)).toThrow();
    
    // 测试空编号字符串
    manager.parseAndSet('');
    expect(manager.getCounters()).toEqual([0, 0, 0, 0, 0, 0]);
    
    // 测试无效计数器数组
    expect(() => manager.setCounters([1, 2, 3])).toThrow();
  });
});
