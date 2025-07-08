const fs = require('fs');

// 获取命令行参数中的文件名
const inputFile = process.argv[2];

if (!inputFile) {
    console.log('请指定要转换的 JS 文件名');
    console.log('使用方法: node build.js 文件名.js');
    process.exit(1);
}

try {
    // 导入 JS 文件
    const component = require('./' + inputFile);
    
    // 获取文件中导出的第一个对象
    const content = Object.values(component)[0];
    
    // 创建输出文件名（将 .js 替换为 .json）
    const outputFile = inputFile.replace('.js', '.json');
    
    // 写入 JSON 文件
    fs.writeFileSync(outputFile, JSON.stringify(content, null, 2));
    
    console.log(`已生成 ${outputFile}`);

} catch (error) {
    console.error('转换失败:', error.message);
} 