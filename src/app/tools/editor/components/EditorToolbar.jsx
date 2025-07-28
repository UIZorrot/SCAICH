import React, { useCallback, useState } from "react";
import { Button, Tooltip, Divider, Dropdown, Space, Modal, Form, Input, Select, InputNumber, Checkbox } from "antd";
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
} from "@ant-design/icons";
import { motion } from "framer-motion";
import "./EditorToolbar.css";

const EditorToolbar = ({ editor }) => {
  const [equationModalVisible, setEquationModalVisible] = useState(false);
  const [theoremModalVisible, setTheoremModalVisible] = useState(false);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
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

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="editor-toolbar">
      <div className="toolbar-section">
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
    </motion.div>
  );
};

export default EditorToolbar;
