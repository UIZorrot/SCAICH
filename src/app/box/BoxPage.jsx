import { useState, useEffect, useCallback } from "react";
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
  PlusOutlined,
  EditOutlined,
  FolderOutlined,
} from "@ant-design/icons";

import { motion } from "framer-motion";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/apiService";

import { uploadToIrys, validateFileType, validateFileSize, getSupportedFileTypes } from "../../utils/irysUploader";
import { hasUserFulltext } from "../../utils/fulltextManager";
import ChatModal from "../../components/chatpage";
import UploadFulltextModal from "../../components/UploadFulltextModal";
import "./BoxPage.css";

// Generate scholar profile HTML template


const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs; // Deprecated, using items instead

// Favorites management utility functions
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
  const { isAuthenticated, user, hasPermission } = useAuth();

  // Only use light mode
  const currentTheme = {
    name: "light",
    isDark: false,
  };
  const [activeTab, setActiveTab] = useState("favorites");
  const [favorites, setFavorites] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [uploadFulltextModalVisible, setUploadFulltextModalVisible] = useState(false);
  const [selectedPaperForUpload, setSelectedPaperForUpload] = useState(null);

  // Initialize data
  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
      loadMyUploads();
    }
  }, [isAuthenticated, user?.id]);

  // Listen for favorites update events
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
    // Get user's upload records from localStorage
    try {
      const userIdForStorage = user?.id || user?.user_id;
      const uploads = localStorage.getItem(`scai_uploads_${userIdForStorage}`);
      setMyUploads(uploads ? JSON.parse(uploads) : []);
    } catch (error) {
      console.error("Error loading uploads:", error);
      setMyUploads([]);
    }
  };

  const handleRemoveFavorite = (doi) => {
    const updatedFavorites = removeFromFavorites(doi);
    setFavorites(updatedFavorites);
    message.success("Removed from bookmarks");
  };

  const handleRemoveUpload = (upload) => {
    try {
      const userIdForStorage = user?.id || user?.user_id;
      const uploads = localStorage.getItem(`scai_uploads_${userIdForStorage}`);
      const uploadList = uploads ? JSON.parse(uploads) : [];

      // Remove specified upload record from list
      const updatedUploads = uploadList.filter((item) => item.txId !== upload.txId);

      // Save updated list
      localStorage.setItem(`scai_uploads_${userIdForStorage}`, JSON.stringify(updatedUploads));

      // Update state
      setMyUploads(updatedUploads);
    } catch (error) {
      console.error("Error removing upload:", error);
      message.error("Failed to remove, please try again");
    }
  };

  // Deep Research handler function
  const handleDeepResearch = async (paperId, source) => {
    console.log("=== Deep Research Debug Info ===");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("user:", user);
    console.log("paperId:", paperId);
    console.log("source:", source);

    // Check authentication status and deep research permissions
    if (!isAuthenticated) {
      console.log("❌ Authentication failed - isAuthenticated is false");
      message.warning("Please login before using the Deep Research feature");
      return;
    }

    console.log("✅ Authentication passed - isAuthenticated is true");

    try {
      console.log("🔍 Checking deep research permission...");
      const hasDeepResearchPermission = await hasPermission('deep_research');
      console.log("hasDeepResearchPermission:", hasDeepResearchPermission);

      if (!hasDeepResearchPermission) {
        console.log("❌ Permission denied - no deep research permission");
        message.warning("You don't have permission to use the Deep Research feature");
        return;
      }

      console.log("✅ Permission granted - opening chat modal");
    } catch (error) {
      console.error('❌ Error checking permission:', error);
      message.error("Permission check failed, please try again");
      return;
    }

    console.log("🚀 Opening chat for paper:", paperId, "source:", source);
    setSelectedPaperId(paperId);
    setSelectedSource(source);
    setChatModalVisible(true);
    console.log("=== End Debug Info ===");
  };



  return (
    // , ${user?.username || "Scholar"}
    <Layout>
      <div className="box-page light-theme">
        {/* Hero Section */}
        <div className="hero-section1">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="hero-content">
            <Title level={1} className="hero-title" style={{ color: "#fff" }}>
              {isAuthenticated ? `Welcome back!` : "Welcome to SCAI Box"}
            </Title>
            <Paragraph className="hero-subtitle">Your personal Science workspace for managing research and publications.</Paragraph>
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
            {!isAuthenticated ? (
              // Show login requirement prompt when not logged in
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
                  Please sign in to access your personalized Science workspace and manage your research materials.
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
            ) : (
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="large"
                style={{ marginBottom: "2rem" }}
                className="scholar-tabs"
                items={[
                  {
                    key: 'favorites',
                    label: (
                      <span>
                        <HeartOutlined style={{ marginRight: "5px" }} />
                        Bookmark ({favorites.length})
                      </span>
                    ),
                    children: (
                      <FavoritesTab
                        favorites={favorites}
                        onRemove={handleRemoveFavorite}
                        onDeepResearch={handleDeepResearch}
                        currentTheme={currentTheme}
                        isAuthenticated={isAuthenticated}
                        hasPermission={hasPermission}
                        onUploadFulltext={(paper) => {
                          setSelectedPaperForUpload({
                            doi: paper.doi,
                            title: paper.title,
                            author: paper.author,
                            year: paper.year
                          });
                          setUploadFulltextModalVisible(true);
                        }}
                      />
                    )
                  },
                  {
                    key: 'uploads',
                    label: (
                      <span>
                        <CloudUploadOutlined style={{ marginRight: "5px" }} />
                        My Uploads ({myUploads.length})
                      </span>
                    ),
                    children: (
                      <UploadsTab
                        uploads={myUploads}
                        onUpload={() => setUploadModalVisible(true)}
                        onRemoveUpload={handleRemoveUpload}
                        currentTheme={currentTheme}
                      />
                    )
                  }
                ]}
              />
            )}
          </div>
        </div>

        {/* Upload Modal */}
        <UploadModal visible={uploadModalVisible} onClose={() => setUploadModalVisible(false)} onSuccess={loadMyUploads} user={user} currentTheme={currentTheme} isAuthenticated={isAuthenticated} />



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

        {/* Upload Fulltext Modal */}
        <UploadFulltextModal
          visible={uploadFulltextModalVisible}
          onClose={() => {
            setUploadFulltextModalVisible(false);
            setSelectedPaperForUpload(null);
          }}
          paperInfo={selectedPaperForUpload}
          onSuccess={(doi, fulltextData) => {
            // Trigger favorites reload to update fulltext status
            loadFavorites();
            // Reload My Upload list to show the new upload
            loadMyUploads();
            message.success('Fulltext uploaded successfully! You can now use the Deep Research feature!');
          }}
        />
      </div>
    </Layout>
  );
};

// Tab component definitions
const FavoritesTab = ({ favorites, onRemove, currentTheme, onDeepResearch, isAuthenticated, hasPermission, onUploadFulltext }) => {
  const [bibtexModalVisible, setBibtexModalVisible] = useState(false);
  const [currentBibtex, setCurrentBibtex] = useState("");
  const [currentPaperTitle, setCurrentPaperTitle] = useState("");

  // Category and tag management state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [currentPaper, setCurrentPaper] = useState(null);
  const [newTag, setNewTag] = useState("");

  // Category management state
  const [categories, setCategories] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("blue");

  // Preset color options
  const colorOptions = [
    { value: "blue", label: "Blue", color: "#1890ff" },
    { value: "green", label: "Green", color: "#52c41a" },
    { value: "orange", label: "Orange", color: "#fa8c16" },
    { value: "red", label: "Red", color: "#f5222d" },
    { value: "purple", label: "Purple", color: "#722ed1" },
    { value: "cyan", label: "Cyan", color: "#13c2c2" },
    { value: "magenta", label: "Magenta", color: "#eb2f96" },
    { value: "volcano", label: "Volcano", color: "#fa541c" },
  ];

  // Extract all tags from favorite papers
  const allTags = [...new Set(favorites.flatMap((paper) => paper.tags || []))];

  // Initialize category data
  useEffect(() => {
    loadCategories();
  }, []);

  // Listen for fulltext update events
  useEffect(() => {
    const handleFulltextUpdate = () => {
      // Force re-render by updating a dummy state or triggering parent reload
      // This will cause hasFulltextAvailable to be re-evaluated
      window.dispatchEvent(new Event("favoritesUpdated"));
    };

    window.addEventListener('fulltextUpdated', handleFulltextUpdate);
    return () => {
      window.removeEventListener('fulltextUpdated', handleFulltextUpdate);
    };
  }, []);

  // Load user-defined categories
  const loadCategories = () => {
    try {
      const savedCategories = localStorage.getItem("scai_categories");
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      } else {
        // Initialize default categories
        const defaultCategories = [{ id: "uncategorized", name: "Uncategorized", color: "gray", isDefault: true }];
        setCategories(defaultCategories);
        localStorage.setItem("scai_categories", JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([{ id: "uncategorized", name: "Uncategorized", color: "gray", isDefault: true }]);
    }
  };

  // Save categories to localStorage
  const saveCategories = (newCategories) => {
    try {
      localStorage.setItem("scai_categories", JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error("Error saving categories:", error);
      message.error("Failed to save categories");
    }
  };

  // Filter papers
  const filteredFavorites = favorites.filter((paper) => {
    const matchesKeyword = !searchKeyword || paper.title.toLowerCase().includes(searchKeyword.toLowerCase()) || paper.author.toLowerCase().includes(searchKeyword.toLowerCase()) || (paper.abstract && paper.abstract.toLowerCase().includes(searchKeyword.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || paper.category === selectedCategory || (!paper.category && selectedCategory === "uncategorized");

    const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => paper.tags && paper.tags.includes(tag));

    return matchesKeyword && matchesCategory && matchesTags;
  });

  // Get complete category options (including "All" option)
  const categoryOptions = [{ id: "all", name: "All Papers", color: "blue", icon: <FolderOutlined /> }, ...categories];
  // View paper handler function
  const handleViewPaper = (paper) => {
    if (paper.url && !paper.url.includes('localhost')) {
      window.open("https://api.scai.sh" + paper.url, "_blank");
    } else if (paper.doi) {
      // Use scai.sh API to view paper
      const scaiUrl = `https://api.scai.sh/api/fulltext/proxy/${paper.doi}`;
      window.open(scaiUrl, "_blank");
    } else {
      message.warning("Unable to find paper link");
    }
  };

  // Check if paper has fulltext available (including user uploaded) - for FavoritesTab
  const hasFulltextAvailable = (paper) => {
    // Reference search page logic: check if there are scihub or arxiv sources
    const hasOriginalFulltext = paper.source === "scihub" || paper.source === "arxiv" || paper.scinet || paper.is_oa || (paper.doi && paper.doi.toLowerCase().includes("arxiv")) || (paper.url && paper.url.toLowerCase().includes("arxiv"));

    // Check user uploaded fulltext
    const hasUserUploadedFulltext = hasUserFulltext(paper.doi);

    return hasOriginalFulltext || hasUserUploadedFulltext;
  };

  // Check if paper has fulltext available (including user uploaded)
  const hasFulltext = (paper) => {
    // Reference search page logic: check if there are scihub or arxiv sources
    const hasOriginalFulltext = paper.source === "scihub" || paper.source === "arxiv" || paper.scinet || paper.is_oa || (paper.doi && paper.doi.toLowerCase().includes("arxiv")) || (paper.url && paper.url.toLowerCase().includes("arxiv"));

    // Check user uploaded fulltext
    const hasUserUploadedFulltext = hasUserFulltext(paper.doi);

    return hasOriginalFulltext || hasUserUploadedFulltext;
  };

  // Deep Research handler function
  const handleDeepResearch = async (paper) => {
    // Check authentication status and deep research permissions
    if (!isAuthenticated) {
      message.warning("Please login before using the Deep Research feature");
      return;
    }

    try {
      const hasDeepResearchPermission = await hasPermission('deep_research');
      if (!hasDeepResearchPermission) {
        message.warning("You don't have permission to use the Deep Research feature");
        return;
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      message.error("Permission check failed, please try again");
      return;
    }

    // Check if fulltext is available
    if (!hasFulltext(paper)) {
      message.warning("This paper has no fulltext available, cannot perform deep research");
      return;
    }

    // Determine correct source parameter
    let source = "scihub"; // Default to scihub

    // If paper has DOI, try to determine best source
    if (paper.doi) {
      // If DOI contains arxiv, use arxiv
      if (paper.doi.toLowerCase().includes("arxiv") || (paper.url && paper.url.toLowerCase().includes("arxiv"))) {
        source = "arxiv";
      }
      // If has scinet link, use scihub (because scinet usually provides scihub links)
      else if (paper.scinet) {
        source = "scihub";
      }
    }

    console.log("Deep Research for paper:", paper.title, "DOI:", paper.doi, "Source:", source);

    // Open ChatModal in current page
    onDeepResearch(paper.doi, source);
  };

  // BibTeX handler function
  const handleBibTexClick = async (paper) => {
    try {
      const cleanDoi = paper.doi.replace(/^https?:\/\/doi\.org\//i, "");

      // Use CrossRef API to get BibTeX
      const response = await fetch(`https://api.crossref.org/works/${cleanDoi}/transform/application/x-bibtex`, {
        headers: {
          Accept: "application/x-bibtex",
        },
      });

      if (response.ok) {
        const bibtex = await response.text();

        // Set modal content and display
        setCurrentBibtex(bibtex);
        setCurrentPaperTitle(paper.title);
        setBibtexModalVisible(true);
      } else {
        throw new Error("Failed to fetch BibTeX");
      }
    } catch (error) {
      console.error("Error fetching BibTeX:", error);
      message.error("Failed to get BibTeX citation");
    }
  };

  // Copy BibTeX to clipboard
  const copyBibtexToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentBibtex);
      } else {
        // Fallback solution
        const textarea = document.createElement("textarea");
        textarea.value = currentBibtex;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      message.success("BibTeX copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      message.error("Failed to copy BibTeX");
    }
  };

  // Tag management functions
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

    // Update favorites data in localStorage
    updatePaperInFavorites(updatedPaper);
    setNewTag("");
    message.success("Tag added successfully");
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedPaper = {
      ...currentPaper,
      tags: (currentPaper.tags || []).filter((tag) => tag !== tagToRemove),
    };

    updatePaperInFavorites(updatedPaper);
    message.success("Tag removed successfully");
  };

  const handleCategoryChange = (paper, newCategory) => {
    const updatedPaper = {
      ...paper,
      category: newCategory,
    };

    updatePaperInFavorites(updatedPaper);
    message.success("Category updated successfully");
  };

  // Update paper data in favorites
  const updatePaperInFavorites = (updatedPaper) => {
    try {
      const favorites = JSON.parse(localStorage.getItem("scai_favorites") || "[]");
      const updatedFavorites = favorites.map((fav) => (fav.doi === updatedPaper.doi ? updatedPaper : fav));
      localStorage.setItem("scai_favorites", JSON.stringify(updatedFavorites));

      // Trigger parent component to reload favorites data
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  // Category management functions
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      message.error("Please enter category name");
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
    message.success("Category created successfully");
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setCategoryModalVisible(true);
  };

  const handleUpdateCategory = () => {
    if (!newCategoryName.trim()) {
      message.error("Please enter category name");
      return;
    }

    const updatedCategories = categories.map((cat) => (cat.id === editingCategory.id ? { ...cat, name: newCategoryName.trim(), color: newCategoryColor } : cat));

    saveCategories(updatedCategories);
    setCategoryModalVisible(false);
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryColor("blue");
    message.success("Category updated successfully");
  };

  const handleDeleteCategory = (categoryId) => {
    const categoryToDelete = categories.find((cat) => cat.id === categoryId);

    if (categoryToDelete?.isDefault) {
      message.error("Default category cannot be deleted");
      return;
    }

    Modal.confirm({
      title: "Confirm Delete Category",
      content: 'After deleting the category, papers in this category will be moved to "Uncategorized". Are you sure you want to delete?',
      onOk: () => {
        // Move papers in this category to uncategorized
        const favoritesToUpdate = favorites.filter((paper) => paper.category === categoryId);
        favoritesToUpdate.forEach((paper) => {
          updatePaperInFavorites({ ...paper, category: "uncategorized" });
        });

        // Delete category
        const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
        saveCategories(updatedCategories);

        // If currently selected category is deleted, switch to all
        if (selectedCategory === categoryId) {
          setSelectedCategory("all");
        }

        message.success("Category deleted successfully");
      },
    });
  };
  return (
    <div>
      {/* Search and filter toolbar */}
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
          {/* Search box */}
          <Input placeholder="Search paper title, author or abstract..." prefix={<SearchOutlined />} value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ minWidth: "300px", flex: 1 }} allowClear />

          {/* Category selection */}
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ minWidth: "180px" }}
            placeholder="Select category"
            dropdownRender={(menu) => (
              <div>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <div style={{ padding: "8px", display: "flex", gap: "8px" }}>
                  <Button type="text" icon={<PlusOutlined />} onClick={() => setCategoryModalVisible(true)} style={{ flex: 1 }}>
                    Manage Categories
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

          {/* Tag filtering */}
          <Select mode="multiple" value={selectedTags} onChange={setSelectedTags} placeholder="Filter tags" style={{ minWidth: "200px" }} maxTagCount={2}>
            {allTags.map((tag) => (
              <Select.Option key={tag} value={tag}>
                <TagOutlined /> {tag}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Statistics */}
        <div
          style={{
            marginTop: "1rem",
            color: currentTheme.isDark ? "#94a3b8" : "#64748b",
            fontSize: "14px",
          }}
        >
          Showing {filteredFavorites.length} / {favorites.length} papers
          {selectedTags.length > 0 && (
            <span style={{ marginLeft: "1rem" }}>
              Selected tags:{" "}
              {selectedTags.map((tag) => (
                <Tag key={tag} closable onClose={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}>
                  {tag}
                </Tag>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Paper list */}
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
            {favorites.length === 0 ? "No bookmarked papers yet" : "No matching papers found"}
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
                Start exploring Science papers and add interesting research to your bookmarks
                <br />
                to build your personal Science library.
              </>
            ) : (
              "Try adjusting search criteria or clearing filters"
            )}
          </Paragraph>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                      cursor: "pointer",
                      transition: "color 0.2s ease",
                    }}
                    onClick={() => handleViewPaper(paper)}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#1890ff";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = currentTheme.isDark ? "#f1f5f9" : "#1e293b";
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

                  {/* Category and tag display */}
                  <div style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                    {paper.category && (
                      <Tag color={categories.find((cat) => cat.id === paper.category)?.color || "blue"} style={{ margin: 0 }}>
                        <FolderOutlined style={{ marginRight: "4px" }} />
                        {categories.find((cat) => cat.id === paper.category)?.name || "Unknown category"}
                      </Tag>
                    )}
                    {(paper.tags || []).map((tag) => (
                      <Tag key={tag} color="green" style={{ margin: 0 }}>
                        <TagOutlined style={{ marginRight: "4px" }} />
                        {tag}
                      </Tag>
                    ))}

                    {/* Fulltext status indicator */}
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

                    <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewPaper(paper)}>
                      View Paper
                    </Button>
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
                    Bookmarked on {new Date(paper.favoriteDate).toLocaleDateString("en-US")}
                  </Text>
                  <div style={{ marginTop: "12px", display: "flex", gap: "0.5rem", minWidth: "140px", flexWrap: "wrap" }}>

                    <Button
                      icon={<MessageOutlined />}
                      className="modern-btn modern-btn-secondary"
                      size="small"
                      disabled={!hasFulltextAvailable(paper)}
                      onClick={() => handleDeepResearch(paper)}
                      title={!hasFulltextAvailable(paper) ? "This paper has no fulltext available" : "Deep research paper"}
                    >
                      Deep Research
                    </Button>

                    {/* Upload Fulltext button - shown when no fulltext is available */}
                    {!hasFulltextAvailable(paper) && (
                      <Button
                        icon={<CloudUploadOutlined />}
                        className="modern-btn modern-btn-secondary"
                        size="small"
                        onClick={() => onUploadFulltext(paper)}
                        style={{
                          borderColor: "#52c41a",
                          color: "#52c41a",
                        }}
                        title="Upload fulltext for this paper"
                      >
                        Upload Fulltext
                      </Button>
                    )}

                    <Button icon={<BookOutlined />} className="modern-btn modern-btn-secondary" size="small" onClick={() => handleBibTexClick(paper)}>
                      BibTeX
                    </Button>
                    <Button icon={<EditOutlined />} className="modern-btn modern-btn-secondary" size="small" onClick={() => handleEditTags(paper)}>
                      Edit Tags
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => onRemove(paper.doi)} className="modern-btn modern-btn-danger" size="small">
                      Remove
                    </Button>
                  </div>
                </div>


              </div>
            </motion.div>
          ))}

          {/* BibTeX Modal */}
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
      )
      }

      {/* Tag editing modal */}
      <Modal
        title="Edit Paper Tags and Categories"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTagModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
        centered
      >
        {currentPaper && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <Title level={5}>Paper: {currentPaper.title}</Title>
            </div>

            {/* Category selection */}
            <div style={{ marginBottom: "1.5rem" }}>
              <Text strong>Category:</Text>
              <Select value={currentPaper.category || "uncategorized"} onChange={(value) => handleCategoryChange(currentPaper, value)} style={{ width: "100%", marginTop: "0.5rem" }}>
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    <FolderOutlined style={{ color: colorOptions.find((c) => c.value === cat.color)?.color || "#1890ff", marginRight: "8px" }} />
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Tag management */}
            <div>
              <Text strong>Tags:</Text>
              <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
                {(currentPaper.tags || []).map((tag) => (
                  <Tag key={tag} closable onClose={() => handleRemoveTag(tag)} style={{ marginBottom: "0.5rem" }}>
                    {tag}
                  </Tag>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Input placeholder="Add new tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onPressEnter={handleAddTag} style={{ flex: 1 }} />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Category management modal */}
      <Modal
        title="Manage Category Folders"
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
          {/* Create new category */}
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              background: currentTheme.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: "8px",
            }}
          >
            <Title level={5}>{editingCategory ? "Edit Category" : "Create New Category"}</Title>
            <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
              <div style={{ flex: 1 }}>
                <Text>Category Name:</Text>
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter category name" onPressEnter={editingCategory ? handleUpdateCategory : handleCreateCategory} />
              </div>
              <div>
                <Text>Color:</Text>
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
                {editingCategory ? "Update" : "Create"}
              </Button>
              {editingCategory && (
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName("");
                    setNewCategoryColor("blue");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Existing categories list */}
          <div>
            <Title level={5}>Existing Categories</Title>
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
                        Default
                      </Tag>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {favorites.filter((p) => p.category === category.id).length} papers
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
    </div >
  );
};

const UploadsTab = ({ uploads, onUpload, currentTheme, onRemoveUpload }) => {
  const handleViewDocument = (upload) => {
    if (upload.url) {
      window.open(upload.url, "_blank");
    } else {
      // Build URL using txId
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
    const actionText = upload.uploadMode === "irys" ? "Hide" : "Delete";
    const confirmText = upload.uploadMode === "irys" ? "Are you sure you want to hide this document? The document will still be saved on the Irys network, but will not be displayed here." : "Are you sure you want to delete this document? This action cannot be undone.";

    Modal.confirm({
      title: `${actionText} Document`,
      content: confirmText,
      okText: actionText,
      cancelText: "Cancel",
      okType: upload.uploadMode === "irys" ? "default" : "danger",
      onOk: () => {
        onRemoveUpload(upload);
        message.success(`Document ${actionText.toLowerCase()}d`);
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
            No uploaded documents yet
          </Title>
          <Paragraph
            style={{
              color: currentTheme.isDark ? "#94a3b8" : "#64748b",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            Upload your research papers and Science documents to decentralized storage network,
            <br />
            enjoy permanent storage and global access convenience.
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
              Upload New Document
            </Button>
          </div> */}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {uploads.map((upload, index) => (
            <motion.div key={upload.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="modern-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                {/* <div
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
                </div> */}

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
                        {upload.isPrivate ? "Private Document" : "Public Document"}
                      </Text>

                      {/* Upload mode identifier */}
                      <Text
                        style={{
                          color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        {upload.uploadMode === "irys" ? (
                          <>
                            <CloudUploadOutlined style={{ marginRight: "4px", color: "#52c41a" }} />
                            Irys Network
                          </>
                        ) : (
                          <>
                            <FileTextOutlined style={{ marginRight: "4px", color: "#fa8c16" }} />
                            Local Storage
                          </>
                        )}
                      </Text>

                      <Text
                        style={{
                          color: currentTheme.isDark ? "#94a3b8" : "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        Uploaded on {new Date(upload.uploadDate).toLocaleDateString("en-US")}
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

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "15px", alignItems: "center" }}>
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewDocument(upload)} className="modern-btn modern-btn-primary" size="small">
                      View
                    </Button>
                    <Button icon={<LinkOutlined />} onClick={() => handleCopyUrl(upload)} className="modern-btn modern-btn-secondary" size="small">
                      Copy Link
                    </Button>
                    <Button icon={upload.uploadMode === "irys" ? <EyeInvisibleOutlined /> : <DeleteOutlined />} onClick={() => handleRemoveUpload(upload)} className="modern-btn modern-btn-secondary" size="small" danger={upload.uploadMode !== "irys"}>
                      {upload.uploadMode === "irys" ? "Hide" : "Delete"}
                    </Button>
                  </div>
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
          Upload New Document
        </Button>
      </div>
    </div>
  );
};



// Modal component definitions
const UploadModal = ({ visible, onClose, onSuccess, user, isAuthenticated }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [uploadMode, setUploadMode] = useState("irys"); // 'irys' or 'local'
  const [fileType, setFileType] = useState("literature"); // 'literature' or 'other'
  const [doiLoading, setDoiLoading] = useState(false);
  const [paperMetadata, setPaperMetadata] = useState(null);

  // DOI search function
  const handleDoiSearch = async (doi) => {
    if (!doi || !doi.trim()) {
      setPaperMetadata(null);
      return;
    }

    setDoiLoading(true);
    try {
      // Use new API service
      const data = await apiService.getPaperInfo(doi.trim());

      if (data && !data.error) {
        setPaperMetadata(data);
        // Auto-fill form fields
        form.setFieldsValue({
          title: data.title,
          description: data.abstract && data.abstract !== "Abstract Not Available" ? data.abstract.substring(0, 200) + "..." : "Paper abstract",
          authors: data.author,
          year: data.year,
        });
        message.success("DOI information retrieved successfully");
      } else {
        setPaperMetadata(null);
        message.warning(data?.error || "DOI information not found");
      }
    } catch (error) {
      console.error("DOI search error:", error);
      setPaperMetadata(null);
      message.error("DOI query error: " + error.message);
    } finally {
      setDoiLoading(false);
    }
  };

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error("Please select a file to upload");
      return;
    }

    // Check if user is logged in
    if (!isAuthenticated) {
      message.error("Please login or register before uploading files");
      return;
    }

    // If it's literature type, check if DOI is required
    if (fileType === "literature" && !values.doi) {
      message.error("Literature type files must include DOI");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = fileList[0];
      const isPrivate = values.isPrivate;

      // Create FormData
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("fileName", file.originFileObj.name); // 添加文件名字段
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("isPrivate", isPrivate);
      formData.append("userId", user?.id || user?.user_id || "anonymous");

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Call upload API (Irys network or local storage)
      // Ensure correct File object is passed
      const actualFile = file.originFileObj || file;

      const useLocal = uploadMode === "local";
      console.log(`Using ${useLocal ? "local storage" : "Irys network"} mode for upload`);

      let uploadResult;

      if (fileType === "literature" && !useLocal) {
        // 论文类型使用专门的upload-paper接口
        console.log("Using dedicated paper upload API");
        uploadResult = await apiService.uploadPaperWithFile(
          actualFile,
          values.doi,
          "manual", // source
          {
            title: values.title,
            description: values.description || "",
            authors: values.authors || paperMetadata?.author,
            year: values.year || paperMetadata?.year,
            abstract: paperMetadata?.abstract,
            isPrivate: isPrivate,
            userId: user?.id || user?.user_id || "anonymous",
            paperMetadata: paperMetadata,
          }
        );
      } else {
        // 其他类型或本地存储使用通用上传
        console.log(`Using ${useLocal ? "local storage" : "general Irys"} mode for upload`);
        uploadResult = await uploadToIrys(
          actualFile,
          {
            title: values.title,
            description: values.description || "",
            isPrivate: isPrivate,
            userId: user?.id || user?.user_id || "anonymous",
            fileType: fileType,
            // If it's literature type, add additional metadata
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
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Debug: Log the upload result structure
      console.log("📊 Upload result received:", uploadResult);

      // Check if upload was successful
      if (!uploadResult || !uploadResult.success) {
        const errorMessage = uploadResult?.error || uploadResult?.message || "Upload failed with unknown error";
        console.error("❌ Upload failed:", errorMessage);
        throw new Error(errorMessage);
      }

      // Save upload record to localStorage with safe data extraction
      const uploadData = uploadResult?.data || uploadResult || {};

      // Debug: Log the data structure we're working with
      console.log("📦 Upload data structure:", uploadData);

      // Safely extract data with fallbacks
      const txId = uploadData.txId || uploadData.id || `upload_${Date.now()}`;
      const fileUrl = uploadData.irysUrl || uploadData.url || uploadData.gateway || "";
      const fileId = uploadData.fileId || uploadData.txId || uploadData.id || txId;

      // Debug: Log extracted values
      console.log("🔍 Extracted values:", { txId, fileUrl, fileId });

      const uploadRecord = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description || "",
        isPrivate: isPrivate,
        uploadDate: new Date().toISOString(),
        txId: txId,
        url: fileUrl,
        fileId: fileId,
        fileName: file.name,
        fileSize: file.size,
        userId: user?.id || user?.user_id || "anonymous",
        uploadMode: uploadMode, // Add upload mode identifier
      };

      // Save to localStorage with error handling
      try {
        const userIdForStorage = user?.id || user?.user_id || "anonymous";
        const existingUploads = JSON.parse(localStorage.getItem(`scai_uploads_${userIdForStorage}`) || "[]");
        existingUploads.push(uploadRecord);
        localStorage.setItem(`scai_uploads_${userIdForStorage}`, JSON.stringify(existingUploads));
        console.log("✅ Upload record saved to localStorage");
      } catch (storageError) {
        console.error("⚠️ Failed to save to localStorage:", storageError);
        // Continue anyway - the upload was successful even if localStorage failed
      }

      message.success("Document uploaded successfully!");
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Upload error:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to upload document";
      if (error.message) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error - please check your connection and try again";
        } else if (error.message.includes("size") || error.message.includes("large")) {
          errorMessage = "File is too large - please try a smaller file";
        } else if (error.message.includes("type") || error.message.includes("format")) {
          errorMessage = "Unsupported file type - please try a different file";
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }

      message.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      if (!validateFileType(file)) {
        message.error("Unsupported file type! Please upload PDF, text, HTML, XML, Markdown, Office documents, or other rich text formats.");
        return false;
      }
      if (!validateFileSize(file, 10)) {
        message.error("File must be smaller than 10MB!");
        return false;
      }

      // Create file object that conforms to Ant Design Upload component format
      const fileObj = {
        uid: Date.now().toString(),
        name: file.name,
        status: "done",
        originFileObj: file, // Save original file object
        size: file.size,
        type: file.type,
      };

      setFileList([fileObj]);
      return false; // Prevent automatic upload
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

        <Form.Item label="File Type" extra="Choose the type of file you want to upload, literature type requires DOI">
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
              Science Literature
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
              Other Files
            </Button>
          </div>
        </Form.Item>

        {fileType === "literature" && (
          <>
            <Form.Item name="doi" label="DOI" rules={[{ required: true, message: "Literature type files must include DOI" }]} extra="Paper information will be automatically retrieved after entering DOI">
              <Input placeholder="e.g.: 10.1038/nature12373" onChange={(e) => handleDoiSearch(e.target.value)} suffix={doiLoading && <LoadingOutlined />} />
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
                  Paper information retrieved successfully
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
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>📖 Title</div>
                    <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.4" }}>{paperMetadata.title}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>👥 Authors</div>
                    <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.4" }}>{paperMetadata.author}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>📅 Publication Year</div>
                    <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.year}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🔗 DOI</div>
                    <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.doi}</div>
                  </div>

                  {paperMetadata.referencecount > 0 && (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>📊 Citation Count</div>
                      <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.referencecount.toLocaleString()} times</div>
                    </div>
                  )}

                  {paperMetadata.location && paperMetadata.location !== "Not Available" && (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🏛️ Journal/Conference</div>
                      <div style={{ fontSize: "14px", color: "#333" }}>{paperMetadata.location}</div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🔓 Open Access</div>
                    <div style={{ fontSize: "14px", color: paperMetadata.is_oa ? "#52c41a" : "#FF3314" }}>{paperMetadata.is_oa ? "✅ Yes" : "❌ No"}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "4px" }}>🔍 Data Source</div>
                    <div style={{ fontSize: "14px", color: "#333" }}>OpenAlex</div>
                  </div>
                </div>

                {paperMetadata.abstract && paperMetadata.abstract !== "Abstract Not Available" && (
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1890ff", marginBottom: "8px" }}>📝 Abstract</div>
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

            <Form.Item name="authors" label="Authors" extra="This field will be auto-filled if DOI query is successful">
              <Input placeholder="Author names, separate multiple authors with commas" />
            </Form.Item>

            <Form.Item name="year" label="Publication Year" extra="This field will be auto-filled if DOI query is successful">
              <Input placeholder="e.g.: 2023" />
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
            <p className="ant-upload-hint">
              Supported formats: {getSupportedFileTypes().join(', ')}. Maximum file size: 10MB
            </p>
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



export default BoxPage;
