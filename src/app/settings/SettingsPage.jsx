import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Modal,
  message,
  Typography,
  Avatar,
  Divider,
  Space,
  Progress,
  Tag,
  Alert,
  Popconfirm,
  Row,
  Col,
  List,
  Statistic,
  Radio
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  KeyOutlined,
  CrownOutlined,
  DatabaseOutlined,
  EyeOutlined,
  EditOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  SafetyOutlined,
  ClearOutlined,
  StarOutlined,
  GoldOutlined,
  RocketOutlined,
  FileOutlined,
  UploadOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { uploadToIrys } from '../../utils/irysUploader';
import Handlebars from 'handlebars';
import './SettingsPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Template Options
const TEMPLATE_OPTIONS = [
  { value: 'scholar', label: 'Scholar Homepage', description: 'For Science researchers to showcase research achievements' },
  { value: 'tech', label: 'Tech Homepage', description: 'For developers to showcase technical projects and skills' },
  { value: 'resume', label: 'Professional Resume', description: 'For job seekers to showcase work experience and abilities' },
  { value: 'blog', label: 'Blog Homepage', description: 'For content creators to showcase articles and insights' }
];

// 生成不同模板的HTML
const generateTemplateHTML = async (templateType, profileData, user) => {
  if (!user?.user_id) throw new Error('User authentication required for template generation');
  if (!profileData) throw new Error('Profile data is required for template generation');
  const displayName = profileData.displayName || profileData.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  const email = user.emailAddresses?.[0]?.emailAddress || profileData.email || '';
  console.log('Generating template:', templateType, 'for user:', user.user_id, 'with profile:', profileData);
  const templateMap = { scholar: 'template-1.html', tech: 'template-2.html', resume: 'template-3.html', blog: 'template-4.html' };
  try {
    // 尝试读取对应的模板文件
    const templateFile = templateMap[templateType];
    console.log('Loading template file:', templateFile);
    const response = await fetch(`/${templateFile}`);

    if (!response.ok) {
      console.warn(`Template file ${templateFile} not found (${response.status}), using fallback`);
      throw new Error(`Template file not found: ${response.status}`);
    }

    let templateContent = await response.text();

    if (!templateContent || templateContent.trim() === '') {
      throw new Error('Template file is empty');
    }

    // 准备统一的数据对象，确保字段名与模板中的Handlebars变量名一致
    const researchFieldsArray = profileData.researchFields ? profileData.researchFields.split(',').map(f => f.trim()) : [];

    const data = {
      displayName,
      email,
      position: profileData.position || '',
      institution: profileData.institution || '',
      bio: profileData.bio || '',
      biography: profileData.bio || '', // template-1使用biography
      // template-1(scholar)使用字符串格式，其他模板使用数组格式
      researchFields: templateType === 'scholar' ? profileData.researchFields || '' : researchFieldsArray,
      website: profileData.website || '',
      personalWebsite: profileData.website || '', // template-1使用personalWebsite
      github: profileData.github || '',
      linkedin: profileData.linkedin || '',
      twitter: profileData.twitter || '',
      updatedAt: new Date().toLocaleDateString(),
      avatarUrl: profileData.avatarUrl || '',
      contributions: profileData.contributions || [],
      experience: profileData.experience || profileData.contributions || [],
      education: profileData.education || [],
      skills: profileData.skills || researchFieldsArray,
      achievements: profileData.achievements || profileData.contributions || [],
      projects: profileData.projects || profileData.contributions || [],
      recentPosts: profileData.contributions || [],
      categories: researchFieldsArray,
      // 为不同模板添加特定字段
      role: profileData.position || '', // template-2使用role
      location: profileData.institution || '' // template-2使用location
    };

    // 使用 Handlebars 编译模板
    const template = Handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.warn('Failed to load template file, using fallback:', error);
    // 如果模板文件加载失败，使用基础的HTML结构
    return generateFallbackTemplate(templateType, profileData, user, displayName, email);
  }
};

// 生成fallback模板
const generateFallbackTemplate = (templateType, profileData, user, displayName, email) => {
  const templateTitle = {
    scholar: 'Science Profile',
    tech: 'Developer Profile',
    resume: 'Professional Resume',
    blog: 'Content Creator Profile'
  }[templateType] || 'Personal Profile';

  const sectionTitle = {
    scholar: { skills: 'Research Fields', projects: 'Major Achievements' },
    tech: { skills: 'Tech Stack', projects: 'Project Experience' },
    resume: { skills: 'Professional Skills', projects: 'Project History' },
    blog: { skills: 'Content Categories', projects: 'Featured Articles' }
  }[templateType] || { skills: 'Skills', projects: 'Projects' };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} - ${templateTitle}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            text-align: center; 
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .avatar { 
            width: 120px; 
            height: 120px; 
            border-radius: 50%; 
            margin: 0 auto 20px;
            border: 4px solid white;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.2);
            font-size: 48px;
        }
        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
        }
        .section h2 {
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .contact-info {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
        }
        .contact-item {
            background: #e9ecef;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 14px;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 12px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="avatar">
                ${profileData.avatarUrl ? `<img src="${profileData.avatarUrl}" alt="${displayName}">` : "👤"}
            </div>
            <h1>${displayName}</h1>
            ${profileData.position || profileData.institution ? `<h3>${profileData.position || ''} ${profileData.position && profileData.institution ? 'at' : ''} ${profileData.institution || ''}</h3>` : ""}
            ${email ? `<p>📧 ${email}</p>` : ""}
        </div>
        
        <div class="content">
            <div class="warning">
                ⚠️ Template file could not be loaded. Displaying fallback version. Please check your template files or contact support.
            </div>
            
            ${profileData.bio ? `
            <div class="section">
                <h2>About</h2>
                <p>${profileData.bio}</p>
            </div>` : ""}
            
            ${profileData.researchFields ? `
            <div class="section">
                <h2>${sectionTitle.skills}</h2>
                <p>${profileData.researchFields}</p>
            </div>` : ""}
            
            ${profileData.contributions && profileData.contributions.length > 0 ? `
            <div class="section">
                <h2>${sectionTitle.projects}</h2>
                <ul>
                    ${profileData.contributions.filter(item => item.trim()).map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>` : ""}
            
            ${profileData.website ? `
            <div class="section">
                <h2>Links</h2>
                <div class="contact-info">
                    <div class="contact-item">🌐 <a href="${profileData.website}" target="_blank">${profileData.website}</a></div>
                </div>
            </div>` : ""}
        </div>
        
        <div class="footer">
            <p>Generated by SCAI Settings (Fallback Mode) | User: ${user.user_id} | ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
};

const SettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();

  // 状态管理
  const [profileData, setProfileData] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('scholar');
  const [uploading, setUploading] = useState(false);
  const [profilePageUrl, setProfilePageUrl] = useState(null);
  const [contributions, setContributions] = useState(['']);
  const [rootKey, setRootKey] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('free');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 100 });
  const [localFiles, setLocalFiles] = useState([]);

  // 用户名编辑状态
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');

  // 加载用户数据
  useEffect(() => {
    console.log('=== USER OBJECT DEBUG ===');
    console.log('Complete user object:', user);
    console.log('User keys:', user ? Object.keys(user) : 'user is null/undefined');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('========================');

    if (user?.user_id) {
      console.log('User authenticated, loading data for user:', user.user_id);
      loadUserData();
      loadStorageInfo();

      // Debug: 检查localStorage中的所有相关数据
      const debugInfo = {
        userId: user.user_id,
        profileKey: `scai_profile_${user.user_id}`,
        profileData: localStorage.getItem(`scai_profile_${user.user_id}`),
        pageUrlKey: `scai_profile_page_${user.user_id}`,
        pageUrl: localStorage.getItem(`scai_profile_page_${user.user_id}`),
        rootKeyExists: !!localStorage.getItem(`scai_root_key_${user.user_id}`),
        subscriptionExists: !!localStorage.getItem(`scai_subscription_${user.user_id}`)
      };
      console.log('LocalStorage debug info:', debugInfo);
    } else {
      console.log('User not authenticated or user object missing:', { user, isAuthenticated });
    }
  }, [user, isAuthenticated]);

  const loadUserData = () => {
    if (!user?.user_id) {
      console.warn('User ID not available, cannot load profile data');
      return;
    }

    try {
      // 加载个人资料
      const savedProfile = localStorage.getItem(`scai_profile_${user.user_id}`);
      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        setProfileData(data);
        setSelectedTemplate(data.templateType || 'scholar');
        profileForm.setFieldsValue(data);
        if (data.contributions) {
          setContributions(data.contributions);
        }
        console.log('Profile data loaded successfully:', data);
      } else {
        console.log('No saved profile found for user:', user.user_id);
      }

      // 加载已上传的页面URL
      const savedPageUrl = localStorage.getItem(`scai_profile_page_${user.user_id}`);
      if (savedPageUrl) {
        setProfilePageUrl(savedPageUrl);
      }

      // 加载根密钥（加密存储）
      const savedRootKey = localStorage.getItem(`scai_root_key_${user.user_id}`);
      if (savedRootKey) {
        setRootKey(savedRootKey);
      }

      // 加载订阅信息
      const savedSubscription = localStorage.getItem(`scai_subscription_${user.user_id}`);
      if (savedSubscription) {
        setSubscriptionType(savedSubscription);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      message.error('Failed to load profile data');
    }
  };

  const loadStorageInfo = () => {
    // 计算本地存储使用情况
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('scai_')) {
        totalSize += localStorage[key].length;
      }
    }

    setStorageInfo({
      used: Math.round(totalSize / 1024), // KB
      total: 5120 // 5MB limit
    });
  };

  // 保存个人资料
  const handleSaveProfile = async (values) => {
    if (!user?.user_id) {
      message.error('User not authenticated. Please login again.');
      return;
    }

    try {
      const updatedProfileData = {
        ...profileData, // 保留现有的profileData，包括displayName和avatarUrl
        ...values,
        templateType: selectedTemplate,
        contributions: contributions.filter(item => item.trim() !== ''),
        userId: user.user_id,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(`scai_profile_${user.user_id}`, JSON.stringify(updatedProfileData));
      setProfileData(updatedProfileData);
      message.success('Profile saved successfully');
      loadStorageInfo();
      console.log('Profile saved for user:', user.user_id, updatedProfileData);
    } catch (error) {
      console.error('Save failed:', error);
      message.error('Save failed, please try again');
    }
  };

  // 上传个人主页
  const handleUploadProfile = async () => {
    if (!profileData) {
      message.warning('Please complete your profile first');
      return;
    }

    setUploading(true);
    try {
      const htmlContent = await generateTemplateHTML(selectedTemplate, profileData, user);
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      // 生成合适的文件名，避免undefined
      const displayName = profileData.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.user_id || 'user';
      const safeFileName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const htmlFile = new File([htmlBlob], `${safeFileName}_${selectedTemplate}_profile.html`, { type: 'text/html' });

      const result = await uploadToIrys(htmlFile, {
        title: `${profileData.displayName || `${user.firstName} ${user.lastName}`} - ${selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Profile`,
        description: `${selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Personal Profile`,
        userId: user.user_id,
        isPrivate: false,
        uploadMode: 'irys'
      });

      if (result.success) {
        // 使用返回的irysUrl而不是result.url
        const pageUrl = result.irysUrl || result.url;
        setProfilePageUrl(pageUrl);
        localStorage.setItem(`scai_profile_page_${user.user_id}`, pageUrl);
        localStorage.setItem(`scai_profile_page_url_${user.user_id}`, pageUrl); // 为ProfilePage.jsx提供URL
        message.success({
          content: (
            <div>
              <div>Homepage uploaded successfully!</div>
              <div style={{ marginTop: '8px' }}>
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                  🔗 Visit your homepage
                </a>
              </div>
            </div>
          ),
          duration: 6
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 预览个人主页
  const handlePreviewProfile = async () => {
    if (!profileData) {
      message.warning('Please complete your profile first');
      return;
    }

    if (!user?.user_id) {
      message.error('User not authenticated. Please login again.');
      return;
    }

    try {
      console.log('Generating preview for template:', selectedTemplate, 'with data:', profileData);
      const htmlContent = await generateTemplateHTML(selectedTemplate, profileData, user);

      if (!htmlContent || htmlContent.trim() === '') {
        throw new Error('Generated HTML content is empty');
      }

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      console.log('Preview opened successfully');
    } catch (error) {
      console.error('Preview error:', error);
      message.error(`Failed to generate preview: ${error.message}`);
    }
  };

  // 查看已上传的主页
  const handleViewProfile = () => {
    if (profilePageUrl) {
      // 直接打开Irys链接
      window.open(profilePageUrl, '_blank');
    } else if (user?.user_id) {
      // 备用：使用profile路由
      const profileUrl = `/profile/${user.user_id}`;
      window.open(profileUrl, '_blank');
    }
  };

  // 管理贡献列表
  const addContribution = () => {
    setContributions([...contributions, '']);
  };

  const updateContribution = (index, value) => {
    const newContributions = [...contributions];
    newContributions[index] = value;
    setContributions(newContributions);
  };

  const removeContribution = (index) => {
    const newContributions = contributions.filter((_, i) => i !== index);
    setContributions(newContributions);
  };

  // 用户名编辑相关函数
  const handleEditDisplayName = () => {
    setTempDisplayName(profileData?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '');
    setEditingDisplayName(true);
  };

  const handleSaveDisplayName = async () => {
    if (!tempDisplayName.trim()) {
      message.warning('Username cannot be empty');
      return;
    }

    try {
      const updatedProfileData = {
        ...profileData,
        displayName: tempDisplayName.trim(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(`scai_profile_${user.user_id}`, JSON.stringify(updatedProfileData));
      setProfileData(updatedProfileData);
      setEditingDisplayName(false);
      message.success('Username updated successfully');
    } catch (error) {
      console.error('Failed to update username:', error);
      message.error('Update failed, please try again');
    }
  };

  const handleCancelEditDisplayName = () => {
    setEditingDisplayName(false);
    setTempDisplayName('');
  };

  // 保存根密钥
  const handleSaveRootKey = (values) => {
    try {
      // 这里应该加密存储
      localStorage.setItem(`scai_root_key_${user.user_id}`, values.rootKey);
      setRootKey(values.rootKey);
      message.success('根密钥保存成功');
      loadStorageInfo();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 清理本地存储
  const handleClearStorage = () => {
    try {
      const keysToRemove = [];
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('scai_') && key.includes(user.user_id)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        if (!key.includes('profile') && !key.includes('root_key')) {
          localStorage.removeItem(key);
        }
      });

      loadStorageInfo();
      message.success('缓存清理完成');
    } catch (error) {
      message.error('清理失败');
    }
  };

  // 购买Plus订阅
  const handleUpgradeToPro = () => {
    Modal.info({
      title: '升级到 SCAI Plus',
      content: (
        <div>
          <p>SCAI Plus 功能包括：</p>
          <ul>
            <li>无限制文件上传</li>
            <li>高级模板定制</li>
            <li>优先技术支持</li>
            <li>数据分析报告</li>
          </ul>
          <p>价格：$9.99/月</p>
        </div>
      ),
      onOk() {
        message.info('支付功能开发中...');
      }
    });
  };

  // 本地文件管理函数
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file: file
    }));

    // 保存到localStorage
    const updatedFiles = [...localFiles, ...newFiles];
    setLocalFiles(updatedFiles);
    localStorage.setItem(`scai_local_files_${user.user_id}`, JSON.stringify(updatedFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified
    }))));

    message.success(`Successfully uploaded ${files.length} file(s)`);
    loadStorageInfo();
  };

  const handleCreateFolder = () => {
    Modal.confirm({
      title: 'Create New Folder',
      content: (
        <Input
          placeholder="Enter folder name"
          id="folder-name-input"
        />
      ),
      onOk() {
        const folderName = document.getElementById('folder-name-input').value;
        if (folderName.trim()) {
          const newFolder = {
            id: Date.now() + Math.random(),
            name: folderName.trim(),
            type: 'folder',
            lastModified: Date.now(),
            isFolder: true
          };

          const updatedFiles = [...localFiles, newFolder];
          setLocalFiles(updatedFiles);
          localStorage.setItem(`scai_local_files_${user.user_id}`, JSON.stringify(updatedFiles));
          message.success('Folder created successfully');
        }
      }
    });
  };

  const handleRefreshFiles = () => {
    const savedFiles = localStorage.getItem(`scai_local_files_${user.user_id}`);
    if (savedFiles) {
      setLocalFiles(JSON.parse(savedFiles));
    }
    message.success('Files refreshed');
  };

  // 刷新profile数据的函数
  const handleRefreshProfileData = () => {
    if (!user?.user_id) {
      message.error('User not authenticated');
      return;
    }

    console.log('Refreshing profile data for user:', user.user_id);

    // 重新加载profile数据
    loadUserData();

    // 重新加载其他相关数据
    const savedProfilePageUrl = localStorage.getItem(`scai_profile_page_${user.user_id}`);
    if (savedProfilePageUrl) {
      setProfilePageUrl(savedProfilePageUrl);
    }

    const savedRootKey = localStorage.getItem(`scai_root_key_${user.user_id}`);
    if (savedRootKey) {
      setRootKey(savedRootKey);
    }

    const savedSubscription = localStorage.getItem(`scai_subscription_${user.user_id}`);
    if (savedSubscription) {
      setSubscriptionType(savedSubscription);
    }

    // 重新加载存储信息
    loadStorageInfo();

    message.success('Profile data refreshed successfully');
  };

  const handleDownloadFile = (file) => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      message.warning('File data not available for download');
    }
  };

  const handleShareFile = (file) => {
    Modal.info({
      title: 'Share File',
      content: (
        <div>
          <p>File: {file.name}</p>
          <p>Size: {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}</p>
          <p>Share functionality will be available in future updates.</p>
        </div>
      )
    });
  };

  const handleDeleteFile = (fileId) => {
    const updatedFiles = localFiles.filter(file => file.id !== fileId);
    setLocalFiles(updatedFiles);
    localStorage.setItem(`scai_local_files_${user.user_id}`, JSON.stringify(updatedFiles));
    message.success('File deleted successfully');
    loadStorageInfo();
  };

  // 加载本地文件
  useEffect(() => {
    if (user?.user_id) {
      const savedFiles = localStorage.getItem(`scai_local_files_${user.user_id}`);
      if (savedFiles) {
        setLocalFiles(JSON.parse(savedFiles));
      }
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className={`search-page light-theme`}>
          <div className="hero-section1">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="hero-content">
              <Title level={1} className="hero-title" style={{ color: "#fff" }}>
                {isAuthenticated ? `Welcome back!` : "Account Setting"}
              </Title>
              <Paragraph className="hero-subtitle">Set your personal Information, Page and More.</Paragraph>
            </motion.div>
          </div>
          <div
            style={{
              padding: "2rem",
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              className="scholar-container"
              style={{
                width: "100%",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <UserOutlined
                  style={{
                    fontSize: 64,
                    color: "#fff",
                    marginBottom: 7,
                  }}
                />
                <Title
                  level={2}
                  style={{
                    color: "#fff",
                    marginBottom: 16,
                  }}
                >
                  Login Required
                </Title>
                <Text
                  style={{
                    color: "#ccc",
                    fontSize: 16,
                    marginBottom: 24,
                    maxWidth: 500,
                    margin: "0 auto 24px",
                    display: "block",
                  }}
                >
                  Please sign in to access your personalized settings and manage your account preferences.
                </Text>

                <Button
                  className="modern-btn modern-btn-primary"
                  type="primary"
                  size="large"
                  style={{
                    height: 48,
                    paddingLeft: 32,
                    paddingRight: 32,
                    fontSize: 16,
                  }}
                  onClick={() => {
                    // Simulate clicking the login button in the top right corner
                    const loginButton = document.querySelector(".login-btn");
                    if (loginButton) {
                      loginButton.click();
                    } else {
                      // If login button is not found, show prompt message
                      message.info("Please use the login button in the top right corner to log in");
                    }
                  }}
                >
                  Sign In to Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Personal Profile
        </span>
      ),
      children: (
        <>
          <Card className="feature-card" style={{ marginBottom: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={profileData?.avatarUrl}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ marginBottom: '16px' }}>
                {editingDisplayName ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Input
                      value={tempDisplayName}
                      onChange={(e) => setTempDisplayName(e.target.value)}
                      style={{ width: '200px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}
                      onPressEnter={handleSaveDisplayName}
                      autoFocus
                    />
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSaveDisplayName}
                      icon={<EditOutlined />}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="small"
                      onClick={handleCancelEditDisplayName}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Text strong style={{ fontSize: '18px' }}>
                      {profileData?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Username not set'}
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={handleEditDisplayName}
                      style={{ color: '#1890ff' }}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Avatar URL</Text>
                <Input
                  value={profileData?.avatarUrl || ''}
                  onChange={(e) => {
                    const newAvatarUrl = e.target.value;
                    // 只更新显示，不立即保存到localStorage
                    setProfileData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
                  }}
                  onBlur={(e) => {
                    // 失去焦点时保存到localStorage
                    const newAvatarUrl = e.target.value;
                    const updatedProfileData = { ...profileData, avatarUrl: newAvatarUrl, updatedAt: new Date().toISOString() };
                    localStorage.setItem(`scai_profile_${user.user_id}`, JSON.stringify(updatedProfileData));
                    setProfileData(updatedProfileData);
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  style={{ textAlign: 'center' }}
                />
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Please provide an image URL, square images recommended
                </Text>
              </div>
            </div>

            <div className="template-selection" style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '12px', textAlign: 'left' }}>Select Homepage Template</Text>
              <Radio.Group
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 16]}>
                  {TEMPLATE_OPTIONS.map(option => (
                    <Col span={12} key={option.value}>
                      <Radio.Button
                        value={option.value}
                        style={{
                          width: '100%',
                          height: 'auto',
                          padding: '12px',
                          textAlign: 'left',
                          whiteSpace: 'normal'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{option.label}</div>
                          <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.3' }}>{option.description}</div>
                        </div>
                      </Radio.Button>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </div>
          </Card>
          <Card className="feature-card" >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleSaveProfile}
            >
              <Form.Item name="institution" label="Institution/Company">
                <Input placeholder="University/Research Institution/Company Name" />
              </Form.Item>

              <Form.Item name="researchFields" label={selectedTemplate === 'scholar' ? 'Research Fields' : selectedTemplate === 'tech' ? 'Tech Stack' : selectedTemplate === 'resume' ? 'Professional Skills' : 'Content Categories'}>
                <TextArea placeholder="Enter relevant information, separated by commas" rows={3} />
              </Form.Item>

              <Form.Item name="bio" label="Personal Bio">
                <TextArea placeholder="Introduce yourself and your professional background" rows={4} />
              </Form.Item>

              <Form.Item label={selectedTemplate === 'scholar' ? 'Major Work & Contributions' : selectedTemplate === 'tech' ? 'Project Experience' : selectedTemplate === 'resume' ? 'Project History' : 'Featured Articles'}>
                <div style={{ marginBottom: '1rem' }}>
                  {contributions.map((contribution, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <TextArea
                        value={contribution}
                        onChange={(e) => updateContribution(index, e.target.value)}
                        placeholder={`${selectedTemplate === 'scholar' ? 'Contribution' : selectedTemplate === 'tech' ? 'Project' : selectedTemplate === 'resume' ? 'Experience' : 'Article'} ${index + 1}`}
                        rows={2}
                        style={{ flex: 1 }}
                      />
                      {contributions.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeContribution(index)}
                          style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={addContribution}
                    icon={<EditOutlined />}
                    style={{ width: '100%' }}
                  >
                    Add {selectedTemplate === 'scholar' ? 'Contribution' : selectedTemplate === 'tech' ? 'Project' : selectedTemplate === 'resume' ? 'Experience' : 'Article'}
                  </Button>
                </div>
              </Form.Item>

              <Form.Item name="website" label="Personal Website">
                <Input placeholder="https://yourwebsite.com" />
              </Form.Item>

              <Form.Item name="orcid" label="ORCID ID">
                <Input placeholder="0000-0000-0000-0000" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" className="modern-btn" block>
                  <EditOutlined /> Save Profile
                </Button>
              </Form.Item>

              <Divider style={{ margin: '24px 0' }} />

              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>Homepage Publishing</Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>Publish your personal profile as an online homepage</Text>
              </div>

              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button
                  type="default"
                  block
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshProfileData}
                  className="modern-btn"
                  size="large"
                  style={{ background: '#f0f9ff', borderColor: '#91d5ff', color: '#1890ff' }}
                >
                  🔄 Refresh Profile Data
                </Button>
                <Button
                  type="default"
                  block
                  icon={<EyeOutlined />}
                  onClick={handlePreviewProfile}
                  disabled={!profileData}
                  className="modern-btn"
                  size="large"
                >
                  Preview Homepage
                </Button>
                <Button
                  type="primary"
                  block
                  icon={<CloudUploadOutlined />}
                  onClick={handleUploadProfile}
                  loading={uploading}
                  disabled={!profileData}
                  className="modern-btn"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  size="large"
                >
                  {profilePageUrl ? 'Update Homepage' : 'Upload Homepage'}
                </Button>
                {profilePageUrl && (
                  <>
                    <Button
                      block
                      icon={<EyeOutlined />}
                      onClick={handleViewProfile}
                      className="modern-btn"
                      size="large"
                      type="default"
                      style={{ background: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a' }}
                    >
                      🔗 Visit Your Personal Homepage
                    </Button>
                    <div style={{
                      padding: '12px',
                      background: '#f6ffed',
                      border: '1px solid #b7eb8f',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Direct Link:</Text>
                      <Text
                        copyable={{ text: profilePageUrl }}
                        style={{ fontSize: '12px', wordBreak: 'break-all' }}
                      >
                        {profilePageUrl}
                      </Text>
                    </div>
                  </>
                )}
              </Space>
            </Form>
          </Card></>
      )
    },
    // {
    //   key: 'local-management',
    //   label: (
    //     <span>
    //       <DatabaseOutlined />
    //       Local Management
    //     </span>
    //   ),
    //   children: (
    //     <>

    //             <Card className="feature-card" style={{marginBottom: '24px'}}>
    //               <div style={{ textAlign: 'center', marginBottom: '24px' }}>

    //                 <Title  level={4}><span style={{color:"#000"}}>Security Center</span></Title>
    //                 <Text type="secondary">Protect your data security</Text>
    //               </div>

    //               <Alert
    //                 message="Security Notice"
    //                 description="Root key is used to encrypt your private data and will not be uploaded to the server. Please keep it safe, it cannot be recovered if lost."
    //                 type="warning"
    //                 style={{ marginBottom: '24px' }}
    //               />

    //               <Form
    //                 form={securityForm}
    //                 layout="vertical"
    //                 onFinish={handleSaveRootKey}
    //               >
    //                 <Form.Item
    //                   name="rootKey"
    //                   label="Root Key"
    //                   rules={[{ required: true, message: 'Please enter root key' }]}
    //                   extra="Recommend using strong password with uppercase, lowercase, numbers and special characters"
    //                 >
    //                   <Input.Password 
    //                     placeholder="Enter your root key" 
    //                     value={rootKey}
    //                     onChange={(e) => setRootKey(e.target.value)}
    //                     size="large"
    //                   />
    //                 </Form.Item>
    //                 <Form.Item>
    //                   <Button 
    //                     type="primary" 
    //                     htmlType="submit" 
    //                     icon={<KeyOutlined />}
    //                     size="large"
    //                     block
    //                     className="modern-btn"
    //                   >
    //                     Save Root Key
    //                   </Button>
    //                 </Form.Item>
    //               </Form>
    //             </Card>

    //             <Card className="feature-card" style={{marginBottom: '24px'}}>
    //               <div style={{ textAlign: 'center', marginBottom: '24px' }}>
    //                 <Title level={4}><span style={{color:"#000"}}>Subscription Management</span></Title>
    //                 <Text type="secondary">Manage your subscription plan</Text>
    //               </div>

    //               <Row gutter={[16, 16]}>
    //                 <Col xs={24} sm={12}>
    //                   <div style={{ 
    //                     padding: '20px', 
    //                     border: subscriptionType === 'free' ? '2px solid #1890ff' : '2px solid #f0f0f0', 
    //                     borderRadius: '8px',
    //                     textAlign: 'center',
    //                   }}>
    //                     <StarOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
    //                     <Title level={5} style={{ margin: '8px 0' }}>Free Plan</Title>
    //                     <ul style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
    //                       <li>Basic homepage templates</li>
    //                       <li>Local data storage</li>
    //                       <li>Basic upload features</li>
    //                       <li>Community support</li>
    //                     </ul>
    //                     {subscriptionType === 'free' && (
    //                       <Tag color="blue" style={{ marginTop: '12px' }}>Current Plan</Tag>
    //                     )}
    //                   </div>
    //                 </Col>
    //                 <Col xs={24} sm={12}>
    //                   <div style={{ 
    //                     padding: '20px', 
    //                     border: subscriptionType === 'plus' ? '2px solid #faad14' : '2px solid #f0f0f0', 
    //                     borderRadius: '8px',
    //                     textAlign: 'center',
    //                   }}>
    //                     <CrownOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
    //                     <Title level={5} style={{ margin: '8px 0' }}>SCAI Plus</Title>
    //                     <ul style={{ paddingLeft: '20px', margin: 0, textAlign: 'left' }}>
    //                       <li>All premium templates</li>
    //                       <li>Unlimited file uploads</li>
    //                       <li>Advanced data analytics</li>
    //                       <li>Priority support</li>
    //                       <li>Custom domain</li>
    //                     </ul>
    //                     {subscriptionType === 'plus' ? (
    //                       <Tag color="gold" style={{ marginTop: '12px' }}>Current Plan</Tag>
    //                     ) : (
    //                       <Button 
    //                         type="primary" 
    //                         size="small"
    //                         style={{ marginTop: '12px', background: '#faad14', borderColor: '#faad14' }}
    //                         onClick={handleUpgradeToPro}
    //                       >
    //                         Upgrade
    //                       </Button>
    //                     )}
    //                   </div>
    //                 </Col>
    //               </Row>
    //             </Card>

    //             <Card className="feature-card" style={{marginBottom: '24px'}}>
    //               <div style={{ textAlign: 'center', marginBottom: '24px' }}>

    //                 <Title level={4} ><span style={{color:"#000"}}>Storage Management</span></Title>
    //                 <Text type="secondary">Manage local data storage</Text>
    //               </div>

    //               <div style={{ marginBottom: '24px' }}>
    //                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
    //                   <Text>Storage Usage</Text>
    //                   <Text>{storageInfo.used} KB / {storageInfo.total} KB</Text>
    //                 </div>
    //                 <Progress 
    //                   percent={Math.round((storageInfo.used / storageInfo.total) * 100)} 
    //                   strokeColor={{
    //                     '0%': '#52c41a',
    //                     '100%': '#389e0d',
    //                   }}
    //                 />
    //               </div>

    //               <Popconfirm
    //                 title="Clear Cache"
    //                 description="Are you sure you want to clear application cache? This will not delete your personal profile and root key."
    //                 onConfirm={handleClearStorage}
    //                 okText="Confirm"
    //                 cancelText="Cancel"
    //               >
    //                 <Button 
    //                   icon={<ClearOutlined />} 
    //                   block 
    //                   size="large"
    //                   className="modern-btn"
    //                 >
    //                   Clear Cache
    //                 </Button>
    //               </Popconfirm>
    //             </Card>

    //             {/* <Card className="feature-card">
    //               <div style={{ textAlign: 'center', marginBottom: '24px' }}>
    //                 <Title level={4}><span style={{color:"#000"}}>Local File Management</span></Title>
    //                 <Text type="secondary">Manage your local files and documents</Text>
    //               </div>

    //               <div style={{ marginBottom: '24px' }}>
    //                 <Row gutter={[16, 16]}>
    //                   <Col xs={24} sm={8}>
    //                     <Statistic
    //                       title="Total Files"
    //                       value={localFiles.length}
    //                       prefix={<FileOutlined />}
    //                     />
    //                   </Col>
    //                   <Col xs={24} sm={8}>
    //                     <Statistic
    //                       title="Total Size"
    //                       value={localFiles.reduce((total, file) => total + (file.size || 0), 0)}
    //                       suffix="KB"
    //                       prefix={<DatabaseOutlined />}
    //                     />
    //                   </Col>
    //                   <Col xs={24} sm={8}>
    //                     <Statistic
    //                       title="Last Updated"
    //                       value={localFiles.length > 0 ? new Date(Math.max(...localFiles.map(f => new Date(f.lastModified || Date.now())))).toLocaleDateString() : 'N/A'}
    //                       prefix={<ClockCircleOutlined />}
    //                     />
    //                   </Col>
    //                 </Row>
    //               </div>

    //               <div style={{ marginBottom: '16px' }}>
    //                 <Row gutter={[8, 8]}>
    //                   <Col>
    //                     <Button 
    //                       type="primary" 
    //                       icon={<UploadOutlined />}
    //                       onClick={() => document.getElementById('file-upload').click()}
    //                     >
    //                       Upload Files
    //                     </Button>
    //                     <input
    //                       id="file-upload"
    //                       type="file"
    //                       multiple
    //                       style={{ display: 'none' }}
    //                       onChange={handleFileUpload}
    //                     />
    //                   </Col>
    //                   <Col>
    //                     <Button 
    //                       icon={<FolderOpenOutlined />}
    //                       onClick={handleCreateFolder}
    //                     >
    //                       New Folder
    //                     </Button>
    //                   </Col>
    //                   <Col>
    //                     <Button 
    //                       icon={<ReloadOutlined />}
    //                       onClick={handleRefreshFiles}
    //                     >
    //                       Refresh
    //                     </Button>
    //                   </Col>
    //                 </Row>
    //               </div>

    //               <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px', maxHeight: '300px', overflow: 'auto' }}>
    //                 {localFiles.length === 0 ? (
    //                   <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
    //                     <FileOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
    //                     <div>No files found</div>
    //                     <div style={{ fontSize: '12px' }}>Upload files to get started</div>
    //                   </div>
    //                 ) : (
    //                   <List
    //                     dataSource={localFiles}
    //                     renderItem={(file) => (
    //                       <List.Item
    //                         actions={[
    //                           <Button 
    //                             type="text" 
    //                             icon={<DownloadOutlined />} 
    //                             onClick={() => handleDownloadFile(file)}
    //                             title="Download"
    //                           />,
    //                           <Button 
    //                             type="text" 
    //                             icon={<ShareAltOutlined />} 
    //                             onClick={() => handleShareFile(file)}
    //                             title="Share"
    //                           />,
    //                           <Popconfirm
    //                             title="Delete file"
    //                             description="Are you sure you want to delete this file?"
    //                             onConfirm={() => handleDeleteFile(file.id)}
    //                             okText="Yes"
    //                             cancelText="No"
    //                           >
    //                             <Button 
    //                               type="text" 
    //                               icon={<DeleteOutlined />} 
    //                               danger
    //                               title="Delete"
    //                             />
    //                           </Popconfirm>
    //                         ]}
    //                       >
    //                         <List.Item.Meta
    //                           avatar={
    //                             file.type?.startsWith('image/') ? 
    //                               <FileImageOutlined style={{ fontSize: '20px', color: '#52c41a' }} /> :
    //                             file.type?.includes('pdf') ?
    //                               <FilePdfOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} /> :
    //                             file.type?.includes('text') ?
    //                               <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} /> :
    //                               <FileOutlined style={{ fontSize: '20px', color: '#666' }} />
    //                           }
    //                           title={file.name}
    //                           description={
    //                             <div>
    //                               <Text type="secondary" style={{ fontSize: '12px' }}>
    //                                 {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'} • 
    //                                 {file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown date'}
    //                               </Text>
    //                             </div>
    //                           }
    //                         />
    //                       </List.Item>
    //                     )}
    //                   />
    //                 )}
    //               </div>
    //             </Card> */}

    //       </>
    //     )
    // }
  ];

  return (
    <Layout>

      <div className={`search-page light-theme`}>
        <div className="hero-section1">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="hero-content">
            <Title level={1} className="hero-title" style={{ color: "#fff" }}>
              {isAuthenticated ? `Welcome back!` : "Account Setting"}
            </Title>
            <Paragraph className="hero-subtitle">Set your personal Information, Page and More.</Paragraph>
          </motion.div>
        </div>


        <div className="scholar-tabs">
          <div className="scholar-container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
                className="modern-tabs"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;