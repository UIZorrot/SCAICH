import React from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

class AuthService {
  constructor() {
    this.baseURL = 'https://api.scai.sh';
    this.tokenCache = null;
    this.userCache = null;
    this.connection = new Connection('https://white-bitter-rain.solana-mainnet.quiknode.pro/4d5cb8fdd5d59fb6555e3d89ebf1ca05b3dbaea4');
  }

  // 获取钱包连接
  async getWallet() {
    if (window.solana && window.solana.isPhantom) {
      return window.solana;
    }
    throw new Error('Phantom wallet not found. Please install Phantom wallet.');
  }

  // 连接钱包
  async connectWallet() {
    try {
      const wallet = await this.getWallet();
      const response = await wallet.connect();
      return response.publicKey.toString();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // 生成签名消息
  generateSignMessage(walletAddress) {
    return "SCAI";
  }

  // 请求钱包签名
  async signMessage(message) {
    try {
      const wallet = await this.getWallet();
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);
      
      return {
        signature: bs58.encode(signature.signature),
        publicKey: wallet.publicKey.toString()
      };
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  // 验证钱包余额
  async checkWalletBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      const solBalance = balance / 1e9; // 转换为 SOL
      return solBalance >= 0.01; // 要求至少 0.01 SOL
    } catch (error) {
      console.error('Failed to check wallet balance:', error);
      return false;
    }
  }

  // 钱包登录
  async loginWithWallet() {
    try {
      // 如果有缓存的token且未过期，直接返回
      if (this.tokenCache && !this.isTokenExpired(this.tokenCache)) {
        return this.tokenCache;
      }

      // 连接钱包
      const walletAddress = await this.connectWallet();
      
      // 检查余额
      const hasEnoughBalance = await this.checkWalletBalance(walletAddress);
      if (!hasEnoughBalance) {
        throw new Error('Insufficient SOL balance. At least 0.01 SOL required.');
      }

      // 生成签名消息
      const message = this.generateSignMessage(walletAddress);
      
      // 请求签名
      const { signature } = await this.signMessage(message);

      // 发送登录请求
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: signature
        })
      });

      if (!response.ok) {
        // Per instruction, login and register are separate. Do not attempt to auto-register.
        // Throw an error and let the UI layer handle the registration flow.
        const errorData = await response.json().catch(() => null); // Try to parse error response
        const errorMessage = errorData?.message || `Wallet login failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success) {
        this.tokenCache = data.data.token;
        this.userCache = data.data;
        return this.tokenCache;
      } else {
        throw new Error(data.message || 'Wallet login failed');
      }
    } catch (error) {
      console.error('Failed to login with wallet:', error);

      throw error;
    }
  }

  // 钱包注册
  async registerWithWallet(walletAddress, signature, username) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature: signature,
          username: username
        })
      });

      if (!response.ok) {
        throw new Error(`Wallet registration failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.tokenCache = data.data.token;
        this.userCache = data.data;
        return this.tokenCache;
      } else {
        throw new Error(data.message || 'Wallet registration failed');
      }
    } catch (error) {
      console.error('Failed to register with wallet:', error);
      throw error;
    }
  }

  // 传统登录
  async loginTraditional(username, password) {
    try {
      // 如果有缓存的token且未过期，直接返回
      if (this.tokenCache && !this.isTokenExpired(this.tokenCache)) {
        return this.tokenCache;
      }

      const response = await fetch(`${this.baseURL}/api/auth/login/traditional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(`Traditional login failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.tokenCache = data.data.token;
        this.userCache = data.data;
        return this.tokenCache;
      } else {
        throw new Error(data.message || 'Traditional login failed');
      }
    } catch (error) {
      console.error('Failed to login with traditional method:', error);
      this.clearCache();
      throw error;
    }
  }

  // 传统注册
  async registerTraditional(username, email, password) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register/traditional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(`Traditional registration failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.tokenCache = data.data.token;
        this.userCache = data.data;
        return this.tokenCache;
      } else {
        throw new Error(data.message || 'Traditional registration failed');
      }
    } catch (error) {
      console.error('Failed to register with traditional method:', error);
      throw error;
    }
  }

  // 获取后端token
  async getBackendToken() {
    // 如果有缓存的token且未过期，直接返回
    if (this.tokenCache && !this.isTokenExpired(this.tokenCache)) {
      return this.tokenCache;
    }
    
    // 如果钱包已连接但没有token，尝试登录
    const connected = await this.isWalletConnected();
    if (connected) {
      try {
        return await this.loginWithWallet();
      } catch (error) {
        // 如果登录失败（比如用户未注册），返回一个临时token
        console.warn('Backend login failed, using wallet connection as auth:', error.message);
        return 'wallet_connected';
      }
    }
    
    throw new Error('Wallet not connected');
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

  // 升级到Plus
  async upgradeToPlus(inviteCode) {
    try {
      const token = await this.getBackendToken();
      const response = await fetch(`${this.baseURL}/api/auth/wallet/upgrade-plus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invite_code: inviteCode
        })
      });

      if (!response.ok) {
        throw new Error(`Upgrade failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // 清除缓存以重新获取用户信息
        this.userCache = null;
        return data;
      } else {
        throw new Error(data.message || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Failed to upgrade to Plus:', error);
      throw error;
    }
  }

  // 检查是否已连接钱包
  async isWalletConnected() {
    try {
      const wallet = await this.getWallet();
      return wallet.isConnected && wallet.publicKey;
    } catch {
      return false;
    }
  }

  // 获取当前连接的钱包地址
  async getCurrentWalletAddress() {
    try {
      const wallet = await this.getWallet();
      return wallet.publicKey?.toString() || null;
    } catch {
      return null;
    }
  }

  // 清除缓存
  clearCache() {
    this.tokenCache = null;
    this.userCache = null;
  }

  // 登出
  async logout() {
    try {
      this.clearCache();
      const wallet = await this.getWallet();
      if (wallet.isConnected) {
        await wallet.disconnect();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // 即使断开连接失败，也要清除缓存
      this.clearCache();
    }
  }
}

// 创建单例实例
const authService = new AuthService();

// 导出服务实例
export default authService;

// React Hook for easy component integration
export const useAuthService = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [user, setUser] = React.useState(null);

  // 检查认证状态
  const checkAuthStatus = React.useCallback(async () => {
    console.log("🔍 [useAuthService] Checking auth status...");
    try {
      const connected = await authService.isWalletConnected();
      const address = await authService.getCurrentWalletAddress();
      const isAuth = !!connected;
      
      console.log("[useAuthService] Wallet connected:", connected);
      console.log("[useAuthService] Wallet address:", address);
      console.log("[useAuthService] Setting isAuthenticated to:", isAuth);
      
      setIsAuthenticated(isAuth);
      setWalletAddress(address);
      
      console.log("✅ [useAuthService] State updated - isAuthenticated:", isAuth, "address:", address);
      
      // 如果已认证，获取用户信息
      if (isAuth) {
        try {
          console.log("[useAuthService] Getting user info...");
          const userInfo = await authService.getUserInfo();
          console.log("[useAuthService] User info:", userInfo);
          setUser(userInfo);
        } catch (error) {
          console.error('[useAuthService] Error getting user info:', error);
          setUser(null);
        }
      } else {
        console.log("[useAuthService] Not authenticated, clearing user");
        setUser(null);
      }
    } catch (error) {
      console.error('[useAuthService] Error in checkAuthStatus:', error);
      setIsAuthenticated(false);
      setWalletAddress(null);
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    checkAuthStatus();
    
    // 监听钱包连接状态变化
    const handleAccountChange = () => {
      checkAuthStatus();
    };

    if (window.solana) {
      window.solana.on('accountChanged', handleAccountChange);
      window.solana.on('disconnect', handleAccountChange);
    }

    return () => {
      if (window.solana) {
        window.solana.off('accountChanged', handleAccountChange);
        window.solana.off('disconnect', handleAccountChange);
      }
    };
  }, [checkAuthStatus]);

  const login = async () => {
    setIsLoading(true);
    try {
      await authService.loginWithWallet();
      await checkAuthStatus();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    setIsLoading(true);
    try {
      await authService.loginWithWallet();
      await checkAuthStatus();
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      await checkAuthStatus();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBackendToken = async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await authService.getBackendToken();
  };

  const getUserInfo = async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await authService.getUserInfo();
  };

  // 权限检查函数，需要先获取用户信息
  const hasPermission = async (permission) => {
    console.log(`🔐 [useAuthService] Checking permission: ${permission}`);
    console.log(`[useAuthService] isAuthenticated: ${isAuthenticated}`);
    
    if (!isAuthenticated) {
      console.log(`[useAuthService] ❌ Permission denied - not authenticated`);
      return false;
    }
    
    try {
      console.log(`[useAuthService] userCache exists: ${!!authService.userCache}`);
      // 如果没有用户缓存，先获取用户信息
      if (!authService.userCache) {
        console.log(`[useAuthService] Getting user info for permission check...`);
        await authService.getUserInfo();
      }
      
      const result = authService.checkPermission(permission);
      console.log(`[useAuthService] Permission ${permission} result: ${result}`);
      return result;
    } catch (error) {
      console.error(`[useAuthService] ❌ Error checking permission ${permission}:`, error);
      return false;
    }
  };

  const loginTraditional = async (username, password) => {
    setIsLoading(true);
    try {
      await authService.loginTraditional(username, password);
      await checkAuthStatus();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithWallet = async (walletAddress, signature, username) => {
    setIsLoading(true);
    try {
      await authService.registerWithWallet(walletAddress, signature, username);
      await checkAuthStatus();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerTraditional = async (username, email, password) => {
    setIsLoading(true);
    try {
      await authService.registerTraditional(username, email, password);
      await checkAuthStatus();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    user,
    walletAddress,
    isLoading,
    login: loginWithWallet, // 为了向后兼容，login指向loginWithWallet
    loginWithWallet,
    loginTraditional,
    registerWithWallet,
    registerTraditional,
    logout,
    getBackendToken,
    getUserInfo,
    hasPermission,
    checkPermission: authService.checkPermission.bind(authService),
    canUploadFiles: authService.canUploadFiles.bind(authService),
    canUploadPaper: authService.canUploadPaper.bind(authService),
    canBatchDownload: authService.canBatchDownload.bind(authService),
    canBatchUpload: authService.canBatchUpload.bind(authService),
    canAdminAccess: authService.canAdminAccess.bind(authService),
    upgradeToPlus: authService.upgradeToPlus.bind(authService),
    refreshAuth: checkAuthStatus
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
      throw new Error('Authentication failed. Please connect your wallet again.');
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
      throw new Error('Authentication failed. Please connect your wallet again.');
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