import React, { useState } from 'react';
import { Modal, Button, Form, Input, message, Typography, Divider } from 'antd';
import { WalletOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const RegisterModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [registerType, setRegisterType] = useState('wallet'); // 'wallet' or 'traditional'
  const { connected, publicKey } = useWallet();
  const { registerWithWallet, registerTraditional } = useAuth();

  const handleWalletRegister = async (values) => {
    if (!connected || !publicKey) {
      message.error('请先连接钱包');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithWallet(values.username);
      if (result.success) {
        message.success('注册成功!');
        onSuccess && onSuccess();
        onClose();
        form.resetFields();
      } else {
        message.error(result.error || '注册失败');
      }
    } catch (error) {
      console.error('Wallet register error:', error);
      message.error('注册过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleTraditionalRegister = async (values) => {
    setLoading(true);
    try {
      const result = await registerTraditional(values.username, values.email, values.password);
      if (result.success) {
        message.success('注册成功!');
        onSuccess && onSuccess();
        onClose();
        form.resetFields();
      } else {
        message.error(result.error || '注册失败');
      }
    } catch (error) {
      console.error('Traditional register error:', error);
      message.error('注册过程中发生错误');
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
      title="注册"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
    >
      <div style={{ padding: '20px 0' }}>
        {/* 注册方式选择 */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Button.Group>
            <Button 
              type={registerType === 'wallet' ? 'primary' : 'default'}
              onClick={() => setRegisterType('wallet')}
              icon={<WalletOutlined />}
            >
              钱包注册
            </Button>
            <Button 
              type={registerType === 'traditional' ? 'primary' : 'default'}
              onClick={() => setRegisterType('traditional')}
              icon={<UserOutlined />}
            >
              传统注册
            </Button>
          </Button.Group>
        </div>

        {registerType === 'wallet' ? (
          // 钱包注册
          <div>
            <Title level={4}>使用 Solana 钱包注册</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              连接您的 Solana 钱包并设置用户名完成注册
            </Text>
            
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <WalletMultiButton />
            </div>
            
            {connected && (
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <Text type="success">钱包已连接: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</Text>
              </div>
            )}
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleWalletRegister}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 20, message: '用户名最多20个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名" 
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
                  disabled={!connected}
                >
                  {connected ? '签名注册' : '请先连接钱包'}
                </Button>
              </Form.Item>
            </Form>
          </div>
        ) : (
          // 传统注册
          <div>
            <Title level={4}>传统账户注册</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleTraditionalRegister}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 20, message: '用户名最多20个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名" 
                  size="large"
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱" 
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
              
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请再次输入密码" 
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
                  注册
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            已有账户？ 
            <Button type="link" style={{ padding: 0 }}>
              立即登录
            </Button>
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default RegisterModal;