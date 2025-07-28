import React from 'react';
import { Result, Button } from 'antd';
import { ExceptionOutlined } from '@ant-design/icons';

/**
 * 错误边界组件
 * 用于捕获和处理React组件中的错误
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新state以显示错误UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { title = "Something went wrong", subTitle, showDetails = false } = this.props;
      
      return (
        <Result
          icon={<ExceptionOutlined style={{ color: '#ff4d4f' }} />}
          title={title}
          subTitle={subTitle || "An unexpected error occurred. Please try again."}
          extra={[
            <Button type="primary" key="retry" onClick={this.handleRetry}>
              Try Again
            </Button>,
            <Button key="home" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          ]}
        >
          {showDetails && this.state.error && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: '#f5f5f5', 
              borderRadius: 4,
              textAlign: 'left'
            }}>
              <h4>Error Details:</h4>
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}

/**
 * API错误处理组件
 * 用于处理API调用中的错误
 */
export const ApiErrorHandler = ({ error, onRetry, children }) => {
  if (!error) {
    return children;
  }

  let title = "Request Failed";
  let subTitle = "An error occurred while processing your request.";
  
  // 根据错误类型自定义消息
  if (error.status === 401) {
    title = "Authentication Required";
    subTitle = "Please log in to continue.";
  } else if (error.status === 403) {
    title = "Access Denied";
    subTitle = "You don't have permission to access this resource.";
  } else if (error.status === 404) {
    title = "Not Found";
    subTitle = "The requested resource was not found.";
  } else if (error.status >= 500) {
    title = "Server Error";
    subTitle = "The server encountered an error. Please try again later.";
  }

  return (
    <Result
      status="error"
      title={title}
      subTitle={subTitle}
      extra={[
        onRetry && (
          <Button type="primary" key="retry" onClick={onRetry}>
            Try Again
          </Button>
        ),
        <Button key="home" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      ].filter(Boolean)}
    />
  );
};

export default ErrorBoundary;