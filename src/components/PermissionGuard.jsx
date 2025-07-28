import React, { useState, useEffect } from 'react';
import { useAuthService } from '../services/authService';
import { Button, Result, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';

/**
 * 权限守卫组件
 * 用于控制用户访问特定功能的权限
 */
const PermissionGuard = ({ 
  permission, 
  children, 
  fallback = null,
  showUpgrade = true,
  upgradeMessage = "You need to upgrade your account to access this feature."
}) => {
  const { hasPermission, user } = useAuthService();
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const access = await hasPermission(permission);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permission, hasPermission]);

  // 显示加载状态
  if (loading) {
    return <Spin size="small" />;
  }

  // 如果用户有权限，直接渲染子组件
  if (hasAccess) {
    return children;
  }

  // 如果提供了自定义fallback，使用它
  if (fallback) {
    return fallback;
  }

  // 如果不显示升级提示，返回null
  if (!showUpgrade) {
    return null;
  }

  // 默认的权限不足提示
  return (
    <Result
      icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
      title="Permission Required"
      subTitle={upgradeMessage}
      extra={
        <Button 
          type="primary" 
          onClick={() => {
            // 这里可以添加升级账户的逻辑
            console.log('Redirect to upgrade page');
          }}
        >
          Upgrade Account
        </Button>
      }
    />
  );
};

/**
 * 高阶组件版本的权限守卫
 */
export const withPermission = (permission, options = {}) => {
  return (WrappedComponent) => {
    return (props) => (
      <PermissionGuard permission={permission} {...options}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
};

/**
 * Hook版本的权限检查
 */
export const usePermissionCheck = (permission) => {
  const { hasPermission } = useAuthService();
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const access = await hasPermission(permission);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (permission) {
      checkPermission();
    }
  }, [permission, hasPermission]);

  return { hasAccess, loading };
};

export default PermissionGuard;