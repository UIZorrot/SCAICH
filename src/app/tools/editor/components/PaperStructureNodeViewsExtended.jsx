import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Select, 
  Switch, 
  Tooltip, 
  Typography, 
  Row, 
  Col,
  Divider,
  message,
  Progress,
  Alert
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SettingOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { PaperStructureUtils, PaperStructureConfig } from '../extensions/PaperStructureNodes';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * AbstractNodeView - 摘要节点视图
 */
export const AbstractNodeView = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(node.attrs.content || '');
  const [localSections, setLocalSections] = useState(node.attrs.sections || []);

  const { wordCount, maxWords, minWords, structured } = node.attrs;
  
  const wordCountStatus = wordCount < minWords ? 'exception' : 
                         wordCount > maxWords ? 'exception' : 'success';
  
  const wordCountPercent = Math.min((wordCount / maxWords) * 100, 100);

  const handleContentChange = useCallback((value) => {
    setLocalContent(value);
    const newWordCount = PaperStructureUtils.countWords(value);
    updateAttributes({ 
      content: value, 
      wordCount: newWordCount,
      updated: new Date().toISOString()
    });
  }, [updateAttributes]);

  const handleSectionChange = useCallback((sectionIndex, content) => {
    const updatedSections = [...localSections];
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], content };
    setLocalSections(updatedSections);
    
    // 计算总字数
    const totalContent = updatedSections.map(s => s.content || '').join(' ');
    const newWordCount = PaperStructureUtils.countWords(totalContent);
    
    updateAttributes({ 
      sections: updatedSections,
      wordCount: newWordCount,
      updated: new Date().toISOString()
    });
  }, [localSections, updateAttributes]);

  const toggleStructured = useCallback(() => {
    const newStructured = !structured;
    const defaultSections = [
      { title: "背景", content: "", placeholder: "研究背景和问题" },
      { title: "方法", content: "", placeholder: "研究方法和数据" },
      { title: "结果", content: "", placeholder: "主要发现和结果" },
      { title: "结论", content: "", placeholder: "结论和意义" }
    ];

    updateAttributes({
      structured: newStructured,
      sections: newStructured ? defaultSections : [],
      updated: new Date().toISOString()
    });
  }, [structured, updateAttributes]);

  return (
    <NodeViewWrapper className="abstract-node-view">
      <Card 
        className="paper-structure-card"
        size="small"
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>摘要</Title>
            <Tag color="red">必填</Tag>
            <Text type="secondary">({wordCount} 字)</Text>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="结构化摘要">
              <Switch
                size="small"
                checked={structured}
                onChange={toggleStructured}
                checkedChildren="结构化"
                unCheckedChildren="自由格式"
              />
            </Tooltip>
            <Tooltip title="语言">
              <Select
                size="small"
                value={node.attrs.language}
                onChange={(value) => updateAttributes({ language: value })}
                style={{ width: 80 }}
              >
                {PaperStructureConfig.LANGUAGES.map(lang => (
                  <Option key={lang.code} value={lang.code}>
                    {lang.name}
                  </Option>
                ))}
              </Select>
            </Tooltip>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 字数统计 */}
          <div>
            <Progress
              percent={wordCountPercent}
              status={wordCountStatus}
              size="small"
              format={() => `${wordCount}/${maxWords}`}
            />
            {wordCount < minWords && (
              <Alert
                message={`摘要字数不足，建议至少 ${minWords} 字`}
                type="warning"
                size="small"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
            {wordCount > maxWords && (
              <Alert
                message={`摘要字数过多，建议不超过 ${maxWords} 字`}
                type="error"
                size="small"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          {/* 内容编辑区域 */}
          {structured ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {localSections.map((section, index) => (
                <Card key={index} size="small" className="section-card">
                  <div className="section-header">
                    <Text strong>{section.title}</Text>
                  </div>
                  <TextArea
                    placeholder={section.placeholder}
                    value={section.content}
                    onChange={(e) => handleSectionChange(index, e.target.value)}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    style={{ marginTop: 8 }}
                  />
                </Card>
              ))}
            </Space>
          ) : (
            <TextArea
              placeholder="请输入摘要内容..."
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              autoSize={{ minRows: 6, maxRows: 12 }}
            />
          )}
        </Space>
      </Card>
    </NodeViewWrapper>
  );
};

/**
 * KeywordsNodeView - 关键词节点视图
 */
export const KeywordsNodeView = ({ node, updateAttributes, deleteNode }) => {
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);

  const keywords = node.attrs.keywords || [];
  const { maxKeywords, minKeywords } = node.attrs;
  
  const keywordCount = keywords.length;
  const countStatus = keywordCount < minKeywords ? 'exception' : 
                     keywordCount > maxKeywords ? 'exception' : 'success';

  const handleAddKeyword = useCallback(() => {
    if (!inputValue.trim()) return;
    
    const keywordText = inputValue.trim();
    const exists = keywords.some(k => 
      (typeof k === 'string' ? k : k.text) === keywordText
    );
    
    if (exists) {
      message.warning('关键词已存在');
      return;
    }
    
    if (keywords.length >= maxKeywords) {
      message.warning(`关键词数量不能超过 ${maxKeywords} 个`);
      return;
    }

    const newKeyword = { text: keywordText, category: 'general' };
    const updatedKeywords = [...keywords, newKeyword];
    
    updateAttributes({ 
      keywords: updatedKeywords,
      updated: new Date().toISOString()
    });
    setInputValue('');
    message.success('关键词已添加');
  }, [inputValue, keywords, maxKeywords, updateAttributes]);

  const handleRemoveKeyword = useCallback((index) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index);
    updateAttributes({ 
      keywords: updatedKeywords,
      updated: new Date().toISOString()
    });
    message.success('关键词已删除');
  }, [keywords, updateAttributes]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  }, [handleAddKeyword]);

  return (
    <NodeViewWrapper className="keywords-node-view">
      <Card 
        className="paper-structure-card"
        size="small"
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>关键词</Title>
            <Tag color="red">必填</Tag>
            <Text type="secondary">({keywordCount}/{minKeywords}-{maxKeywords})</Text>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="语言">
              <Select
                size="small"
                value={node.attrs.language}
                onChange={(value) => updateAttributes({ language: value })}
                style={{ width: 80 }}
              >
                {PaperStructureConfig.LANGUAGES.map(lang => (
                  <Option key={lang.code} value={lang.code}>
                    {lang.name}
                  </Option>
                ))}
              </Select>
            </Tooltip>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 关键词列表 */}
          <div className="keywords-list">
            <Space wrap>
              {keywords.map((keyword, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleRemoveKeyword(index)}
                  color="blue"
                  style={{ marginBottom: 8 }}
                >
                  {typeof keyword === 'string' ? keyword : keyword.text}
                </Tag>
              ))}
            </Space>
          </div>

          {/* 添加关键词 */}
          <div className="keyword-input-area">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入关键词后按回车或点击添加..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleKeyPress}
                disabled={keywords.length >= maxKeywords}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddKeyword}
                disabled={!inputValue.trim() || keywords.length >= maxKeywords}
              >
                添加
              </Button>
            </Space.Compact>
          </div>

          {/* 状态提示 */}
          {keywordCount < minKeywords && (
            <Alert
              message={`关键词数量不足，建议至少 ${minKeywords} 个`}
              type="warning"
              size="small"
              showIcon
            />
          )}
          {keywordCount >= maxKeywords && (
            <Alert
              message={`已达到关键词数量上限 (${maxKeywords} 个)`}
              type="info"
              size="small"
              showIcon
            />
          )}
        </Space>
      </Card>
    </NodeViewWrapper>
  );
};

/**
 * AffiliationNodeView - 机构信息节点视图
 */
export const AffiliationNodeView = ({ node, updateAttributes, deleteNode }) => {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [localAffiliations, setLocalAffiliations] = useState(node.attrs.affiliations || []);

  const handleAddAffiliation = useCallback(() => {
    const newAffiliation = {
      id: PaperStructureUtils.generateId('affiliation'),
      name: '',
      department: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      email: '',
      website: ''
    };
    
    const updatedAffiliations = [...localAffiliations, newAffiliation];
    setLocalAffiliations(updatedAffiliations);
    updateAttributes({ 
      affiliations: updatedAffiliations,
      updated: new Date().toISOString()
    });
    setEditingIndex(updatedAffiliations.length - 1);
  }, [localAffiliations, updateAttributes]);

  const handleRemoveAffiliation = useCallback((index) => {
    const updatedAffiliations = localAffiliations.filter((_, i) => i !== index);
    setLocalAffiliations(updatedAffiliations);
    updateAttributes({ 
      affiliations: updatedAffiliations,
      updated: new Date().toISOString()
    });
    message.success('机构已删除');
  }, [localAffiliations, updateAttributes]);

  const handleSaveAffiliation = useCallback((index, affiliationData) => {
    const updatedAffiliations = [...localAffiliations];
    updatedAffiliations[index] = { ...updatedAffiliations[index], ...affiliationData };
    setLocalAffiliations(updatedAffiliations);
    updateAttributes({ 
      affiliations: updatedAffiliations,
      updated: new Date().toISOString()
    });
    setEditingIndex(-1);
    message.success('机构信息已更新');
  }, [localAffiliations, updateAttributes]);

  const getMarker = (index) => {
    switch (node.attrs.displayFormat) {
      case 'lettered':
        return String.fromCharCode(97 + index); // a, b, c...
      case 'symbols':
        const symbols = ['*', '†', '‡', '§', '¶', '#'];
        return symbols[index % symbols.length];
      default:
        return (index + 1).toString(); // 1, 2, 3...
    }
  };

  return (
    <NodeViewWrapper className="affiliation-node-view">
      <Card 
        className="paper-structure-card"
        size="small"
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>机构信息</Title>
            <Text type="secondary">({localAffiliations.length} 个机构)</Text>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="标记格式">
              <Select
                size="small"
                value={node.attrs.displayFormat}
                onChange={(value) => updateAttributes({ displayFormat: value })}
                style={{ width: 80 }}
              >
                <Option value="numbered">数字</Option>
                <Option value="lettered">字母</Option>
                <Option value="symbols">符号</Option>
              </Select>
            </Tooltip>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAffiliation}
            >
              添加机构
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {localAffiliations.map((affiliation, index) => (
            <Card
              key={affiliation.id}
              size="small"
              className="affiliation-card"
              title={
                <Space>
                  <Tag color="blue">{getMarker(index)}</Tag>
                  <Text strong>机构 {index + 1}</Text>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditingIndex(index)}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAffiliation(index)}
                  />
                </Space>
              }
            >
              {editingIndex === index ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    placeholder="机构名称"
                    value={affiliation.name}
                    onChange={(e) => {
                      const updated = [...localAffiliations];
                      updated[index] = { ...updated[index], name: e.target.value };
                      setLocalAffiliations(updated);
                    }}
                  />
                  <Input
                    placeholder="部门/学院"
                    value={affiliation.department}
                    onChange={(e) => {
                      const updated = [...localAffiliations];
                      updated[index] = { ...updated[index], department: e.target.value };
                      setLocalAffiliations(updated);
                    }}
                  />
                  <Row gutter={16}>
                    <Col span={12}>
                      <Input
                        placeholder="地址"
                        value={affiliation.address}
                        onChange={(e) => {
                          const updated = [...localAffiliations];
                          updated[index] = { ...updated[index], address: e.target.value };
                          setLocalAffiliations(updated);
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Input
                        placeholder="国家"
                        value={affiliation.country}
                        onChange={(e) => {
                          const updated = [...localAffiliations];
                          updated[index] = { ...updated[index], country: e.target.value };
                          setLocalAffiliations(updated);
                        }}
                      />
                    </Col>
                  </Row>
                  <Space>
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => handleSaveAffiliation(index, affiliation)}
                    >
                      保存
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => setEditingIndex(-1)}
                    >
                      取消
                    </Button>
                  </Space>
                </Space>
              ) : (
                <div className="affiliation-display">
                  <Text strong>{affiliation.name || '未命名机构'}</Text>
                  {affiliation.department && (
                    <div><Text type="secondary">部门: {affiliation.department}</Text></div>
                  )}
                  {affiliation.address && (
                    <div><Text type="secondary">地址: {affiliation.address}</Text></div>
                  )}
                  {affiliation.country && (
                    <div><Text type="secondary">国家: {affiliation.country}</Text></div>
                  )}
                </div>
              )}
            </Card>
          ))}
          
          {localAffiliations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">暂无机构信息</Text>
              <br />
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={handleAddAffiliation}
                style={{ marginTop: 8 }}
              >
                添加机构信息
              </Button>
            </div>
          )}
        </Space>
      </Card>
    </NodeViewWrapper>
  );
};

export default {
  AbstractNodeView,
  KeywordsNodeView,
  AffiliationNodeView
};
