const pdfViewerWidget = {
    html: `
        <div class="viewer-container">
            <div class="pdf-controls">
                <select id="pdfVersionSelect" class="version-select">
                    <option value="">Select PDF Version</option>
                </select>
                <button id="downloadPdf" class="download-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                </button>
            </div>
            <div id="pdfViewer" class="pdf-viewer"></div>
            <div id="loadingIndicator">
                <div class="spinner"></div>
                <span>Loading PDF...</span>
            </div>
        </div>
    `,
    css: `
        .viewer-container {
            position: relative;
            width: 100%;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: visible;
        }

        .pdf-controls {
            display: flex;
            gap: 10px;
            padding: 10px;
            border-bottom: 1px solid var(--border-color);
        }

        .version-select {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-color);
            color: var(--text-color);
        }

        .download-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: var(--accent-color);
            color: white;
            cursor: pointer;
        }

        .download-button:hover {
            background: var(--accent-hover-color);
        }

        #pdfViewer {
            width: 100%;
            background: var(--bg-color);
        }

        /* PDF viewer styles */
        #pdfViewer embed,
        #pdfViewer object,
        #pdfViewer iframe {
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
            display: block;
            border: none !important;
        }

        #loadingIndicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: var(--text-color);
            display: none;
        }

        #loadingIndicator.active {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color);
            border-top-color: var(--accent-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `,
    js: `
        let currentPdfVersions = [];
        let currentDoi = '';

        // 查询PDF版本信息
        async function queryPdfVersions(doi) {
            try {
                const query1_0_3 = \`
                    query {
                        transactions(
                            tags: [
                                { name: "App-Name", values: ["scivault"] },
                                { name: "Content-Type", values: ["application/pdf"] },
                                { name: "Version", values: ["1.0.3"] },
                                { name: "doi", values: ["\${doi}"] }
                            ],
                            order: DESC
                        ) {
                            edges {
                                node {
                                    id
                                    timestamp
                                    tags {
                                        name
                                        value
                                    }
                                }
                            }
                        }
                    }
                \`;

                const query2_0_0 = \`
                    query {
                        transactions(
                            tags: [
                                { name: "App-Name", values: ["scivault"] },
                                { name: "Content-Type", values: ["application/pdf"] },
                                { name: "Version", values: ["2.0.0"] },
                                { name: "doi", values: ["\${doi}"] }
                            ],
                            order: DESC
                        ) {
                            edges {
                                node {
                                    id
                                    timestamp
                                    tags {
                                        name
                                        value
                                    }
                                }
                            }
                        }
                    }
                \`;

                const [result1_0_3, result2_0_0] = await Promise.all([
                    fetch('https://uploader.irys.xyz/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: query1_0_3 })
                    }).then(res => res.json()),
                    fetch('https://uploader.irys.xyz/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: query2_0_0 })
                    }).then(res => res.json())
                ]);

                const versions = [];

                // 处理 1.0.3 版本的切片 PDF
                const edges1_0_3 = result1_0_3.data?.transactions?.edges || [];
                if (edges1_0_3.length > 0) {
                    // 按时间戳对切片进行分组
                    const chunkGroups = new Map();
                    
                    edges1_0_3.forEach(edge => {
                        const uploadId = edge.node.tags.find(tag => tag.name === 'Upload-Id')?.value || edge.node.timestamp;
                        
                        if (!chunkGroups.has(uploadId)) {
                            chunkGroups.set(uploadId, {
                                timestamp: edge.node.timestamp,
                                chunks: []
                            });
                        }
                        
                        const chunk = {
                            id: edge.node.id,
                            index: parseInt(edge.node.tags.find(tag => tag.name === 'Chunk-Index')?.value || '0'),
                            total: parseInt(edge.node.tags.find(tag => tag.name === 'Total-Chunks')?.value || '1')
                        };
                        
                        chunkGroups.get(uploadId).chunks.push(chunk);
                    });

                    // 找到最新的完整切片组
                    let latestCompleteGroup = null;
                    for (const [uploadId, group] of chunkGroups) {
                        const chunks = group.chunks;
                        const totalChunks = chunks[0]?.total || 1;
                        
                        // 检查切片是否完整
                        if (chunks.length === totalChunks) {
                            const sortedChunks = chunks.sort((a, b) => a.index - b.index);
                            const isSequential = sortedChunks.every((chunk, idx) => chunk.index === idx);
                            
                            if (isSequential) {
                                if (!latestCompleteGroup || group.timestamp > latestCompleteGroup.timestamp) {
                                    latestCompleteGroup = {
                                        ...group,
                                        chunks: sortedChunks
                                    };
                                }
                            }
                        }
                    }

                    if (latestCompleteGroup) {
                        versions.push({
                            version: '1.0.3',
                            isChunked: true,
                            ids: latestCompleteGroup.chunks.map(chunk => chunk.id),
                            uploadTimestamp: latestCompleteGroup.timestamp
                        });
                    } else {
                        // 如果没有找到完整的切片组，尝试使用所有切片（兼容旧数据）
                        const allChunks = edges1_0_3
                            .map(edge => ({
                                id: edge.node.id,
                                index: parseInt(edge.node.tags.find(tag => tag.name === 'Chunk-Index')?.value || '0'),
                                timestamp: edge.node.timestamp
                            }))
                            .sort((a, b) => a.index - b.index);

                        if (allChunks.length > 0) {
                            versions.push({
                                version: '1.0.3',
                                isChunked: true,
                                ids: allChunks.map(chunk => chunk.id),
                                uploadTimestamp: allChunks[0].timestamp
                            });
                        }
                    }
                }

                // 处理 2.0.0 版本的完整 PDF
                const edges2_0_0 = result2_0_0.data?.transactions?.edges || [];
                if (edges2_0_0.length > 0) {
                    versions.push({
                        version: '2.0.0',
                        isChunked: false,
                        ids: [edges2_0_0[0].node.id],
                        uploadTimestamp: edges2_0_0[0].node.timestamp
                    });
                }

                // 按时间戳排序，最新的在前
                return versions.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp);
            } catch (error) {
                console.error('Error querying PDF versions:', error);
                return [];
            }
        }

        // 加载PDF
        async function loadPDF(version) {
            const loadingIndicator = document.getElementById('loadingIndicator');
            const viewerContainer = document.getElementById('pdfViewer');
            loadingIndicator.classList.add('active');

            try {
                if (version.isChunked) {
                    // 处理分块PDF
                    const pdfChunks = await Promise.all(
                        version.ids.map(id => 
                            fetch(\`https://gateway.irys.xyz/\${id}\`)
                                .then(res => res.arrayBuffer())
                        )
                    );

                    // 合并所有chunks
                    const totalSize = pdfChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
                    const mergedPdf = new Uint8Array(totalSize);
                    let offset = 0;
                    for (const chunk of pdfChunks) {
                        mergedPdf.set(new Uint8Array(chunk), offset);
                        offset += chunk.byteLength;
                    }

                    const pdfUrl = URL.createObjectURL(
                        new Blob([mergedPdf], { type: 'application/pdf' })
                    );
                    displayPDF(pdfUrl);
                } else {
                    // 处理完整PDF
                    const pdfUrl = \`https://gateway.irys.xyz/\${version.ids[0]}\`;
                    displayPDF(pdfUrl);
                }
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Failed to load PDF');
            } finally {
                loadingIndicator.classList.remove('active');
            }
        }

        // 显示PDF
        function displayPDF(url) {
            const viewerContainer = document.getElementById('pdfViewer');
            viewerContainer.innerHTML = \`
                <iframe 
                    src="\${url}#view=FitH&scrollbar=1&toolbar=0&statusbar=0&messages=0&navpanes=0&page=1&view=FitH&pagemode=thumbs&zoom=page-width"
                    style="width: 100%; border: none;"
                    allowfullscreen
                ></iframe>
            \`;
        }

        // 更新版本选择器
        function updateVersionSelector(versions) {
            const select = document.getElementById('pdfVersionSelect');
            select.innerHTML = '<option value="">Select PDF Version</option>';
            
            versions.forEach((version, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = \`Version \${version.version} (\${new Date(version.uploadTimestamp).toLocaleString()})\`;
                select.appendChild(option);
            });

            // 默认选择最新版本
            if (versions.length > 0) {
                select.value = '0';
                loadPDF(versions[0]);
            }
        }

        // 初始化
        function initialize() {
            const select = document.getElementById('pdfVersionSelect');
            const downloadBtn = document.getElementById('downloadPdf');

            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.value);
                if (!isNaN(index) && currentPdfVersions[index]) {
                    loadPDF(currentPdfVersions[index]);
                }
            });

            downloadBtn.addEventListener('click', () => {
                const selectedIndex = parseInt(select.value);
                if (!isNaN(selectedIndex) && currentPdfVersions[selectedIndex]) {
                    const version = currentPdfVersions[selectedIndex];
                    if (version.isChunked) {
                        // 对于分块PDF，需要下载所有chunks并合并
                        loadPDF(version);
                    } else {
                        // 对于完整PDF，直接下载
                        window.open(\`https://gateway.irys.xyz/\${version.ids[0]}\`, '_blank');
                    }
                }
            });
        }

        // 监听论文加载事件
        window.eventBus.on('load-paper', async (data) => {
            if (data.doi && data.doi !== currentDoi) {
                currentDoi = data.doi;
                currentPdfVersions = await queryPdfVersions(data.doi);
                updateVersionSelector(currentPdfVersions);
            }
        });

        // 初始化组件
        initialize();
    `
};

module.exports = { pdfViewerWidget }; 