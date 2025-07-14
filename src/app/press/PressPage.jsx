import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Typography,
  Form,
  Input,
  Select,
  Upload,
  Steps,
  List,
  Tag,
  Space,
  Modal,
  Tabs,
  Divider,
  Progress,
  message,
  Spin,
  Alert,
  notification
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
  SendOutlined,
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  WalletOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';

import irysService from '../../services/irysService';
import './PressPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;

const PressPage = () => {
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [polishModalVisible, setPolishModalVisible] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [submissionData, setSubmissionData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState({
    manuscript: null,
    supplementary: []
  });
  const [polishText, setPolishText] = useState('');
  const [polishedResult, setPolishedResult] = useState('');
  const [polishLoading, setPolishLoading] = useState(false);


  // 模拟钱包连接状态（实际应该从登录系统获取）
  useEffect(() => {
    // 这里应该从全局状态或登录系统获取钱包连接状态
    setWalletConnected(true);
    setWalletAddress('Demo...Address');
  }, []);

  // Mock data for published papers
  const publishedPapers = [
    {
      id: 'press.2024.001',
      title: 'Advances in Quantum Machine Learning Algorithms',
      authors: ['Dr. Sarah Chen', 'Prof. Michael Zhang', 'Dr. Emily Rodriguez'],
      abstract: 'This paper presents novel quantum machine learning algorithms that demonstrate significant improvements in computational efficiency for large-scale data processing tasks...',
      category: 'Computer Science',
      subcategory: 'Machine Learning',
      submissionDate: '2024-01-15',
      publicationDate: '2024-01-20',
      status: 'published',
      downloads: 1247,
      citations: 23,
      doi: '10.48550/press.2024.001',
      keywords: ['quantum computing', 'machine learning', 'algorithms', 'optimization']
    },
    {
      id: 'press.2024.002',
      title: 'Sustainable Energy Storage Solutions Using Novel Nanomaterials',
      authors: ['Prof. David Kim', 'Dr. Lisa Wang'],
      abstract: 'We investigate the application of novel nanomaterials in energy storage systems, demonstrating improved efficiency and sustainability compared to traditional methods...',
      category: 'Physics',
      subcategory: 'Materials Science',
      submissionDate: '2024-01-12',
      publicationDate: '2024-01-18',
      status: 'published',
      downloads: 892,
      citations: 15,
      doi: '10.48550/press.2024.002',
      keywords: ['energy storage', 'nanomaterials', 'sustainability', 'batteries']
    },
    {
      id: 'press.2024.003',
      title: 'CRISPR-Cas9 Applications in Treating Genetic Disorders',
      authors: ['Dr. Jennifer Liu', 'Prof. Robert Johnson', 'Dr. Maria Garcia'],
      abstract: 'This comprehensive review examines recent advances in CRISPR-Cas9 gene editing technology and its therapeutic applications in treating various genetic disorders...',
      category: 'Biology',
      subcategory: 'Genetics',
      submissionDate: '2024-01-10',
      publicationDate: '2024-01-16',
      status: 'published',
      downloads: 2156,
      citations: 41,
      doi: '10.48550/press.2024.003',
      keywords: ['CRISPR', 'gene editing', 'genetic disorders', 'therapy']
    }
  ];

  const categories = [
    'Computer Science',
    'Physics',
    'Mathematics',
    'Biology',
    'Chemistry',
    'Medicine',
    'Engineering',
    'Environmental Science',
    'Social Sciences',
    'Economics'
  ];

  const subcategories = {
    'Computer Science': ['Machine Learning', 'Artificial Intelligence', 'Algorithms', 'Software Engineering', 'Computer Vision'],
    'Physics': ['Quantum Physics', 'Materials Science', 'Astrophysics', 'Condensed Matter', 'Particle Physics'],
    'Biology': ['Genetics', 'Molecular Biology', 'Ecology', 'Neuroscience', 'Bioinformatics'],
    'Mathematics': ['Pure Mathematics', 'Applied Mathematics', 'Statistics', 'Computational Mathematics'],
    'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
    'Medicine': ['Clinical Medicine', 'Public Health', 'Pharmacology', 'Medical Research'],
    'Engineering': ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering'],
    'Environmental Science': ['Climate Science', 'Ecology', 'Environmental Policy', 'Sustainability'],
    'Social Sciences': ['Psychology', 'Sociology', 'Anthropology', 'Political Science'],
    'Economics': ['Microeconomics', 'Macroeconomics', 'Econometrics', 'Development Economics']
  };

  const submissionSteps = [
    {
      title: 'Paper Details',
      description: 'Basic information about your paper'
    },
    {
      title: 'Upload Files',
      description: 'Upload your manuscript and supplementary materials'
    },
    {
      title: 'Review & Submit',
      description: 'Review your submission and submit for publication'
    }
  ];

  const handleSubmit = async () => {
    try {
      if (!walletConnected) {
        message.error('Please connect your wallet first');
        return;
      }

      if (!selectedFiles.manuscript) {
        message.error('Please upload your manuscript');
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      // Generate DOI
      const doi = irysService.generateDOI();

      // Prepare metadata
      const metadata = {
        ...submissionData,
        doi: doi,
        submissionDate: new Date().toISOString(),
        status: 'submitted',
        version: '1.0',
        submitter: walletAddress
      };

      // Step 1: Calculate and fund upload
      message.loading('Calculating upload cost...', 0);
      const totalSize = selectedFiles.manuscript.size +
        selectedFiles.supplementary.reduce((sum, file) => sum + file.size, 0) +
        JSON.stringify(metadata).length;

      const cost = await irysService.calculateUploadCost(totalSize);
      await irysService.fundUpload(cost);
      setUploadProgress(25);

      // Step 2: Upload metadata
      message.loading('Uploading metadata...', 0);
      const metadataReceipt = await irysService.uploadMetadata(metadata, doi);
      setUploadProgress(50);

      // Step 3: Upload PDF
      message.loading('Uploading manuscript...', 0);
      const pdfReceipt = await irysService.uploadPDF(selectedFiles.manuscript, metadata, doi);
      setUploadProgress(75);

      // Step 4: Upload supplementary files (if any)
      let supplementaryReceipts = [];
      if (selectedFiles.supplementary.length > 0) {
        message.loading('Uploading supplementary files...', 0);
        supplementaryReceipts = await irysService.uploadSupplementaryFiles(
          selectedFiles.supplementary,
          metadata,
          doi
        );
      }
      setUploadProgress(100);

      // Success
      message.destroy();
      message.success('Paper submitted successfully!');

      // Show success modal with details
      Modal.success({
        title: 'Submission Successful!',
        content: (
          <div>
            <p><strong>DOI:</strong> {doi}</p>
            <p><strong>Manuscript ID:</strong> <a href={irysService.getIrysGatewayUrl(pdfReceipt.id)} target="_blank" rel="noopener noreferrer">{pdfReceipt.id}</a></p>
            <p><strong>Metadata ID:</strong> <a href={irysService.getIrysGatewayUrl(metadataReceipt.id)} target="_blank" rel="noopener noreferrer">{metadataReceipt.id}</a></p>
            <p>Your paper has been submitted for review. You will be notified of the review status.</p>
          </div>
        ),
        width: 600
      });

      // Reset form
      setSubmitModalVisible(false);
      setCurrentStep(0);
      setSelectedFiles({ manuscript: null, supplementary: [] });
      form.resetFields();

    } catch (error) {
      console.error('Submission failed:', error);
      message.error('Submission failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStepNext = async () => {
    try {
      const values = await form.validateFields();
      setSubmissionData({ ...submissionData, ...values });
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handleStepPrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFileUpload = (info, type) => {
    if (type === 'manuscript') {
      if (info.file.status === 'done' || info.file.status === 'uploading') {
        setSelectedFiles(prev => ({
          ...prev,
          manuscript: info.file.originFileObj || info.file
        }));
      }
    } else if (type === 'supplementary') {
      const files = info.fileList.map(file => file.originFileObj || file).filter(Boolean);
      setSelectedFiles(prev => ({
        ...prev,
        supplementary: files
      }));
    }
  };

  const beforeUpload = (file, type) => {
    if (type === 'manuscript') {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('You can only upload PDF files!');
        return false;
      }
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('File must be smaller than 50MB!');
        return false;
      }
    }
    return false; // Prevent automatic upload
  };

  // 文章润色功能
  const handlePolishText = async () => {
    if (!polishText.trim()) {
      message.error('Please enter text to polish');
      return;
    }

    setPolishLoading(true);
    try {
      // 这里可以集成AI润色服务，暂时使用模拟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模拟润色结果
      const polished = `${polishText}\n\n[Polished Version]\nThis is an enhanced version of your text with improved grammar, clarity, and academic tone. The content has been refined while maintaining the original meaning and scientific accuracy.`;

      setPolishedResult(polished);
      message.success('Text polished successfully!');
    } catch (error) {
      message.error('Failed to polish text: ' + error.message);
    } finally {
      setPolishLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">

            <Form.Item
              name="title"
              label="Paper Title"
              rules={[{ required: true, message: 'Please enter the paper title' }]}
            >
              <Input placeholder="Enter the title of your paper" />
            </Form.Item>

            <Form.Item
              name="authors"
              label="Authors"
              rules={[{ required: true, message: 'Please enter the authors' }]}
            >
              <Input placeholder="Enter authors (comma-separated)" />
            </Form.Item>

            <Form.Item
              name="abstract"
              label="Abstract"
              rules={[{ required: true, message: 'Please enter the abstract' }]}
            >
              <TextArea
                rows={6}
                placeholder="Enter the abstract of your paper (max 2000 characters)"
                maxLength={2000}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select a category">
                {categories.map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="subcategory"
              label="Subcategory"
              rules={[{ required: true, message: 'Please select a subcategory' }]}
            >
              <Select placeholder="Select a subcategory">
                {/* Dynamic subcategories based on selected category */}
              </Select>
            </Form.Item>

            <Form.Item
              name="keywords"
              label="Keywords"
              rules={[{ required: true, message: 'Please enter keywords' }]}
            >
              <Input placeholder="Enter keywords (comma-separated)" />
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <Form.Item
              name="manuscript"
              label="Manuscript (PDF)"
              rules={[{ required: true, message: 'Please upload your manuscript' }]}
            >
              <Upload.Dragger
                name="manuscript"
                accept=".pdf"
                maxCount={1}
                beforeUpload={(file) => beforeUpload(file, 'manuscript')}
                onChange={(info) => handleFileUpload(info, 'manuscript')}
                fileList={selectedFiles.manuscript ? [selectedFiles.manuscript] : []}
              >
                <p className="ant-upload-drag-icon">
                  <FileTextOutlined />
                </p>
                <p className="ant-upload-text">Click or drag PDF file to this area to upload</p>
                <p className="ant-upload-hint">
                  Upload your main manuscript file (PDF format only, max 50MB)
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item
              name="supplementary"
              label="Supplementary Materials (Optional)"
            >
              <Upload.Dragger
                name="supplementary"
                multiple
                beforeUpload={(file) => beforeUpload(file, 'supplementary')}
                onChange={(info) => handleFileUpload(info, 'supplementary')}
                fileList={selectedFiles.supplementary}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">
                  Upload any supplementary materials (data files, code, additional figures, etc.)
                </p>
              </Upload.Dragger>
            </Form.Item>

            {uploading && (
              <div className="upload-progress">
                <Progress percent={uploadProgress} status="active" />
                <Text type="secondary">Uploading to decentralized storage...</Text>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="submission-review">
              <Title level={4}>Review Your Submission</Title>
              <Divider />

              <div className="review-section">
                <Text strong>Title:</Text>
                <Paragraph>{submissionData.title}</Paragraph>
              </div>

              <div className="review-section">
                <Text strong>Authors:</Text>
                <Paragraph>{submissionData.authors}</Paragraph>
              </div>

              <div className="review-section">
                <Text strong>Category:</Text>
                <Paragraph>{submissionData.category} - {submissionData.subcategory}</Paragraph>
              </div>

              <div className="review-section">
                <Text strong>Keywords:</Text>
                <Paragraph>{submissionData.keywords}</Paragraph>
              </div>

              <div className="review-section">
                <Text strong>Abstract:</Text>
                <Paragraph>{submissionData.abstract}</Paragraph>
              </div>

              <Divider />

              <div className="submission-agreement">
                <Paragraph>
                  By submitting this paper, you agree to the SCAI Press publication terms and conditions.
                  Your paper will be made available under an open access license.
                </Paragraph>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className={`press-page light-theme`}>
        {/* Hero Section */}
        <div className="hero-section1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <Title level={1} className="hero-title">SCAI Press</Title>
            <Paragraph className="hero-subtitle">
              Open Access Scientific Publishing Platform
            </Paragraph>
            <Paragraph className="hero-description">
              Publish your research with permanent, decentralized storage.
              Fast peer review, immediate publication, and global accessibility.
            </Paragraph>

            <div className="hero-actions">
              <div className="submit-section">
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => setSubmitModalVisible(true)}
                  className="submit-btn"
                >
                  I Want to Submit
                </Button>

              </div>
              <Button
                size="large"
                icon={<EditOutlined />}
                className="browse-btn"
                onClick={() => setPolishModalVisible(true)}
              >
                I Want to Audit
              </Button>
            </div>
          </motion.div>
        </div>



        {/* Submission Modal */}
        <Modal
          title={
            <div className="submission-modal-header">
              <SendOutlined className="modal-icon" />
              <div style={{ marginRight: "50px" }}>
                <Title level={3} style={{ margin: 0, color: 'inherit' }}>Submit Paper</Title>
                <p style={{ fontSize: "14px", fontWeight: 300 }}>Publish your research on the decentralized academic network</p>

              </div>
              <Button
                size="large"
                icon={<InfoCircleOutlined />}
                className="guidelines-btn"
                onClick={() => {
                  if (!submitModalVisible) {
                    setSubmitModalVisible(true);
                    setShowGuidelines(true);
                  } else {
                    setShowGuidelines(!showGuidelines);
                  }
                }}
              >
                Submission Guidelines
              </Button>
            </div>
          }
          open={submitModalVisible}
          onCancel={() => {
            setSubmitModalVisible(false);
            setCurrentStep(0);
            setShowGuidelines(false);
            form.resetFields();
          }}
          footer={null}
          width="100%"
          style={{ maxWidth: '1600px' }}
          className="submission-modal"
        >
          <div className="submission-content">
            {showGuidelines ? (
              <div>
                <div className="guideline-section">
                  <Title level={3}>
                    <FileTextOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    Manuscript Preparation
                  </Title>

                  <Title level={5}>File Format Requirements</Title>
                  <ul>
                    <li>Submit manuscripts in <strong>PDF format only</strong></li>
                    <li>Maximum file size: <strong>50MB</strong></li>
                    <li>Minimum resolution: <strong>300 DPI</strong> for figures</li>
                    <li>Embed all fonts and ensure text is searchable</li>
                  </ul>

                  <Title level={5}>Content Structure</Title>
                  <ul>
                    <li>Title: Clear, concise, and descriptive (max 200 characters)</li>
                    <li>Abstract: Structured summary (max 2000 characters)</li>
                    <li>Keywords: 3-8 relevant terms for indexing</li>
                    <li>Author information: Full names, affiliations, ORCID IDs</li>
                    <li>References: Complete and properly formatted</li>
                  </ul>

                  <Title level={5}>Formatting Standards</Title>
                  <ul>
                    <li>Use standard academic formatting (APA, IEEE, or similar)</li>
                    <li>12pt font, double-spaced text</li>
                    <li>Number all pages consecutively</li>
                    <li>Include line numbers for review process</li>
                  </ul>
                </div>

                <div className="guideline-section">
                  <Title level={3}>
                    <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    Review Process
                  </Title>

                  <Title level={5}>Peer Review Timeline</Title>
                  <ul>
                    <li><strong>Initial screening:</strong> 1-2 business days</li>
                    <li><strong>Peer review:</strong> 7-14 days</li>
                    <li><strong>Author revision:</strong> 30 days (if required)</li>
                    <li><strong>Final decision:</strong> 3-5 days after revision</li>
                    <li><strong>Publication:</strong> Immediate upon acceptance</li>
                  </ul>

                  <Title level={5}>Review Criteria</Title>
                  <ul>
                    <li>Scientific rigor and methodology</li>
                    <li>Novelty and significance of findings</li>
                    <li>Clarity of presentation and writing quality</li>
                    <li>Appropriate use of references and citations</li>
                    <li>Ethical compliance and data availability</li>
                  </ul>

                  <Title level={5}>Review Types</Title>
                  <ul>
                    <li><strong>Single-blind:</strong> Reviewers know author identities</li>
                    <li><strong>Open review:</strong> Optional transparent review process</li>
                    <li><strong>Post-publication:</strong> Community feedback encouraged</li>
                  </ul>
                </div>

                <div className="guideline-section">
                  <Title level={3}>
                    <ClockCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    Submission Categories
                  </Title>

                  <Title level={5}>Research Articles</Title>
                  <ul>
                    <li>Original research with novel findings</li>
                    <li>Typical length: 3,000-8,000 words</li>
                    <li>Include: Abstract, Introduction, Methods, Results, Discussion</li>
                  </ul>

                  <Title level={5}>Review Articles</Title>
                  <ul>
                    <li>Comprehensive overview of a research area</li>
                    <li>Typical length: 5,000-12,000 words</li>
                    <li>Systematic analysis of existing literature</li>
                  </ul>

                  <Title level={5}>Short Communications</Title>
                  <ul>
                    <li>Brief reports of significant findings</li>
                    <li>Typical length: 1,500-3,000 words</li>
                    <li>Rapid publication track available</li>
                  </ul>

                  <Title level={5}>Preprints</Title>
                  <ul>
                    <li>Early-stage research for community feedback</li>
                    <li>No length restrictions</li>
                    <li>Immediate publication with version control</li>
                  </ul>
                </div>

                <div className="guideline-section">
                  <Title level={5}>
                    <UserOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                    Author Responsibilities
                  </Title>

                  <Title level={5}>Authorship Criteria</Title>
                  <ul>
                    <li>Substantial contribution to conception or design</li>
                    <li>Acquisition, analysis, or interpretation of data</li>
                    <li>Drafting or critical revision of manuscript</li>
                    <li>Final approval of version to be published</li>
                  </ul>

                  <Title level={5}>Ethical Requirements</Title>
                  <ul>
                    <li>Original work not published elsewhere</li>
                    <li>Proper attribution of all sources</li>
                    <li>Disclosure of conflicts of interest</li>
                    <li>Compliance with research ethics guidelines</li>
                  </ul>

                  <Title level={5}>Data Sharing</Title>
                  <ul>
                    <li>Make data available upon reasonable request</li>
                    <li>Include data availability statement</li>
                    <li>Use appropriate repositories for supplementary data</li>
                  </ul>
                </div>


                {/* <div className="guidelines-footer">
                  <Card className="footer-card">
                    <Title level={3}>
                      <SendOutlined style={{ marginRight: 8 }} />
                      Ready to Submit?
                    </Title>
                    <Paragraph>
                      Once you've reviewed these guidelines and prepared your manuscript according to our standards,
                      you can proceed with your submission.
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => setShowGuidelines(false)}
                      className="proceed-button"
                    >
                      Proceed to Submission Form
                    </Button>
                  </Card>
                </div> */}
              </div>
            ) : (
              <>
                <Steps current={currentStep} className="submission-steps">
                  {submissionSteps.map((step, index) => (
                    <Step
                      key={index}
                      title={step.title}
                      description={step.description}
                    />
                  ))}
                </Steps>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  className="submission-form"
                >
                  {renderStepContent()}

                  <div className="step-actions">
                    {currentStep > 0 && (
                      <Button onClick={handleStepPrev}>
                        Previous
                      </Button>
                    )}
                    {currentStep < submissionSteps.length - 1 && (
                      <Button type="primary" onClick={handleStepNext}>
                        Next
                      </Button>
                    )}
                    {currentStep === submissionSteps.length - 1 && (
                      <Button type="primary" htmlType="submit">
                        Submit Paper
                      </Button>
                    )}
                  </div>
                </Form>
              </>
            )}
          </div>
        </Modal>

        {/* Polish Papers Modal */}
        <Modal
          title={
            <div className="polish-modal-header">
              <EditOutlined className="modal-icon" />
              <div>
                <Title level={3} style={{ margin: 0, color: 'inherit' }}>Polish Papers</Title>
                <Text type="secondary" style={{ fontSize: '0.9rem' }}>AI-powered tools to enhance your academic writing</Text>
              </div>
            </div>
          }
          open={polishModalVisible}
          onCancel={() => setPolishModalVisible(false)}
          footer={null}
          width="100%"
          style={{ maxWidth: '1600px' }}
          className="polish-modal"
        >
          <div className="polish-content-full">
            <Tabs defaultActiveKey="grammar" className="polish-tabs-enhanced">
              <Tabs.TabPane
                tab={
                  <span>
                    <EditOutlined />
                    Grammar & Style
                  </span>
                }
                key="grammar"
              >
                <div className="polish-section-enhanced">
                  <div className="polish-header">
                    <Title level={4}>AI-Powered Text Enhancement</Title>
                    <Paragraph>
                      Transform your academic writing with advanced AI that understands scientific language patterns,
                      improves clarity, and maintains your original meaning while enhancing readability.
                    </Paragraph>
                  </div>

                  <div className="polish-workspace">
                    <div className="input-section">
                      <Title level={5}>Original Text</Title>
                      <TextArea
                        rows={12}
                        placeholder="Paste your paragraph, abstract, or section here for enhancement...

Example: 'The results shows that our method perform better than existing approaches in most cases and we believe this is due to the novel algorithm we developed.'

Our AI will improve grammar, style, and academic tone while preserving your meaning."
                        value={polishText}
                        onChange={(e) => setPolishText(e.target.value)}
                        maxLength={5000}
                        showCount
                        className="polish-textarea"
                      />

                      <div className="polish-controls">
                        <div className="control-group">
                          <Button
                            type="primary"
                            size="large"
                            onClick={handlePolishText}
                            loading={polishLoading}
                            disabled={!polishText.trim()}
                            className="polish-button"
                          >
                            <EditOutlined />
                            Polish Text
                          </Button>
                          <Button
                            size="large"
                            onClick={() => {
                              setPolishText('');
                              setPolishedResult('');
                            }}
                            className="clear-button"
                          >
                            Clear All
                          </Button>
                        </div>

                        <div className="polish-options">
                          <Text type="secondary">Enhancement focus:</Text>
                          <Select defaultValue="academic" style={{ width: 150, marginLeft: 8 }}>
                            <Option value="academic">Academic Tone</Option>
                            <Option value="clarity">Clarity</Option>
                            <Option value="concise">Conciseness</Option>
                            <Option value="formal">Formal Style</Option>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {polishedResult && (
                      <div className="output-section">
                        <div className="result-header">
                          <Title level={5}>Enhanced Text</Title>
                          <div className="result-actions">
                            <Button
                              onClick={() => navigator.clipboard.writeText(polishedResult)}
                              className="copy-button"
                            >
                              Copy Result
                            </Button>
                            <Button
                              onClick={() => setPolishText(polishedResult)}
                              className="use-button"
                            >
                              Use as Input
                            </Button>
                          </div>
                        </div>
                        <div className="polish-result-enhanced">
                          {polishedResult}
                        </div>

                        <div className="improvement-summary">
                          <Title level={6}>Improvements Made:</Title>
                          <div className="improvement-tags">
                            <Tag color="green">Grammar corrected</Tag>
                            <Tag color="blue">Academic tone enhanced</Tag>
                            <Tag color="orange">Clarity improved</Tag>
                            <Tag color="purple">Word choice optimized</Tag>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <BookOutlined />
                    Citation Formatter
                  </span>
                }
                key="citation"
              >
                <div className="polish-section-enhanced">
                  <div className="polish-header">
                    <Title level={4}>Citation Formatter & Validator</Title>
                    <Paragraph>
                      Format your citations according to major academic styles (APA, IEEE, MLA, Chicago)
                      and validate reference completeness.
                    </Paragraph>
                  </div>

                  <div className="citation-workspace">
                    <div className="citation-input">
                      <Title level={5}>Raw Citation Input</Title>
                      <TextArea
                        rows={6}
                        placeholder="Enter your raw citations here, one per line:

Smith, J. (2023). Machine Learning Applications. Journal of AI Research.
https://doi.org/10.1234/example
arXiv:2301.12345
ISBN: 978-0123456789"
                        className="citation-textarea"
                      />

                      <div className="citation-controls">
                        <Select defaultValue="apa" style={{ width: 120 }}>
                          <Option value="apa">APA Style</Option>
                          <Option value="ieee">IEEE</Option>
                          <Option value="mla">MLA</Option>
                          <Option value="chicago">Chicago</Option>
                        </Select>
                        <Button type="primary" style={{ marginLeft: 8 }}>
                          Format Citations
                        </Button>
                      </div>
                    </div>

                    <div className="citation-features">
                      <Card title="Features" className="feature-card">
                        <ul>
                          <li>✅ Auto-detect citation type (DOI, arXiv, ISBN, URL)</li>
                          <li>✅ Format according to style guides</li>
                          <li>✅ Validate completeness and accuracy</li>
                          <li>✅ Generate bibliography automatically</li>
                          <li>✅ Check for duplicate references</li>
                          <li>✅ Export to BibTeX, EndNote, Zotero</li>
                        </ul>
                      </Card>
                    </div>
                  </div>

                  <div className="coming-soon-notice">
                    <Card className="notice-card">
                      <Title level={5}>🚀 Coming Soon</Title>
                      <Paragraph>
                        Our citation formatter is currently in development. It will support:
                      </Paragraph>
                      <ul>
                        <li>Automatic DOI and metadata retrieval</li>
                        <li>Real-time citation validation</li>
                        <li>Integration with major reference managers</li>
                        <li>Bulk citation processing</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <CheckCircleOutlined />
                    Plagiarism Check
                  </span>
                }
                key="plagiarism"
              >
                <div className="polish-section-enhanced">
                  <div className="polish-header">
                    <Title level={4}>Plagiarism Detection & Originality Check</Title>
                    <Paragraph>
                      Ensure your work is original by checking against academic databases,
                      preprint servers, and web sources.
                    </Paragraph>
                  </div>

                  <div className="plagiarism-workspace">
                    <div className="plagiarism-input">
                      <Title level={5}>Text to Check</Title>
                      <TextArea
                        rows={8}
                        placeholder="Paste your text here to check for potential plagiarism...

Our system will compare your text against:
• Academic journal databases
• Preprint servers (arXiv, bioRxiv, etc.)
• Web sources and publications
• Previously submitted papers"
                        className="plagiarism-textarea"
                      />

                      <div className="plagiarism-controls">
                        <Button type="primary" size="large">
                          <CheckCircleOutlined />
                          Check Originality
                        </Button>
                        <div className="check-options">
                          <Text type="secondary">Check against:</Text>
                          <div style={{ marginTop: 8 }}>
                            <Tag.CheckableTag checked>Academic Journals</Tag.CheckableTag>
                            <Tag.CheckableTag checked>Preprint Servers</Tag.CheckableTag>
                            <Tag.CheckableTag checked>Web Sources</Tag.CheckableTag>
                            <Tag.CheckableTag>Internal Database</Tag.CheckableTag>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="plagiarism-features">
                      <Card title="Detection Features" className="feature-card">
                        <ul>
                          <li>🔍 Deep semantic analysis</li>
                          <li>📊 Similarity percentage scoring</li>
                          <li>🎯 Highlighted matching sections</li>
                          <li>📚 Source identification and linking</li>
                          <li>📈 Detailed originality report</li>
                          <li>💡 Suggestions for improvement</li>
                        </ul>
                      </Card>
                    </div>
                  </div>

                  <div className="coming-soon-notice">
                    <Card className="notice-card">
                      <Title level={5}>🔬 Advanced Detection Coming Soon</Title>
                      <Paragraph>
                        Our plagiarism detection system is being developed with:
                      </Paragraph>
                      <ul>
                        <li>AI-powered semantic similarity detection</li>
                        <li>Integration with major academic databases</li>
                        <li>Real-time checking against latest publications</li>
                        <li>Paraphrasing and translation detection</li>
                        <li>Collaborative filtering with SCAI network</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane
                tab={
                  <span>
                    <FileTextOutlined />
                    Document Analysis
                  </span>
                }
                key="analysis"
              >
                <div className="polish-section-enhanced">
                  <div className="polish-header">
                    <Title level={4}>Document Structure & Readability Analysis</Title>
                    <Paragraph>
                      Analyze your document structure, readability metrics, and get suggestions
                      for improving academic presentation.
                    </Paragraph>
                  </div>

                  <div className="analysis-workspace">
                    <div className="upload-section">
                      <Title level={5}>Upload Document for Analysis</Title>
                      <Upload.Dragger
                        accept=".pdf,.doc,.docx,.txt"
                        beforeUpload={() => false}
                        className="analysis-uploader"
                      >
                        <p className="ant-upload-drag-icon">
                          <FileTextOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag file to upload</p>
                        <p className="ant-upload-hint">
                          Supports PDF, Word documents, and plain text files
                        </p>
                      </Upload.Dragger>
                    </div>

                    <div className="analysis-features-grid">
                      <Card title="📊 Readability Metrics" className="analysis-card">
                        <ul>
                          <li>Flesch Reading Ease Score</li>
                          <li>Gunning Fog Index</li>
                          <li>Average sentence length</li>
                          <li>Vocabulary complexity</li>
                        </ul>
                      </Card>

                      <Card title="📝 Structure Analysis" className="analysis-card">
                        <ul>
                          <li>Section organization</li>
                          <li>Paragraph length distribution</li>
                          <li>Heading hierarchy</li>
                          <li>Citation density</li>
                        </ul>
                      </Card>

                      <Card title="🎯 Content Quality" className="analysis-card">
                        <ul>
                          <li>Keyword density</li>
                          <li>Transition word usage</li>
                          <li>Passive voice detection</li>
                          <li>Redundancy identification</li>
                        </ul>
                      </Card>

                      <Card title="📈 Improvement Suggestions" className="analysis-card">
                        <ul>
                          <li>Clarity enhancements</li>
                          <li>Structure recommendations</li>
                          <li>Style improvements</li>
                          <li>Academic tone adjustments</li>
                        </ul>
                      </Card>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default PressPage;
