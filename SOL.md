# Solana钱包认证API接口文档

本文档说明了 `main.py` 文件中与Solana钱包认证相关的API接口。

## 📋 概述

系统支持两种认证方式：
1. **传统认证**：用户名/密码
2. **Solana钱包认证**：钱包地址/签名

## 🔐 Solana钱包相关API接口

### 1. 用户注册接口

**接口地址：** `POST /api/auth/register`

**功能：** 支持Solana钱包注册和传统用户注册

#### Solana钱包注册

**请求参数：**
```json
{
  "wallet_address": "string",  // Solana钱包地址（必填）
  "signature": "string"        // 钱包签名（必填）
}
```

**响应成功：**
```json
{
  "success": true,
  "message": "Wallet user registered successfully",
  "data": {
    "user_id": "string",
    "username": "string",
    "wallet_address": "string",
    "sol_balance": 0.123,
    "role": "user",
    "token": "jwt_token_string"
  }
}
```

**响应失败：**
```json
{
  "success": false,
  "message": "Invalid wallet signature" // 或其他错误信息
}
```

**验证逻辑：**
- 验证钱包签名
- 检查SOL余额（需要满足最低余额要求）
- 检查钱包是否已注册
- 创建新用户并生成JWT token

---

### 2. 用户登录接口

**接口地址：** `POST /api/auth/login`

**功能：** 支持Solana钱包登录和传统用户登录

#### Solana钱包登录

**请求参数：**
```json
{
  "wallet_address": "string",  // Solana钱包地址（必填）
  "signature": "string",      // 钱包签名（必填）
  "message": "SCAI"           // 签名消息（可选，默认为"SCAI"）
}
```

**响应成功：**
```json
{
  "success": true,
  "message": "Wallet login successful",
  "data": {
    "user_id": "string",
    "username": "string",
    "wallet_address": "string",
    "email": "string",
    "role": "user",
    "sol_balance": 0.123,
    "token": "jwt_token_string",
    "auth_type": "wallet"
  }
}
```

**响应失败：**
```json
{
  "success": false,
  "message": "Invalid wallet signature or insufficient SOL balance"
}
```

**验证逻辑：**
- 调用 `authenticate_wallet` 方法验证签名和余额
- 生成JWT token
- 返回用户信息

---

### 3. 钱包用户Plus升级接口

**接口地址：** `POST /api/auth/wallet/upgrade-plus`

**功能：** 钱包用户使用Plus邀请码升级角色

**认证要求：** 需要钱包认证 (`@require_wallet_auth`)

**请求参数：**
```json
{
  "plus_invite_code": "string"  // Plus邀请码（必填）
}
```

**响应成功：**
```json
{
  "success": true,
  "message": "Wallet user upgraded to plus successfully",
  "data": {
    "user_id": "string",
    "username": "string",
    "wallet_address": "string",
    "sol_balance": 0.123,
    "role": "plus",
    "token": "new_jwt_token_string"
  }
}
```

**响应失败：**
```json
{
  "success": false,
  "message": "Invalid or expired plus invite code"
}
```

**验证逻辑：**
- 检查用户当前角色（不能已经是plus或更高级别）
- 验证Plus邀请码
- 升级用户角色
- 生成新的JWT token

---

## 🔧 认证装饰器

系统使用以下钱包认证装饰器：

- `@require_wallet_auth` - 要求钱包认证
- `@require_wallet_plus` - 要求钱包用户且角色为plus或更高
- `@require_wallet_pro` - 要求钱包用户且角色为pro或更高
- `@require_wallet_admin` - 要求钱包用户且角色为admin
- `@optional_wallet_auth` - 可选钱包认证

## 📝 重要说明

### SOL余额要求
- 注册和登录时都会检查钱包的SOL余额
- 需要满足最低余额要求（在 `solana_auth.py` 中配置）

### 签名验证
- 默认签名消息为 "SCAI"
- 登录时可以自定义签名消息
- 签名验证通过 `solana_auth.py` 中的 `verify_wallet_signature` 方法实现

### JWT Token
- 成功认证后会生成JWT token
- Token包含用户信息，用于后续API调用的身份验证
- 钱包用户的token中包含 `wallet_address` 字段

### 错误处理
- 所有接口都有统一的错误响应格式
- 常见错误包括：签名验证失败、余额不足、用户已存在等

## 🔗 相关文件

- `solana_auth.py` - Solana钱包认证服务实现
- `unified_auth.py` - 传统认证服务实现
- 前端集成文档：`SOLANA_FRONTEND_INTEGRATION_GUIDE.md`