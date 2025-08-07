// API服务 - 统一管理所有后端API调用
import { apiCall, uploadFile } from './authService';
import authService from './authService';

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
    formData.append('fileName', file.name); // 添加必需的文件名字段
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
  
  // 论文上传（JSON格式，用于已有论文的元数据上传）
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

  // 论文文件上传（带文件的完整上传）
  async uploadPaperWithFile(file, doi, source, metadata = {}) {
    try {
      // 获取JWT token
      let token = await authService.getBackendToken();
      
      // 如果token是'wallet_connected'，说明用户需要登录或注册
      if (token === 'wallet_connected') {
        throw new Error('请先登录或注册后再上传文件');
      }
      
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('无法获取有效的认证token');
      }

      const formData = new FormData();
    formData.append('file', file); // PDF文件
    formData.append('fileName', file.name); // 添加文件名字段
    formData.append('doi', doi || ''); // DOI 可以为空字符串
    formData.append('title', metadata.title || 'Untitled Paper'); // 确保有标题
    formData.append('authors', Array.isArray(metadata.authors) ? metadata.authors.join(', ') : (metadata.authors || metadata.author || 'Unknown Author'));
    formData.append('year', metadata.year ? metadata.year.toString() : new Date().getFullYear().toString());
    formData.append('source', source || 'manual'); // 添加 source 字段，确保不为空

      const response = await fetch(`${this.baseURL}/api/irys/fulltext/upload-paper-v2`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
          // 不要设置Content-Type，让浏览器自动设置multipart/form-data
        }
      });

      if (!response.ok) {
        let errorMessage = `上传失败: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = '身份验证失败，请重新登录';
        } else if (response.status === 403) {
          errorMessage = '权限不足，请升级账户';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // 如果无法解析错误响应，使用默认消息
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
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
    const token = await authService.getBackendToken();
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
    const token = await authService.getBackendToken();
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
    // 纯前端实现，直接调用OpenAlex API
    try {
      const response = await fetch(`https://api.openalex.org/works/doi:${doi}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { error: 'Paper not found' };
        }
        throw new Error(`Get paper info failed: ${response.status}`);
      }

      const paper = await response.json();

      // 处理摘要
      const restoreAbstract = (abstractInvertedIndex) => {
        if (!abstractInvertedIndex) return "Abstract Not Available";

        const words = [];
        for (const [word, positions] of Object.entries(abstractInvertedIndex)) {
          for (const pos of positions) {
            words[pos] = word;
          }
        }
        return words.filter(Boolean).join(' ');
      };

      // 处理作者信息
      const authors = paper.authorships?.map(authorship =>
        authorship.author?.display_name || "Unknown"
      ) || [];

      // 格式化返回数据
      const paperInfo = {
        source: "openalex",
        title: paper.title || "Unknown",
        doi: doi,
        abstract: restoreAbstract(paper.abstract_inverted_index),
        referencecount: paper.cited_by_count || 0,
        author: authors.join(", ") || "Unknown",
        year: paper.publication_year || "Unknown",
        url: `https://www.doi.org/${doi}`,
        location: paper.locations?.map(loc => loc.source?.display_name).join(", ") || "Not Available",
        scihub_url: `https://www.doi.org/${doi}`,
        is_oa: paper.open_access?.is_oa || false
      };

      return paperInfo;
    } catch (error) {
      console.error('DOI query error:', error);
      return { error: error.message || 'Failed to fetch paper info' };
    }
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