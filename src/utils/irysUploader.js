// Irys上传工具函数
// 基于test.js的正确实现，支持真正的Irys网络上传和本地存储两种模式

// 简单的加密/解密函数（用于私人文档）
const simpleEncrypt = (text, key = 'scai-default-key') => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64编码
};

const simpleDecrypt = (encryptedText, key = 'scai-default-key') => {
  try {
    const decoded = atob(encryptedText); // Base64解码
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// Irys配置
const IRYS_CONFIG = {
  gatewayUrl: 'https://gateway.irys.xyz',
  maxFreeSize: 1000000 * 1024, // 100KB 免费上传限制
};

// 主上传函数 - 支持Irys网络和本地存储两种模式
export const uploadToIrys = async (file, metadata = {}, useLocal = false) => {
  try {
    console.log(`开始上传文件: ${file.name}, 模式: ${useLocal ? '本地存储' : 'Irys网络'}`);

    if (useLocal) {
      return await uploadToLocal(file, metadata);
    } else {
      return await uploadToIrysNetwork(file, metadata);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 上传到真正的Irys网络 - 使用远程服务器
const uploadToIrysNetwork = async (file, metadata = {}) => {
  try {
    // 使用远程上传服务
    const { uploadToRemote } = await import('../services/remoteUploadService');
    
    const result = await uploadToRemote(file, metadata);
    
    console.log('✅ Irys上传成功:', result.txId);
    return result;
  } catch (error) {
    console.error('❌ Irys上传失败:', error);
    throw error;
  }
};

// 上传到本地存储（备用选项）
const uploadToLocal = async (file, metadata = {}) => {
  try {
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // 读取文件内容
    const fileContent = await readFileAsText(file);

    // 如果是私人文档，进行加密
    let processedContent = fileContent;
    if (metadata.isPrivate) {
      processedContent = simpleEncrypt(fileContent);
    }

    // 生成本地存储ID（使用local_前缀区分）
    const txId = `local_${generateLocalId()}`;

    // 保存到localStorage
    const uploadData = {
      id: txId,
      content: processedContent,
      metadata: {
        ...metadata,
        uploadDate: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        isEncrypted: metadata.isPrivate,
        uploadMode: 'local'
      }
    };

    const existingData = JSON.parse(localStorage.getItem('irys_storage') || '{}');
    existingData[txId] = uploadData;
    localStorage.setItem('irys_storage', JSON.stringify(existingData));

    console.log('✅ 本地上传成功:', txId);

    return {
      success: true,
      txId: txId,
      url: `${window.location.origin}/irys/${txId}`,
      metadata: uploadData.metadata
    };

  } catch (error) {
    console.error('❌ 本地上传失败:', error);
    throw error;
  }
};

// 生成本地存储ID
const generateLocalId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 43; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 从Irys获取文档
export const getFromIrys = async (txId, isPrivate = false) => {
  try {
    const allData = JSON.parse(localStorage.getItem('irys_storage') || '{}');
    const data = allData[txId];

    if (!data) {
      throw new Error('Document not found');
    }

    let content = data.content;

    // 如果是私人文档，进行解密
    if (isPrivate) {
      content = simpleDecrypt(content);
      if (!content) {
        throw new Error('Failed to decrypt private document');
      }
    }

    return {
      success: true,
      content: content,
      metadata: data.metadata
    };

  } catch (error) {
    console.error('Retrieval failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 检查文档是否存在
export const checkDocumentExists = async (txId) => {
  try {
    const allData = JSON.parse(localStorage.getItem('irys_storage') || '{}');
    return !!allData[txId];
  } catch (error) {
    return false;
  }
};

// 获取用户的所有上传
export const getUserUploads = async (userId) => {
  try {
    const allData = JSON.parse(localStorage.getItem('irys_storage') || '{}');
    const userUploads = [];

    for (const [txId, data] of Object.entries(allData)) {
      if (data.metadata.userId === userId) {
        userUploads.push({
          txId,
          ...data.metadata
        });
      }
    }

    // 按上传时间排序
    userUploads.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    return {
      success: true,
      uploads: userUploads
    };
  } catch (error) {
    console.error('Failed to get user uploads:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 删除文档
export const deleteFromIrys = async (txId, userId) => {
  try {
    const allData = JSON.parse(localStorage.getItem('irys_storage') || '{}');
    const data = allData[txId];

    if (!data) {
      throw new Error('Document not found');
    }

    if (data.metadata.userId !== userId) {
      throw new Error('Unauthorized to delete this document');
    }

    delete allData[txId];
    localStorage.setItem('irys_storage', JSON.stringify(allData));

    return {
      success: true,
      message: 'Document deleted successfully'
    };
  } catch (error) {
    console.error('Delete failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 辅助函数：读取文件为文本
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    // 检查文件对象是否有效
    if (!file) {
      reject(new Error('File is null or undefined'));
      return;
    }

    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('Invalid file object:', file, 'Type:', typeof file);
      reject(new Error('Invalid file object: expected File or Blob'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// 辅助函数：读取文件为ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    // 检查文件对象是否有效
    if (!file) {
      reject(new Error('File is null or undefined'));
      return;
    }

    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('Invalid file object:', file, 'Type:', typeof file);
      reject(new Error('Invalid file object: expected File or Blob'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// 生成可访问的URL
export const generateAccessUrl = (txId) => {
  return `${window.location.origin}/irys/${txId}`;
};

// 验证文件类型
export const validateFileType = (file) => {
  const allowedTypes = [
    // PDF files
    'application/pdf',

    // Text files
    'text/plain',
    'text/markdown',
    'text/html',
    'text/xml',
    'text/csv',
    'text/rtf',

    // Microsoft Office documents
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

    // OpenDocument formats
    'application/vnd.oasis.opendocument.text', // .odt
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'application/vnd.oasis.opendocument.presentation', // .odp

    // Rich text and markup
    'application/rtf',
    'application/xml',
    'text/xml',
    'application/xhtml+xml',

    // JSON and structured data
    'application/json',
    'text/json',

    // LaTeX
    'application/x-latex',
    'text/x-tex',

    // Other document formats
    'application/epub+zip', // .epub
    'text/x-markdown' // alternative markdown MIME type
  ];

  return allowedTypes.includes(file.type);
};

// 验证文件大小
export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// 获取支持的文件类型列表（用于显示）
export const getSupportedFileTypes = () => {
  return [
    'PDF', 'TXT', 'MD', 'HTML', 'XML', 'CSV', 'RTF',
    'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX',
    'ODT', 'ODS', 'ODP', 'JSON', 'LaTeX', 'EPUB'
  ];
};

// 根据文件扩展名获取MIME类型
export const getMimeTypeFromExtension = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap = {
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'markdown': 'text/markdown',
    'html': 'text/html',
    'htm': 'text/html',
    'xml': 'text/xml',
    'csv': 'text/csv',
    'rtf': 'text/rtf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'odt': 'application/vnd.oasis.opendocument.text',
    'ods': 'application/vnd.oasis.opendocument.spreadsheet',
    'odp': 'application/vnd.oasis.opendocument.presentation',
    'json': 'application/json',
    'tex': 'application/x-latex',
    'latex': 'application/x-latex',
    'epub': 'application/epub+zip'
  };
  return mimeMap[ext] || null;
};
