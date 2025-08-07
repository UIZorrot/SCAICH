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
  Modal,
  Form
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SettingOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { PaperStructureUtils, PaperStructureConfig } from '../extensions/PaperStructureNodes';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * PaperTitleNodeView - 论文标题节点视图
 */
export const PaperTitleNodeView = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(node.attrs.mainTitle || '');
  const [localSubtitle, setLocalSubtitle] = useState(node.attrs.subtitle || '');

  const handleSave = useCallback(() => {
    if (!localTitle.trim()) {
      message.error('论文标题不能为空');
      return;
    }

    updateAttributes({
      mainTitle: localTitle.trim(),
      subtitle: localSubtitle.trim(),
      updated: new Date().toISOString()
    });
    setIsEditing(false);
    message.success('标题已更新');
  }, [localTitle, localSubtitle, updateAttributes]);

  const handleCancel = useCallback(() => {
    setLocalTitle(node.attrs.mainTitle || '');
    setLocalSubtitle(node.attrs.subtitle || '');
    setIsEditing(false);
  }, [node.attrs]);

  const formatTitle = (title, titleCase) => {
    switch (titleCase) {
      case 'upper':
        return title.toUpperCase();
      case 'lower':
        return title.toLowerCase();
      case 'sentence':
        return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      case 'title':
      default:
        return title.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
  };

  return (
    <NodeViewWrapper className="paper-title-node-view">
      <Card 
        className="paper-structure-card"
        size="small"
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>论文标题</Title>
            <Tag color="red">必填</Tag>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="标题格式">
              <Select
                size="small"
                value={node.attrs.titleCase}
                onChange={(value) => updateAttributes({ titleCase: value })}
                style={{ width: 80 }}
              >
                <Option value="title">标题格式</Option>
                <Option value="sentence">句子格式</Option>
                <Option value="upper">全大写</Option>
                <Option value="lower">全小写</Option>
              </Select>
            </Tooltip>
            <Tooltip title="对齐方式">
              <Select
                size="small"
                value={node.attrs.alignment}
                onChange={(value) => updateAttributes({ alignment: value })}
                style={{ width: 70 }}
              >
                <Option value="left">左对齐</Option>
                <Option value="center">居中</Option>
                <Option value="right">右对齐</Option>
              </Select>
            </Tooltip>
            <Button
              size="small"
              type={isEditing ? "primary" : "default"}
              icon={<EditOutlined />}
              onClick={() => setIsEditing(!isEditing)}
            />
          </Space>
        }
      >
        {isEditing ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="请输入论文标题..."
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              size="large"
              autoFocus
            />
            <Input
              placeholder="副标题（可选）"
              value={localSubtitle}
              onChange={(e) => setLocalSubtitle(e.target.value)}
            />
            <Space>
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckOutlined />}
                onClick={handleSave}
              >
                保存
              </Button>
              <Button 
                size="small" 
                icon={<CloseOutlined />}
                onClick={handleCancel}
              >
                取消
              </Button>
            </Space>
          </Space>
        ) : (
          <div className={`title-preview alignment-${node.attrs.alignment}`}>
            <Title 
              level={1} 
              className={`main-title case-${node.attrs.titleCase}`}
              style={{ 
                textAlign: node.attrs.alignment,
                margin: '16px 0 8px 0'
              }}
            >
              {formatTitle(node.attrs.mainTitle || '请输入论文标题...', node.attrs.titleCase)}
            </Title>
            {node.attrs.subtitle && (
              <Title 
                level={2} 
                type="secondary"
                style={{ 
                  textAlign: node.attrs.alignment,
                  margin: '0 0 16px 0'
                }}
              >
                {node.attrs.subtitle}
              </Title>
            )}
          </div>
        )}
      </Card>
    </NodeViewWrapper>
  );
};

/**
 * AuthorInfoNodeView - 作者信息节点视图
 */
export const AuthorInfoNodeView = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [authorForm] = Form.useForm();

  const authors = node.attrs.authors || [];

  const handleAddAuthor = useCallback(() => {
    const newAuthor = {
      id: PaperStructureUtils.generateId('author'),
      firstName: '',
      lastName: '',
      email: '',
      orcid: '',
      affiliations: [],
      roles: [],
      isCorresponding: false
    };
    
    const updatedAuthors = [...authors, newAuthor];
    updateAttributes({ authors: updatedAuthors });
    setEditingAuthor(newAuthor.id);
  }, [authors, updateAttributes]);

  const handleRemoveAuthor = useCallback((authorId) => {
    const updatedAuthors = authors.filter(author => author.id !== authorId);
    updateAttributes({ authors: updatedAuthors });
    message.success('作者已删除');
  }, [authors, updateAttributes]);

  const handleSaveAuthor = useCallback((authorId, authorData) => {
    const updatedAuthors = authors.map(author => 
      author.id === authorId ? { ...author, ...authorData } : author
    );
    updateAttributes({ authors: updatedAuthors });
    setEditingAuthor(null);
    message.success('作者信息已更新');
  }, [authors, updateAttributes]);

  const validateEmail = (email) => {
    return !email || PaperStructureUtils.validateEmail(email);
  };

  const validateORCID = (orcid) => {
    return !orcid || PaperStructureUtils.validateORCID(orcid);
  };

  return (
    <NodeViewWrapper className="author-info-node-view">
      <Card 
        className="paper-structure-card"
        size="small"
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>作者信息</Title>
            <Tag color="red">必填</Tag>
            <Text type="secondary">({authors.length} 位作者)</Text>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="显示格式">
              <Select
                size="small"
                value={node.attrs.displayFormat}
                onChange={(value) => updateAttributes({ displayFormat: value })}
                style={{ width: 80 }}
              >
                <Option value="standard">标准</Option>
                <Option value="compact">紧凑</Option>
                <Option value="detailed">详细</Option>
              </Select>
            </Tooltip>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAuthor}
            >
              添加作者
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {authors.map((author, index) => (
            <Card
              key={author.id}
              size="small"
              className="author-card"
              title={
                <Space>
                  <Text strong>作者 {index + 1}</Text>
                  {author.roles && author.roles.length > 0 && (
                    <Space>
                      {author.roles.map(role => {
                        const roleConfig = PaperStructureConfig.AUTHOR_ROLES.find(r => r.code === role);
                        return (
                          <Tag key={role} size="small" color="blue">
                            {roleConfig ? roleConfig.name : role}
                          </Tag>
                        );
                      })}
                    </Space>
                  )}
                </Space>
              }
              extra={
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditingAuthor(author.id)}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAuthor(author.id)}
                  />
                </Space>
              }
            >
              {editingAuthor === author.id ? (
                <Form
                  form={authorForm}
                  layout="vertical"
                  initialValues={author}
                  onFinish={(values) => handleSaveAuthor(author.id, values)}
                  size="small"
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="firstName"
                        label="名"
                        rules={[{ required: true, message: '请输入名' }]}
                      >
                        <Input placeholder="名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lastName"
                        label="姓"
                        rules={[{ required: true, message: '请输入姓' }]}
                      >
                        <Input placeholder="姓" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                          { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                      >
                        <Input placeholder="邮箱地址" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="orcid"
                        label="ORCID"
                        rules={[
                          { 
                            pattern: /^(\d{4}-){3}\d{3}[\dX]$/,
                            message: '请输入有效的ORCID格式 (0000-0000-0000-0000)'
                          }
                        ]}
                      >
                        <Input placeholder="0000-0000-0000-0000" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name="roles"
                    label="作者角色"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择作者角色"
                      style={{ width: '100%' }}
                    >
                      {PaperStructureConfig.AUTHOR_ROLES.map(role => (
                        <Option key={role.code} value={role.code}>
                          {role.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" size="small">
                      保存
                    </Button>
                    <Button size="small" onClick={() => setEditingAuthor(null)}>
                      取消
                    </Button>
                  </Space>
                </Form>
              ) : (
                <div className="author-display">
                  <Text strong>
                    {PaperStructureUtils.formatAuthorName(author.firstName, author.lastName)}
                  </Text>
                  {author.email && (
                    <div><Text type="secondary">邮箱: {author.email}</Text></div>
                  )}
                  {author.orcid && (
                    <div>
                      <Text type="secondary">ORCID: </Text>
                      <a 
                        href={`https://orcid.org/${author.orcid}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {author.orcid}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
          
          {authors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">暂无作者信息</Text>
              <br />
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={handleAddAuthor}
                style={{ marginTop: 8 }}
              >
                添加第一位作者
              </Button>
            </div>
          )}
        </Space>
      </Card>
    </NodeViewWrapper>
  );
};

export default {
  PaperTitleNodeView,
  AuthorInfoNodeView
};
