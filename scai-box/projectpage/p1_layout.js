const pageLayoutWidget = {
    html: `
        <div class="page-container">
            <div class="main-content">
                <div id="search-container"></div>
                <div id="viewer-container"></div>
                <div id="comments-container"></div>
            </div>
            <div class="market-sidebar">
                <div id="market-container"></div>
            </div>
        </div>
    `,
    css: `
        :root {
            --bg-color: #ffffff;
            --text-color: #1a1a1a;
            --border-color: #e2e8f0;
            --container-width: 1600px;
            --sidebar-width: 300px;
            --content-gap: 30px;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #0A192F;
                --text-color: #CCD6F6;
                --border-color: rgba(255, 255, 255, 0.1);
            }
        }

        body {
            margin: 0;
            padding: 0;
            background: var(--bg-color);
            color: var(--text-color);
            font-family: system-ui, -apple-system, sans-serif;
        }

        .page-container {
            width: 100%;
            max-width: var(--container-width);
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
            min-height: 100vh;
            display: flex;
            gap: var(--content-gap);
        }

        .main-content {
            flex: 1;
            min-width: 0;
            max-width: calc(100% - var(--sidebar-width) - var(--content-gap));
        }

        .market-sidebar {
            width: var(--sidebar-width);
            flex-shrink: 0;
            position: sticky;
            top: 20px;
            height: calc(100vh - 40px);
            overflow-y: auto;
        }

        #viewer-container {
            margin: 20px 0;
            width: 100%;
        }

        @media (max-width: 1400px) {
            :root {
                --container-width: 100%;
                --content-gap: 20px;
            }
            
            .main-content {
                max-width: calc(100% - var(--sidebar-width) - var(--content-gap));
            }
        }

        @media (max-width: 900px) {
            .page-container {
                flex-direction: column;
            }

            .main-content {
                max-width: 100%;
            }

            .market-sidebar {
                width: 100%;
                position: static;
                height: auto;
                margin-top: var(--content-gap);
            }
        }

        @media (max-width: 768px) {
            .page-container {
                padding: 15px;
            }

            :root {
                --content-gap: 15px;
            }
        }
    `,
    js: `
        // Event Bus for component communication
        window.eventBus = {
            listeners: new Map(),
            emit(event, data) {
                const callbacks = this.listeners.get(event);
                if (callbacks) callbacks.forEach(cb => cb(data));
            },
            on(event, callback) {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, new Set());
                }
                this.listeners.get(event).add(callback);
            }
        };

        // Load and apply widget
        async function loadWidget(containerId, widgetType) {
            try {
                const query = \`{
                    transactions(
                        tags: [
                            { name: "Content-Type", values: ["application/json"] },
                            { name: "sciobject", values: ["\${widgetType}"] },
                            { name: "Version", values: ["0.1.2"] }
                        ],
                        first: 1,
                        order: DESC
                    ) {
                        edges { node { id } }
                    }
                }\`;

                const response = await fetch('https://uploader.irys.xyz/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });

                const result = await response.json();
                if (result.data?.transactions?.edges?.[0]?.node?.id) {
                    const widgetId = result.data.transactions.edges[0].node.id;
                    const widgetData = await fetch(\`https://gateway.irys.xyz/\${widgetId}\`).then(r => r.json());
                    
                    const container = document.getElementById(containerId);
                    if (!container) return;

                    if (widgetData.html) container.innerHTML = widgetData.html;
                    if (widgetData.css) {
                        const style = document.createElement('style');
                        style.textContent = widgetData.css;
                        document.head.appendChild(style);
                    }
                    if (widgetData.js) {
                        const script = document.createElement('script');
                        script.textContent = widgetData.js;
                        document.body.appendChild(script);
                    }
                }
            } catch (error) {
                console.error(\`Failed to load \${widgetType}:\`, error);
            }
        }

        // Initialize page
        async function initialize() {
            try {
                // 加载所有组件
                await Promise.all([
                    loadWidget('search-container', 'doi-search'),
                    loadWidget('viewer-container', 'pdf-viewer'),
                    loadWidget('comments-container', 'comments'),
                    loadWidget('market-container', 'nft-market')
                ]);

                // 检查URL中的DOI参数
                const urlParams = new URLSearchParams(window.location.search);
                const doi = urlParams.get('doi');
                
                if (doi) {
                    // 触发论文加载事件
                    window.eventBus.emit('load-paper', { doi });
                }
            } catch (error) {
                console.error('Page initialization failed:', error);
            }
        }

        // 监听浏览器前进/后退事件
        window.addEventListener('popstate', (event) => {
            const doi = event.state?.doi;
            if (doi) {
                window.eventBus.emit('load-paper', { doi });
            }
        });

        // Start initialization when DOM is ready
        document.readyState === 'loading' 
            ? document.addEventListener('DOMContentLoaded', initialize)
            : initialize();
    `
};

module.exports = { pageLayoutWidget };
