// Express服务器用于本地开发和Irys上传
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Uploader } = require("@irys/upload");
const { Solana } = require("@irys/upload-solana");

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 在生产环境中服务静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// 配置
const MAX_FREE_SIZE = 1000000 * 1024; // 100KB 免费上传限制

// 初始化Irys上传器
let irysUploader = null;

const getIrysUploader = async () => {
  if (irysUploader) {
    return irysUploader;
  }

  try {
    console.log("🔄 Initializing Irys uploader...");

    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }

    console.log("🔑 Private key found, creating uploader...");
    irysUploader = await Uploader(Solana).withWallet(process.env.PRIVATE_KEY);
    console.log("✅ Irys uploader initialized successfully");
    return irysUploader;
  } catch (error) {
    console.error("❌ Failed to initialize Irys uploader:", error);
    console.error("Error details:", error.stack);
    throw error;
  }
};

// Irys上传API端点
app.post('/api/irys/upload', async (req, res) => {
  try {
    console.log("📥 Received upload request");
    const { data, tags } = req.body;

    // 验证请求数据
    if (!data || !Array.isArray(data)) {
      console.log("❌ Invalid data format");
      return res.status(400).json({
        success: false,
        error: 'Invalid data format'
      });
    }

    if (!tags || !Array.isArray(tags)) {
      console.log("❌ Invalid tags format");
      return res.status(400).json({
        success: false,
        error: 'Invalid tags format'
      });
    }

    // 将数组转换回buffer
    const buffer = Buffer.from(data);
    console.log(`📊 Buffer created: ${buffer.length} bytes`);

    // 检查文件大小
    if (buffer.length > MAX_FREE_SIZE) {
      console.log(`❌ File too large: ${buffer.length} bytes`);
      return res.status(400).json({
        success: false,
        error: `File too large: ${(buffer.length / 1024).toFixed(2)} KB > 100 KB`
      });
    }

    console.log(`📁 Uploading file: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`);
    console.log(`🏷️ Tags:`, tags);

    // 初始化Irys上传器
    console.log("🔄 Getting Irys uploader...");
    const irys = await getIrysUploader();
    console.log("✅ Irys uploader ready");

    // 上传到Irys网络
    console.log("🚀 Starting upload to Irys...");
    const receipt = await irys.upload(buffer, { tags });
    console.log("📋 Upload receipt:", receipt);

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
    console.error(`❌ Upload failed:`, error);
    console.error("Error stack:", error.stack);

    // 返回错误响应
    return res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Irys upload server is running',
    timestamp: new Date().toISOString()
  });
});

// Irys GraphQL代理端点
app.post('/api/irys/graphql', async (req, res) => {
  try {
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch('https://uploader.irys.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);

    if (error.name === 'AbortError') {
      res.status(504).json({ error: 'Request timeout - Irys service is not responding' });
    } else if (error.message.includes('HTTP error')) {
      res.status(502).json({ error: `Irys service error: ${error.message}` });
    } else {
      res.status(500).json({ error: 'GraphQL proxy error' });
    }
  }
});

// DOI查询API
app.get('/api/paper-info', async (req, res) => {
  try {
    const { doi } = req.query;

    if (!doi) {
      return res.status(400).json({ error: 'DOI parameter is required' });
    }

    // 调用OpenAlex API获取论文信息
    const response = await fetch(`https://api.openalex.org/works/doi:${doi}`);

    if (!response.ok) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const paper = await response.json();

    // 处理摘要
    const restoreAbstract = (abstractInvertedIndex) => {
      if (!abstractInvertedIndex) return "Abstract Not Available";

      const words = [];
      for (const [word, positions] of Object.entries(abstractInvertedIndex)) {
        for (const pos of positions) {
          words[pos] = word;
        }
      }
      return words.filter(Boolean).join(' ');
    };

    // 处理作者信息
    const authors = paper.authorships?.map(authorship =>
      authorship.author?.display_name || "Unknown"
    ) || [];

    // 格式化返回数据
    const paperInfo = {
      source: "openalex",
      title: paper.title || "Unknown",
      doi: doi,
      abstract: restoreAbstract(paper.abstract_inverted_index),
      referencecount: paper.cited_by_count || 0,
      author: authors.join(", ") || "Unknown",
      year: paper.publication_year || "Unknown",
      url: `https://www.doi.org/${doi}`,
      location: paper.locations?.map(loc => loc.source?.display_name).join(", ") || "Not Available",
      scihub_url: `https://www.doi.org/${doi}`,
      is_oa: paper.open_access?.is_oa || false
    };

    res.json(paperInfo);
  } catch (error) {
    console.error('DOI query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 在生产环境中，所有非API路由都返回React应用
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Irys upload server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/irys/upload`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
