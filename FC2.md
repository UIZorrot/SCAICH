# 🔧 Main.py API 变化和新接口 - 前端集成指南

## 📋 **概述**

本文档详细说明了Main.py服务的所有变化和新增接口，为前端开发者提供完整的集成参考。

### **重要变更**
- ✅ **统一认证系统** - 所有服务现在使用同一套JWT认证
- ✅ **Irys转发接口** - 通过Main.py访问所有Irys功能  
- ✅ **角色权限控制** - 基于用户等级的功能访问控制
- ✅ **流式文件传输** - 优化的文件下载和查看体验

---

## 🔐 **1. 认证系统接口**

### **基础URL**
```
https://api.scai.sh
```

### **1.1 用户注册**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string (required, min 3 chars)",
  "email": "string (optional)",
  "password": "string (required, min 6 chars, must contain uppercase, lowercase, number, special char)"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid",
    "username": "string",
    "email": "string",
    "role": "user",
    "token": "jwt_token"
  }
}
```

### **1.2 用户登录**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string (required)",
  "password": "string (required)"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": "uuid",
    "username": "string",
    "email": "string", 
    "role": "user|plus|pro|admin",
    "token": "jwt_token"
  }
}
```

### **1.3 获取用户信息**
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### **1.4 修改密码**
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "old_password": "string",
  "new_password": "string"
}
```

### **1.5 用户升级**
```http
POST /api/auth/upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "upgrade_code": "string"
}
```

---

## 📁 **2. Irys文件管理接口**

### **2.1 文件上传**
```http
POST /api/irys/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: File (required)
- metadata: JSON string (optional)
```

**权限要求：** `user+`

### **2.2 文件列表**
```http
GET /api/irys/files/list?page=1&limit=20
Authorization: Bearer {token}
```

**权限要求：** `user+`

### **2.3 文件元数据**
```http
GET /api/irys/files/metadata/{txId}
Authorization: Bearer {token}
```

**权限要求：** `user+`

### **2.4 文件搜索**
```http
GET /api/irys/files/search?q={query}&page=1&limit=20
Authorization: Bearer {token}
```

**权限要求：** `user+`

---

## 📄 **3. Irys全文管理接口**

### **3.1 论文上传**
```http
POST /api/irys/fulltext/upload-paper
Authorization: Bearer {token}
Content-Type: application/json

{
  "doi": "string (required)",
  "source": "arxiv|scihub|oa|scinet",
  "metadata": {
    "title": "string",
    "authors": ["string"],
    "abstract": "string"
  }
}
```

**权限要求：** `plus+`

### **3.2 批量论文上传**
```http
POST /api/irys/fulltext/batch-upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "papers": [
    {
      "doi": "string",
      "source": "string",
      "metadata": {}
    }
  ]
}
```

**权限要求：** `pro+`

### **3.3 检查论文是否存在**
```http
GET /api/irys/fulltext/check/{doi}
Authorization: Bearer {token} (optional)
```

**权限要求：** `public`

### **3.4 获取论文状态**
```http
GET /api/irys/fulltext/status/{doi}
Authorization: Bearer {token} (optional)
```

**权限要求：** `public`

---

## 📥 **4. Irys代理下载接口**

### **4.1 文件下载**
```http
GET /api/irys/proxy/download/{txId}
Authorization: Bearer {token}
```

**权限要求：** `user+`
**响应：** 流式文件内容

### **4.2 文件在线查看**
```http
GET /api/irys/proxy/view/{txId}
Authorization: Bearer {token}
```

**权限要求：** `user+`
**响应：** 流式文件内容（Content-Disposition: inline）

### **4.3 文件信息**
```http
GET /api/irys/proxy/info/{txId}
Authorization: Bearer {token}
```

**权限要求：** `user+`

### **4.4 批量下载准备**
```http
POST /api/irys/proxy/batch-download
Authorization: Bearer {token}
Content-Type: application/json

{
  "files": ["txId1", "txId2", "txId3"]
}
```

**权限要求：** `plus+`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "batch_id": "uuid",
    "status": "prepared",
    "file_count": 3
  }
}
```

### **4.5 批量下载执行**
```http
GET /api/irys/proxy/batch-download/{batchId}
Authorization: Bearer {token}
```

**权限要求：** `plus+`
**响应：** ZIP文件流

---

## 🔧 **5. 系统接口**

### **5.1 Irys健康检查**
```http
GET /api/irys/health
```

**权限要求：** `public`

**响应示例：**
```json
{
  "success": true,
  "message": "Unified authentication system is operational",
  "data": {
    "auth_system": "unified",
    "main_py_url": "http://localhost:7788",
    "irys_server": "operational",
    "integration": "active"
  },
  "forwarded_from": "main.py",
  "forwarding_service": "active"
}
```

### **5.2 API文档**
```http
GET /api/irys
```

**权限要求：** `public`

**响应示例：**
```json
{
  "success": true,
  "message": "Irys Server API forwarding endpoints",
  "data": {
    "base_url": "http://localhost:7788",
    "irys_server": "http://localhost:7711",
    "authentication": "JWT Bearer token required (except where noted)",
    "endpoints": {
      "files": { ... },
      "fulltext": { ... },
      "proxy": { ... },
      "system": { ... }
    },
    "user_roles": {
      "user": "Basic user - file operations",
      "plus": "Enhanced user - paper uploads, batch downloads",
      "pro": "Professional user - batch uploads", 
      "admin": "Administrator - all operations"
    }
  }
}
```

---

## 👥 **6. 用户角色和权限**

### **角色层级**
```
user < plus < pro < admin
```

### **权限矩阵**

| 功能 | user | plus | pro | admin |
|------|------|------|-----|-------|
| 基础文件操作 | ✅ | ✅ | ✅ | ✅ |
| 文件下载/查看 | ✅ | ✅ | ✅ | ✅ |
| 论文上传 | ❌ | ✅ | ✅ | ✅ |
| 批量下载 | ❌ | ✅ | ✅ | ✅ |
| 批量论文上传 | ❌ | ❌ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ❌ | ✅ |

---

## 🚨 **7. 错误处理**

### **HTTP状态码**
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `500` - 服务器内部错误
- `503` - Irys服务不可用
- `504` - Irys服务超时

### **错误响应格式**
```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message"
}
```

### **权限不足示例**
```json
{
  "success": false,
  "message": "plus role or higher required"
}
```

---

## 🔄 **8. 迁移指南**

### **从旧版本迁移**

#### **8.1 认证系统迁移**
```javascript
// 旧方式 ❌
const irysLogin = await fetch('http://localhost:7711/api/auth/login', ...);
const mainLogin = await fetch('http://localhost:7788/api/auth/login', ...);

// 新方式 ✅
const response = await fetch('http://localhost:7788/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { data } = await response.json();
const token = data.token; // 通用token
```

#### **8.2 API端点迁移**
```javascript
// 旧方式 ❌
const oldEndpoint = 'http://localhost:7711/api/files/upload';

// 新方式 ✅  
const newEndpoint = 'http://localhost:7788/api/irys/files/upload';
```

#### **8.3 权限检查添加**
```javascript
// 新增权限检查 ✅
function canUploadPaper(userRole) {
  return ['plus', 'pro', 'admin'].includes(userRole);
}

function canBatchUpload(userRole) {
  return ['pro', 'admin'].includes(userRole);
}
```

---

## 📝 **9. 使用示例**

### **9.1 完整认证流程**
```javascript
async function authenticateUser(username, password) {
  const response = await fetch('http://localhost:7788/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    const { data } = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('userRole', data.role);
    return data;
  } else {
    throw new Error('Authentication failed');
  }
}
```

### **9.2 文件上传示例**
```javascript
async function uploadFile(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:7788/api/irys/files/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return await response.json();
}
```

### **9.3 权限控制示例**
```javascript
function initializeUI(userRole) {
  // 基础功能 - 所有用户
  document.getElementById('file-upload').style.display = 'block';
  
  // Plus功能
  if (['plus', 'pro', 'admin'].includes(userRole)) {
    document.getElementById('paper-upload').style.display = 'block';
    document.getElementById('batch-download').style.display = 'block';
  }
  
  // Pro功能
  if (['pro', 'admin'].includes(userRole)) {
    document.getElementById('batch-upload').style.display = 'block';
  }
  
  // Admin功能
  if (userRole === 'admin') {
    document.getElementById('admin-panel').style.display = 'block';
  }
}
```

---

## 🎯 **10. 测试建议**

### **10.1 功能测试**
1. **认证流程** - 注册、登录、获取用户信息
2. **文件操作** - 上传、列表、搜索、下载
3. **权限控制** - 不同角色的功能访问限制
4. **错误处理** - 各种错误情况的响应

### **10.2 性能测试**
1. **文件传输** - 大文件上传下载性能
2. **批量操作** - 批量上传下载效率
3. **并发访问** - 多用户同时访问

### **10.3 安全测试**
1. **Token验证** - 无效token的处理
2. **权限绕过** - 尝试访问无权限的功能
3. **输入验证** - 恶意输入的处理

---

## 📞 **11. 支持和联系**

如有任何问题或需要技术支持，请联系开发团队。

---

## 🔧 **12. 技术实现细节**

### **12.1 JWT Token格式**
```javascript
// Token payload 结构
{
  "user_id": "uuid",
  "username": "string",
  "role": "user|plus|pro|admin",
  "email": "string",
  "iss": "scaiengine",
  "iat": timestamp,
  "exp": timestamp
}
```

### **12.2 请求头要求**
```javascript
// 标准请求头
const headers = {
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// 文件上传请求头（不要设置Content-Type）
const uploadHeaders = {
  'Authorization': 'Bearer {token}'
  // Content-Type 由浏览器自动设置
};
```

### **12.3 流式响应处理**
```javascript
// 处理文件下载流
async function handleFileStream(response) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const contentType = response.headers.get('content-type');

  // 创建可读流
  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // 合并所有块
  const blob = new Blob(chunks, { type: contentType });
  return blob;
}
```

### **12.4 错误重试机制**
```javascript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      }

      // 如果是服务不可用，进行重试
      if (response.status === 503 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 📊 **13. 性能优化建议**

### **13.1 文件上传优化**
```javascript
// 大文件分块上传
async function uploadLargeFile(file, chunkSize = 1024 * 1024) {
  const chunks = Math.ceil(file.size / chunkSize);
  const uploadPromises = [];

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    uploadPromises.push(uploadChunk(chunk, i, chunks));
  }

  return await Promise.all(uploadPromises);
}
```

### **13.2 缓存策略**
```javascript
// API响应缓存
class APICache {
  constructor(ttl = 300000) { // 5分钟TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }
}

const apiCache = new APICache();
```

### **13.3 并发控制**
```javascript
// 限制并发请求数量
class ConcurrencyLimiter {
  constructor(limit = 5) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.limit || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const limiter = new ConcurrencyLimiter(3);
```

---

## 🛡️ **14. 安全最佳实践**

### **14.1 Token安全**
```javascript
// 安全的token存储
class SecureTokenStorage {
  static setToken(token) {
    // 使用httpOnly cookie（如果可能）
    // 或者使用sessionStorage而不是localStorage
    sessionStorage.setItem('auth_token', token);
  }

  static getToken() {
    return sessionStorage.getItem('auth_token');
  }

  static removeToken() {
    sessionStorage.removeItem('auth_token');
  }

  static isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
```

### **14.2 输入验证**
```javascript
// 客户端输入验证
class InputValidator {
  static validateDOI(doi) {
    const doiRegex = /^10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+$/;
    return doiRegex.test(doi);
  }

  static validateFile(file, maxSize = 100 * 1024 * 1024) { // 100MB
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      throw new Error('File size exceeds limit');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    return true;
  }
}
```

---

## 📱 **15. 移动端适配**

### **15.1 响应式设计**
```css
/* 移动端优化 */
@media (max-width: 768px) {
  .file-upload-area {
    padding: 20px;
    font-size: 14px;
  }

  .batch-operations {
    display: none; /* 移动端隐藏批量操作 */
  }
}
```

### **15.2 触摸优化**
```javascript
// 移动端文件选择优化
function initMobileFileUpload() {
  const uploadArea = document.getElementById('upload-area');

  // 添加触摸事件
  uploadArea.addEventListener('touchstart', handleTouchStart);
  uploadArea.addEventListener('touchend', handleTouchEnd);

  // 优化文件选择器
  const fileInput = document.getElementById('file-input');
  fileInput.setAttribute('accept', '.pdf,.doc,.docx,.txt');
  fileInput.setAttribute('multiple', 'true');
}
```

---

**API版本：** v1.0
**最后更新：** 2025-07-26
**兼容性：** 向后兼容，建议迁移到新接口
**文档版本：** 完整版
