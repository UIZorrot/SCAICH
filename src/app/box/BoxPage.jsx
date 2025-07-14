import React, { useState, useEffect, useCallback } from "react";
import { Button, Typography, Avatar, Modal, message, Tabs, Divider, Upload, Form, Input, Switch, Progress, Select, Tag } from "antd";
import {
  CloudUploadOutlined,
  HeartOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
  InboxOutlined,
  LinkOutlined,
  LoadingOutlined,
  MessageOutlined,
  BookOutlined,
  TagOutlined,
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import Layout from "../../components/layout/Layout";

import { uploadToIrys, validateFileType, validateFileSize } from "../../utils/irysUploader";
import ChatModal from "../../components/chatpage";
import "./BoxPage.css";

// 生成学者主页HTML模板
const generateProfileHTML = (profileData, user) => {
  const displayName = profileData.displayName || `${user.firstName} ${user.lastName}`;
  const email = user.emailAddresses?.[0]?.emailAddress || "";

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${displayName} - 学者主页</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }

        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            border: 4px solid rgba(255,255,255,0.3);
        }

        .name {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .position {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 0.25rem;
        }

        .institution {
            font-size: 1.1rem;
            opacity: 0.8;
            margin-bottom: 0.5rem;
        }

        .email {
            font-size: 1rem;
            opacity: 0.8;
        }

        .content {
            padding: 2rem;
        }

        .section {
            margin-bottom: 2rem;
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f0f0f0;
        }

        .section-content {
            font-size: 1rem;
            line-height: 1.8;
            color: #555;
        }

        .links {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .link {
            color: #667eea;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border: 2px solid #667eea;
            border-radius: 25px;
            transition: all 0.3s ease;
        }

        .link:hover {
            background: #667eea;
            color: white;
        }

        .contributions {
            list-style: none;
        }

        .contributions li {
            padding: 0.75rem 0;
            border-bottom: 1px solid #f0f0f0;
            position: relative;
            padding-left: 1.5rem;
        }

        .contributions li:before {
            content: "▶";
            color: #667eea;
            position: absolute;
            left: 0;
        }

        .footer {
            text-align: center;
            padding: 2rem;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .header {
                padding: 2rem 1rem;
            }

            .name {
                font-size: 2rem;
            }

            .content {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="avatar">
                ${profileData.avatarUrl || user.imageUrl ? `<img src="${profileData.avatarUrl || user.imageUrl}" alt="${displayName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : "👤"}
            </div>
            <h1 class="name">${displayName}</h1>
            ${profileData.position ? `<div class="position">${profileData.position}</div>` : ""}
            ${profileData.institution ? `<div class="institution">${profileData.institution}</div>` : ""}
            <div class="email">${email}</div>
        </div>

        <div class="content">
            ${
              profileData.researchFields
                ? `
            <div class="section">
                <h2 class="section-title">研究领域</h2>
                <div class="section-content">${profileData.researchFields}</div>
            </div>
            `
                : ""
            }

            ${
              profileData.bio
                ? `
            <div class="section">
                <h2 class="section-title">个人简介</h2>
                <div class="section-content">${profileData.bio}</div>
            </div>
            `
                : ""
            }

            ${
              profileData.contributions && profileData.contributions.length > 0
                ? `
            <div class="section">
                <h2 class="section-title">主要工作与贡献</h2>
                <ul class="contributions">
                    ${profileData.contributions.map((contribution) => `<li>${contribution}</li>`).join("")}
                </ul>
            </div>
            `
                : ""
            }

            ${
              profileData.website || profileData.orcid
                ? `
            <div class="section">
                <h2 class="section-title">相关链接</h2>
                <div class="links">
                    ${profileData.website ? `<a href="${profileData.website}" target="_blank" class="link">个人网站</a>` : ""}
                    ${profileData.orcid ? `<a href="https://orcid.org/${profileData.orcid}" target="_blank" class="link">ORCID</a>` : ""}
                </div>
            </div>
            `
                : ""
            }
        </div>

        <div class="footer">
            <p>此页面由 SCAI Box 生成 | 更新时间: ${new Date().toLocaleDateString("zh-CN")}</p>
        </div>
    </div>
</body>
</html>
  `.trim();
};

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 收藏管理工具函数
const getFavorites = () => {
  try {
    const favorites = localStorage.getItem("scai_favorites");
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
};

const removeFromFavorites = (doi) => {
  try {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter((fav) => fav.doi !== doi);
    localStorage.setItem("scai_favorites", JSON.stringify(updatedFavorites));
    return updatedFavorites;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return getFavorites();
  }
};

const BoxPage = () => {
  const { isSignedIn, user } = useUser();

  // 只使用光明模式
  const currentTheme = {
    name: "light",
    isDark: false,
  };
  const [activeTab, setActiveTab] = useState("favorites");
  const [favorites, setFavorites] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  // 初始化数据
  useEffect(() => {
    if (isSignedIn) {
      loadFavorites();
      loadMyUploads();
    }
  }, [isSignedIn, user?.id]);

  // 监听收藏更新事件
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      loadFavorites();
    };

    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => {
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
    };
  }, []);

  const loadFavorites = () => {
    const favs = getFavorites();
    setFavorites(favs);
  };

  const loadMyUploads = () => {
    // 从localStorage获取用户的上传记录
    try {
      const uploads = localStorage.getItem(`scai_uploads_${user?.id}`);
      setMyUploads(uploads ? JSON.parse(uploads) : []);
    } catch (error) {
      console.error("Error loading uploads:", error);
      setMyUploads([]);
    }
  };

  const handleRemoveFavorite = (doi) => {
    const updatedFavorites = removeFromFavorites(doi);
    setFavorites(updatedFavorites);
    message.success("已从收藏中移除");
  };

  const handleRemoveUpload = (upload) => {
    try {
      const uploads = localStorage.getItem(`scai_uploads_${user?.id}`);
      const uploadList = uploads ? JSON.parse(uploads) : [];

      // 从列表中移除指定的上传记录
      const updatedUploads = uploadList.filter((item) => item.txId !== upload.txId);

      // 保存更新后的列表
      localStorage.setItem(`scai_uploads_${user?.id}`, JSON.stringify(updatedUploads));

      // 更新状态
      setMyUploads(updatedUploads);
    } catch (error) {
      console.error("Error removing upload:", error);
      message.error("移除失败，请重试");
    }
  };

  // Deep Research处理函数
  const handleDeepResearch = (paperId, source) => {
    console.log("Opening chat for paper:", paperId, "source:", source);
    setSelectedPaperId(paperId);
    setSelectedSource(source);
    setChatModalVisible(true);
  };

  const handleProfileRefresh = () => {
    setProfileRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Layout>
      <div className="box-page light-theme">
        {/* Hero Section */}
        <div className="hero-section1">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="hero-content">
            <Title level={1} className="hero-title" style={{ color: "#fff" }}>
              {isSignedIn ? `Welcome back, ${user?.firstName || "Scholar"}!` : "Welcome to SCAI Box"}
            </Title>
            <Paragraph className="hero-subtitle">Your personal academic workspace for managing research and publications.</Paragraph>
          </motion.div>
        </div>

        {/* Main Content */}
        <div
          className="main-content"
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
            {!isSignedIn ? (
              // 未登录时显示登录要求提示
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
                <Paragraph
                  style={{
                    color: "#ccc",
                    fontSize: 16,
                    marginBottom: 24,
                    maxWidth: 500,
                    margin: "0 auto 24px",
                  }}
                >
                  Please sign in to access your personalized academic workspace and manage your research materials.
                </Paragraph>

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
                    // 模拟点击右上角的登录按钮
                    const loginButton = document.querySelector(".login-btn");
                    if (loginButton) {
                      loginButton.click();
                    } else {
                      // 如果找不到登录按钮，显示提示信息
                      message.info("请使用页面右上角的登录按钮进行登录");
                    }
                  }}
                >
                  Sign In to Continue
                </Button>
              </div>
            ) : (
              <Tabs activeKey={activeTab} onChange={setActiveTab} size="large" style={{ marginBottom: "2rem" }} className="scholar-tabs">
                <TabPane
                  tab={
                    <span>
                      <HeartOutlined />
                      我的收藏 ({favorites.length})
                    </span>
                  }
                  key="favorites"
                >
                  <FavoritesTab favorites={favorites} onRemove={handleRemoveFavorite} onDeepResearch={handleDeepResearch} currentTheme={currentTheme} />
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <CloudUploadOutlined />
                      我的上传 ({myUploads.length})
                    </span>
                  }
                  key="uploads"
                >
                  <UploadsTab uploads={myUploads} onUpload={() => setUploadModalVisible(true)} onRemoveUpload={handleRemoveUpload} currentTheme={currentTheme} />
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <UserOutlined />
                      学者主页
                    </span>
                  }
                  key="profile"
                >
                  <ProfileTab user={user} onEdit={() => setProfileModalVisible(true)} onRefresh={profileRefreshTrigger} currentTheme={currentTheme} />
                </TabPane>
              </Tabs>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        <UploadModal visible={uploadModalVisible} onClose={() => setUploadModalVisible(false)} onSuccess={loadMyUploads} user={user} currentTheme={currentTheme} />

        {/* Profile Modal */}
        <ProfileModal visible={profileModalVisible} onClose={() => setProfileModalVisible(false)} onSuccess={handleProfileRefresh} user={user} />

        {/* ChatModal for Deep Research */}
        {selectedPaperId && (
          <ChatModal
            visible={chatModalVisible}
            onClose={() => {
              setChatModalVisible(false);
              setSelectedPaperId(null);
              setSelectedSource(null);
            }}
            paperId={selectedPaperId}
            source={selectedSource}
          />
        )}
      </div>
    </Layout>
  );
};

// Tab组件定义
const FavoritesTab = ({ favorites, onRemove, currentTheme, onDeepResearch }) => {
  const [bibtexModalVisible, setBibtexModalVisible] = useState(false);
  const [currentBibtex, setCurrentBibtex] = useState("");
  const [currentPaperTitle, setCurrentPaperTitle] = useState("");

  // 分类和标签管理状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [newTag, setNewTag] = useState("");

  // 分类管理状态
  const [categories, setCategories] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("blue");

  // 预设颜色选项
  const colorOptions = [
    { value: "blue", label: "蓝色", color: "#1890ff" },
    { value: "green", label: "绿色", color: "#52c41a" },
    { value: "orange", label: "橙色", color: "#fa8c16" },
    { value: "red", label: "红色", color: "#f5222d" },
    { value: "purple", label: "紫色", color: "#722ed1" },
    { value: "cyan", label: "青色", color: "#13c2c2" },
    { value: "magenta", label: "品红", color: "#eb2f96" },
    { value: "volcano", label: "火山", color: "#fa541c" },
  ];

  // 从收藏论文中提取所有标签
  const allTags = [...new Set(favorites.flatMap((paper) => paper.tags || []))];

  // 初始化分类数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载用户自定义分类
  const loadCategories = () => {
    try {
      const savedCategories = localStorage.getItem("scai_categories");
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      } else {
        // 初始化默认分类
        const defaultCategories = [{ id: "uncategorized", name: "未分类", color: "gray", isDefault: true }];
        setCategories(defaultCategories);
        localStorage.setItem("scai_categories", JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([{ id: "uncategorized", name: "未分类", color: "gray", isDefault: true }]);
    }
  };

  // 保存分类到localStorage
  const saveCategories = (newCategories) => {
    try {
      localStorage.setItem("scai_categories", JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error("Error saving categories:", error);
      message.error("保存分类失败");
    }
  };

  // 过滤论文
  const filteredFavorites = favorites.filter((paper) => {
    const matchesKeyword = !searchKeyword || paper.title.toLowerCase().includes(searchKeyword.toLowerCase()) || paper.author.toLowerCase().includes(searchKeyword.toLowerCase()) || (paper.abstract && paper.abstract.toLowerCase().includes(searchKeyword.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || paper.category === selectedCategory || (!paper.category && selectedCategory === "uncategorized");

    const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => paper.tags && paper.tags.includes(tag));

    return matchesKeyword && matchesCategory && matchesTags;
  });

  // 获取完整的分类选项（包含"全部"选项）
  const categoryOptions = [{ id: "all", name: "全部论文", color: "blue", icon: <FolderOutlined /> }, ...categories];
  // 查看论文处理函数
  const handleViewPaper = (paper) => {
    if (paper.url) {
      window.open(paper.url, "_blank");
    } else if (paper.doi) {
      // 构建DOI链接
      const doiUrl = `https://doi.org/${paper.doi}`;
      window.open(doiUrl, "_blank");
    } else {
      message.warning("无法找到论文链接");
    }
  };

  // 检查论文是否有全文可用
  const hasFulltext = (paper) => {
    // 参考搜索页面的逻辑：检查是否有scihub或arxiv来源
    return paper.source === "scihub" || paper.source === "arxiv" || paper.scinet || paper.is_oa || (paper.doi && paper.doi.toLowerCase().includes("arxiv")) || (paper.url && paper.url.toLowerCase().includes("arxiv"));
  };

  // Deep Research处理函数
  const handleDeepResearch = (paper) => {
    // 检查是否有全文可用
    if (!hasFulltext(paper)) {
      message.warning("该论文暂无全文可用，无法进行深度研究");
      return;
    }

    // 确定正确的source参数
    let source = "scihub"; // 默认使用scihub

    // 如果论文有DOI，尝试判断最佳source
    if (paper.doi) {
      // 如果DOI包含arxiv，使用arxiv
      if (paper.doi.toLowerCase().includes("arxiv") || (paper.url && paper.url.toLowerCase().includes("arxiv"))) {
        source = "arxiv";
      }
      // 如果有scinet链接，使用scihub（因为scinet通常提供scihub链接）
      else if (paper.scinet) {
        source = "scihub";
      }
    }

    console.log("Deep Research for paper:", paper.title, "DOI:", paper.doi, "Source:", source);

    // 在当前页面打开ChatModal
    onDeepResearch(paper.doi, source);
  };

  // BibTeX处理函数
  const handleBibTexClick = async (paper) => {
    try {
      const cleanDoi = paper.doi.replace(/^https?:\/\/doi\.org\//i, "");

      // 使用CrossRef API获取BibTeX
      const response = await fetch(`https://api.crossref.org/works/${cleanDoi}/transform/application/x-bibtex`, {
        headers: {
          Accept: "application/x-bibtex",
        },
      });

      if (response.ok) {
        const bibtex = await response.text();

        // 设置弹窗内容并显示
        setCurrentBibtex(bibtex);
        setCurrentPaperTitle(paper.title);
        setBibtexModalVisible(true);
      } else {
        throw new Error("Failed to fetch BibTeX");
      }
    } catch (error) {
      console.error("Error fetching BibTeX:", error);
      message.error("获取BibTeX引用失败");
    }
  };

  // 复制BibTeX到剪贴板
  const copyBibtexToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentBibtex);
      } else {
        // 降级方案
        const textarea = document.createElement("textarea");
        textarea.value = currentBibtex;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      message.success("BibTeX已复制到剪贴板！");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      message.error("复制BibTeX失败");
    }
  };

  // 标签管理函数
  const handleEditTags = (paper) => {
    setCurrentPaper(paper);
    setTagModalVisible(true);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    const updatedPaper = {
      ...currentPaper,
      tags: [...(currentPaper.tags || []), newTag.trim()],
    };

    // 更新localStorage中的收藏数据
    updatePaperInFavorites(updatedPaper);
    setNewTag("");
    message.success("标签添加成功");
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedPaper = {
      ...currentPaper,
      tags: (currentPaper.tags || []).filter((tag) => tag !== tagToRemove),
    };

    updatePaperInFavorites(updatedPaper);
    message.success("标签移除成功");
  };

  const handleCategoryChange = (paper, newCategory) => {
    const updatedPaper = {
      ...paper,
      category: newCategory,
    };

    updatePaperInFavorites(updatedPaper);
    message.success("分类更新成功");
  };

  // 更新收藏中的论文数据
  const updatePaperInFavorites = (updatedPaper) => {
    try {
      const favorites = JSON.parse(localStorage.getItem("scai_favorites") || "[]");
      const updatedFavorites = favorites.map((fav) => (fav.doi === updatedPaper.doi ? updatedPaper : fav));
      localStorage.setItem("scai_favorites", JSON.stringify(updatedFavorites));

      // 触发父组件重新加载收藏数据
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  // 分类管理函数
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      message.error("请输入分类名称");
      return;
    }

    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, newCategory];
    saveCategories(updatedCategories);
    setNewCategoryName("");
    setNewCategoryColor("blue");
    message.success("分类创建成功");
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setCategoryModalVisible(true);
  };

  const handleUpdateCategory = () => {
    if (!newCategoryName.trim()) {
      message.error("请输入分类名称");
      return;
    }

    const updatedCategories = categories.map((cat) => (cat.id === editingCategory.id ? { ...cat, name: newCategoryName.trim(), color: newCategoryColor } : cat));

    saveCategories(updatedCategories);
    setCategoryModalVisible(false);
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryColor("blue");
    message.success("分类更新成功");
  };

  const handleDeleteCategory = (categoryId) => {
    const categoryToDelete = categories.find((cat) => cat.id === categoryId);

    if (categoryToDelete?.isDefault) {
      message.error("默认分类不能删除");
      return;
    }

    Modal.confirm({
      title: "确认删除分类",
      content: '删除分类后，该分类下的论文将移动到"未分类"。确定要删除吗？',
      onOk: () => {
        // 将该分类下的论文移动到未分类
        const favoritesToUpdate = favorites.filter((paper) => paper.category === categoryId);
        favoritesToUpdate.forEach((paper) => {
          updatePaperInFavorites({ ...paper, category: "uncategorized" });
        });

        // 删除分类
        const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
        saveCategories(updatedCategories);

        // 如果当前选中的分类被删除，切换到全部
        if (selectedCategory === categoryId) {
          setSelectedCategory("all");
        }

        message.success("分类删除成功");
      },
    });
  };
  return (
    <div>
      {/* 搜索和过滤工具栏 */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          background: currentTheme.isDark ? "rgba(42, 42, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
          border: `1px solid ${currentTheme.isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
          borderRadius: "12px",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* 搜索框 */}
          <Input placeholder="搜索论文标题、作者或摘要..." prefix={<SearchOutlined />} value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ minWidth: "300px", flex: 1 }} allowClear />

          {/* 分类选择 */}
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ minWidth: "180px" }}
            placeholder="选择分类"
            dropdownRender={(menu) => (
              <div>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ padding: "8px", display: "flex", gap: "8px" }}>
                  <Button type="text" icon={<PlusOutlined />} onClick={() => setCategoryModalVisible(true)} style={{ flex: 1 }}>
                    管理分类
                  </Button>
                </div>
              </div>
            )}
          >
            {categoryOptions.map((cat) => (
              <Select.Option key={cat.id} value={cat.id}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>
                    <FolderOutlined style={{ color: colorOptions.find((c) => c.value === cat.color)?.color || "#1890ff", marginRight: "8px" }} />
                    {cat.name}
                  </span>
                  {cat.id !== "all" && !cat.isDefault && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(cat);
                        }}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                      />
                    </div>
                  )}
                </div>
              </Select.Option>
            ))}
          </Select>

          {/* 标签过滤 */}
          <Select mode="multiple" value={selectedTags} onChange={setSelectedTags} placeholder="筛选标签" style={{ minWidth: "200px" }} maxTagCount={2}>
            {allTags.map((tag) => (
              <Select.Option key={tag} value={tag}>
                <TagOutlined /> {tag}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 统计信息 */}
        <div
          style={{
            marginTop: "1rem",
            color: currentTheme.isDark ? "#94a3b8" : "#64748b",
            fontSize: "14px",
          }}
        >
          显示 {filteredFavorites.length} / {favorites.length} 篇论文
          {selectedTags.length > 0 && (
            <span style={{ marginLeft: "1rem" }}>
              已选标签:{" "}
              {selectedTags.map((tag) => (
                <Tag key={tag} closable onClose={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}>
                  {tag}
                </Tag>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* 论文列表 */}
      {filteredFavorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HeartOutlined />
          </div>
          <Title
            level={3}
            style={{
              color: currentTheme.isDark ? "#cbd5e1" : "#475569",
              marginBottom: "1rem",
              fontWeight: 600,
            }}
          >
            {favorites.length === 0 ? "暂无收藏论文" : "没有找到匹配的论文"}
          </Title>
          <Paragraph
            style={{
              color: currentTheme.isDark ? "#94a3b8" : "#64748b",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            {favorites.length === 0 ? (
              <>
                开始探索学术论文，将感兴趣的研究添加到您的收藏夹中，
                <br />
                构建您的个人学术资料库。
              </>
            ) : (
              "尝试调整搜索条件或清除筛选器"
            )}
          </Paragraph>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {filteredFavorites.map((paper, index) => (
            <motion.div key={paper.doi || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="modern-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ flex: 1, marginRight: "1rem" }}>
                  <Title
                    level={4}
                    style={{
                      color: currentTheme.isDark ? "#f1f5f9" : "#1e293b",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      lineHeight: "1.4",
                    }}
                  >
                    {paper.title}
                  </Title>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <Text
                      style={{
                        color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {paper.author} • {paper.year} • {paper.location}
                    </Text>
                  </div>

                  {/* 分类和标签显示 */}
                  <div style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                    {paper.category && (
                      <Tag color={categories.find((cat) => cat.id === paper.category)?.color || "blue"} style={{ margin: 0 }}>
                        <FolderOutlined style={{ marginRight: "4px" }} />
                        {categories.find((cat) => cat.id === paper.category)?.name || "未知分类"}
                      </Tag>
                    )}
                    {(paper.tags || []).map((tag) => (
                      <Tag key={tag} color="green" style={{ margin: 0 }}>
                        <TagOutlined style={{ marginRight: "4px" }} />
                        {tag}
                      </Tag>
                    ))}

                    {/* 全文状态提示 */}
                    {hasFulltext(paper) ? (
                      <Tag color="green" style={{ margin: 0 }}>
                        <FileTextOutlined style={{ marginRight: "4px" }} />
                        Fulltext available
                      </Tag>
                    ) : (
                      <Tag color="orange" style={{ margin: 0 }}>
                        <FileTextOutlined style={{ marginRight: "4px" }} />
                        No fulltext
                      </Tag>
                    )}
                  </div>

                  <Text
                    style={{
                      color: currentTheme.isDark ? "#cbd5e1" : "#475569",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      display: "block",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {paper.abstract.substring(0, 180)}...
                  </Text>

                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      color: currentTheme.isDark ? "#64748b" : "#94a3b8",
                    }}
                  >
                    收藏于 {new Date(paper.favoriteDate).toLocaleDateString("zh-CN")}
                  </Text>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "140px" }}>
                  <Button icon={<EyeOutlined />} className="modern-btn modern-btn-secondary" size="small" onClick={() => handleViewPaper(paper)}>
                    查看论文
                  </Button>
                  <Button icon={<MessageOutlined />} className="modern-btn modern-btn-secondary" size="small" disabled={!hasFulltext(paper)} onClick={() => handleDeepResearch(paper)} title={!hasFulltext(paper) ? "该论文暂无全文可用" : "深度研究论文"}>
                    Deep Research
                  </Button>
                  <Button icon={<BookOutlined />} className="modern-btn modern-btn-secondary" size="small" onClick={() => handleBibTexClick(paper)}>
                    BibTeX
                  </Button>
                  <Button icon={<EditOutlined />} className="modern-btn modern-btn-secondary" size="small" onClick={() => handleEditTags(paper)}>
                    编辑标签
                  </Button>
                  <Button danger icon={<DeleteOutlined />} onClick={() => onRemove(paper.doi)} className="modern-btn modern-btn-danger" size="small">
                    移除收藏
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* BibTeX弹窗 */}
          <Modal
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOutlined style={{ color: "#1890ff" }} />
                <span>BibTeX Citation</span>
              </div>
            }
            open={bibtexModalVisible}
            onCancel={() => setBibtexModalVisible(false)}
            footer={[
              <Button key="copy" type="primary" onClick={copyBibtexToClipboard}>
                Copy to Clipboard
              </Button>,
              <Button key="close" onClick={() => setBibtexModalVisible(false)}>
                Close
              </Button>,
            ]}
            width={700}
            centered
          >
            <div style={{ marginBottom: "1rem" }}>
              <Title level={5} style={{ margin: 0, color: "#666" }}>
                Paper: {currentPaperTitle}
              </Title>
            </div>

            <div
              style={{
                background: currentTheme.isDark ? "#1f1f1f" : "#f5f5f5",
                border: `1px solid ${currentTheme.isDark ? "#444" : "#d9d9d9"}`,
                borderRadius: "6px",
                padding: "1rem",
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: "13px",
                lineHeight: "1.5",
                maxHeight: "400px",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {currentBibtex || "Loading BibTeX..."}
            </div>

            <div style={{ marginTop: "1rem", fontSize: "12px", color: "#999" }}>
              <Text type="secondary">Citation format provided by CrossRef API</Text>
            </div>
          </Modal>
        </div>
      )}

      {/* 标签编辑弹窗 */}
      <Modal
        title="编辑论文标签和分类"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTagModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
        centered
      >
        {currentPaper && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <Title level={5}>论文: {currentPaper.title}</Title>
            </div>

            {/* 分类选择 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <Text strong>分类:</Text>
              <Select value={currentPaper.category || "uncategorized"} onChange={(value) => handleCategoryChange(currentPaper, value)} style={{ width: "100%", marginTop: "0.5rem" }}>
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    <FolderOutlined style={{ color: colorOptions.find((c) => c.value === cat.color)?.color || "#1890ff", marginRight: "8px" }} />
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* 标签管理 */}
            <div>
              <Text strong>标签:</Text>
              <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
                {(currentPaper.tags || []).map((tag) => (
                  <Tag key={tag} closable onClose={() => handleRemoveTag(tag)} style={{ marginBottom: "0.5rem" }}>
                    {tag}
                  </Tag>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Input placeholder="添加新标签" value={newTag} onChange={(e) => setNewTag(e.target.value)} onPressEnter={handleAddTag} style={{ flex: 1 }} />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
                  添加
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 分类管理弹窗 */}
      <Modal
        title="管理分类文件夹"
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setEditingCategory(null);
          setNewCategoryName("");
          setNewCategoryColor("blue");
        }}
        footer={null}
        width={700}
        centered
      >
        <div>
          {/* 创建新分类 */}
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              background: currentTheme.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: "8px",
            }}
          >
            <Title level={5}>{editingCategory ? "编辑分类" : "创建新分类"}</Title>
            <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
              <div style={{ flex: 1 }}>
                <Text>分类名称:</Text>
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="输入分类名称" onPressEnter={editingCategory ? handleUpdateCategory : handleCreateCategory} />
              </div>
              <div>
                <Text>颜色:</Text>
                <Select value={newCategoryColor} onChange={setNewCategoryColor} style={{ width: "120px" }}>
                  {colorOptions.map((color) => (
                    <Select.Option key={color.value} value={color.value}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: color.color,
                            borderRadius: "2px",
                          }}
                        />
                        {color.label}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <Button type="primary" onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                {editingCategory ? "更新" : "创建"}
              </Button>
              {editingCategory && (
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName("");
                    setNewCategoryColor("blue");
                  }}
                >
                  取消
                </Button>
              )}
            </div>
          </div>

          {/* 现有分类列表 */}
          <div>
            <Title level={5}>现有分类</Title>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    border: `1px solid ${currentTheme.isDark ? "#444" : "#d9d9d9"}`,
                    borderRadius: "6px",
                    background: currentTheme.isDark ? "rgba(255, 255, 255, 0.02)" : "#fafafa",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        backgroundColor: colorOptions.find((c) => c.value === category.color)?.color || "#1890ff",
                        borderRadius: "3px",
                      }}
                    />
                    <FolderOutlined style={{ color: colorOptions.find((c) => c.value === category.color)?.color || "#1890ff" }} />
                    <Text strong>{category.name}</Text>
                    {category.isDefault && (
                      <Tag size="small" color="orange">
                        默认
                      </Tag>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {favorites.filter((p) => p.category === category.id).length} 篇论文
                    </Text>
                    {!category.isDefault && (
                      <>
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditCategory(category)} />
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(category.id)} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const UploadsTab = ({ uploads, onUpload, currentTheme, onRemoveUpload }) => {
  const handleViewDocument = (upload) => {
    if (upload.url) {
      window.open(upload.url, "_blank");
    } else {
      // 使用txId构建URL
      const url = `/irys/${upload.txId}`;
      window.open(url, "_blank");
    }
  };

  const handleCopyUrl = (upload) => {
    const url = upload.url || `${window.location.origin}/irys/${upload.txId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        message.success("URL copied to clipboard");
      })
      .catch(() => {
        message.error("Failed to copy URL");
      });
  };

  const handleRemoveUpload = (upload) => {
    const actionText = upload.uploadMode === "irys" ? "隐藏" : "删除";
    const confirmText = upload.uploadMode === "irys" ? "确定要隐藏这个文档吗？文档仍会保存在Irys网络上，但不会在此处显示。" : "确定要删除这个文档吗？此操作不可撤销。";

    Modal.confirm({
      title: `${actionText}文档`,
      content: confirmText,
      okText: actionText,
      cancelText: "取消",
      okType: upload.uploadMode === "irys" ? "default" : "danger",
      onOk: () => {
        onRemoveUpload(upload);
        message.success(`文档已${actionText}`);
      },
    });
  };

  return (
    <div>
      {uploads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CloudUploadOutlined />
          </div>
          <Title
            level={3}
            style={{
              color: currentTheme.isDark ? "#cbd5e1" : "#475569",
              marginBottom: "1rem",
              fontWeight: 600,
            }}
          >
            暂无上传文档
          </Title>
          <Paragraph
            style={{
              color: currentTheme.isDark ? "#94a3b8" : "#64748b",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            将您的研究论文和学术文档上传到去中心化存储网络，
            <br />
            享受永久保存和全球访问的便利。
          </Paragraph>
          {/* <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<CloudUploadOutlined />}
              onClick={onUpload}
              className="modern-btn modern-btn-primary"
              style={{
                height: '48px',
                padding: '0 2rem',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              上传新文档
            </Button>
          </div> */}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {uploads.map((upload, index) => (
            <motion.div key={upload.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="modern-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div
                  style={{
                    background: upload.isPrivate ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: "12px",
                    padding: "12px",
                    color: "white",
                    fontSize: "20px",
                    minWidth: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileTextOutlined />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <Title
                      level={4}
                      style={{
                        color: currentTheme.isDark ? "#f1f5f9" : "#1e293b",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      {upload.title}
                    </Title>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewDocument(upload)} className="modern-btn modern-btn-primary" size="small">
                        查看
                      </Button>
                      <Button icon={<LinkOutlined />} onClick={() => handleCopyUrl(upload)} className="modern-btn modern-btn-secondary" size="small">
                        复制链接
                      </Button>
                      <Button icon={upload.uploadMode === "irys" ? <EyeInvisibleOutlined /> : <DeleteOutlined />} onClick={() => handleRemoveUpload(upload)} className="modern-btn modern-btn-secondary" size="small" danger={upload.uploadMode !== "irys"}>
                        {upload.uploadMode === "irys" ? "隐藏" : "删除"}
                      </Button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <Text
                        style={{
                          color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        {upload.isPrivate ? <LockOutlined style={{ marginRight: "4px" }} /> : <UnlockOutlined style={{ marginRight: "4px" }} />}
                        {upload.isPrivate ? "私人文档" : "公开文档"}
                      </Text>

                      {/* 上传模式标识 */}
                      <Text
                        style={{
                          color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        {upload.uploadMode === "irys" ? (
                          <>
                            <CloudUploadOutlined style={{ marginRight: "4px", color: "#52c41a" }} />
                            Irys网络
                          </>
                        ) : (
                          <>
                            <FileTextOutlined style={{ marginRight: "4px", color: "#fa8c16" }} />
                            本地存储
                          </>
                        )}
                      </Text>

                      <Text
                        style={{
                          color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        上传于 {new Date(upload.uploadDate).toLocaleDateString("zh-CN")}
                      </Text>
                    </div>
                  </div>

                  {upload.description && (
                    <Paragraph
                      style={{
                        color: currentTheme.isDark ? "#cbd5e1" : "#475569",
                        fontSize: "14px",
                        marginBottom: "0.75rem",
                        lineHeight: "1.5",
                      }}
                    >
                      {upload.description}
                    </Paragraph>
                  )}

                  <Text
                    code
                    style={{
                      fontSize: "12px",
                      background: currentTheme.isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.1)",
                      color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                      border: "none",
                      borderRadius: "6px",
                      padding: "2px 6px",
                    }}
                  >
                    TX: {upload.txId}
                  </Text>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
        <Button
          type="primary"
          size="large"
          icon={<CloudUploadOutlined />}
          onClick={onUpload}
          className="modern-btn modern-btn-primary"
          style={{
            height: "48px",
            padding: "0 2rem",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          上传新文档
        </Button>
      </div>
    </div>
  );
};

const ProfileTab = ({ user, onEdit, onRefresh, currentTheme }) => {
  const [profileData, setProfileData] = useState(null);
  const [profilePageUrl, setProfilePageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadProfileData = useCallback(() => {
    if (user?.id) {
      const savedProfile = localStorage.getItem(`scai_profile_${user.id}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }

      // 检查是否已上传学者主页
      const savedPageUrl = localStorage.getItem(`scai_profile_page_${user.id}`);
      if (savedPageUrl) {
        setProfilePageUrl(savedPageUrl);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // 监听刷新触发器
  useEffect(() => {
    if (onRefresh) {
      loadProfileData();
    }
  }, [onRefresh, loadProfileData]);

  const handleUploadProfile = async () => {
    if (!profileData) {
      message.warning("请先完善资料再上传学者主页");
      return;
    }

    setUploading(true);
    try {
      // 生成HTML模板
      const htmlContent = generateProfileHTML(profileData, user);

      // 创建HTML文件
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const htmlFile = new File([htmlBlob], `${user.firstName}_${user.lastName}_profile.html`, { type: "text/html" });

      // 上传到Irys
      const result = await uploadToIrys(htmlFile, {
        title: `${profileData.displayName || `${user.firstName} ${user.lastName}`} - 学者主页`,
        description: "学者个人主页",
        userId: user.id,
        isPrivate: false,
        uploadMode: "irys",
      });

      if (result.success) {
        const pageUrl = result.url;
        setProfilePageUrl(pageUrl);
        localStorage.setItem(`scai_profile_page_${user.id}`, pageUrl);
        message.success("学者主页上传成功！");
      } else {
        throw new Error(result.error || "上传失败");
      }
    } catch (error) {
      console.error("Profile upload error:", error);
      message.error("上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewProfile = () => {
    if (profilePageUrl) {
      window.open(profilePageUrl, "_blank");
    }
  };

  return (
    <div className="modern-card" style={{ padding: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Avatar size={100} src={profileData?.avatarUrl || user?.imageUrl} icon={!(profileData?.avatarUrl || user?.imageUrl) && <UserOutlined />} className="profile-avatar" style={{ marginBottom: "1rem" }} />
        <Title level={2} style={{ color: currentTheme.isDark ? "#fff" : "#333" }}>
          {profileData?.displayName || `${user?.firstName} ${user?.lastName}`}
        </Title>
        {profileData?.position && <Text style={{ color: currentTheme.isDark ? "#ccc" : "#666", display: "block", marginBottom: "0.5rem" }}>{profileData.position}</Text>}
        {profileData?.institution && <Text style={{ color: currentTheme.isDark ? "#ccc" : "#666", display: "block", marginBottom: "0.5rem" }}>{profileData.institution}</Text>}
        <Text style={{ color: currentTheme.isDark ? "#ccc" : "#666" }}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
      </div>

      <Divider />

      {profileData?.researchFields && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Title level={5} style={{ color: currentTheme.isDark ? "#fff" : "#333" }}>
            研究领域
          </Title>
          <Paragraph style={{ color: currentTheme.isDark ? "#ccc" : "#666" }}>{profileData.researchFields}</Paragraph>
        </div>
      )}

      {profileData?.bio && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Title level={5} style={{ color: currentTheme.isDark ? "#fff" : "#333" }}>
            个人简介
          </Title>
          <Paragraph style={{ color: currentTheme.isDark ? "#ccc" : "#666" }}>{profileData.bio}</Paragraph>
        </div>
      )}

      {profileData?.contributions && profileData.contributions.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Title level={5} style={{ color: currentTheme.isDark ? "#fff" : "#333" }}>
            主要工作与贡献
          </Title>
          <div style={{ paddingLeft: "1rem" }}>
            {profileData.contributions.map((contribution, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "0.75rem",
                  position: "relative",
                  paddingLeft: "1.5rem",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    color: "#1890ff",
                    fontWeight: "bold",
                  }}
                >
                  ▶
                </span>
                <Text style={{ color: currentTheme.isDark ? "#ccc" : "#666" }}>{contribution}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {(profileData?.website || profileData?.orcid) && (
        <div style={{ marginBottom: "1.5rem" }}>
          <Title level={5} style={{ color: currentTheme.isDark ? "#fff" : "#333" }}>
            链接
          </Title>
          {profileData?.website && (
            <div style={{ marginBottom: "0.5rem" }}>
              <Text style={{ color: currentTheme.isDark ? "#ccc" : "#666" }}>
                其他个人网站:{" "}
                <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                  {profileData.website}
                </a>
              </Text>
            </div>
          )}
          {profileData?.orcid && (
            <div>
              <Text style={{ color: currentTheme.isDark ? "#ccc" : "#666" }}>
                ORCID:{" "}
                <a href={`https://orcid.org/${profileData.orcid}`} target="_blank" rel="noopener noreferrer">
                  {profileData.orcid}
                </a>
              </Text>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Button type="primary" icon={<EditOutlined />} onClick={onEdit} className="modern-btn modern-btn-primary" size="large">
          {profileData ? "编辑资料" : "完善资料"}
        </Button>

        {profileData && (
          <Button type="default" icon={<CloudUploadOutlined />} onClick={handleUploadProfile} loading={uploading} className="modern-btn modern-btn-secondary" size="large">
            {profilePageUrl ? "更新主页" : "上传主页"}
          </Button>
        )}

        {profilePageUrl && (
          <Button type="default" icon={<EyeOutlined />} onClick={handleViewProfile} className="modern-btn modern-btn-secondary" size="large">
            访问主页
          </Button>
        )}
      </div>
    </div>
  );
};

// Modal组件定义
const UploadModal = ({ visible, onClose, onSuccess, user }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [uploadMode, setUploadMode] = useState("irys"); // 'irys' 或 'local'
  const [fileType, setFileType] = useState("literature"); // 'literature' 或 'other'
  const [doiLoading, setDoiLoading] = useState(false);
  const [paperMetadata, setPaperMetadata] = useState(null);

  // DOI查询函数
  const handleDoiSearch = async (doi) => {
    if (!doi || !doi.trim()) {
      setPaperMetadata(null);
      return;
    }

    setDoiLoading(true);
    try {
      // 根据环境选择API端点
      const apiUrl = process.env.NODE_ENV === "development" ? `http://localhost:3001/api/paper-info` : "/api/paper-info";

      // 调用API查询DOI信息
      const response = await fetch(`${apiUrl}?doi=${encodeURIComponent(doi.trim())}`);

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          setPaperMetadata(data);
          // 自动填充表单字段
          form.setFieldsValue({
            title: data.title,
            description: data.abstract && data.abstract !== "Abstract Not Available" ? data.abstract.substring(0, 200) + "..." : "论文摘要",
            authors: data.author,
            year: data.year,
          });
          message.success("DOI信息获取成功");
        } else {
          setPaperMetadata(null);
          message.warning(data.error || "未找到该DOI的信息");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setPaperMetadata(null);
        message.error(errorData.error || "DOI查询失败");
      }
    } catch (error) {
      console.error("DOI search error:", error);
      setPaperMetadata(null);
      message.error("DOI查询出错: " + error.message);
    } finally {
      setDoiLoading(false);
    }
  };

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error("Please select a file to upload");
      return;
    }

    // 如果是文献类型，检查DOI是否必填
    if (fileType === "literature" && !values.doi) {
      message.error("文献类型文件必须输入DOI");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = fileList[0];
      const isPrivate = values.isPrivate;

      // 创建FormData
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("isPrivate", isPrivate);
      formData.append("userId", user.id);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // 调用上传API（Irys网络或本地存储）
      // 确保传递正确的File对象
      const actualFile = file.originFileObj || file;

      const useLocal = uploadMode === "local";
      console.log(`使用${useLocal ? "本地存储" : "Irys网络"}模式上传`);

      const uploadResult = await uploadToIrys(
        actualFile,
        {
          title: values.title,
          description: values.description || "",
          isPrivate: isPrivate,
          userId: user.id,
          fileType: fileType,
          // 如果是文献类型，添加额外的元数据
          ...(fileType === "literature" && {
            doi: values.doi,
            authors: values.authors || paperMetadata?.author,
            year: values.year || paperMetadata?.year,
            abstract: paperMetadata?.abstract,
            paperMetadata: paperMetadata,
          }),
        },
        useLocal
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // 保存上传记录到localStorage
      const uploadRecord = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description || "",
        isPrivate: isPrivate,
        uploadDate: new Date().toISOString(),
        txId: uploadResult.txId,
        url: uploadResult.url,
        fileName: file.name,
        fileSize: file.size,
        userId: user.id,
        uploadMode: uploadMode, // 添加上传模式标识
      };

      const existingUploads = JSON.parse(localStorage.getItem(`scai_uploads_${user.id}`) || "[]");
      existingUploads.push(uploadRecord);
      localStorage.setItem(`scai_uploads_${user.id}`, JSON.stringify(existingUploads));

      message.success("Document uploaded successfully!");
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Failed to upload document");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      if (!validateFileType(file)) {
        message.error("You can only upload PDF, text, or document files!");
        return false;
      }
      if (!validateFileSize(file, 10)) {
        message.error("File must be smaller than 10MB!");
        return false;
      }

      // 创建符合Ant Design Upload组件格式的文件对象
      const fileObj = {
        uid: Date.now().toString(),
        name: file.name,
        status: "done",
        originFileObj: file, // 保存原始文件对象
        size: file.size,
        type: file.type,
      };

      setFileList([fileObj]);
      return false; // 阻止自动上传
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
  };

  return (
    <Modal title="Upload Document to SCAI Box" open={visible} onCancel={onClose} footer={null} width={900} style={{ top: 20 }}>
      <Form form={form} layout="vertical" onFinish={handleUpload} disabled={uploading}>
        <Form.Item name="title" label="Document Title" rules={[{ required: true, message: "Please enter document title" }]}>
          <Input placeholder="Enter document title" />
        </Form.Item>

        <Form.Item name="description" label="Description (Optional)">
          <Input.TextArea placeholder="Brief description of the document" rows={3} />
        </Form.Item>

        <Form.Item name="isPrivate" label="Privacy Setting" valuePropName="checked" extra="Private documents will be encrypted and only accessible to you">
          <Switch checkedChildren={<LockOutlined />} unCheckedChildren={<UnlockOutlined />} />
        </Form.Item>

        <Form.Item label="文件类型" extra="选择您要上传的文件类型，文献类型需要提供DOI">
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              type={fileType === "literature" ? "primary" : "default"}
              onClick={() => setFileType("literature")}
              icon={<FileTextOutlined />}
              style={{
                flex: 1,
                ...(fileType === "literature" && {
                  background: "#FF3314",
                  borderColor: "#FF3314",
                  color: "#fff",
                }),
              }}
            >
              学术文献
            </Button>
            <Button
              type={fileType === "other" ? "primary" : "default"}
              onClick={() => setFileType("other")}
              icon={<CloudUploadOutlined />}
              style={{
                flex: 1,
                ...(fileType === "other" && {
                  background: "#FF3314",
                  borderColor: "#FF3314",
                  color: "#fff",
                }),
              }}
            >
              其他文件
            </Button>
          </div>
        </Form.Item>

        {fileType === "literature" && (
          <>
            <Form.Item name="doi" label="DOI" rules={[{ required: true, message: "文献类型文件必须输入DOI" }]} extra="输入DOI后将自动获取论文信息">
              <Input placeholder="例如: 10.1038/nature12373" onChange={(e) => handleDoiSearch(e.target.value)} suffix={doiLoading && <LoadingOutlined />} />
            </Form.Item>

            {paperMetadata && (
              <div
                style={{
                  background: "linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)",
                  border: "2px solid #52c41a",
                  borderRadius: "12px",
                  padding: "10px",
                  marginBottom: "30px",
                  boxShadow: "0 4px 12px rgba(82, 196, 26, 0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: "bold",
                    color: "#389e0d",
                    marginBottom: "16px",
                    fontSize: "16px",
                  }}
                >
                  <span style={{ fontSize: "20px", marginRight: "8px" }}>📄</span>
                  论文信息已成功获取
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>📖 标题</div>
                    <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.4" }}>{paperMetadata.title}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>👥 作者</div>
                    <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.4" }}>{paperMetadata.author}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>📅 发表年份</div>
                    <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.year}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🔗 DOI</div>
                    <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.doi}</div>
                  </div>

                  {paperMetadata.referencecount > 0 && (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>📊 引用次数</div>
                      <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.referencecount.toLocaleString()} 次</div>
                    </div>
                  )}

                  {paperMetadata.location && paperMetadata.location !== "Not Available" && (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🏛️ 发表期刊/会议</div>
                      <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.location}</div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🔓 开放获取</div>
                    <div style={{ fontSize: "14px", color: paperMetadata.is_oa ? "#52c41a" : "#FF3314" }}>{paperMetadata.is_oa ? "✅ 是" : "❌ 否"}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🔍 数据源</div>
                    <div style={{ fontSize: "14px", color: "#333" }}>OpenAlex</div>
                  </div>
                </div>

                {paperMetadata.abstract && paperMetadata.abstract !== "Abstract Not Available" && (
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "8px" }}>📝 摘要</div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: "1.5",
                        background: "rgba(255, 255, 255, 0.7)",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e8f4fd",
                        maxHeight: "120px",
                        overflowY: "auto",
                      }}
                    >
                      {paperMetadata.abstract.length > 500 ? `${paperMetadata.abstract.substring(0, 500)}...` : paperMetadata.abstract}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Form.Item name="authors" label="作者" extra="如果DOI查询成功，此字段会自动填充">
              <Input placeholder="作者姓名，多个作者用逗号分隔" />
            </Form.Item>

            <Form.Item name="year" label="发表年份" extra="如果DOI查询成功，此字段会自动填充">
              <Input placeholder="例如: 2023" />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Upload Mode"
          // extra={
          //   <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          //     <div>• <strong>Irys Network</strong>: Permanent decentralized storage on Arweave blockchain</div>
          //     <div style={{ marginLeft: '12px', color: '#52c41a' }}>✓ Truly decentralized, permanent, globally accessible</div>
          //     <div style={{ marginLeft: '12px', color: '#fa8c16' }}>⚠ Requires backend API and wallet funding</div>
          //     <div style={{ marginTop: '4px' }}>• <strong>Local Storage</strong>: Store in browser's localStorage</div>
          //     <div style={{ marginLeft: '12px', color: '#52c41a' }}>✓ Works offline, no external dependencies</div>
          //     <div style={{ marginLeft: '12px', color: '#fa8c16' }}>⚠ Only accessible on this device/browser</div>
          //   </div>
          // }
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              type={uploadMode === "irys" ? "primary" : "default"}
              onClick={() => setUploadMode("irys")}
              icon={<CloudUploadOutlined />}
              style={{
                flex: 1,
                ...(uploadMode === "irys" && {
                  background: "#FF3314",
                  borderColor: "#FF3314",
                  color: "#fff",
                }),
              }}
            >
              Irys Network
            </Button>
            <Button
              type={uploadMode === "local" ? "primary" : "default"}
              onClick={() => setUploadMode("local")}
              icon={<FileTextOutlined />}
              style={{
                flex: 1,
                ...(uploadMode === "local" && {
                  background: "#FF3314",
                  borderColor: "#FF3314",
                  color: "#fff",
                }),
              }}
            >
              Local Storage
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="Select File">
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">Support for PDF, text, and document files. Maximum file size: 10MB</p>
          </Upload.Dragger>
        </Form.Item>

        {uploading && (
          <Form.Item>
            <Progress percent={uploadProgress} status={uploadProgress === 100 ? "success" : "active"} />
            <div style={{ textAlign: "center", marginTop: "8px", color: "#666" }}>{uploadMode === "irys" ? "Uploading to Irys network..." : "Uploading to local storage..."}</div>
          </Form.Item>
        )}

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={uploading} disabled={fileList.length === 0} style={{ background: "#FF3314", borderColor: "#FF3314" }}>
            {uploading ? "Uploading..." : "Upload to SCAI Box"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ProfileModal = ({ visible, onClose, onSuccess, user }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [contributions, setContributions] = useState([""]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      // 过滤空的贡献项
      const filteredContributions = contributions.filter((item) => item.trim() !== "");

      // 保存学者信息到localStorage
      const profileData = {
        ...values,
        contributions: filteredContributions,
        userId: user.id,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`scai_profile_${user.id}`, JSON.stringify(profileData));
      message.success("学者资料保存成功");
      onClose();
      // 通知父组件刷新数据
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      message.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const addContribution = () => {
    setContributions([...contributions, ""]);
  };

  const removeContribution = (index) => {
    const newContributions = contributions.filter((_, i) => i !== index);
    setContributions(newContributions);
  };

  const updateContribution = (index, value) => {
    const newContributions = [...contributions];
    newContributions[index] = value;
    setContributions(newContributions);
  };

  // 加载现有的个人资料
  useEffect(() => {
    if (visible && user?.id) {
      const existingProfile = localStorage.getItem(`scai_profile_${user.id}`);
      if (existingProfile) {
        const profileData = JSON.parse(existingProfile);
        form.setFieldsValue(profileData);
        // 加载贡献列表
        if (profileData.contributions && profileData.contributions.length > 0) {
          setContributions(profileData.contributions);
        } else {
          setContributions([""]);
        }
      } else {
        setContributions([""]);
      }
    }
  }, [visible, user, form]);

  return (
    <Modal title="编辑学者主页" open={visible} onCancel={onClose} footer={null} width={900} style={{ top: 20 }}>
      <Form form={form} layout="vertical" onFinish={handleSave} disabled={saving}>
        <Form.Item name="displayName" label="显示姓名" rules={[{ required: true, message: "请输入显示姓名" }]}>
          <Input placeholder="输入您的学术显示姓名" />
        </Form.Item>

        <Form.Item name="avatarUrl" label="头像链接" extra="请提供图片的URL链接，建议使用正方形图片">
          <Input placeholder="https://example.com/avatar.jpg" />
        </Form.Item>

        <Form.Item name="institution" label="所属机构">
          <Input placeholder="大学/研究所名称" />
        </Form.Item>

        <Form.Item name="position" label="职位/学位">
          <Input placeholder="教授/博士生/研究员等" />
        </Form.Item>

        <Form.Item name="researchFields" label="研究领域">
          <Input.TextArea placeholder="请描述您的主要研究方向和兴趣领域" rows={3} />
        </Form.Item>

        <Form.Item name="bio" label="个人简介">
          <Input.TextArea placeholder="简要介绍您的学术背景和研究经历" rows={4} />
        </Form.Item>

        <Form.Item label="主要工作与贡献" extra="列出您的主要学术成果、研究贡献或重要工作">
          <div style={{ marginBottom: "1rem" }}>
            {contributions.map((contribution, index) => (
              <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Input.TextArea value={contribution} onChange={(e) => updateContribution(index, e.target.value)} placeholder={`贡献 ${index + 1}: 例如：发表高影响因子论文、获得重要奖项、主持重大项目等`} rows={2} style={{ flex: 1 }} />
                {contributions.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeContribution(index)} style={{ alignSelf: "flex-start", marginTop: "0.25rem" }} />}
              </div>
            ))}
            <Button type="dashed" onClick={addContribution} icon={<PlusOutlined />} style={{ width: "100%" }}>
              添加贡献项
            </Button>
          </div>
        </Form.Item>

        <Form.Item name="website" label="其他个人网站">
          <Input placeholder="https://yourwebsite.com" />
        </Form.Item>

        <Form.Item name="orcid" label="ORCID ID">
          <Input placeholder="0000-0000-0000-0000" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BoxPage;
