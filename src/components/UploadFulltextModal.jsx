import React, { useState, useEffect } from 'react';
import { Modal, Form, Upload, Button, message, Progress, Typography, Tag } from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { saveUserFulltext } from '../utils/fulltextManager';
import { uploadToRemote } from '../services/remoteUploadService';

const { Title } = Typography;

// File validation functions
const validateFileSize = (file, maxSizeMB) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Upload fulltext using remote upload service
const uploadFulltextToIrys = async (file, metadata = {}) => {
  try {
    // Use remote upload service
    const result = await uploadToRemote(file, {
      title: `${metadata.paperTitle || file.name} - Fulltext`,
      description: `User uploaded fulltext for paper: ${metadata.paperTitle || file.name}`,
      fileType: 'fulltext',
      isPrivate: false, // fulltext is usually public
      userId: metadata.userId,
      doi: metadata.doi,
      authors: metadata.paperAuthor,
      year: metadata.paperYear,
      paperMetadata: {
        title: metadata.paperTitle,
        author: metadata.paperAuthor,
        year: metadata.paperYear,
        doi: metadata.doi
      }
    });

    return {
      success: true,
      txId: result.txId,
      url: result.url,
      size: file.size
    };

  } catch (error) {
    console.error('Upload fulltext error:', error);
    throw error;
  }
};

const UploadFulltextModal = ({
  visible,
  onClose,
  paperInfo, // 論文信息：{ doi, title, author, year, etc. }
  onSuccess
}) => {
  const { isAuthenticated, user } = useAuth();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState([]);

  // 重置表單和狀態
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setFileList([]);
      setUploadProgress(0);
      setUploading(false);
    }
  }, [visible, form]);

  // Handle upload
  const handleUpload = async () => {
    if (!isAuthenticated) {
      message.error('Please login before uploading files');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    if (!paperInfo?.doi) {
      message.error('Paper DOI information is missing');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = fileList[0];
      const actualFile = file.originFileObj || file;

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

      // Upload to Irys network via remote service
      const uploadResult = await uploadFulltextToIrys(actualFile, {
        doi: paperInfo.doi,
        paperTitle: paperInfo.title,
        paperAuthor: paperInfo.author,
        paperYear: paperInfo.year,
        userId: user.user_id,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Save fulltext information to local storage
      const fulltextData = {
        txId: uploadResult.txId,
        url: uploadResult.url,
        fileName: actualFile.name,
        fileSize: actualFile.size,
        userId: user.user_id,
        paperTitle: paperInfo.title,
        paperAuthor: paperInfo.author,
        paperYear: paperInfo.year,
      };

      const saveSuccess = saveUserFulltext(paperInfo.doi, fulltextData);

      if (!saveSuccess) {
        throw new Error('Failed to save fulltext information');
      }

      message.success('Fulltext uploaded successfully!');

      // Call success callback
      if (onSuccess) {
        onSuccess(paperInfo.doi, fulltextData);
      }

      onClose();
    } catch (error) {
      console.error('Upload fulltext error:', error);
      message.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // File upload configuration
  const uploadProps = {
    beforeUpload: (file) => {
      // Check file type (only allow PDF and document formats)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        message.error('Only PDF, Word documents, or text files are supported');
        return false;
      }

      if (!validateFileSize(file, 50)) { // 50MB limit
        message.error('File size cannot exceed 50MB');
        return false;
      }

      const fileObj = {
        uid: Date.now().toString(),
        name: file.name,
        status: 'done',
        originFileObj: file,
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
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>Upload Fulltext</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
    >
      <div style={{ marginBottom: '20px' }}>
        {/* Paper information display */}
        {paperInfo && (
          <div style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <Title level={5} style={{ margin: '0 0 8px 0', color: '#389e0d' }}>
              📄 Paper Information
            </Title>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div><strong>Title:</strong> {paperInfo.title}</div>
              {paperInfo.author && <div><strong>Author:</strong> {paperInfo.author}</div>}
              {paperInfo.year && <div><strong>Year:</strong> {paperInfo.year}</div>}
              <div><strong>DOI:</strong> {paperInfo.doi}</div>
            </div>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            label="Select Fulltext File"
            extra="Supports PDF, Word documents, or text files, maximum 50MB"
          >
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Please upload the full-text document of the paper (PDF format recommended)
              </p>
            </Upload.Dragger>
          </Form.Item>

          {uploading && (
            <Form.Item>
              <Progress
                percent={uploadProgress}
                status={uploadProgress === 100 ? 'success' : 'active'}
              />
              <div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
                Uploading to Irys network...
              </div>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              disabled={fileList.length === 0}
              icon={<CloudUploadOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              {uploading ? 'Uploading...' : 'Upload Fulltext'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default UploadFulltextModal;
