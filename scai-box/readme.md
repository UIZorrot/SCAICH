<<<<<<< HEAD
# SciBox - Decentralized Academic Paper Platform

SciBox is a revolutionary Web4-based decentralized platform for academic papers, built on the Irys network. It represents a new paradigm in academic paper sharing and management, leveraging blockchain technology for decentralized storage and distribution.

## Core Features

### Decentralized Architecture
- **Web4-based Framework**: Built on decentralized principles using Irys network
- **Modular Widget System**: Each component is independently stored and managed on the blockchain
- **Dynamic Loading**: Components are loaded in real-time through GraphQL queries
- **Version Control**: Automatic versioning of components and content

### Key Components
- **Paper Search**: Advanced search functionality supporting DOI, Title, and arXiv ID
- **Latest Papers Feed**: Real-time updates of newly added papers
- **PDF Viewer**: Integrated viewer for academic papers
- **Chat System**: Real-time discussion platform integrated with Solana wallet
- **Upload System**: Decentralized paper upload system

### Technical Highlights
- **Component Independence**: Each widget contains complete HTML, CSS, and JavaScript
- **Dynamic Updates**: Components can be updated independently without full redeployment
- **Blockchain Storage**: All content stored on Irys decentralized network
- **Real-time Loading**: GraphQL-powered dynamic content loading

## Architecture

### Widget System
Each functional component (widget) in SciBox is:
- Completely self-contained with HTML, CSS, and JavaScript
- Stored independently on the Irys network
- Versioned and updateable individually
- Loaded dynamically based on user interaction

### Decentralized Storage
- Papers and metadata stored on Irys network
- Content addressed through unique identifiers
- Immutable and permanent storage
- Distributed access and retrieval

### Integration
- **Solana Wallet Integration**: For user authentication and chat functionality
- **Irys Network**: For decentralized storage and content delivery
- **GraphQL API**: For efficient data querying and real-time updates

## Technical Stack
- **Frontend**: Pure JavaScript with Web4 principles
- **Storage**: Irys Network (formerly Bundlr)
- **Authentication**: Solana Wallet
- **API**: GraphQL
- **PDF Processing**: Client-side chunk processing and viewing

## Future Development
- Enhanced search capabilities
- Academic community features
- Citation management system
- Integration with more academic databases
- Mobile application development

## Version History

### v0.1.7
- Added paper details page and comment section
- Enhanced upload system with better user experience

### v0.1.6
- Added statistics dashboard for paper count and points
- Improved upload interface with progress indicators and better UI
- Enhanced user guidance and feedback

### v0.1.5
- Implemented PDF validation and metadata checks
- Added paid upload option for complete PDFs based on file size
- Maintained free upload option for chunked PDFs

---

SciBox represents a significant step forward in decentralized academic publishing and sharing. By leveraging Web4 technologies and blockchain storage, it provides a robust, censorship-resistant platform for academic knowledge distribution.

// Layout 职责
- 加载组件
- 处理组件查询和数据获取
- 提供最基础的容器布局
- 管理主题切换

// 组件职责
- 自己的样式和布局
- 响应式设计
- 内部交互逻辑

0.1.1
https://uploader.irys.xyz/8F3FmLwBCArk2jYbMqtWJYHbm2NCmRWB7zriPBCSNRqh/index.html

好的，我来总结一下解决支付和上传问题的关键步骤：
钱包连接问题：
使用 solanaWeb3.PublicKey 正确转换钱包公钥
确保钱包连接完成后再初始化 Irys
添加详细的日志记录来追踪连接状态
Irys 初始化问题：
正确配置 provider 对象，包含：
Apply to pdfupload.ht...
使用 withRpc 设置正确的 RPC 端点
添加连接测试确保初始化成功
支付问题：
实现 fundUpload 方法处理资金：
Apply to pdfupload.ht...
添加重试机制处理支付失败
提供清晰的错误提示
上传问题：
简化上传流程，直接使用 uploadFile 方法
添加元数据上传支持
实现进度显示和状态更新
错误处理：
添加详细的错误日志
实现重试机制
提供用户友好的错误提示
关键改进：
使用 QuickNode RPC 端点提高稳定性
正确配置 Solana 钱包 provider
添加完整的日志系统便于调试
这些改进使得系统能够：
可靠地连接钱包
正确处理支付
稳定地上传文件
提供良好的用户体验

0.1.5 

文件结构规范：
const widgetName = {
    html: [
        // HTML 内容，每行一个字符串
        '<div class="container">',
        '    <div class="content">',
        '        <!-- 内容 -->',
        '    </div>',
        '</div>'
    ].join('\n'),
    
    css: [
        // CSS 内容，每行一个字符串
        '.container {',
        '    width: 100%;',
        '    padding: 20px;',
        '}',
        '',
        '.content {',
        '    background: var(--bg-color);',
        '}'
    ].join('\n'),
    
    js: [
        // JavaScript 内容，每行一个字符串
        'function init() {',
        '    console.log(\'Initialized\');',
        '}',
        '',
        '// 导出模块',
        'module.exports = { widgetName };'
    ].join('\n')
};

module.exports = { widgetName };
字符串处理规范：
使用单引号 ' 而不是双引号 "
使用 join('\n') 连接数组元素
避免使用模板字符串 `` ``
正确处理转义字符
代码格式规范：
使用 4 个空格缩进
保持一致的代码风格
添加适当的空行提高可读性
使用有意义的变量名和函数名
错误
try {
    // 主要逻辑
} catch (error) {
    console.error('Error description:', error);
    // 适当的错误处理
} finally {
    // 清理工作
}

/ 异步函数
async function functionName(params) {
    // 函数体
}

// 普通函数
function functionName(params) {
    // 函数体
}

// 箭头函数
const functionName = (params) => {
    // 函数体
}

模块导出规范

// 单个导出
module.exports = { widgetName };

// 多个导出
module.exports = { 
    widgetName1,
    widgetName2 
};

代码组织规范:
a) HTML 规范:
使用语义化标签
添加适当的 class 和 id
保持缩进和格式
避免内联样式和脚本
b) CSS 规范:
使用 BEM 命名规范
添加响应式设计
使用 CSS 变量
添加必要的浏览器前缀
c) JavaScript 规范:
使用 ES6+ 语法
添加错误处理
使用异步/等待
添加必要的注释
组件开发指南:
a) 文件命名:




v0.1.5  
更新了上传页面检验pdf和信息完整，默认上传页面是根据文件大小收一点sol上传完整pdf以避免乱传，也保留了免费上传切片pdf的功能

v0.1.6
增加了统计论文发布数量和积分的窗口
##更新了上传界面，增加了上传进度提醒和更多提示，优化了界面显示


v0.1.7
##上传系统，增加了详情页和评论区

=======
# SciBox - Decentralized Academic Paper Platform

SciBox is a revolutionary Web4-based decentralized platform for academic papers, built on the Irys network. It represents a new paradigm in academic paper sharing and management, leveraging blockchain technology for decentralized storage and distribution.

## Core Features

### Decentralized Architecture
- **Web4-based Framework**: Built on decentralized principles using Irys network
- **Modular Widget System**: Each component is independently stored and managed on the blockchain
- **Dynamic Loading**: Components are loaded in real-time through GraphQL queries
- **Version Control**: Automatic versioning of components and content

### Key Components
- **Paper Search**: Advanced search functionality supporting DOI, Title, and arXiv ID
- **Latest Papers Feed**: Real-time updates of newly added papers
- **PDF Viewer**: Integrated viewer for academic papers
- **Chat System**: Real-time discussion platform integrated with Solana wallet
- **Upload System**: Decentralized paper upload system

### Technical Highlights
- **Component Independence**: Each widget contains complete HTML, CSS, and JavaScript
- **Dynamic Updates**: Components can be updated independently without full redeployment
- **Blockchain Storage**: All content stored on Irys decentralized network
- **Real-time Loading**: GraphQL-powered dynamic content loading

## Architecture

### Widget System
Each functional component (widget) in SciBox is:
- Completely self-contained with HTML, CSS, and JavaScript
- Stored independently on the Irys network
- Versioned and updateable individually
- Loaded dynamically based on user interaction

### Decentralized Storage
- Papers and metadata stored on Irys network
- Content addressed through unique identifiers
- Immutable and permanent storage
- Distributed access and retrieval

### Integration
- **Solana Wallet Integration**: For user authentication and chat functionality
- **Irys Network**: For decentralized storage and content delivery
- **GraphQL API**: For efficient data querying and real-time updates

## Technical Stack
- **Frontend**: Pure JavaScript with Web4 principles
- **Storage**: Irys Network (formerly Bundlr)
- **Authentication**: Solana Wallet
- **API**: GraphQL
- **PDF Processing**: Client-side chunk processing and viewing

## Future Development
- Enhanced search capabilities
- Academic community features
- Citation management system
- Integration with more academic databases
- Mobile application development

## Version History

### v0.1.7
- Added paper details page and comment section
- Enhanced upload system with better user experience

### v0.1.6
- Added statistics dashboard for paper count and points
- Improved upload interface with progress indicators and better UI
- Enhanced user guidance and feedback

### v0.1.5
- Implemented PDF validation and metadata checks
- Added paid upload option for complete PDFs based on file size
- Maintained free upload option for chunked PDFs

---

SciBox represents a significant step forward in decentralized academic publishing and sharing. By leveraging Web4 technologies and blockchain storage, it provides a robust, censorship-resistant platform for academic knowledge distribution.

// Layout 职责
- 加载组件
- 处理组件查询和数据获取
- 提供最基础的容器布局
- 管理主题切换

// 组件职责
- 自己的样式和布局
- 响应式设计
- 内部交互逻辑

0.1.1
https://uploader.irys.xyz/8F3FmLwBCArk2jYbMqtWJYHbm2NCmRWB7zriPBCSNRqh/index.html

好的，我来总结一下解决支付和上传问题的关键步骤：
钱包连接问题：
使用 solanaWeb3.PublicKey 正确转换钱包公钥
确保钱包连接完成后再初始化 Irys
添加详细的日志记录来追踪连接状态
Irys 初始化问题：
正确配置 provider 对象，包含：
Apply to pdfupload.ht...
使用 withRpc 设置正确的 RPC 端点
添加连接测试确保初始化成功
支付问题：
实现 fundUpload 方法处理资金：
Apply to pdfupload.ht...
添加重试机制处理支付失败
提供清晰的错误提示
上传问题：
简化上传流程，直接使用 uploadFile 方法
添加元数据上传支持
实现进度显示和状态更新
错误处理：
添加详细的错误日志
实现重试机制
提供用户友好的错误提示
关键改进：
使用 QuickNode RPC 端点提高稳定性
正确配置 Solana 钱包 provider
添加完整的日志系统便于调试
这些改进使得系统能够：
可靠地连接钱包
正确处理支付
稳定地上传文件
提供良好的用户体验

0.1.5 

文件结构规范：
const widgetName = {
    html: [
        // HTML 内容，每行一个字符串
        '<div class="container">',
        '    <div class="content">',
        '        <!-- 内容 -->',
        '    </div>',
        '</div>'
    ].join('\n'),
    
    css: [
        // CSS 内容，每行一个字符串
        '.container {',
        '    width: 100%;',
        '    padding: 20px;',
        '}',
        '',
        '.content {',
        '    background: var(--bg-color);',
        '}'
    ].join('\n'),
    
    js: [
        // JavaScript 内容，每行一个字符串
        'function init() {',
        '    console.log(\'Initialized\');',
        '}',
        '',
        '// 导出模块',
        'module.exports = { widgetName };'
    ].join('\n')
};

module.exports = { widgetName };
字符串处理规范：
使用单引号 ' 而不是双引号 "
使用 join('\n') 连接数组元素
避免使用模板字符串 `` ``
正确处理转义字符
代码格式规范：
使用 4 个空格缩进
保持一致的代码风格
添加适当的空行提高可读性
使用有意义的变量名和函数名
错误
try {
    // 主要逻辑
} catch (error) {
    console.error('Error description:', error);
    // 适当的错误处理
} finally {
    // 清理工作
}

/ 异步函数
async function functionName(params) {
    // 函数体
}

// 普通函数
function functionName(params) {
    // 函数体
}

// 箭头函数
const functionName = (params) => {
    // 函数体
}

模块导出规范

// 单个导出
module.exports = { widgetName };

// 多个导出
module.exports = { 
    widgetName1,
    widgetName2 
};

代码组织规范:
a) HTML 规范:
使用语义化标签
添加适当的 class 和 id
保持缩进和格式
避免内联样式和脚本
b) CSS 规范:
使用 BEM 命名规范
添加响应式设计
使用 CSS 变量
添加必要的浏览器前缀
c) JavaScript 规范:
使用 ES6+ 语法
添加错误处理
使用异步/等待
添加必要的注释
组件开发指南:
a) 文件命名:




v0.1.5  
更新了上传页面检验pdf和信息完整，默认上传页面是根据文件大小收一点sol上传完整pdf以避免乱传，也保留了免费上传切片pdf的功能

v0.1.6
增加了统计论文发布数量和积分的窗口
##更新了上传界面，增加了上传进度提醒和更多提示，优化了界面显示


v0.1.7
##上传系统，增加了详情页和评论区

>>>>>>> ebf96e87a3beacfc57de7ef66189a7b0da85cb7c
#准备优化搜索的大小写