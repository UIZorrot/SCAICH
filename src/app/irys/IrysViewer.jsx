import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Button, message, Spin, Alert } from 'antd';
import { DownloadOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { getFromIrys, checkDocumentExists } from '../../utils/irysUploader';
import Layout from '../../components/layout/Layout';
import { useBackground } from '../../contexts/BackgroundContext';

const { Title, Paragraph, Text } = Typography;

const IrysViewer = () => {
  const { txId } = useParams();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const { currentTheme } = useBackground();

  useEffect(() => {
    loadDocument();
  }, [txId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      // 首先检查文档是否存在
      const exists = await checkDocumentExists(txId);
      if (!exists) {
        setError('Document not found');
        return;
      }

      // 尝试获取文档（先假设是公开的）
      let result = await getFromIrys(txId, false);
      
      if (!result.success) {
        // 如果失败，可能是私人文档
        result = await getFromIrys(txId, true);
        setIsPrivate(true);
        
        if (!result.success) {
          setError(result.error);
          return;
        }
      }

      setDocument(result);
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!document) return;

    const blob = new Blob([document.content], { 
      type: document.metadata.contentType || 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = document.metadata.fileName || 'document.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('Download started');
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: currentTheme.isDark ? '#1a1a1a' : '#f5f5f5'
        }}>
          <Card style={{ textAlign: 'center', minWidth: '300px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '1rem' }}>
              <Text>Loading document from Irys network...</Text>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: currentTheme.isDark ? '#1a1a1a' : '#f5f5f5'
        }}>
          <Card style={{ textAlign: 'center', maxWidth: '500px' }}>
            <Alert
              message="Document Not Found"
              description={error}
              type="error"
              showIcon
            />
            <Button 
              type="primary" 
              style={{ marginTop: '1rem' }}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ 
        minHeight: '100vh',
        padding: '2rem',
        background: currentTheme.isDark ? '#1a1a1a' : '#f5f5f5'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Card
            style={{
              background: currentTheme.isDark ? '#2a2a2a' : '#fff',
              border: `2px solid #ff4d4f`,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(255, 77, 79, 0.15)'
            }}
          >
            {/* Document Header */}
            <div style={{ 
              borderBottom: `1px solid ${currentTheme.isDark ? '#444' : '#f0f0f0'}`,
              paddingBottom: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Title level={2} style={{ 
                    color: currentTheme.isDark ? '#fff' : '#333',
                    marginBottom: '0.5rem'
                  }}>
                    {document?.metadata?.title || 'Untitled Document'}
                    {isPrivate && (
                      <LockOutlined style={{ marginLeft: '0.5rem', color: '#ff4d4f' }} />
                    )}
                  </Title>
                  
                  {document?.metadata?.description && (
                    <Paragraph style={{ color: currentTheme.isDark ? '#ccc' : '#666' }}>
                      {document.metadata.description}
                    </Paragraph>
                  )}
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Text type="secondary">
                      <strong>File:</strong> {document?.metadata?.fileName}
                    </Text>
                    <Text type="secondary">
                      <strong>Size:</strong> {(document?.metadata?.fileSize / 1024).toFixed(2)} KB
                    </Text>
                    <Text type="secondary">
                      <strong>Uploaded:</strong> {new Date(document?.metadata?.uploadDate).toLocaleDateString()}
                    </Text>
                    <Text type="secondary">
                      <strong>TX ID:</strong> {txId}
                    </Text>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div style={{ 
              background: currentTheme.isDark ? '#1a1a1a' : '#fafafa',
              border: `1px solid ${currentTheme.isDark ? '#444' : '#d9d9d9'}`,
              borderRadius: '8px',
              padding: '1.5rem',
              maxHeight: '60vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <EyeOutlined style={{ marginRight: '0.5rem', color: '#ff4d4f' }} />
                <Text strong style={{ color: currentTheme.isDark ? '#fff' : '#333' }}>
                  Document Preview
                </Text>
                {isPrivate && (
                  <Text style={{ marginLeft: '1rem', color: '#ff4d4f' }}>
                    (Decrypted Private Document)
                  </Text>
                )}
              </div>
              
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: currentTheme.isDark ? '#ccc' : '#333',
                margin: 0
              }}>
                {document?.content}
              </pre>
            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: `1px solid ${currentTheme.isDark ? '#444' : '#f0f0f0'}`,
              textAlign: 'center'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                This document is stored permanently on the Irys network • 
                <a 
                  href={`https://gateway.irys.xyz/${txId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ marginLeft: '0.5rem' }}
                >
                  View on Irys Gateway
                </a>
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default IrysViewer;
