import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Typography, Input, List, Avatar, Space, Modal, Upload, message, Progress, Select } from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  BarsOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import { useBackground } from '../../contexts/BackgroundContext';
import './BoxPage.css';

const { Title, Text, Paragraph } = Typography;

const BoxPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('doi');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPapers: 12847,
    totalStorage: '2.4TB',
    activeUsers: 1523
  });
  const { currentTheme } = useBackground();

  const [latestPapers, setLatestPapers] = useState([]);

  const features = [
    {
      icon: <DatabaseOutlined style={{ fontSize: '24px', color: '#4a90e2' }} />,
      title: 'Permanent Storage',
      description: 'Your papers are stored permanently on the Irys network, ensuring they remain accessible for generations to come.'
    },
    {
      icon: <BarsOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      title: 'Secure & Decentralized',
      description: 'Built on blockchain technology, your research is distributed across a global network, making it tamper-proof and censorship-resistant.'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      title: 'Fast Upload',
      description: 'Experience lightning-fast uploads with our optimized infrastructure, making paper sharing as quick as a click.'
    }
  ];

  // GraphQL查询函数
  const executeGraphQLQuery = async (query) => {
    const response = await fetch('https://uploader.irys.xyz/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return response.json();
  };

  // 查询PDF版本
  const queryPdfVersions = async (doi) => {
    if (!doi) return [];

    const query1_0_3 = `
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["scivault"] },
            { name: "Content-Type", values: ["application/pdf"] },
            { name: "Version", values: ["1.0.3"] },
            { name: "doi", values: ["${doi}"] }
          ]
        ) {
          edges {
            node {
              id
              tags { name value }
            }
          }
        }
      }
    `;

    try {
      const result = await executeGraphQLQuery(query1_0_3);
      const versions = [];

      if (result.data?.transactions?.edges?.length > 0) {
        versions.push({
          version: '1.0.3',
          ids: result.data.transactions.edges.map(edge => edge.node.id)
        });
      }

      return versions;
    } catch (error) {
      console.error('Error querying PDF versions:', error);
      return [];
    }
  };

  // 处理论文元数据
  const processPaperMetadata = async (edge) => {
    try {
      const id = edge.node.id;
      const metadataResponse = await fetch(`https://gateway.irys.xyz/${id}`);
      if (!metadataResponse.ok) return null;

      const paper = await metadataResponse.json();
      const doi = edge.node.tags.find(tag => tag.name === 'doi')?.value;

      if (doi) {
        paper.pdfVersions = await queryPdfVersions(doi);
      } else {
        paper.pdfVersions = [];
      }

      return paper;
    } catch (error) {
      console.error('Error processing paper metadata:', error);
      return null;
    }
  };

  const handleSearch = async (value) => {
    if (!value.trim()) {
      message.error('Please enter a search term');
      return;
    }

    setLoading(true);
    setSearchQuery(value);

    try {
      const query = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["scivault"] },
              { name: "Content-Type", values: ["application/json"] },
              { name: "${searchType}", values: ["${value}"] }
            ],
            first: 100
          ) {
            edges {
              node {
                id
                tags { name value }
              }
            }
          }
        }
      `;

      const result = await executeGraphQLQuery(query);
      const metadataNodes = result.data?.transactions?.edges || [];
      const papers = await Promise.all(metadataNodes.map(edge => processPaperMetadata(edge)));
      const validPapers = papers.filter(paper => paper !== null);

      setPapers(validPapers.map(paper => ({
        id: paper.doi || Math.random().toString(),
        title: paper.title || 'Untitled',
        author: paper.authors || 'Unknown authors',
        uploadDate: new Date().toISOString().split('T')[0],
        size: 'N/A',
        downloads: 0,
        txId: paper.doi || 'N/A',
        doi: paper.doi,
        abstract: paper.abstract,
        pdfVersions: paper.pdfVersions || []
      })));

      if (validPapers.length === 0) {
        message.info('No papers found for your search query');
      }
    } catch (error) {
      console.error('Error during search:', error);
      message.error('Unable to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    // Open Irys uploader in new window
    window.open('https://uploader.irys.xyz/AqKyf8Z6mtrEkguvCeJ9TH28bzUt88cr2iWxJdAD1Ldc/index.html', '_blank');
  };

  // PDF下载功能
  const downloadPdf = async (doi, pdfIds, title, version) => {
    try {
      message.loading({ content: 'Loading PDF...', key: 'pdf-download' });

      if (version === '1.0.3') {
        // 处理切片PDF
        const pdfChunks = [];
        let totalSize = 0;

        for (let i = 0; i < pdfIds.length; i++) {
          message.loading({ content: `Loading chunk ${i + 1}/${pdfIds.length}...`, key: 'pdf-download' });
          const response = await fetch(`https://gateway.irys.xyz/${pdfIds[i]}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch chunk ${i + 1}: ${response.statusText}`);
          }
          const chunkData = await response.arrayBuffer();
          pdfChunks.push(new Uint8Array(chunkData));
          totalSize += chunkData.byteLength;
        }

        // 合并切片
        message.loading({ content: 'Merging PDF chunks...', key: 'pdf-download' });
        const mergedPdf = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of pdfChunks) {
          mergedPdf.set(chunk, offset);
          offset += chunk.length;
        }

        // 创建并下载PDF
        const blob = new Blob([mergedPdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, title);
      } else {
        // 处理完整PDF
        const response = await fetch(`https://gateway.irys.xyz/${pdfIds[0]}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        downloadFile(url, title);
      }

      message.success({ content: 'PDF downloaded successfully!', key: 'pdf-download' });
    } catch (error) {
      console.error('Error processing PDF:', error);
      message.error({ content: `Failed to process PDF: ${error.message}`, key: 'pdf-download' });
    }
  };

  const downloadFile = (url, title) => {
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // 加载最新论文
  const loadLatestPapers = useCallback(async () => {
    try {
      const query = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["scivault"] },
              { name: "Content-Type", values: ["application/json"] }
            ],
            first: 20,
            order: DESC
          ) {
            edges {
              node {
                id
                tags { name value }
                timestamp
              }
            }
          }
        }
      `;

      const result = await executeGraphQLQuery(query);
      const metadataNodes = result.data?.transactions?.edges || [];
      const papers = await Promise.all(metadataNodes.map(edge => processPaperMetadata(edge)));
      const validPapers = papers.filter(paper => paper !== null);

      const formattedPapers = validPapers.map(paper => ({
        id: paper.doi || Math.random().toString(),
        title: paper.title || 'Untitled',
        author: paper.authors || 'Unknown authors',
        uploadDate: new Date().toISOString().split('T')[0],
        size: 'N/A',
        downloads: 0,
        txId: paper.doi || 'N/A',
        doi: paper.doi,
        abstract: paper.abstract,
        pdfVersions: paper.pdfVersions || []
      }));

      setLatestPapers(formattedPapers);
    } catch (error) {
      console.error('Error loading latest papers:', error);
      message.error('Failed to load latest papers');
    }
  }, []);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      const query = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["scivault"] },
              { name: "Content-Type", values: ["application/json"] }
            ]
          ) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      const result = await executeGraphQLQuery(query);
      // 这里可以根据实际需要更新统计数据
      // setStats({ ... });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const handlePaperClick = (paper) => {
    // Open paper details or download
    const paperUrl = `https://uploader.irys.xyz/7NTozL367vtp2i1REuTKncHvnPjeZTdGMbUxYB4wJGnv?doi=${encodeURIComponent(paper.doi || paper.txId)}`;
    window.open(paperUrl, '_blank');
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadLatestPapers();
    loadStats();
  }, []);

  return (
    <Layout>
      <div className={`box-page ${currentTheme.name}-theme`}>
        {/* Hero Section */}
        <div className="hero-section1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <Title level={1} className="hero-title" style={{ color: '#fff' }}>SCAI Box</Title>
            <Paragraph className="hero-subtitle">
              Decentralized and permanent storage for open science.
            </Paragraph>
            <Paragraph className="hero-tagline">
              Publish your paper permanently, right from your computer.
            </Paragraph>




          </motion.div>
          <div className="search-input-section">

            {/* <Select
                value={searchType}
                onChange={setSearchType}
                className="search-type-select"
                size="large"
              >
                <Select.Option value="doi">DOI</Select.Option>
                <Select.Option value="title">Title</Select.Option>
                <Select.Option value="aid">arXiv ID</Select.Option>
              </Select> */}

            <Input.Search
              placeholder="Search for DOIs"
              size="large"
              onSearch={handleSearch}
              loading={loading}
              className="main-search-input"
            />
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              className="upload-btn"
            >
              Upload Paper
            </Button>
          </div>
        </div>

        {/* Features Section */}
        {/* <div className="features-section">
          <Title level={2} className="section-title">Why Choose SCAI Box?</Title>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="feature-card" hoverable>
                  <div className="feature-icon-wrapper">
                    {feature.icon}
                  </div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph>{feature.description}</Paragraph>
                </Card>
              </motion.div>
            ))}
          </div>
        </div> */}

        {/* Stats Section */}
        {/* <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <Title level={2} className="stat-number">{stats.totalPapers.toLocaleString()}</Title>
              <Text className="stat-label">Papers Stored</Text>
            </div>
            <div className="stat-item">
              <Title level={2} className="stat-number">{stats.totalStorage}</Title>
              <Text className="stat-label">Total Storage</Text>
            </div>
            <div className="stat-item">
              <Title level={2} className="stat-number">{stats.activeUsers.toLocaleString()}</Title>
              <Text className="stat-label">Active Users</Text>
            </div>
          </div>
        </div> */}

        {/* Search Section */}


        {/* Latest Papers Section */}
        <div className="papers-section1">
          <Title level={2} className="section-title">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest Papers'}
          </Title>

          <List
            className="papers-list"
            itemLayout="horizontal"
            dataSource={papers.length > 0 ? papers : latestPapers}
            loading={loading}
            renderItem={(paper) => (
              <List.Item
                className="paper-item"
                actions={[
                  ...(paper.pdfVersions && paper.pdfVersions.length > 0
                    ? paper.pdfVersions.map(version => (
                      <Button
                        key={version.version}
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadPdf(paper.doi, version.ids, paper.title, version.version)}
                      >
                        PDF v{version.version}
                      </Button>
                    ))
                    : [
                      <Button
                        key="view"
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={() => handlePaperClick(paper)}
                      >
                        View Details
                      </Button>
                    ]
                  )
                ]}
              >
                <List.Item.Meta
                  title={
                    <Button
                      type="link"
                      onClick={() => handlePaperClick(paper)}
                      className="paper-title"
                      style={{ padding: 0, height: 'auto', textAlign: 'left', textWrap: "balance" }}
                    >
                      {paper.title}
                    </Button>
                  }
                  description={
                    <div className="paper-meta">
                      <Text className="paper-meta">By {paper.author}</Text>
                      <Text className="paper-meta" type="secondary"> • {paper.uploadDate}</Text>
                      <Text className="paper-meta" type="secondary"> • {paper.size}</Text>
                      {/* <Text className="paper-meta" type="secondary"> • {paper.downloads} downloads</Text> */}
                      <br />
                      <br />
                      <Text code className="tx-id">TX: {paper.txId}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        {/* Floating Upload Button */}
        {/* <div className="floating-upload">
          <Button
            type="primary"
            shape="round"
            size="large"
            icon={<CloudUploadOutlined />}
            onClick={handleUpload}
            className="floating-upload-btn"
          >
            Upload PDF
          </Button>
        </div> */}
      </div>
    </Layout>
  );
};

export default BoxPage;
