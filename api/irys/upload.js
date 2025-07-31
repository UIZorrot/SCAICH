// Irys上传API - 基于test.js的正确实现
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");

// 配置
const MAX_FREE_SIZE = 1000000 * 1024; // 100KB 免费上传限制

// 初始化Irys上传器
const getIrysUploader = async () => {
  try {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }
    
    const irysUploader = await Uploader(Solana).withWallet(process.env.PRIVATE_KEY);
    console.log("✅ Irys uploader initialized");
    return irysUploader;
  } catch (error) {
    console.error("❌ Failed to initialize Irys uploader:", error);
    throw error;
  }
};

// 主要的上传处理函数
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

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

    // 将数组转换回buffer
    const buffer = Buffer.from(data);
    
    // 检查文件大小
    if (buffer.length > MAX_FREE_SIZE) {
      return res.status(400).json({ 
        success: false, 
        error: `File too large: ${(buffer.length / 1024).toFixed(2)} KB > 100 KB` 
      });
    }

    console.log(`📁 Uploading file: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);

    // 初始化Irys上传器
    const irys = await getIrysUploader();

    // 上传到Irys网络
    const receipt = await irys.upload(buffer, { tags });
    
    console.log(`✅ Upload successful: https://gateway.irys.xyz/${receipt.id}`);

    // 返回成功响应
    return res.status(200).json({
      success: true,
      txId: receipt.id,
      url: `https://gateway.irys.xyz/${receipt.id}`,
      size: buffer.length,
      tags: tags
    });

  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    
    // 返回错误响应
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
