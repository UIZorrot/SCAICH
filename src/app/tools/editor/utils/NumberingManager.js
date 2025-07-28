/**
 * NumberingManager - 统一的标题编号管理工具
 * 
 * 用于替代不可靠的CSS counter系统，提供JavaScript手动编号功能
 * 确保插入内容和大纲显示的编号一致性
 */
class NumberingManager {
  constructor() {
    this.counters = [0, 0, 0, 0, 0, 0]; // H1-H6 counters
  }

  /**
   * 重置所有计数器
   */
  reset() {
    this.counters = [0, 0, 0, 0, 0, 0];
  }

  /**
   * 增加指定级别的计数器，并重置更低级别的计数器
   * @param {number} level - 标题级别 (1-6)
   */
  increment(level) {
    if (level < 1 || level > 6) {
      throw new Error(`Invalid heading level: ${level}. Must be between 1 and 6.`);
    }
    
    this.counters[level - 1]++;
    
    // 重置更低级别的计数器
    for (let i = level; i < this.counters.length; i++) {
      this.counters[i] = 0;
    }
  }

  /**
   * 获取当前编号字符串
   * @param {number} level - 标题级别 (1-6)
   * @returns {string} 编号字符串，如 "1.2.3"
   */
  getNumber(level) {
    if (level < 1 || level > 6) {
      throw new Error(`Invalid heading level: ${level}. Must be between 1 and 6.`);
    }
    
    return this.counters
      .slice(0, level)
      .filter(n => n > 0)
      .join('.');
  }

  /**
   * 获取下一个编号（不改变状态）
   * @param {number} level - 标题级别 (1-6)
   * @returns {string} 下一个编号字符串
   */
  getNextNumber(level) {
    const tempCounters = [...this.counters];
    tempCounters[level - 1]++;
    
    // 重置更低级别的计数器
    for (let i = level; i < tempCounters.length; i++) {
      tempCounters[i] = 0;
    }
    
    return tempCounters
      .slice(0, level)
      .filter(n => n > 0)
      .join('.');
  }

  /**
   * 解析现有编号并设置计数器状态
   * @param {string} numberString - 编号字符串，如 "1.2.3"
   */
  parseAndSet(numberString) {
    if (!numberString || typeof numberString !== 'string') {
      return;
    }
    
    const parts = numberString.split('.').map(n => parseInt(n) || 0);
    this.counters = [0, 0, 0, 0, 0, 0];
    
    parts.forEach((num, index) => {
      if (index < this.counters.length && num > 0) {
        this.counters[index] = num;
      }
    });
  }

  /**
   * 获取当前计数器状态的副本
   * @returns {number[]} 计数器数组的副本
   */
  getCounters() {
    return [...this.counters];
  }

  /**
   * 设置计数器状态
   * @param {number[]} counters - 新的计数器状态
   */
  setCounters(counters) {
    if (!Array.isArray(counters) || counters.length !== 6) {
      throw new Error('Counters must be an array of 6 numbers');
    }
    
    this.counters = counters.map(n => Math.max(0, parseInt(n) || 0));
  }

  /**
   * 生成带编号的标题HTML
   * @param {number} level - 标题级别 (1-6)
   * @param {string} title - 标题文本
   * @param {Object} options - 选项
   * @param {boolean} options.autoIncrement - 是否自动增加计数器 (默认: true)
   * @param {string} options.className - CSS类名 (默认: 'numbered-heading')
   * @returns {string} HTML字符串
   */
  generateHeadingHTML(level, title, options = {}) {
    const {
      autoIncrement = true,
      className = 'numbered-heading'
    } = options;
    
    if (autoIncrement) {
      this.increment(level);
    }
    
    const number = this.getNumber(level);
    const numberDisplay = number ? `${number}. ` : '';
    
    return `<h${level} class="${className}" data-level="${level}" data-number="${number}">${numberDisplay}${title}</h${level}>`;
  }

  /**
   * 从HTML中提取编号信息
   * @param {string} html - HTML字符串
   * @returns {Array} 编号信息数组
   */
  extractNumbersFromHTML(html) {
    const headingRegex = /<h([1-6])[^>]*data-number="([^"]*)"[^>]*>(.*?)<\/h[1-6]>/gi;
    const numbers = [];
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const number = match[2];
      const content = match[3].replace(/^\d+\.\s*/, ''); // Remove number prefix from content
      
      numbers.push({
        level,
        number,
        content: content.trim()
      });
    }
    
    return numbers;
  }

  /**
   * 验证编号序列是否正确
   * @param {Array} numbers - 编号信息数组
   * @returns {Object} 验证结果
   */
  validateNumberSequence(numbers) {
    const tempManager = new NumberingManager();
    const errors = [];
    
    numbers.forEach((item, index) => {
      const expectedNumber = tempManager.getNextNumber(item.level);
      tempManager.increment(item.level);
      
      if (item.number !== expectedNumber) {
        errors.push({
          index,
          level: item.level,
          expected: expectedNumber,
          actual: item.number,
          content: item.content
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default NumberingManager;
