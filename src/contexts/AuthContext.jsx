import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  // 检查认证状态
  const checkAuthStatus = useCallback(async () => {
    console.log("🔍 [AuthContext] Checking auth status...");
    try {
      const connected = await authService.isWalletConnected();
      const address = await authService.getCurrentWalletAddress();
      const isAuth = !!connected;
      
      console.log("[AuthContext] Wallet connected:", connected);
      console.log("[AuthContext] Wallet address:", address);
      console.log("[AuthContext] Setting isAuthenticated to:", isAuth);
      
      setIsAuthenticated(isAuth);
      setWalletAddress(address);
      
      console.log("✅ [AuthContext] State updated - isAuthenticated:", isAuth, "address:", address);
      
      // 如果已认证，获取用户信息
      if (isAuth) {
        try {
          console.log("[AuthContext] Getting user info...");
          const userInfo = await authService.getUserInfo();
          console.log("[AuthContext] User info:", userInfo);
          setUser(userInfo);
        } catch (error) {
          console.error('[AuthContext] Error getting user info:', error);
          setUser(null);
        }
      } else {
        console.log("[AuthContext] Not authenticated, clearing user");
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error in checkAuthStatus:', error);
      setIsAuthenticated(false);
      setWalletAddress(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    // 监听钱包连接状态变化
    const handleAccountChange = () => {
      console.log("🔄 [AuthContext] Wallet account changed, rechecking auth status");
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
    return await authService.getBackendToken();
  };

  const getUserInfo = async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    return await authService.getUserInfo();
  };

  const hasPermission = async (requiredRole) => {
    console.log("🔍 [AuthContext] Checking permission for role:", requiredRole);
    console.log("[AuthContext] Current isAuthenticated:", isAuthenticated);
    console.log("[AuthContext] Current user exists:", !!user);
    
    if (!isAuthenticated) {
      console.log("❌ [AuthContext] Permission denied - not authenticated");
      return false;
    }
    
    try {
      // 确保有用户信息
      let userCache = user;
      if (!userCache) {
        console.log("[AuthContext] No user cache, fetching user info...");
        userCache = await authService.getUserInfo();
        setUser(userCache);
      }
      
      const result = authService.checkPermission(requiredRole);
      console.log("✅ [AuthContext] Permission check result:", result);
      return result;
    } catch (error) {
      console.error('[AuthContext] Error checking permission:', error);
      return false;
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

  const value = {
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
    canAdminAccess: authService.canAdminAccess.bind(authService)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};