import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Typography, Form, Input, Select, Tag, Modal, message, Spin } from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, BookOutlined, UserOutlined } from "@ant-design/icons";
import { useUser } from "@clerk/clerk-react";
import irysService from "../../services/irysService";
import "./PressPage.css";
import { motion } from "framer-motion";
import Layout from "../../components/layout/Layout";
import GroupMarkdownEditor from "../../components/GroupMarkdownEditor";
import GroupWorkspace from "./components/GroupWorkspace";
import ProfileSetupPrompt from "./components/ProfileSetupPrompt";

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PressPage = () => {
  const { isSignedIn, user } = useUser();

  // Main page state
  const [currentView, setCurrentView] = useState("my-groups"); // 'my-groups', 'explore-groups', 'group-detail'
  const [selectedGroup, setSelectedGroup] = useState(null);

  // User groups and documents
  const [userGroups, setUserGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [groupDocuments, setGroupDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Modals and forms
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [joinPrivateGroupModalVisible, setJoinPrivateGroupModalVisible] = useState(false);
  const [groupDetailsModalVisible, setGroupDetailsModalVisible] = useState(false);

  const [groupEditorVisible, setGroupEditorVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editorMode, setEditorMode] = useState("create"); // "create" or "edit"

  // Form states
  const [groupForm] = Form.useForm();
  const [joinGroupForm] = Form.useForm();

  // Scholar profile verification
  const [scholarProfile, setScholarProfile] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const checkScholarProfile = useCallback(() => {
    // Check for scholar profile from localStorage (same as Box module)
    if (!user?.id) {
      setNeedsProfileSetup(true);
      return;
    }

    const profileData = localStorage.getItem(`scai_profile_${user.id}`);

    if (profileData) {
      const profile = JSON.parse(profileData);
      // Check if essential fields are filled (same as Box module requirements)
      const hasEssentialInfo = profile.displayName && profile.institution && profile.researchFields;

      if (hasEssentialInfo) {
        setScholarProfile(profile);
        setNeedsProfileSetup(false);
      } else {
        setNeedsProfileSetup(true);
      }
    } else {
      setNeedsProfileSetup(true);
    }
  }, [user?.id]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load user's groups from Irys
  const loadUserGroups = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Query 1: Groups where user is creator
      const createdGroupsQuery = await irysService.queryTransactions({
        tags: [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: "application/json" },
          { name: "Data-Type", value: "group" },
          { name: "Creator", value: user.id },
        ],
      });

      // Query 2: All groups to find ones where user is a member
      const allGroupsQuery = await irysService.queryTransactions({
        tags: [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: "application/json" },
          { name: "Data-Type", value: "group" },
        ],
      });

      const groups = [];
      const processedGroupIds = new Set();

      // Process groups where user is creator
      for (const tx of createdGroupsQuery) {
        try {
          const groupData = await irysService.getTransactionData(tx.id);
          groups.push({
            ...groupData,
            id: tx.id,
            txId: tx.id,
          });
          processedGroupIds.add(tx.id);
        } catch (error) {
          console.error("Error loading created group data:", error);
        }
      }

      // Process groups where user is a member (but not creator)
      for (const tx of allGroupsQuery) {
        if (processedGroupIds.has(tx.id)) continue; // Skip already processed groups

        try {
          const groupData = await irysService.getTransactionData(tx.id);
          // Check if user is a member of this group
          if (groupData.members && groupData.members.includes(user.id)) {
            groups.push({
              ...groupData,
              id: tx.id,
              txId: tx.id,
            });
          }
        } catch (error) {
          console.error("Error loading member group data:", error);
        }
      }

      setUserGroups(groups);
    } catch (error) {
      console.error("Error loading user groups:", error);
      message.error("Failed to load your groups");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load all public groups from Irys
  const loadAllGroups = useCallback(async () => {
    setLoading(true);
    try {
      const publicGroupsQuery = await irysService.queryTransactions({
        tags: [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: "application/json" },
          { name: "Data-Type", value: "group" },
          { name: "Group-Type", value: "public" },
        ],
      });

      const groups = [];
      for (const tx of publicGroupsQuery) {
        try {
          const groupData = await irysService.getTransactionData(tx.id);
          groups.push({
            ...groupData,
            id: tx.id,
            txId: tx.id,
          });
        } catch (error) {
          console.error("Error loading group data:", error);
        }
      }

      setAllGroups(groups);
    } catch (error) {
      console.error("Error loading public groups:", error);
      message.error("Failed to load public groups");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load documents for a specific group
  const loadGroupDocuments = useCallback(async (groupId) => {
    if (!groupId) return;

    setLoading(true);
    try {
      const documentsQuery = await irysService.queryTransactions({
        tags: [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: "text/markdown" },
          { name: "Data-Type", value: "document" },
          { name: "Group-Id", value: groupId },
        ],
      });

      const documents = [];
      for (const tx of documentsQuery) {
        try {
          const docContent = await irysService.getTransactionData(tx.id);
          const docMetadata = tx.tags.reduce((acc, tag) => {
            acc[tag.name] = tag.value;
            return acc;
          }, {});

          documents.push({
            id: tx.id,
            txId: tx.id,
            title: docMetadata["Document-Title"] || "Untitled",
            content: docContent,
            author: docMetadata["Author"] || "Unknown",
            createdAt: new Date(parseInt(docMetadata["Created-At"]) || Date.now()),
            updatedAt: new Date(parseInt(docMetadata["Updated-At"]) || Date.now()),
            tags: docMetadata["Document-Tags"] ? docMetadata["Document-Tags"].split(",") : [],
            status: docMetadata["Document-Status"] || "draft", // Add status field
          });
        } catch (error) {
          console.error("Error loading document data:", error);
        }
      }

      setGroupDocuments(documents.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      console.error("Error loading group documents:", error);
      message.error("Failed to load group documents");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new group
  const handleCreateGroup = async (values) => {
    if (!user?.id) {
      message.error("Please sign in to create a group");
      return;
    }

    if (needsProfileSetup) {
      message.warning("Please complete your scholar profile in SCAI Box before creating a group");
      return;
    }

    setLoading(true);
    try {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const groupData = {
        id: groupId,
        name: values.name,
        description: values.description,
        type: values.type, // 'public' or 'private'
        creator: user.id,
        creatorProfile: scholarProfile,
        members: [user.id], // Creator is automatically a member
        createdAt: Date.now(),
        avatar: values.avatar || "",
        tags: values.tags || "",
        documentsCount: 0,
        memberCount: 1,
      };

      // Generate hash for private groups
      if (values.type === "private") {
        const hashInput = `${groupId}_${user.id}_${Date.now()}`;
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashInput));
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        groupData.hash = hashHex;
        groupData.hashPrefix = hashHex.substring(0, 15);
      }

      // Upload to Irys
      const tags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "application/json" },
        { name: "Data-Type", value: "group" },
        { name: "Group-Type", value: values.type },
        { name: "Creator", value: user.id },
        { name: "Group-Name", value: values.name },
        { name: "Created-At", value: Date.now().toString() },
      ];

      if (values.tags) {
        tags.push({ name: "Group-Tags", value: values.tags });
      }

      const txId = await irysService.uploadData(JSON.stringify(groupData), tags);

      message.success(`Group created successfully! ${values.type === "private" ? `Hash prefix: ${groupData.hashPrefix}` : ""}`);

      // Refresh user groups
      await loadUserGroups();
      if (values.type === "public") {
        await loadAllGroups();
      }

      setCreateGroupModalVisible(false);
      groupForm.resetFields();

      // Show hash prefix for private groups
      if (values.type === "private") {
        Modal.info({
          title: "Private Group Created",
          content: (
            <div>
              <p>Your private group has been created successfully!</p>
              <p>
                <strong>Hash Prefix (share this with members):</strong>
              </p>
              <p
                style={{
                  background: "#f0f0f0",
                  padding: "10px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "16px",
                  textAlign: "center",
                }}
              >
                {groupData.hashPrefix}
              </p>
              <p style={{ color: "#666", fontSize: "12px" }}>Members will need this prefix to join your private group.</p>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Error creating group:", error);
      message.error("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Join a private group using hash prefix
  const handleJoinPrivateGroup = async (values) => {
    if (!user?.id) {
      message.error("Please sign in to join a group");
      return;
    }

    setLoading(true);
    try {
      // Query Irys for private groups with matching hash prefix
      const privateGroupsQuery = await irysService.queryTransactions({
        tags: [
          { name: "App-Name", value: "scai-press" },
          { name: "Content-Type", value: "application/json" },
          { name: "Data-Type", value: "group" },
          { name: "Group-Type", value: "private" },
        ],
      });

      let targetGroup = null;
      for (const tx of privateGroupsQuery) {
        try {
          const groupData = await irysService.getTransactionData(tx.id);
          if (groupData.hashPrefix === values.hashPrefix) {
            targetGroup = { ...groupData, id: tx.id, txId: tx.id };
            break;
          }
        } catch (error) {
          console.error("Error checking group:", error);
        }
      }

      if (!targetGroup) {
        message.error("No private group found with this hash prefix");
        return;
      }

      if (targetGroup.members.includes(user.id)) {
        message.warning("You are already a member of this group");
        return;
      }

      // Add user to group members
      const updatedGroupData = {
        ...targetGroup,
        members: [...targetGroup.members, user.id],
        memberCount: targetGroup.memberCount + 1,
      };

      // Upload updated group data to Irys
      const tags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "application/json" },
        { name: "Data-Type", value: "group" },
        { name: "Group-Type", value: "private" },
        { name: "Creator", value: targetGroup.creator },
        { name: "Group-Name", value: targetGroup.name },
        { name: "Updated-At", value: Date.now().toString() },
      ];

      await irysService.uploadData(JSON.stringify(updatedGroupData), tags);

      message.success(`Successfully joined group: ${targetGroup.name}`);

      // Refresh user groups
      await loadUserGroups();

      setJoinPrivateGroupModalVisible(false);
      joinGroupForm.resetFields();
    } catch (error) {
      console.error("Error joining private group:", error);
      message.error("Failed to join group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize data when user is available
  useEffect(() => {
    if (user?.id) {
      checkScholarProfile();
      loadUserGroups();
    }
    // Load all public groups for explore view
    loadAllGroups();
  }, [user?.id, checkScholarProfile, loadUserGroups, loadAllGroups]);

  // Group handling functions

  const handleDeleteDocument = async (document) => {
    Modal.confirm({
      title: "Delete Document",
      content: "Are you sure you want to delete this document? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // In a real implementation, you would mark the document as deleted on Irys
          // For now, we'll just remove it from the local state
          setGroupDocuments((prev) => prev.filter((doc) => doc.id !== document.id));
          message.success("Document deleted successfully");
        } catch (error) {
          console.error("Error deleting document:", error);
          message.error("Failed to delete document");
        }
      },
    });
  };

  const renderGroupsContent = () => {
    if (currentView === "group-detail" && selectedGroup) {
      return renderGroupWorkspace();
    }

    const groups = currentView === "my-groups" ? userGroups : allGroups;
    const isMyGroups = currentView === "my-groups";

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: "1rem" }}>Loading {isMyGroups ? "your" : "all"} groups...</Paragraph>
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="empty-state">
          {isMyGroups ? <BookOutlined style={{ fontSize: "64px", color: "#ee1111" }} /> : <UserOutlined />}
          <Title level={4}>{isMyGroups ? "No Research Groups Yet" : "No Public Groups Available"}</Title>
          <Paragraph>
            {isMyGroups ? "Create your first research group to start collaborating with other researchers. Share knowledge and work together on projects." : "The community hasn't shared any public research groups yet. Be the first to contribute by creating and sharing your group!"}
          </Paragraph>
          {isMyGroups ? (
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Button type="primary" size="large" onClick={() => setCreateGroupModalVisible(true)} style={{ marginTop: "15px" }}>
                Create Your First Group
              </Button>
              <Button size="large" onClick={() => setJoinPrivateGroupModalVisible(true)} style={{ marginTop: "15px" }}>
                Join Private Group
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentView("my-groups");
                  setCreateGroupModalVisible(true);
                }}
              >
                Create a Group
              </Button>
              <Button size="large" icon={<UserOutlined />} onClick={() => setCurrentView("my-groups")}>
                View My Groups
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="projects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {groups.map((group) => (
          <Card
            key={group.id}
            hoverable
            className="project-card"
            actions={
              isMyGroups
                ? [
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewGroup(group)}>
                      Enter
                    </Button>,
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditGroup(group)}>
                      Edit
                    </Button>,
                    <Button type="text" icon={<UserOutlined />}>
                      Members: {group.memberCount}
                    </Button>,
                  ]
                : [
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewGroup(group)}>
                      View
                    </Button>,
                    <Button type="text" icon={<UserOutlined />} onClick={() => handleJoinGroup(group)}>
                      Join
                    </Button>,
                    <Button type="text" icon={<BookOutlined />}>
                      Docs: {group.documentsCount}
                    </Button>,
                  ]
            }
          >
            <Card.Meta
              title={group.name}
              description={
                <div>
                  <Paragraph ellipsis={{ rows: 2 }}>{group.description}</Paragraph>
                  <div style={{ marginTop: "1rem" }}>
                    <Tag color={group.type === "private" ? "red" : "blue"}>{group.type === "private" ? "Private" : "Public"}</Tag>
                    {group.tags &&
                      group.tags.map((tag) => (
                        <Tag key={tag} color="default">
                          {tag}
                        </Tag>
                      ))}
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "12px", color: "#666" }}>
                    Created by {group.creatorProfile?.displayName || "Unknown"} • {group.memberCount} members
                  </div>
                </div>
              }
            />
          </Card>
        ))}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="press-dashboard">
      {/* Hero Section */}
      <div className="hero-section" style={{ marginBottom: "2.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="hero-content">
          <Title level={1} className="hero-title">
            SCAI Press
          </Title>
          <Paragraph className="hero-subtitle">Research Project Management & Publishing Platform</Paragraph>
          <Paragraph className="hero-description">Create research projects, manage your papers, and publish with permanent decentralized storage.</Paragraph>

          <div className="hero-actions">
            <Button type={currentView === "my-groups" ? "primary" : "default"} size="large" icon={<UserOutlined />} onClick={() => setCurrentView("my-groups")} className={currentView === "my-groups" ? "submit-btn" : "browse-btn"}>
              My Groups
            </Button>
            <Button type={currentView === "explore-groups" ? "primary" : "default"} size="large" icon={<BookOutlined />} className={currentView === "explore-groups" ? "submit-btn" : "browse-btn"} onClick={() => setCurrentView("explore-groups")}>
              Explore Groups
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Groups Section */}
      <div className="projects-section" style={{ padding: "2rem", maxWidth: "1200px", margin: " auto" }}>
        <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <Title level={2}>{currentView === "my-groups" ? "My Research Groups" : currentView === "explore-groups" ? "Explore Research Groups" : "Group Workspace"}</Title>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {currentView === "my-groups" && (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateGroupModalVisible(true)}>
                  Create Group
                </Button>
                <Button icon={<UserOutlined />} onClick={() => setJoinPrivateGroupModalVisible(true)}>
                  Join Private Group
                </Button>
              </>
            )}
            {currentView === "group-detail" && selectedGroup && (
              <Button
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditorMode("create");
                  setGroupEditorVisible(true);
                }}
              >
                New Document
              </Button>
            )}
            <Text type="secondary">Total: {currentView === "my-groups" ? userGroups.length : currentView === "explore-groups" ? allGroups.length : groupDocuments.length}</Text>
          </div>
        </div>

        {renderGroupsContent()}
      </div>
    </div>
  );

  // Group handling functions
  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setCurrentView("group-detail");
    loadGroupDocuments(group.id);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setEditorMode("create");
    setGroupEditorVisible(true);
  };

  // Handle document save from GroupMarkdownEditor
  const handleGroupDocumentSave = async (documentData) => {
    if (!user?.id || !selectedGroup) {
      message.error("Please sign in and select a group");
      return;
    }

    // Check if user is a member of the group
    if (!selectedGroup.members.includes(user.id)) {
      message.error("You are not a member of this group");
      return;
    }

    setLoading(true);
    try {
      const tags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "text/markdown" },
        { name: "Data-Type", value: "document" },
        { name: "Group-Id", value: selectedGroup.id },
        { name: "Document-Title", value: documentData.title },
        { name: "Author", value: editorMode === "edit" ? selectedDocument.author : user.id },
        { name: "Created-At", value: editorMode === "edit" ? selectedDocument.createdAt.toString() : Date.now().toString() },
        { name: "Updated-At", value: Date.now().toString() },
        { name: "Document-Status", value: documentData.status || (editorMode === "edit" ? selectedDocument.status : "draft") || "draft" }, // Add status tag
      ];

      if (editorMode === "edit") {
        tags.push({ name: "Editor", value: user.id });
        tags.push({ name: "Previous-Version", value: selectedDocument.txId });
      }

      if (documentData.tags && documentData.tags.length > 0) {
        tags.push({ name: "Document-Tags", value: documentData.tags.join(",") });
      }

      await irysService.uploadData(documentData.content, tags);

      message.success(`Document ${editorMode === "edit" ? "updated" : "created"} successfully!`);

      // Refresh group documents
      await loadGroupDocuments(selectedGroup.id);

      // Close editor
      setGroupEditorVisible(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error(`Error ${editorMode === "edit" ? "updating" : "creating"} document:`, error);
      message.error(`Failed to ${editorMode === "edit" ? "update" : "create"} document. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (group) => {
    if (!user?.id) {
      message.error("Please sign in to join a group");
      return;
    }

    if (group.members.includes(user.id)) {
      message.warning("You are already a member of this group");
      return;
    }

    try {
      // Add user to group members
      const updatedGroupData = {
        ...group,
        members: [...group.members, user.id],
        memberCount: group.memberCount + 1,
      };

      // Upload updated group data to Irys
      const tags = [
        { name: "App-Name", value: "scai-press" },
        { name: "Content-Type", value: "application/json" },
        { name: "Data-Type", value: "group" },
        { name: "Group-Type", value: group.type },
        { name: "Creator", value: group.creator },
        { name: "Group-Name", value: group.name },
        { name: "Updated-At", value: Date.now().toString() },
      ];

      await irysService.uploadData(JSON.stringify(updatedGroupData), tags);

      message.success(`Successfully joined group: ${group.name}`);

      // Refresh groups
      await loadAllGroups();
      await loadUserGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      message.error("Failed to join group. Please try again.");
    }
  };

  // Group workspace rendering
  const renderGroupWorkspace = () => {
    if (!selectedGroup) return null;

    return (
      <GroupWorkspace
        group={selectedGroup}
        documents={groupDocuments}
        currentUser={user}
        onCreateDocument={() => {
          setEditorMode("create");
          setGroupEditorVisible(true);
        }}
        onEditDocument={(document) => {
          setSelectedDocument(document);
          setEditorMode("edit");
          setGroupEditorVisible(true);
        }}
        onDeleteDocument={handleDeleteDocument}
        onPublishProject={(projectData) => {
          message.success(`Project "${projectData.title}" published successfully!`);
          message.info(`Access your project at: ${projectData.url}`);
        }}
        loading={loading}
      />
    );
  };

  // Document handling functions - now handled by GroupWorkspace component

  return (
    <Layout>
      <div className={`press-page light-theme`}>{needsProfileSetup ? <ProfileSetupPrompt user={user} /> : renderDashboard()}</div>

      {/* Create Group Modal */}
      <Modal
        title={
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <UserOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <div>
                <Title level={3} style={{ margin: 0, color: "inherit" }}>
                  Create Research Group
                </Title>
                <Text type="secondary">Create a collaborative space for your research team</Text>
              </div>
            </div>
          </div>
        }
        open={createGroupModalVisible}
        onCancel={() => {
          setCreateGroupModalVisible(false);
          groupForm.resetFields();
        }}
        footer={null}
        width="100%"
        style={{ maxWidth: "600px" }}
        className="create-group-modal"
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup} style={{ marginTop: "2rem" }}>
          <Form.Item name="name" label="Group Name" rules={[{ required: true, message: "Please enter group name" }]} extra="A clear, descriptive name for your research group">
            <Input placeholder="e.g., Quantum AI Research Lab" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Group Description" rules={[{ required: true, message: "Please enter group description" }]} extra="Describe the purpose and focus of your research group">
            <TextArea rows={4} placeholder="Describe your group's research focus, goals, and collaboration approach..." maxLength={1000} showCount />
          </Form.Item>

          <Form.Item name="type" label="Group Type" rules={[{ required: true, message: "Please select group type" }]} extra="Public groups are discoverable by everyone, private groups require a hash to join">
            <Select placeholder="Select group type" size="large">
              <Option value="public">Public - Anyone can discover and join</Option>
              <Option value="private">Private - Requires hash to join</Option>
            </Select>
          </Form.Item>

          <Form.Item name="tags" label="Research Tags (Optional)" extra="Tags that describe your research areas (comma-separated)">
            <Input placeholder="machine learning, quantum computing, collaboration" size="large" />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "2rem" }}>
            <Button
              onClick={() => {
                setCreateGroupModalVisible(false);
                groupForm.resetFields();
              }}
              style={{ marginRight: "1rem" }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Group
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Join Private Group Modal */}
      <Modal
        title={
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <UserOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <div>
                <Title level={3} style={{ margin: 0, color: "inherit" }}>
                  Join Private Group
                </Title>
                <Text type="secondary">Enter the group hash prefix to join a private group</Text>
              </div>
            </div>
          </div>
        }
        open={joinPrivateGroupModalVisible}
        onCancel={() => {
          setJoinPrivateGroupModalVisible(false);
          joinGroupForm.resetFields();
        }}
        footer={null}
        width="100%"
        style={{ maxWidth: "500px" }}
        className="join-group-modal"
      >
        <Form form={joinGroupForm} layout="vertical" onFinish={handleJoinPrivateGroup} style={{ marginTop: "2rem" }}>
          <Form.Item
            name="hashPrefix"
            label="Group Hash Prefix"
            rules={[
              { required: true, message: "Please enter the hash prefix" },
              { len: 15, message: "Hash prefix must be exactly 15 characters" },
            ]}
            extra="Enter the 15-character hash prefix provided by the group creator"
          >
            <Input placeholder="Enter 15-character hash prefix" size="large" maxLength={15} style={{ fontFamily: "monospace", fontSize: "16px" }} />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "2rem" }}>
            <Button
              onClick={() => {
                setJoinPrivateGroupModalVisible(false);
                joinGroupForm.resetFields();
              }}
              style={{ marginRight: "1rem" }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Join Group
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Group Markdown Editor */}
      <GroupMarkdownEditor
        visible={groupEditorVisible}
        onClose={() => {
          setGroupEditorVisible(false);
          setSelectedDocument(null);
        }}
        group={selectedGroup}
        onSave={handleGroupDocumentSave}
        loading={loading}
        initialData={editorMode === "edit" ? selectedDocument : null}
        mode={editorMode}
      />
    </Layout>
  );
};

export default PressPage;
