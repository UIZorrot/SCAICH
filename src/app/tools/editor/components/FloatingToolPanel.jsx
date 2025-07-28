import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  List, 
  Typography, 
  Space, 
  Switch, 
  Select, 
  Tooltip, 
  message, 
  Spin,
  Badge,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  FileTextOutlined, 
  DatabaseOutlined, 
  CloseOutlined,
  PlusOutlined,
  LinkOutlined,
  DownloadOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import searchService from '../services/SearchService';
import './FloatingToolPanel.css';

const { Text, Title } = Typography;
const { Option } = Select;

const FloatingToolPanel = ({ editor, onInsertCitation }) => {
  // 面板状态
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 搜索状态
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('literature'); // 'literature' | 'deepsearch'
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState('');
  
  // 搜索选项
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [searchLimit, setSearchLimit] = useState(10);
  
  // 引用
  const panelRef = useRef(null);

  // 切换面板开关
  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // 执行搜索
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setLoading(true);
    try {
      let searchResult;
      
      if (searchType === 'literature') {
        // 文献搜索
        searchResult = await searchService.searchPapers({
          query: query.trim(),
          limit: searchLimit,
          openAccessOnly
        });
      } else {
        // 深度搜索 - 使用AI优化的搜索
        searchResult = await searchService.searchForAI({
          topic: query.trim(),
          limit: searchLimit,
          includeAbstracts: true
        });
      }

      if (searchResult.success) {
        setResults(searchResult.results || []);
        setSummary(searchResult.summary || '');
        message.success(`找到 ${searchResult.results?.length || 0} 篇相关文献`);
      } else {
        message.error(`搜索失败: ${searchResult.error}`);
        setResults([]);
        setSummary('');
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('搜索过程中发生错误');
      setResults([]);
      setSummary('');
    } finally {
      setLoading(false);
    }
  }, [query, searchType, searchLimit, openAccessOnly]);

  // 处理回车搜索
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // 插入引用到编辑器
  const handleInsertCitation = useCallback((paper) => {
    if (!editor) {
      message.warning('编辑器未准备就绪');
      return;
    }

    // 格式化引用文本
    const citation = `${paper.author} (${paper.year}). ${paper.title}. ${paper.location}. DOI: ${paper.doi}`;
    
    // 插入到编辑器当前位置
    editor.chain().focus().insertContent(`\n\n**参考文献：**\n${citation}\n\n`).run();
    
    // 调用外部回调
    if (onInsertCitation) {
      onInsertCitation(paper);
    }
    
    message.success('引用已插入到编辑器');
  }, [editor, onInsertCitation]);

  // 插入摘要到编辑器
  const handleInsertSummary = useCallback(() => {
    if (!editor || !summary) {
      message.warning('没有可插入的摘要内容');
      return;
    }

    editor.chain().focus().insertContent(`\n\n**文献综述：**\n${summary}\n\n`).run();
    message.success('文献综述已插入到编辑器');
  }, [editor, summary]);

  // 清空搜索结果
  const handleClearResults = useCallback(() => {
    setResults([]);
    setSummary('');
    setQuery('');
  }, []);

  return (
    <>
      {/* 悬浮触发按钮 */}
      <motion.div
        className="floating-trigger-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Tooltip title={isOpen ? "关闭搜索面板" : "打开文献搜索"} placement="left">
          <Badge count={results.length} size="small">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={isOpen ? <CloseOutlined /> : <SearchOutlined />}
              onClick={togglePanel}
              className="trigger-button"
            />
          </Badge>
        </Tooltip>
      </motion.div>

      {/* 悬浮面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            className="floating-tool-panel"
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card
              title={
                <Space>
                  <SearchOutlined />
                  <span>文献搜索工具</span>
                </Space>
              }
              extra={
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={togglePanel}
                  size="small"
                />
              }
              className="search-panel-card"
            >
              {/* 搜索控制区域 */}
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 搜索类型切换 */}
                <div className="search-type-selector">
                  <Text strong>搜索类型：</Text>
                  <Select
                    value={searchType}
                    onChange={setSearchType}
                    style={{ width: 120, marginLeft: 8 }}
                    size="small"
                  >
                    <Option value="literature">
                      <FileTextOutlined /> 文献搜索
                    </Option>
                    <Option value="deepsearch">
                      <DatabaseOutlined /> 深度搜索
                    </Option>
                  </Select>
                </div>

                {/* 搜索输入框 */}
                <Input.Search
                  placeholder={searchType === 'literature' ? "输入关键词搜索文献..." : "输入主题进行深度搜索..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onSearch={handleSearch}
                  onPressEnter={handleKeyPress}
                  loading={loading}
                  enterButton={<SearchOutlined />}
                  size="middle"
                />

                {/* 搜索选项 */}
                <div className="search-options">
                  <Space wrap>
                    <div className="option-item">
                      <Text>仅开放获取：</Text>
                      <Switch
                        checked={openAccessOnly}
                        onChange={setOpenAccessOnly}
                        size="small"
                      />
                    </div>
                    <div className="option-item">
                      <Text>结果数量：</Text>
                      <Select
                        value={searchLimit}
                        onChange={setSearchLimit}
                        style={{ width: 80 }}
                        size="small"
                      >
                        <Option value={5}>5</Option>
                        <Option value={10}>10</Option>
                        <Option value={20}>20</Option>
                      </Select>
                    </div>
                  </Space>
                </div>

                {/* 操作按钮 */}
                {(results.length > 0 || summary) && (
                  <div className="action-buttons">
                    <Space>
                      {summary && (
                        <Button
                          type="dashed"
                          icon={<RobotOutlined />}
                          onClick={handleInsertSummary}
                          size="small"
                        >
                          插入综述
                        </Button>
                      )}
                      <Button
                        type="text"
                        onClick={handleClearResults}
                        size="small"
                      >
                        清空结果
                      </Button>
                    </Space>
                  </div>
                )}
              </Space>

              <Divider />

              {/* 搜索结果区域 */}
              <div className="search-results-container">
                {loading && (
                  <div className="loading-container">
                    <Spin size="large" />
                    <Text type="secondary" style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
                      正在搜索文献...
                    </Text>
                  </div>
                )}

                {!loading && summary && (
                  <div className="summary-section">
                    <Title level={5}>
                      <RobotOutlined style={{ color: '#1890ff' }} /> AI 综述
                    </Title>
                    <Text className="summary-text">{summary}</Text>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <div className="results-section">
                    <Title level={5}>
                      搜索结果 ({results.length})
                    </Title>
                    <List
                      dataSource={results}
                      renderItem={(item, index) => (
                        <List.Item className="result-item">
                          <div className="result-content">
                            <Title level={5} className="result-title">
                              {item.title}
                            </Title>
                            <Text type="secondary" className="result-meta">
                              {item.author} • {item.year} • {item.location}
                            </Text>
                            <Text className="result-abstract">
                              {item.abstract?.substring(0, 150)}...
                            </Text>
                            <div className="result-actions">
                              <Space size="small">
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => handleInsertCitation(item)}
                                >
                                  插入引用
                                </Button>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<LinkOutlined />}
                                  onClick={() => window.open(item.url || `https://doi.org/${item.doi}`, '_blank')}
                                >
                                  查看原文
                                </Button>
                              </Space>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {!loading && results.length === 0 && query && (
                  <div className="no-results">
                    <Text type="secondary">未找到相关文献，请尝试其他关键词</Text>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingToolPanel;
