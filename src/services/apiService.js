// API服务 - 统一管理所有后端API调用
import { apiCall, uploadFile } from './authService';

class APIService {
  constructor() {
    this.baseURL = 'https://api.scai.sh';
  }

  // ==================== 认证相关接口 ====================
  
  // 获取用户信息
  async getUserProfile() {
    return await apiCall('/api/auth/profile');
  }

  // 修改密码
  async changePassword(oldPassword, newPassword) {
    return await apiCall('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    });
  }

  // 用户升级
  async upgradeUser(upgradeCode) {
    return await apiCall('/api/auth/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        upgrade_code: upgradeCode
      })
    });
  }

  // ==================== Irys文件管理接口 ====================
  
  // 文件上传
  async uploadFileToIrys(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    return await uploadFile('/api/irys/files/upload', formData);
  }

  // 获取文件列表
  async getFileList(page = 1, limit = 20) {
    return await apiCall(`/api/irys/files/list?page=${page}&limit=${limit}`);
  }

  // 获取文件元数据
  async getFileMetadata(txId) {
    return await apiCall(`/api/irys/files/metadata/${txId}`);
  }

  // 搜索文件
  async searchFiles(query, page = 1, limit = 20) {
    return await apiCall(`/api/irys/files/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  // ==================== Irys全文管理接口 ====================
  
  // 论文上传
  async uploadPaper(doi, source, metadata = {}) {
    return await apiCall('/api/irys/fulltext/upload-paper', {
      method: 'POST',
      body: JSON.stringify({
        doi,
        source,
        metadata
      })
    });
  }

  // 批量论文上传
  async batchUploadPapers(papers) {
    return await apiCall('/api/irys/fulltext/batch-upload', {
      method: 'POST',
      body: JSON.stringify({
        papers
      })
    });
  }

  // 检查论文是否存在
  async checkPaperExists(doi) {
    // 这个接口不需要认证
    const response = await fetch(`${this.baseURL}/api/irys/fulltext/check/${encodeURIComponent(doi)}`);
    if (!response.ok) {
      throw new Error(`Check paper failed: ${response.status}`);
    }
    return await response.json();
  }

  // 获取论文状态
  async getPaperStatus(doi) {
    // 这个接口不需要认证
    const response = await fetch(`${this.baseURL}/api/irys/fulltext/status/${encodeURIComponent(doi)}`);
    if (!response.ok) {
      throw new Error(`Get paper status failed: ${response.status}`);
    }
    return await response.json();
  }

  // ==================== Irys代理下载接口 ====================
  
  // 文件下载
  async downloadFile(txId) {
    // 返回blob用于下载
    const token = await window.authService?.getBackendToken();
    const response = await fetch(`${this.baseURL}/api/irys/proxy/download/${txId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return await response.blob();
  }

  // 文件在线查看
  getFileViewUrl(txId) {
    return `${this.baseURL}/api/irys/proxy/view/${txId}`;
  }

  // 获取文件信息
  async getFileInfo(txId) {
    return await apiCall(`/api/irys/proxy/info/${txId}`);
  }

  // 批量下载准备
  async prepareBatchDownload(fileIds) {
    return await apiCall('/api/irys/proxy/batch-download', {
      method: 'POST',
      body: JSON.stringify({
        files: fileIds
      })
    });
  }

  // 批量下载执行
  async executeBatchDownload(batchId) {
    const token = await window.authService?.getBackendToken();
    const response = await fetch(`${this.baseURL}/api/irys/proxy/batch-download/${batchId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Batch download failed: ${response.status}`);
    }
    
    return await response.blob();
  }

  // ==================== 系统接口 ====================
  
  // Irys健康检查
  async checkIrysHealth() {
    const response = await fetch(`${this.baseURL}/api/irys/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  }

  // 获取API文档
  async getApiDocs() {
    const response = await fetch(`${this.baseURL}/api/irys`);
    if (!response.ok) {
      throw new Error(`Get API docs failed: ${response.status}`);
    }
    return await response.json();
  }

  // ==================== 兼容性接口（逐步迁移） ====================
  
  // 搜索论文（不需要认证）
  async searchPapers(query, limit = 10, openAccessOnly = false) {
    const response = await fetch(`${this.baseURL}/search?query=${encodeURIComponent(query)}&limit=${limit}&oa=${openAccessOnly}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    return await response.json();
  }

  // 获取论文信息（DOI查询）
  async getPaperInfo(doi) {
    // 使用本地API代理
    const response = await fetch(`/api/paper-info?doi=${encodeURIComponent(doi)}`);
    if (!response.ok) {
      throw new Error(`Get paper info failed: ${response.status}`);
    }
    return await response.json();
  }

  // ==================== 错误处理辅助函数 ====================
  
  // 处理API错误
  handleApiError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('Authentication failed')) {
      // 触发重新登录
      window.location.reload();
      return 'Please sign in again.';
    }
    
    if (error.message.includes('Permission denied')) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.message.includes('503') || error.message.includes('504')) {
      return 'Service is temporarily unavailable. Please try again later.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  // 重试机制
  async retryApiCall(apiFunction, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiFunction();
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // 如果是认证错误，不重试
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
}

// 创建单例实例
const apiService = new APIService();

// 将服务挂载到全局，方便其他模块使用
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}

export default apiService;

// 导出常用的API调用函数
export const {
  getUserProfile,
  uploadFileToIrys,
  getFileList,
  searchFiles,
  uploadPaper,
  batchUploadPapers,
  checkPaperExists,
  downloadFile,
  searchPapers,
  getPaperInfo,
  checkIrysHealth
} = apiService;