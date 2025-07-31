// Irys上传API - 后端处理真正的Irys网络上传
// 严格按照test.js的实现

const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");

// 配置
const MAX_FREE_SIZE = 1000000 * 1024; // 100KB 免费上传限制

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

// API处理函数
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

    // 转换数据为Buffer
    const buffer = Buffer.from(data);

    // 检查文件大小
    if (buffer.length > MAX_FREE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `File too large: ${(buffer.length / 1024).toFixed(2)} KB > 100 KB`
      });
    }

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
    console.error('❌ Upload failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
}

// 用于开发环境的模拟API响应
export const mockIrysUpload = async (data, tags) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  // 模拟成功响应
  const mockTxId = `irys_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    txId: mockTxId,
    url: `https://gateway.irys.xyz/${mockTxId}`,
    size: data.length,
    tags: tags
  };
};
