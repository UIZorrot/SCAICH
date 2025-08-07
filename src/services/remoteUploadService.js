// 远程上传服务 - 使用 https://api.scai.sh 的 Irys 接口
// 替代本地服务器，直接调用远程API

import { uploadFile, apiCall } from './authService';

class RemoteUploadService {
  constructor() {
    this.baseURL = 'https://api.scai.sh';
  }

  /**
   * 上传文件到远程Irys服务
   * @param {File} file - 要上传的文件
   * @param {Object} metadata - 文件元数据
   * @returns {Promise<Object>} 上传结果
   */
  async uploadToRemoteIrys(file, metadata = {}) {
    try {
      console.log(`🚀 开始远程上传文件: ${file.name}`);
      
      // 验证文件大小 (10MB限制)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)} MB > 10 MB`);
      }

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name); // 直接添加文件名字段
      
      // 添加元数据
      const metadataJson = {
        title: metadata.title || file.name,
        description: metadata.description || '',
        isPrivate: metadata.isPrivate || false,
        userId: metadata.userId,
        fileType: metadata.fileType || 'other',
        uploadDate: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        // 文献类型的额外元数据
        ...(metadata.fileType === 'literature' && {
          doi: metadata.doi,
          authors: metadata.authors,
          year: metadata.year,
          abstract: metadata.abstract,
          paperMetadata: metadata.paperMetadata
        })
      };
      
      formData.append('metadata', JSON.stringify(metadataJson));

      // 调用远程上传API
      const result = await uploadFile('/api/irys/files/upload', formData);
      
      if (!result.success) {
        throw new Error(result.message || '远程上传失败');
      }

      console.log('✅ 远程上传成功:', result.data);
      
      return {
        success: true,
        txId: result.data.txId,
        url: result.data.url || `https://gateway.irys.xyz/${result.data.txId}`,
        metadata: {
          ...metadataJson,
          uploadMode: 'remote-irys'
        }
      };
      
    } catch (error) {
      console.error('❌ 远程上传失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的文件列表
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 文件列表
   */
  async getUserFiles(page = 1, limit = 20) {
    try {
      const result = await apiCall(`/api/irys/files/list?page=${page}&limit=${limit}`);
      return result;
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件元数据
   * @param {string} txId - 文件交易ID
   * @returns {Promise<Object>} 文件元数据
   */
  async getFileMetadata(txId) {
    try {
      const result = await apiCall(`/api/irys/files/metadata/${txId}`);
      return result;
    } catch (error) {
      console.error('获取文件元数据失败:', error);
      throw error;
    }
  }

  /**
   * 搜索文件
   * @param {string} query - 搜索关键词
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 搜索结果
   */
  async searchFiles(query, page = 1, limit = 20) {
    try {
      const result = await apiCall(`/api/irys/files/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return result;
    } catch (error) {
      console.error('搜索文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件下载URL
   * @param {string} txId - 文件交易ID
   * @returns {string} 下载URL
   */
  getDownloadUrl(txId) {
    return `${this.baseURL}/api/irys/proxy/download/${txId}`;
  }

  /**
   * 获取文件查看URL
   * @param {string} txId - 文件交易ID
   * @returns {string} 查看URL
   */
  getViewUrl(txId) {
    return `${this.baseURL}/api/irys/proxy/view/${txId}`;
  }

  /**
   * 获取文件信息
   * @param {string} txId - 文件交易ID
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(txId) {
    try {
      const result = await apiCall(`/api/irys/proxy/info/${txId}`);
      return result;
    } catch (error) {
      console.error('获取文件信息失败:', error);
      throw error;
    }
  }

  /**
   * 批量下载文件
   * @param {string[]} txIds - 文件交易ID数组
   * @returns {Promise<Object>} 批量下载结果
   */
  async batchDownload(txIds) {
    try {
      // 准备批量下载
      const prepareResult = await apiCall('/api/irys/proxy/batch-download', {
        method: 'POST',
        body: JSON.stringify({ files: txIds })
      });
      
      if (!prepareResult.success) {
        throw new Error(prepareResult.message || '批量下载准备失败');
      }
      
      // 返回下载URL
      return {
        success: true,
        downloadUrl: `${this.baseURL}/api/irys/proxy/batch-download/${prepareResult.data.batch_id}`,
        batchId: prepareResult.data.batch_id,
        fileCount: prepareResult.data.file_count
      };
      
    } catch (error) {
      console.error('批量下载失败:', error);
      throw error;
    }
  }

  /**
   * 检查服务健康状态
   * @returns {Promise<Object>} 健康状态
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/irys/health`);
      return await response.json();
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const remoteUploadService = new RemoteUploadService();

export default remoteUploadService;

// 导出便捷函数
export const uploadToRemote = remoteUploadService.uploadToRemoteIrys.bind(remoteUploadService);
export const getUserFiles = remoteUploadService.getUserFiles.bind(remoteUploadService);
export const searchFiles = remoteUploadService.searchFiles.bind(remoteUploadService);
export const getFileMetadata = remoteUploadService.getFileMetadata.bind(remoteUploadService);
export const getDownloadUrl = remoteUploadService.getDownloadUrl.bind(remoteUploadService);
export const getViewUrl = remoteUploadService.getViewUrl.bind(remoteUploadService);
export const batchDownload = remoteUploadService.batchDownload.bind(remoteUploadService);