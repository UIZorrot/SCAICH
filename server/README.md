# SCAI Irys Upload Server

这是SCAI Box的Irys上传服务器，严格按照test.js的实现来处理真正的Irys网络上传。

## 快速开始

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的Solana私钥
nano .env
```

### 3. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 4. 测试服务器
```bash
# 健康检查
curl http://localhost:3001/health
```

## 环境变量说明

- `PRIVATE_KEY`: Solana私钥（base58编码）
- `PORT`: 服务器端口（默认3001）

## API端点

### POST /api/irys/upload
上传文件到Irys网络

**请求体:**
```json
{
  "data": [/* Uint8Array转换的数组 */],
  "tags": [
    { "name": "Content-Type", "value": "application/pdf" },
    { "name": "App-Name", "value": "scai-box" }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "txId": "真正的Irys交易ID",
  "url": "https://gateway.irys.xyz/交易ID",
  "size": 12345,
  "tags": [...]
}
```

## 注意事项

1. **私钥安全**: 确保.env文件不被提交到版本控制
2. **文件大小限制**: 当前限制为100KB
3. **网络要求**: 需要稳定的网络连接到Irys网络
4. **钱包余额**: 确保Solana钱包有足够的余额支付上传费用

## 与test.js的一致性

本服务器严格按照test.js的实现：
- 使用相同的依赖包版本
- 使用相同的环境变量名（PRIVATE_KEY）
- 使用相同的初始化逻辑
- 使用相同的上传方法
- 返回真正的receipt.id
