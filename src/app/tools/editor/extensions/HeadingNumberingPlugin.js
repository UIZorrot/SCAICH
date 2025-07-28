import { Plugin, PluginKey } from '@tiptap/pm/state';
import NumberingManager from '../utils/NumberingManager.js';

/**
 * TipTap插件：自动为标题添加JavaScript编号
 * 
 * 这个插件会：
 * 1. 监听文档变化
 * 2. 自动计算并更新所有标题的编号
 * 3. 将编号直接插入到标题文本中
 */

export const HeadingNumberingPluginKey = new PluginKey('headingNumbering');

export function createHeadingNumberingPlugin() {
  return new Plugin({
    key: HeadingNumberingPluginKey,
    
    state: {
      init() {
        return {
          numberingManager: new NumberingManager(),
          lastDocSize: 0
        };
      },
      
      apply(tr, pluginState, oldState, newState) {
        // 检查文档是否发生变化
        const docChanged = tr.docChanged;
        const docSizeChanged = newState.doc.nodeSize !== pluginState.lastDocSize;
        
        if (docChanged || docSizeChanged) {
          // 重新计算编号
          const numberingManager = new NumberingManager();
          updateHeadingNumbers(newState.doc, numberingManager);
          
          return {
            numberingManager,
            lastDocSize: newState.doc.nodeSize
          };
        }
        
        return pluginState;
      }
    },
    
    view(editorView) {
      // 初始化时更新编号
      const pluginState = HeadingNumberingPluginKey.getState(editorView.state);
      if (pluginState) {
        updateHeadingNumbers(editorView.state.doc, pluginState.numberingManager);
      }
      
      return {
        update: (view, prevState) => {
          const pluginState = HeadingNumberingPluginKey.getState(view.state);
          if (pluginState && view.state.doc !== prevState.doc) {
            // 文档变化时更新编号
            updateHeadingNumbers(view.state.doc, pluginState.numberingManager);
          }
        }
      };
    }
  });
}

/**
 * 更新文档中所有标题的编号
 * @param {Node} doc - TipTap文档节点
 * @param {NumberingManager} numberingManager - 编号管理器
 */
function updateHeadingNumbers(doc, numberingManager) {
  numberingManager.reset();
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'numberedHeading') {
      const level = node.attrs.level;
      const currentText = node.textContent;
      
      // 移除现有的编号前缀
      const cleanText = currentText.replace(/^\d+(\.\d+)*\.?\s+/, '').trim();
      
      // 生成新的编号
      numberingManager.increment(level);
      const number = numberingManager.getNumber(level);
      const numberedText = number ? `${number}. ${cleanText}` : cleanText;
      
      // 更新节点的data-number属性（用于大纲显示）
      if (node.attrs['data-number'] !== number) {
        // 这里我们不直接修改DOM，而是让CSS或其他机制处理显示
        // 编号信息存储在NumberingManager中，可以通过其他方式获取
      }
    }
  });
}

/**
 * 获取文档中所有标题的编号信息
 * @param {Node} doc - TipTap文档节点
 * @returns {Array} 标题编号信息数组
 */
export function extractHeadingNumbers(doc) {
  const headings = [];
  const numberingManager = new NumberingManager();
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'numberedHeading') {
      const level = node.attrs.level;
      const currentText = node.textContent;
      
      // 移除现有的编号前缀
      const cleanText = currentText.replace(/^\d+(\.\d+)*\.?\s+/, '').trim();
      
      // 生成编号
      numberingManager.increment(level);
      const number = numberingManager.getNumber(level);
      
      headings.push({
        level,
        number,
        text: cleanText,
        numberedText: number ? `${number}. ${cleanText}` : cleanText,
        pos
      });
    }
  });
  
  return headings;
}

/**
 * 为编辑器添加编号更新命令
 * @param {Editor} editor - TipTap编辑器实例
 */
export function addNumberingCommands(editor) {
  editor.commands.updateHeadingNumbers = () => {
    const pluginState = HeadingNumberingPluginKey.getState(editor.state);
    if (pluginState) {
      updateHeadingNumbers(editor.state.doc, pluginState.numberingManager);
      return true;
    }
    return false;
  };
  
  editor.commands.getHeadingNumbers = () => {
    return extractHeadingNumbers(editor.state.doc);
  };
}
