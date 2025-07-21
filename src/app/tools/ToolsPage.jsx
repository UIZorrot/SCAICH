import {
    Button,
    Card,
    Typography,
    Input,
    Select,
    Tag,
    message,
    Row,
    Col,
    List,
    Avatar,
    Badge,
    Divider,
    Progress,
    Rate
} from 'antd';
import {
    EditOutlined,
    ExperimentOutlined,
    BarChartOutlined,
    ToolOutlined,
    BulbOutlined,
    AccountBookOutlined,
    TrophyOutlined,
    EyeOutlined,
    PieChartOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import './ToolsPage.css';
import { useState } from 'react';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ToolsPage = () => {
    // Tool states
    const [polishText, setPolishText] = useState('');
    const [polishedResult, setPolishedResult] = useState('');
    const [polishLoading, setPolishLoading] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [reviewResult, setReviewResult] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [chartData, setChartData] = useState('');
    const [chartResult, setChartResult] = useState('');
    const [chartLoading, setChartLoading] = useState(false);

    // Mock data for recommendations and news
    const [recommendations] = useState([
        {
            id: 1,
            title: "AI-Powered Research Assistant Tools",
            description: "Discover the latest AI tools that can accelerate your research workflow",
            category: "AI Tools",
            rating: 4.8,
            views: 1234,
            trending: true
        },
        {
            id: 2,
            title: "Best Practices for Academic Writing",
            description: "Essential guidelines for writing high-impact research papers",
            category: "Writing",
            rating: 4.6,
            views: 892,
            trending: false
        },
        {
            id: 3,
            title: "Data Visualization Techniques",
            description: "Modern approaches to presenting research data effectively",
            category: "Visualization",
            rating: 4.7,
            views: 756,
            trending: true
        }
    ]);

    const [newsItems] = useState([
        {
            id: 1,
            title: "Nature Announces New Open Access Policy",
            source: "Nature Publishing",
            time: "2 hours ago",
            category: "Publishing",
            image: "https://via.placeholder.com/60x60"
        },
        {
            id: 2,
            title: "AI Breakthrough in Protein Folding Research",
            source: "Science Magazine",
            time: "5 hours ago",
            category: "AI Research",
            image: "https://via.placeholder.com/60x60"
        },
        {
            id: 3,
            title: "New Funding Opportunities for Early Career Researchers",
            source: "Research Funding News",
            time: "1 day ago",
            category: "Funding",
            image: "https://via.placeholder.com/60x60"
        }
    ]);

    const handlePolishText = () => {
        if (!polishText.trim()) {
            message.warning('Please enter some text to polish');
            return;
        }

        setPolishLoading(true);

        // Simulate AI polishing
        setTimeout(() => {
            const polished = `Enhanced version: ${polishText.replace(/\b(shows|perform|we believe)\b/g, (match) => {
                switch (match) {
                    case 'shows': return 'demonstrates';
                    case 'perform': return 'performs';
                    case 'we believe': return 'our analysis suggests';
                    default: return match;
                }
            })}`;

            setPolishedResult(polished);
            setPolishLoading(false);
            message.success('Text polished successfully!');
        }, 2000);
    };

    const handleReviewText = () => {
        if (!reviewText.trim()) {
            message.warning('Please enter text for review');
            return;
        }

        setReviewLoading(true);

        // Simulate AI review
        setTimeout(() => {
            const review = {
                score: 8.5,
                strengths: [
                    "Clear methodology and well-structured approach",
                    "Strong theoretical foundation",
                    "Comprehensive literature review"
                ],
                weaknesses: [
                    "Limited sample size may affect generalizability",
                    "Some statistical analyses could be more robust",
                    "Discussion section needs more depth"
                ],
                suggestions: [
                    "Consider expanding the sample size for future studies",
                    "Add more recent references to strengthen the literature review",
                    "Include limitations section to acknowledge study constraints"
                ]
            };

            setReviewResult(review);
            setReviewLoading(false);
            message.success('Review completed successfully!');
        }, 3000);
    };

    const handleGenerateChart = () => {
        if (!chartData.trim()) {
            message.warning('Please enter data for chart generation');
            return;
        }

        setChartLoading(true);

        // Simulate chart generation
        setTimeout(() => {
            const chartInfo = {
                type: "Bar Chart",
                description: "Generated visualization based on your data",
                suggestions: [
                    "Consider using a line chart for time-series data",
                    "Add error bars to show data uncertainty",
                    "Use consistent color scheme for better readability"
                ]
            };

            setChartResult(chartInfo);
            setChartLoading(false);
            message.success('Chart generated successfully!');
        }, 2500);
    };

    return (
        <Layout>
            <div className="tools-page">
                {/* Hero Section */}
                <div className="hero-section">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="hero-content"
                    >
                        <Title level={1} className="hero-title">SCAI Tools</Title>
                        <Paragraph className="hero-subtitle">
                            AI-Powered Academic Writing & Research Tools
                        </Paragraph>
                        <Paragraph className="hero-description">
                            Enhance your academic writing with our suite of intelligent tools designed for researchers and scholars.
                        </Paragraph>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="tools-main-content">
                    <Row gutter={[24, 24]}>
                        {/* Left Column - Tools */}
                        <Col xs={24} lg={16}>
                            <div>
                                <Row gutter={[16, 16]}>
                                    {/* Polish Tool */}
                                    <Col xs={24} md={12}>
                                        <Card
                                            className="tool-card"
                                            title={
                                                <span>
                                                    <EditOutlined style={{ marginRight: '0.5rem', color: '#ee1d1d' }} />
                                                    润色校对工具
                                                </span>
                                            }
                                            hoverable
                                        >
                                            <Paragraph className="tool-description">
                                                AI驱动的学术写作增强工具，提升语言表达和学术规范性
                                            </Paragraph>
                                            <TextArea
                                                rows={4}
                                                placeholder="输入需要润色的文本..."
                                                value={polishText}
                                                onChange={(e) => setPolishText(e.target.value)}
                                                style={{ marginBottom: '1rem' }}
                                            />
                                            <Button
                                                type="primary"
                                                loading={polishLoading}
                                                onClick={handlePolishText}
                                                block
                                            >
                                                开始润色
                                            </Button>
                                            {polishedResult && (
                                                <div className="tool-result">
                                                    <Divider />
                                                    <Text strong>润色结果：</Text>
                                                    <Paragraph className="result-text">{polishedResult}</Paragraph>
                                                </div>
                                            )}
                                        </Card>
                                    </Col>

                                    {/* Review Tool */}
                                    <Col xs={24} md={12}>
                                        <Card
                                            className="tool-card"
                                            title={
                                                <span>
                                                    <ExperimentOutlined style={{ marginRight: '0.5rem', color: '#ee1d1d' }} />
                                                    模拟论文评审
                                                </span>
                                            }
                                            hoverable
                                        >
                                            <Paragraph className="tool-description">
                                                模拟同行评审过程，提供专业的论文评价和改进建议
                                            </Paragraph>
                                            <TextArea
                                                rows={4}
                                                placeholder="输入论文摘要或段落进行评审..."
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                style={{ marginBottom: '1rem' }}
                                            />
                                            <Button
                                                type="primary"
                                                loading={reviewLoading}
                                                onClick={handleReviewText}
                                                block
                                            >
                                                开始评审
                                            </Button>
                                            {reviewResult && (
                                                <div className="tool-result">
                                                    <Divider />
                                                    <div className="review-score">
                                                        <Text strong>评分: </Text>
                                                        <Rate disabled defaultValue={Math.floor(reviewResult.score / 2)} />
                                                        <Text className="score-text">{reviewResult.score}/10</Text>
                                                    </div>
                                                    <div className="review-details">
                                                        <Text strong className="review-section">优点:</Text>
                                                        <ul>
                                                            {reviewResult.strengths?.map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))}
                                                        </ul>
                                                        <Text strong className="review-section">改进建议:</Text>
                                                        <ul>
                                                            {reviewResult.suggestions?.map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    </Col>

                                    {/* Chart Tool */}
                                    <Col xs={24}>
                                        <Card
                                            className="tool-card"
                                            title={
                                                <span>
                                                    <BarChartOutlined style={{ marginRight: '0.5rem', color: '#ee1d1d' }} />
                                                    图表生成工具
                                                </span>
                                            }
                                            hoverable
                                        >
                                            <Paragraph className="tool-description">
                                                智能数据可视化工具，根据数据自动生成专业图表
                                            </Paragraph>
                                            <Row gutter={16}>
                                                <Col xs={24} md={16}>
                                                    <TextArea
                                                        rows={4}
                                                        placeholder="输入数据或描述图表需求..."
                                                        value={chartData}
                                                        onChange={(e) => setChartData(e.target.value)}
                                                        style={{ marginBottom: '1rem' }}
                                                    />
                                                </Col>
                                                <Col xs={24} md={8}>
                                                    <Select
                                                        placeholder="选择图表类型"
                                                        style={{ width: '100%', marginBottom: '1rem' }}
                                                    >
                                                        <Option value="bar">柱状图</Option>
                                                        <Option value="line">折线图</Option>
                                                        <Option value="pie">饼图</Option>
                                                        <Option value="scatter">散点图</Option>
                                                    </Select>
                                                </Col>
                                            </Row>
                                            <Button
                                                type="primary"
                                                loading={chartLoading}
                                                onClick={handleGenerateChart}
                                                block
                                            >
                                                生成图表
                                            </Button>
                                            {chartResult && (
                                                <div className="tool-result">
                                                    <Divider />
                                                    <div className="chart-preview">
                                                        <PieChartOutlined style={{ fontSize: '48px', color: '#ee1d1d', marginBottom: '1rem' }} />
                                                        <Text strong>图表类型: {chartResult.type}</Text>
                                                        <Paragraph>{chartResult.description}</Paragraph>
                                                        <Text strong>优化建议:</Text>
                                                        <ul>
                                                            {chartResult.suggestions?.map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        </Col>

                        {/* Right Column - Recommendations & News */}
                        <Col xs={24} lg={8}>
                            <div className="sidebar-section">
                                {/* Tool Recommendations */}
                                <Card className="sidebar-card" title={
                                    <span>
                                        <BulbOutlined style={{ marginRight: '0.5rem', color: '#ee1d1d' }} />
                                        工具推荐
                                    </span>
                                }>
                                    <List
                                        dataSource={recommendations}
                                        renderItem={(item) => (
                                            <List.Item className="recommendation-item">
                                                <div className="recommendation-content">
                                                    <div className="recommendation-header">
                                                        <Text strong className="recommendation-title">{item.title}</Text>
                                                        {item.trending && <Badge count="热门" style={{ backgroundColor: '#ee1d1d' }} />}
                                                    </div>
                                                    <Paragraph className="recommendation-desc">{item.description}</Paragraph>
                                                    <div className="recommendation-meta">
                                                        <Tag color="blue">{item.category}</Tag>
                                                        <Rate disabled defaultValue={Math.floor(item.rating)} size="small" />
                                                        <Text type="secondary" className="view-count">
                                                            <EyeOutlined /> {item.views}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </List.Item>
                                        )}
                                    />
                                </Card>

                                {/* Academic News */}
                                <Card className="sidebar-card" title={
                                    <span>
                                        <AccountBookOutlined style={{ marginRight: '0.5rem', color: '#ee1d1d' }} />
                                        学术资讯
                                    </span>
                                } style={{ marginTop: '1.5rem' }}>
                                    <List
                                        dataSource={newsItems}
                                        renderItem={(item) => (
                                            <List.Item className="news-item">
                                                <List.Item.Meta
                                                    avatar={<Avatar src={item.image} />}
                                                    title={<Text strong className="news-title">{item.title}</Text>}
                                                    description={
                                                        <div className="news-meta">
                                                            <Text type="secondary">{item.source}</Text>
                                                            <Text type="secondary" className="news-time">{item.time}</Text>
                                                            <Tag size="small" color="green">{item.category}</Tag>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </Card>

                                {/* Quick Stats */}
                                <Card className="sidebar-card" title={
                                    <span>
                                        <TrophyOutlined style={{ marginRight: '0.5rem', color: '#ee1d1d' }} />
                                        使用统计
                                    </span>
                                } style={{ marginTop: '1.5rem' }}>
                                    <div className="stats-content">
                                        <div className="stat-item">
                                            <Text strong>今日润色次数</Text>
                                            <Progress percent={75} strokeColor="#ee1d1d" />
                                            <Text type="secondary">45/60</Text>
                                        </div>
                                        <div className="stat-item">
                                            <Text strong>本月评审次数</Text>
                                            <Progress percent={60} strokeColor="#52c41a" />
                                            <Text type="secondary">18/30</Text>
                                        </div>
                                        <div className="stat-item">
                                            <Text strong>图表生成次数</Text>
                                            <Progress percent={40} strokeColor="#1890ff" />
                                            <Text type="secondary">12/30</Text>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
};

export default ToolsPage;