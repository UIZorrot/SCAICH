// 简单的Express服务器，用于处理Irys上传
// 严格按照test.js的实现

require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");

const app = express();
const PORT = process.env.PORT || 3001;

// 配置
const MAX_FREE_SIZE = 100 * 1024; // 100KB 免费上传限制

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 初始化Irys上传器 - 严格按照test.js实现
const getIrysUploader = async () => {
  try {
    // 使用环境变量中的私钥，变量名与test.js保持一致
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }

    const irysUploader = await Uploader(Solana).withWallet(privateKey);
    console.log("✅ 初始化完成");
    return irysUploader;
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    throw error;
  }
};

// Irys上传API端点
app.post('/api/irys/upload', async (req, res) => {
  try {
    const { data, tags } = req.body;

    // 验证请求数据
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data format' 
      });
    }

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tags format' 
      });
    }

    // 转换数据为Buffer
    const buffer = Buffer.from(data);
    
    // 检查文件大小
    if (buffer.length > MAX_FREE_SIZE) {
      return res.status(400).json({ 
        success: false, 
        error: `文件过大: ${(buffer.length / 1024).toFixed(2)} KB > 100 KB` 
      });
    }

    console.log(`文件大小: ${buffer.length} 字节 (${(buffer.length / 1024).toFixed(2)} KB)`);

    // 初始化Irys上传器
    const irys = await getIrysUploader();

    // 上传到Irys网络 - 严格按照test.js实现
    const receipt = await irys.upload(buffer, { tags });

    console.log(`✅ 上传成功: https://gateway.irys.xyz/${receipt.id}`);

    // 返回成功结果，使用真正的receipt.id
    return res.status(200).json({
      success: true,
      txId: receipt.id,  // 这是真正的Irys transaction ID
      url: `https://gateway.irys.xyz/${receipt.id}`,
      size: buffer.length,
      tags: tags
    });

  } catch (error) {
    console.error('❌ 上传失败:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Irys upload server is running' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Irys upload server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/irys/upload`);
});

module.exports = app;
