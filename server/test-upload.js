// 测试Irys上传功能
// 验证服务器是否正确返回真正的receipt.id

require("dotenv").config();
const fetch = require('node-fetch');

const testUpload = async () => {
  try {
    console.log('🧪 开始测试Irys上传...');

    // 创建测试数据
    const testContent = "Hello, SCAI Box! This is a test upload.";
    const buffer = Buffer.from(testContent, 'utf8');
    const data = Array.from(buffer);

    const tags = [
      { name: "Content-Type", value: "text/plain" },
      { name: "App-Name", value: "scai-box" },
      { name: "Title", value: "Test Upload" },
      { name: "Description", value: "Testing Irys upload functionality" }
    ];

    console.log(`📄 测试内容: "${testContent}"`);
    console.log(`📊 数据大小: ${buffer.length} 字节`);

    // 调用上传API
    const response = await fetch('http://localhost:3001/api/irys/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, tags })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ 上传成功!');
      console.log(`🆔 Transaction ID: ${result.txId}`);
      console.log(`🔗 URL: ${result.url}`);
      console.log(`📏 Size: ${result.size} bytes`);
      
      // 验证ID格式
      if (result.txId.startsWith('irys_mock_') || result.txId.startsWith('local_')) {
        console.log('⚠️  警告: 这是模拟ID，不是真正的Irys ID');
      } else if (result.txId.length === 43) {
        console.log('✅ ID格式正确: 43字符的base64url格式');
      } else {
        console.log(`❓ ID格式异常: 长度为${result.txId.length}字符`);
      }

      // 尝试访问上传的内容
      console.log('\n🔍 验证上传内容...');
      try {
        const verifyResponse = await fetch(result.url);
        if (verifyResponse.ok) {
          const uploadedContent = await verifyResponse.text();
          if (uploadedContent === testContent) {
            console.log('✅ 内容验证成功: 上传的内容与原始内容一致');
          } else {
            console.log('❌ 内容验证失败: 上传的内容与原始内容不一致');
          }
        } else {
          console.log(`⏳ 内容暂时不可访问 (HTTP ${verifyResponse.status})`);
          console.log('💡 Irys网络可能需要几分钟来同步内容');
        }
      } catch (verifyError) {
        console.log('⏳ 内容验证失败:', verifyError.message);
        console.log('💡 这可能是正常的，Irys网络需要时间来同步');
      }

    } else {
      console.log('❌ 上传失败:', result.error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 提示:');
      console.log('1. 确保Irys服务器正在运行: npm run dev');
      console.log('2. 检查端口3001是否可用');
    } else if (error.message.includes('PRIVATE_KEY')) {
      console.log('\n💡 提示:');
      console.log('1. 确保.env文件存在');
      console.log('2. 确保PRIVATE_KEY环境变量已设置');
    }
  }
};

// 运行测试
testUpload();
