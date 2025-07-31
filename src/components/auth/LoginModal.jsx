import React, { useState } from 'react';
import { Modal, Button, Form, Input, message, Typography, Divider } from 'antd';
import { WalletOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('wallet'); // 'wallet' or 'traditional'
  const { connected, publicKey } = useWallet();
  const { loginWithWallet, loginTraditional } = useAuth();

  const handleWalletLogin = async () => {
    if (!connected || !publicKey) {
      message.error('请先连接钱包');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithWallet();
      if (result.success) {
        message.success('登录成功!');
        onSuccess && onSuccess();
        onClose();
        form.resetFields();
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error) {
      console.error('Wallet login error:', error);
      message.error('登录过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleTraditionalLogin = async (values) => {
    setLoading(true);
    try {
      const result = await loginTraditional(values.username, values.password);
      if (result.success) {
        message.success('登录成功!');
        onSuccess && onSuccess();
        onClose();
        form.resetFields();
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error) {
      console.error('Traditional login error:', error);
      message.error('登录过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="登录"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        {/* 登录方式选择 */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Button.Group>
            <Button 
              type={loginType === 'wallet' ? 'primary' : 'default'}
              onClick={() => setLoginType('wallet')}
              icon={<WalletOutlined />}
            >
              钱包登录
            </Button>
            <Button 
              type={loginType === 'traditional' ? 'primary' : 'default'}
              onClick={() => setLoginType('traditional')}
              icon={<UserOutlined />}
            >
              传统登录
            </Button>
          </Button.Group>
        </div>

        {loginType === 'wallet' ? (
          // 钱包登录
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>使用 Solana 钱包登录</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              连接您的 Solana 钱包并签名以完成登录
            </Text>
            
            <div style={{ marginBottom: 20 }}>
              <WalletMultiButton />
            </div>
            
            {connected && (
              <div style={{ marginBottom: 20 }}>
                <Text type="success">钱包已连接: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</Text>
              </div>
            )}
            
            <Button 
              type="primary" 
              size="large" 
              block
              loading={loading}
              disabled={!connected}
              onClick={handleWalletLogin}
            >
              {connected ? '签名登录' : '请先连接钱包'}
            </Button>
          </div>
        ) : (
          // 传统登录
          <div>
            <Title level={4}>传统账户登录</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleTraditionalLogin}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名" 
                  size="large"
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码" 
                  size="large"
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block
                  loading={loading}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            还没有账户？ 
            <Button type="link" style={{ padding: 0 }}>
              立即注册
            </Button>
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;