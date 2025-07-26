import React, { useState } from "react";
import { Modal, Tabs, Card, Button, Input, Typography, Space, Tag, Tooltip, message } from "antd";
import { FunctionOutlined, CopyOutlined, SearchOutlined, BookOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const MathTemplateLibrary = ({
  visible,
  onClose,
  onInsertTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("basic");

  // 数学公式模板库
  const mathTemplates = {
    basic: {
      title: "基础数学",
      icon: "📐",
      templates: [
        {
          name: "分数",
          latex: "\\frac{a}{b}",
          description: "基本分数表示",
          example: "$\\frac{1}{2}$",
          tags: ["fraction", "basic"]
        },
        {
          name: "平方根",
          latex: "\\sqrt{x}",
          description: "平方根",
          example: "$\\sqrt{16} = 4$",
          tags: ["root", "basic"]
        },
        {
          name: "n次方根",
          latex: "\\sqrt[n]{x}",
          description: "n次方根",
          example: "$\\sqrt[3]{8} = 2$",
          tags: ["root", "power"]
        },
        {
          name: "上标",
          latex: "x^{n}",
          description: "指数/上标",
          example: "$x^2$, $e^{i\\pi}$",
          tags: ["power", "superscript"]
        },
        {
          name: "下标",
          latex: "x_{n}",
          description: "下标",
          example: "$x_1$, $a_{ij}$",
          tags: ["subscript", "index"]
        },
        {
          name: "求和",
          latex: "\\sum_{i=1}^{n} x_i",
          description: "求和符号",
          example: "$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$",
          tags: ["sum", "series"]
        },
        {
          name: "积分",
          latex: "\\int_{a}^{b} f(x) dx",
          description: "定积分",
          example: "$\\int_0^1 x^2 dx = \\frac{1}{3}$",
          tags: ["integral", "calculus"]
        },
        {
          name: "极限",
          latex: "\\lim_{x \\to a} f(x)",
          description: "极限",
          example: "$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$",
          tags: ["limit", "calculus"]
        }
      ]
    },
    algebra: {
      title: "代数",
      icon: "🔢",
      templates: [
        {
          name: "二次公式",
          latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
          description: "二次方程求根公式",
          example: "对于 $ax^2 + bx + c = 0$",
          tags: ["quadratic", "formula"]
        },
        {
          name: "矩阵",
          latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
          description: "2x2矩阵",
          example: "$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$",
          tags: ["matrix", "linear algebra"]
        },
        {
          name: "行列式",
          latex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",
          description: "2x2行列式",
          example: "$\\begin{vmatrix} 1 & 2 \\\\ 3 & 4 \\end{vmatrix} = -2$",
          tags: ["determinant", "matrix"]
        },
        {
          name: "向量",
          latex: "\\vec{v} = \\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}",
          description: "三维向量",
          example: "$\\vec{v} = \\begin{pmatrix} 1 \\\\ 2 \\\\ 3 \\end{pmatrix}$",
          tags: ["vector", "geometry"]
        },
        {
          name: "点积",
          latex: "\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta",
          description: "向量点积",
          example: "$\\vec{a} \\cdot \\vec{b} = a_1b_1 + a_2b_2 + a_3b_3$",
          tags: ["dot product", "vector"]
        }
      ]
    },
    calculus: {
      title: "微积分",
      icon: "📈",
      templates: [
        {
          name: "导数",
          latex: "\\frac{d}{dx}f(x) = f'(x)",
          description: "导数记号",
          example: "$\\frac{d}{dx}x^2 = 2x$",
          tags: ["derivative", "calculus"]
        },
        {
          name: "偏导数",
          latex: "\\frac{\\partial f}{\\partial x}",
          description: "偏导数",
          example: "$\\frac{\\partial}{\\partial x}(x^2 + y^2) = 2x$",
          tags: ["partial derivative", "multivariable"]
        },
        {
          name: "二重积分",
          latex: "\\iint_D f(x,y) \\, dx \\, dy",
          description: "二重积分",
          example: "$\\iint_D xy \\, dx \\, dy$",
          tags: ["double integral", "multivariable"]
        },
        {
          name: "泰勒级数",
          latex: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
          description: "泰勒级数展开",
          example: "$e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}$",
          tags: ["taylor series", "series"]
        },
        {
          name: "梯度",
          latex: "\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right)",
          description: "梯度向量",
          example: "$\\nabla(x^2 + y^2) = (2x, 2y)$",
          tags: ["gradient", "vector calculus"]
        }
      ]
    },
    statistics: {
      title: "统计学",
      icon: "📊",
      templates: [
        {
          name: "正态分布",
          latex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
          description: "正态分布概率密度函数",
          example: "均值 $\\mu$，标准差 $\\sigma$",
          tags: ["normal distribution", "probability"]
        },
        {
          name: "期望值",
          latex: "E[X] = \\sum_{i} x_i P(X = x_i)",
          description: "离散随机变量期望",
          example: "$E[X] = \\mu$",
          tags: ["expectation", "probability"]
        },
        {
          name: "方差",
          latex: "\\text{Var}(X) = E[(X - \\mu)^2] = E[X^2] - (E[X])^2",
          description: "方差公式",
          example: "$\\text{Var}(X) = \\sigma^2$",
          tags: ["variance", "statistics"]
        },
        {
          name: "贝叶斯定理",
          latex: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
          description: "贝叶斯定理",
          example: "条件概率的基础",
          tags: ["bayes", "probability"]
        },
        {
          name: "置信区间",
          latex: "\\bar{x} \\pm z_{\\alpha/2} \\frac{\\sigma}{\\sqrt{n}}",
          description: "均值的置信区间",
          example: "95%置信区间",
          tags: ["confidence interval", "statistics"]
        }
      ]
    },
    physics: {
      title: "物理学",
      icon: "⚛️",
      templates: [
        {
          name: "牛顿第二定律",
          latex: "F = ma",
          description: "力等于质量乘以加速度",
          example: "$F = m\\frac{dv}{dt}$",
          tags: ["newton", "mechanics"]
        },
        {
          name: "能量守恒",
          latex: "E = K + U = \\frac{1}{2}mv^2 + mgh",
          description: "机械能守恒",
          example: "动能 + 势能 = 常数",
          tags: ["energy", "conservation"]
        },
        {
          name: "薛定谔方程",
          latex: "i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi",
          description: "量子力学基本方程",
          example: "波函数的时间演化",
          tags: ["quantum", "schrodinger"]
        },
        {
          name: "麦克斯韦方程组",
          latex: "\\begin{align} \\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\epsilon_0} \\\\ \\nabla \\cdot \\mathbf{B} &= 0 \\\\ \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\ \\nabla \\times \\mathbf{B} &= \\mu_0\\mathbf{J} + \\mu_0\\epsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t} \\end{align}",
          description: "电磁学基本方程",
          example: "描述电磁场的行为",
          tags: ["maxwell", "electromagnetism"]
        },
        {
          name: "爱因斯坦质能方程",
          latex: "E = mc^2",
          description: "质量能量等价性",
          example: "相对论的著名公式",
          tags: ["einstein", "relativity"]
        }
      ]
    }
  };

  // 过滤模板
  const getFilteredTemplates = () => {
    const category = mathTemplates[selectedCategory];
    if (!category) return [];

    return category.templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // 复制到剪贴板
  const copyToClipboard = (latex) => {
    navigator.clipboard.writeText(latex).then(() => {
      message.success("LaTeX code copied to clipboard!");
    }).catch(() => {
      message.error("Failed to copy to clipboard");
    });
  };

  // 插入模板
  const handleInsertTemplate = (template) => {
    if (onInsertTemplate) {
      onInsertTemplate(template.latex);
      message.success(`Inserted: ${template.name}`);
    }
  };

  // 渲染模板卡片
  const renderTemplateCard = (template, index) => (
    <motion.div
      key={template.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        size="small"
        style={{
          marginBottom: "12px",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.1)",
        }}
        bodyStyle={{ padding: "12px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
              <Title level={5} style={{ margin: 0, marginRight: "8px" }}>
                {template.name}
              </Title>
              <div>
                {template.tags.map(tag => (
                  <Tag key={tag} size="small" color="blue">
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
            
            <Paragraph style={{ margin: "0 0 8px 0", color: "#666", fontSize: "12px" }}>
              {template.description}
            </Paragraph>
            
            <div style={{
              background: "#f5f5f5",
              padding: "8px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
              marginBottom: "8px",
              wordBreak: "break-all",
            }}>
              {template.latex}
            </div>
            
            <Text type="secondary" style={{ fontSize: "11px" }}>
              Example: {template.example}
            </Text>
          </div>
          
          <Space direction="vertical" size="small" style={{ marginLeft: "12px" }}>
            <Tooltip title="Copy LaTeX Code">
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                onClick={() => copyToClipboard(template.latex)}
              />
            </Tooltip>
            <Tooltip title="Insert Template">
              <Button
                type="primary"
                size="small"
                onClick={() => handleInsertTemplate(template)}
                style={{
                  background: "linear-gradient(45deg, #FF3314, #FF6B47)",
                  border: "none",
                }}
              >
                Insert
              </Button>
            </Tooltip>
          </Space>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FunctionOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Math Template Library
            </Title>
            <Text type="secondary">Insert mathematical formulas and equations</Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: "1200px" }}
      bodyStyle={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <Search
          placeholder="Search templates by name, description, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: "16px" }}
          prefix={<SearchOutlined />}
        />
      </div>

      <Tabs
        activeKey={selectedCategory}
        onChange={setSelectedCategory}
        items={Object.entries(mathTemplates).map(([key, category]) => ({
          key,
          label: (
            <span>
              <span style={{ marginRight: "8px" }}>{category.icon}</span>
              {category.title}
            </span>
          ),
          children: (
            <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "8px 0" }}>
              {getFilteredTemplates().length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <BookOutlined style={{ fontSize: "48px", color: "#ccc" }} />
                  <div style={{ marginTop: "16px" }}>
                    <Title level={4} style={{ color: "#999" }}>No Templates Found</Title>
                    <Text type="secondary">
                      {searchTerm ? "Try different search terms" : "No templates in this category"}
                    </Text>
                  </div>
                </div>
              ) : (
                getFilteredTemplates().map((template, index) => renderTemplateCard(template, index))
              )}
            </div>
          ),
        }))}
      />
    </Modal>
  );
};

export default MathTemplateLibrary;
