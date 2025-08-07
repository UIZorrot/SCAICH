import React, { useCallback, useState } from "react";
import { Button, Tooltip, Divider, Dropdown, Space, Modal, Form, Input, Select, InputNumber, Checkbox, message } from "antd";
import {
  UndoOutlined,
  RedoOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  MessageOutlined,
  LinkOutlined,
  PictureOutlined,
  TableOutlined,
  FunctionOutlined,
  ExperimentOutlined,
  FontSizeOutlined,
  DownOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  CodeOutlined,
  FileTextOutlined,
  UserOutlined,
  BookOutlined,
  TagsOutlined,
  BankOutlined,
  FileAddOutlined,
  TeamOutlined,
  TrophyOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import "./EditorToolbar.css";
import PaperTemplateService from "../services/PaperTemplateService";
import PaperStructureIntegration from "../services/PaperStructureIntegration";
import NewPaperWizard from "./PaperWorkflowGuide";

const EditorToolbar = ({ editor }) => {
  const [equationModalVisible, setEquationModalVisible] = useState(false);
  const [theoremModalVisible, setTheoremModalVisible] = useState(false);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [workflowGuideVisible, setWorkflowGuideVisible] = useState(false);
  const [equationForm] = Form.useForm();
  const [theoremForm] = Form.useForm();
  const [tableForm] = Form.useForm();
  const [imageForm] = Form.useForm();
  // History operations
  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  // Text formatting
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run();
  }, [editor]);

  // Paragraph formatting
  const setHeading = useCallback(
    (level) => {
      if (level === 0) {
        editor?.chain().focus().setParagraph().run();
      } else {
        editor?.chain().focus().toggleHeading({ level }).run();
      }
    },
    [editor]
  );

  const getCurrentHeadingLevel = useCallback(() => {
    if (!editor) return 0;
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("numberedHeading", { level })) {
        return level;
      }
    }
    return 0;
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  // Insert elements
  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("请输入链接URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    setImageModalVisible(true);
  }, []);

  const addTable = useCallback(() => {
    setTableModalVisible(true);
  }, []);

  const addEquation = useCallback(() => {
    setEquationModalVisible(true);
  }, []);

  const addTheorem = useCallback(() => {
    setTheoremModalVisible(true);
  }, []);

  const handleEquationSubmit = useCallback(() => {
    equationForm.validateFields().then((values) => {
      // 使用 insertText 来触发第三方扩展的转换规则
      editor?.chain().focus().insertText(`$$${values.latex}$$`).run();
      setEquationModalVisible(false);
      equationForm.resetFields();
    });
  }, [editor, equationForm]);

  const handleTheoremSubmit = useCallback(() => {
    theoremForm.validateFields().then((values) => {
      editor
        ?.chain()
        .focus()
        .setTheoremBlock({
          type: values.type,
          title: values.title || "",
        })
        .run();
      setTheoremModalVisible(false);
      theoremForm.resetFields();
    });
  }, [editor, theoremForm]);

  const handleTableSubmit = useCallback(() => {
    tableForm.validateFields().then((values) => {
      editor
        ?.chain()
        .focus()
        .insertTable({
          rows: values.rows,
          cols: values.cols,
          withHeaderRow: values.withHeader,
        })
        .run();
      setTableModalVisible(false);
      tableForm.resetFields();
    });
  }, [editor, tableForm]);

  const handleImageSubmit = useCallback(() => {
    imageForm.validateFields().then((values) => {
      editor
        ?.chain()
        .focus()
        .setImage({
          src: values.url,
          alt: values.alt || "",
          title: values.title || "",
        })
        .run();
      setImageModalVisible(false);
      imageForm.resetFields();
    });
  }, [editor, imageForm]);

  // 智能模板选择处理函数
  const handleTemplateSelect = useCallback(
    async (templateType) => {
      try {
        const success = await PaperStructureIntegration.smartApplyTemplate(editor, templateType, {
          preserveStructure: true,
        });

        if (success) {
          message.success("论文模板已成功应用");
        }
      } catch (error) {
        console.error("应用模板失败:", error);
        message.error("应用模板失败，请重试");
      }
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  const headingItems = [
    { key: "0", label: "正文", onClick: () => setHeading(0) },
    { key: "1", label: "一级标题", onClick: () => setHeading(1) },
    { key: "2", label: "二级标题", onClick: () => setHeading(2) },
    { key: "3", label: "三级标题", onClick: () => setHeading(3) },
    { key: "4", label: "四级标题", onClick: () => setHeading(4) },
    { key: "5", label: "五级标题", onClick: () => setHeading(5) },
    { key: "6", label: "六级标题", onClick: () => setHeading(6) },
  ];

  // 模板选项
  const templateItems = PaperTemplateService.getAvailableTemplates().map((template) => ({
    key: template.key,
    label: (
      <Space>
        <span>{template.name}</span>
        <span style={{ color: "#666", fontSize: "12px" }}>{template.description}</span>
      </Space>
    ),
    onClick: () => handleTemplateSelect(template.key),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="editor-toolbar">
      <div className="toolbar-section">
        {/* New Paper Wizard */}
        <Tooltip title="新建论文向导">
          <Button size="small" type="primary" onClick={() => setWorkflowGuideVisible(true)}>
            <RocketOutlined />
            新建向导
          </Button>
        </Tooltip>

        {/* Template Selection */}
        <Dropdown menu={{ items: templateItems }} trigger={["click"]} placement="bottomLeft">
          <Tooltip title="选择论文模板">
            <Button size="small" type="default">
              <FileAddOutlined />
              模板
              <DownOutlined style={{ fontSize: "10px", marginLeft: "4px" }} />
            </Button>
          </Tooltip>
        </Dropdown>

        <Divider type="vertical" />

        {/* History Operations */}
        <Space.Compact>
          <Tooltip title="撤销">
            <Button size="small" icon={<UndoOutlined />} onClick={undo} disabled={!editor.can().undo()} />
          </Tooltip>
          <Tooltip title="重做">
            <Button size="small" icon={<RedoOutlined />} onClick={redo} disabled={!editor.can().redo()} />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" />

        {/* Heading Selection */}
        <Dropdown menu={{ items: headingItems }} trigger={["click"]} placement="bottomLeft">
          <Tooltip title="设置标题级别">
            <Button size="small" type={getCurrentHeadingLevel() > 0 ? "primary" : "default"}>
              <FontSizeOutlined />
              {getCurrentHeadingLevel() > 0 ? `H${getCurrentHeadingLevel()}` : "标题"}
              <DownOutlined style={{ fontSize: "10px", marginLeft: "4px" }} />
            </Button>
          </Tooltip>
        </Dropdown>

        <Divider type="vertical" />

        {/* Text Formatting */}
        <Space.Compact>
          <Tooltip title="粗体">
            <Button size="small" type={editor.isActive("bold") ? "primary" : "default"} icon={<BoldOutlined />} onClick={toggleBold} />
          </Tooltip>
          <Tooltip title="斜体">
            <Button size="small" type={editor.isActive("italic") ? "primary" : "default"} icon={<ItalicOutlined />} onClick={toggleItalic} />
          </Tooltip>
          <Tooltip title="下划线">
            <Button size="small" type={editor.isActive("underline") ? "primary" : "default"} icon={<UnderlineOutlined />} onClick={toggleUnderline} />
          </Tooltip>
          <Tooltip title="删除线">
            <Button size="small" type={editor.isActive("strike") ? "primary" : "default"} icon={<StrikethroughOutlined />} onClick={toggleStrike} />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" />

        {/* List and Quote */}
        <Space.Compact>
          <Tooltip title="无序列表">
            <Button size="small" type={editor.isActive("bulletList") ? "primary" : "default"} icon={<UnorderedListOutlined />} onClick={toggleBulletList} />
          </Tooltip>
          <Tooltip title="有序列表">
            <Button size="small" type={editor.isActive("orderedList") ? "primary" : "default"} icon={<OrderedListOutlined />} onClick={toggleOrderedList} />
          </Tooltip>
          <Tooltip title="引用">
            <Button size="small" type={editor.isActive("blockquote") ? "primary" : "default"} icon={<MessageOutlined />} onClick={toggleBlockquote} />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" />

        {/* Insert Elements */}
        <Space.Compact>
          <Tooltip title="插入链接">
            <Button size="small" type={editor.isActive("link") ? "primary" : "default"} icon={<LinkOutlined />} onClick={addLink} />
          </Tooltip>
          <Tooltip title="插入图片">
            <Button size="small" icon={<PictureOutlined />} onClick={addImage} />
          </Tooltip>
          <Tooltip title="插入表格">
            <Button size="small" icon={<TableOutlined />} onClick={addTable} />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" />

        {/* Academic Elements */}
        <Space.Compact>
          <Tooltip title="插入定理">
            <Button size="small" icon={<ExperimentOutlined />} onClick={addTheorem} />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" />

        {/* Paper Structure Elements */}
        <Space.Compact>
          <Tooltip title="插入论文标题">
            <Button size="small" icon={<FileTextOutlined />} onClick={() => editor.commands.setPaperTitle()} type={editor.isActive("paperTitle") ? "primary" : "default"} />
          </Tooltip>
          <Tooltip title="插入作者信息">
            <Button size="small" icon={<UserOutlined />} onClick={() => editor.commands.setAuthorInfo()} type={editor.isActive("authorInfo") ? "primary" : "default"} />
          </Tooltip>
          <Tooltip title="插入摘要">
            <Button size="small" icon={<BookOutlined />} onClick={() => editor.commands.setAbstract()} type={editor.isActive("abstract") ? "primary" : "default"} />
          </Tooltip>
          <Tooltip title="插入关键词">
            <Button size="small" icon={<TagsOutlined />} onClick={() => editor.commands.setKeywords()} type={editor.isActive("keywords") ? "primary" : "default"} />
          </Tooltip>
          <Tooltip title="插入机构信息">
            <Button size="small" icon={<BankOutlined />} onClick={() => editor.commands.setAffiliation()} type={editor.isActive("affiliation") ? "primary" : "default"} />
          </Tooltip>
        </Space.Compact>
      </div>

      {/* 公式输入Modal */}
      <Modal
        title="插入数学公式"
        open={equationModalVisible}
        onOk={handleEquationSubmit}
        onCancel={() => {
          setEquationModalVisible(false);
          equationForm.resetFields();
        }}
        okText="插入"
        cancelText="取消"
      >
        <Form form={equationForm} layout="vertical">
          <Form.Item name="latex" label="LaTeX公式" rules={[{ required: true, message: "请输入LaTeX公式" }]} initialValue="E = mc^2">
            <Input.TextArea rows={3} placeholder="例如: E = mc^2, \frac{a}{b}, \sum_{i=1}^{n} x_i" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 定理输入Modal */}
      <Modal
        title="插入定理"
        open={theoremModalVisible}
        onOk={handleTheoremSubmit}
        onCancel={() => {
          setTheoremModalVisible(false);
          theoremForm.resetFields();
        }}
        okText="插入"
        cancelText="取消"
      >
        <Form form={theoremForm} layout="vertical">
          <Form.Item name="type" label="定理类型" rules={[{ required: true, message: "请选择定理类型" }]} initialValue="theorem">
            <Select>
              <Select.Option value="theorem">定理 (Theorem)</Select.Option>
              <Select.Option value="lemma">引理 (Lemma)</Select.Option>
              <Select.Option value="corollary">推论 (Corollary)</Select.Option>
              <Select.Option value="definition">定义 (Definition)</Select.Option>
              <Select.Option value="proposition">命题 (Proposition)</Select.Option>
              <Select.Option value="example">例子 (Example)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="定理标题（可选）">
            <Input placeholder="例如: 勾股定理" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 表格配置Modal */}
      <Modal
        title="插入表格"
        open={tableModalVisible}
        onOk={handleTableSubmit}
        onCancel={() => {
          setTableModalVisible(false);
          tableForm.resetFields();
        }}
        okText="插入"
        cancelText="取消"
      >
        <Form form={tableForm} layout="vertical" initialValues={{ rows: 3, cols: 3, withHeader: true }}>
          <Form.Item name="rows" label="行数" rules={[{ required: true, message: "请输入行数" }]}>
            <InputNumber min={1} max={20} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="cols" label="列数" rules={[{ required: true, message: "请输入列数" }]}>
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="withHeader" valuePropName="checked">
            <Checkbox>包含表头</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* 图片插入Modal */}
      <Modal
        title="插入图片"
        open={imageModalVisible}
        onOk={handleImageSubmit}
        onCancel={() => {
          setImageModalVisible(false);
          imageForm.resetFields();
        }}
        okText="插入"
        cancelText="取消"
      >
        <Form form={imageForm} layout="vertical">
          <Form.Item name="url" label="图片URL" rules={[{ required: true, message: "请输入图片URL" }]}>
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
          <Form.Item name="alt" label="替代文本（可选）">
            <Input placeholder="图片描述" />
          </Form.Item>
          <Form.Item name="title" label="图片标题（可选）">
            <Input placeholder="图片标题" />
          </Form.Item>
        </Form>
      </Modal>

      {/* New Paper Wizard */}
      <NewPaperWizard
        visible={workflowGuideVisible}
        onClose={() => setWorkflowGuideVisible(false)}
        editor={editor}
        onComplete={(outlineParams) => {
          // 向导完成后的处理
          console.log("工作流程完成，大纲参数:", outlineParams);
        }}
      />
    </motion.div>
  );
};

export default EditorToolbar;
