// 认证服务 - 整合Clerk与后端JWT系统
import { useAuth, useUser } from '@clerk/clerk-react';

class AuthService {
  constructor() {
    this.baseURL = 'https://api.scai.sh';
    this.tokenCache = null;
    this.userCache = null;
  }

  // 使用Clerk用户信息登录后端系统
  async getBackendToken() {
    try {
      // 如果有缓存的token且未过期，直接返回
      if (this.tokenCache && !this.isTokenExpired(this.tokenCache)) {
        return this.tokenCache;
      }

      // 获取Clerk用户信息
      const clerkUser = window.Clerk?.user;
      if (!clerkUser) {
        throw new Error('No Clerk user found');
      }

      // 使用Clerk用户信息登录后端
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress,
          // 这里需要一个特殊的标识来表示这是来自Clerk的登录
          clerk_user_id: clerkUser.id,
          clerk_auth: true
        })
      });

      if (!response.ok) {
        // 如果用户不存在，尝试注册
        if (response.status === 404 || response.status === 401) {
          return await this.registerWithClerk(clerkUser);
        }
        throw new Error(`Backend login failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.tokenCache = data.data.token;
        this.userCache = data.data;
        return this.tokenCache;
      } else {
        throw new Error(data.message || 'Backend login failed');
      }
    } catch (error) {
      console.error('Failed to get backend token:', error);
      this.clearCache();
      throw error;
    }
  }

  // 使用Clerk信息注册后端用户
  async registerWithClerk(clerkUser) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          // 使用Clerk用户ID作为密码的一部分，确保安全性
          password: `Clerk_${clerkUser.id}_${Date.now()}`,
          clerk_user_id: clerkUser.id,
          clerk_auth: true
        })
      });

      if (!response.ok) {
        throw new Error(`Backend registration failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.tokenCache = data.data.token;
        this.userCache = data.data;
        return this.tokenCache;
      } else {
        throw new Error(data.message || 'Backend registration failed');
      }
    } catch (error) {
      console.error('Failed to register with backend:', error);
      throw error;
    }
  }

  // 检查token是否过期
  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // 获取用户信息
  async getUserInfo() {
    try {
      if (this.userCache) {
        return this.userCache;
      }

      const token = await this.getBackendToken();
      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.userCache = data.data;
        return this.userCache;
      } else {
        throw new Error(data.message || 'Failed to get user info');
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  // 检查用户权限
  checkPermission(requiredRole) {
    if (!this.userCache) {
      return false;
    }

    const roleHierarchy = {
      'user': 1,
      'plus': 2,
      'pro': 3,
      'admin': 4
    };

    const userLevel = roleHierarchy[this.userCache.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  // 权限检查函数
  canUploadFiles() {
    return this.checkPermission('user');
  }

  canUploadPaper() {
    return this.checkPermission('plus');
  }

  canBatchDownload() {
    return this.checkPermission('plus');
  }

  canBatchUpload() {
    return this.checkPermission('pro');
  }

  canAdminAccess() {
    return this.checkPermission('admin');
  }

  // 清除缓存
  clearCache() {
    this.tokenCache = null;
    this.userCache = null;
  }

  // 登出
  logout() {
    this.clearCache();
    // Clerk登出会自动处理
  }
}

// 创建单例实例
const authService = new AuthService();

// 导出服务实例和React Hook
export default authService;

// React Hook for easy component integration
export const useAuthService = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const getBackendToken = async () => {
    if (!isSignedIn) {
      throw new Error('User not signed in');
    }
    return await authService.getBackendToken();
  };

  const getUserInfo = async () => {
    if (!isSignedIn) {
      throw new Error('User not signed in');
    }
    return await authService.getUserInfo();
  };

  // 权限检查函数，需要先获取用户信息
  const hasPermission = async (permission) => {
    if (!isSignedIn) {
      return false;
    }
    
    try {
      // 如果没有用户缓存，先获取用户信息
      if (!authService.userCache) {
        await authService.getUserInfo();
      }
      return authService.checkPermission(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  return {
    isSignedIn,
    isAuthenticated: isSignedIn, // 添加别名以保持兼容性
    user,
    getBackendToken,
    getUserInfo,
    hasPermission,
    checkPermission: authService.checkPermission.bind(authService),
    canUploadFiles: authService.canUploadFiles.bind(authService),
    canUploadPaper: authService.canUploadPaper.bind(authService),
    canBatchDownload: authService.canBatchDownload.bind(authService),
    canBatchUpload: authService.canBatchUpload.bind(authService),
    canAdminAccess: authService.canAdminAccess.bind(authService),
    logout: authService.logout.bind(authService)
  };
};

// API调用辅助函数
export const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await authService.getBackendToken();
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(`${authService.baseURL}${endpoint}`, {
      ...defaultOptions,
      ...options
    });

    // 处理认证错误
    if (response.status === 401) {
      authService.clearCache();
      throw new Error('Authentication failed. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('Permission denied. Insufficient privileges.');
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// 文件上传专用函数
export const uploadFile = async (endpoint, formData) => {
  try {
    const token = await authService.getBackendToken();
    
    const response = await fetch(`${authService.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // 不设置Content-Type，让浏览器自动设置multipart/form-data
      },
      body: formData
    });

    if (response.status === 401) {
      authService.clearCache();
      throw new Error('Authentication failed. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('Permission denied. Insufficient privileges.');
    }

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};