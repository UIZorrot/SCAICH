const commentsWidget = {
    html: `
        <div class="comments-section">
            <div class="comments-header">
                <h3>Paper Discussion</h3>
                <div class="comment-stats">
                    <span id="commentCount">0 comments</span>
                </div>
            </div>
            <div class="comments-container" id="commentsContainer">
                <div class="loading">Loading comments...</div>
            </div>
            <div id="loadMoreContainer" style="display: none; text-align: center; padding: 10px;">
                <button id="loadMoreBtn" class="load-more-btn">Load More Comments</button>
            </div>
            <div class="comment-input">
                <div class="guest-notice" id="guestNotice">
                    <button id="connectBtn">Connect Wallet</button>
                    <span>to join the discussion</span>
                </div>
                <div class="input-area" id="inputArea" style="display: none;">
                    <div class="status-message" id="statusMessage"></div>
                    <textarea id="commentInput" placeholder="Add to the discussion..." disabled></textarea>
                    <div class="button-group">
                        <button id="sendBtn" disabled>Comment</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    css: `
        .comments-section {
            margin-top: 30px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--bg-color);
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
        }

        .comments-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .comments-header h3 {
            margin: 0;
            font-size: 18px;
            color: var(--text-color);
        }

        .comment-stats {
            font-size: 14px;
            color: var(--text-color);
            opacity: 0.7;
        }

        .comments-container {
            max-height: 600px;
            overflow-y: auto;
            padding: 20px;
        }

        .comment {
            margin-bottom: 20px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.03);
            border-radius: 6px;
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: var(--text-color);
            opacity: 0.7;
        }

        .comment-content {
            font-size: 15px;
            line-height: 1.5;
            color: var(--text-color);
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .comment-input {
            padding: 20px;
            border-top: 1px solid var(--border-color);
            background: rgba(0, 0, 0, 0.02);
        }

        .guest-notice {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
            color: var(--text-color);
            opacity: 0.7;
            font-size: 14px;
        }

        .guest-notice button {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            background: #3182ce;
            color: white;
            cursor: pointer;
            font-size: 14px;
        }

        .input-area {
            display: none;
        }

        .input-area.active {
            display: block;
        }

        .comment-input textarea {
            width: 100%;
            height: 80px;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-color);
            color: var(--text-color);
            font-size: 15px;
            resize: none;
            margin-bottom: 10px;
            box-sizing: border-box;
        }

        .button-group {
            display: flex;
            gap: 10px;
        }

        .button-group button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #3182ce;
            color: white;
            cursor: pointer;
            font-size: 14px;
            flex: 1;
        }

        .button-group button:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
        }

        .loading {
            text-align: center;
            color: var(--text-color);
            opacity: 0.7;
            padding: 20px;
        }

        .status-message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
            font-size: 14px;
            text-align: center;
            background: #f0f9ff;
            color: #0369a1;
        }

        .load-more-btn {
            padding: 8px 16px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-color);
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .load-more-btn:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        .load-more-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        @media (max-width: 768px) {
            .comments-section {
                margin-top: 20px;
                border-radius: 0;
            }

            .comments-header {
                padding: 12px 15px;
            }

            .comments-container {
                padding: 15px;
            }

            .comment-input {
                padding: 15px;
            }
        }
    `,
    js: `
        // Constants
        const COMMENTS_PER_PAGE = 10;
        let currentCursor = null;
        let isLoadingComments = false;
        let isConnecting = false;

        // State management
        const state = {
            wallet: null,
            irys: null,
            comments: [],
            hasMore: false
        };

        // Load Irys bundle
        async function loadIrysBundle() {
            if (window.WebIrys) return;
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://uploader.irys.xyz/Cip4wmuMv1K3bmcL4vYoZuV2aQQnnzViqwHm6PCei3QX/bundle.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Irys bundle'));
                document.head.appendChild(script);
            });
        }

        // Get Irys uploader instance
        async function getIrysUploader() {
            if (!state.wallet) throw new Error("Wallet not connected");

            const originalSignMessage = window.solana.signMessage;
            window.solana.signMessage = async (msg) => {
                const signedMessage = await originalSignMessage.call(window.solana, msg);
                return signedMessage.signature || signedMessage;
            };

            return await window.WebIrys.WebUploader(window.WebIrys.WebSolana)
                .withProvider(window.solana);
        }

        // Initialize comments functionality
        async function initializeComments() {
            try {
                await loadIrysBundle();
                
                const connectBtn = document.getElementById('connectBtn');
                const sendBtn = document.getElementById('sendBtn');
                const commentInput = document.getElementById('commentInput');
                const guestNotice = document.getElementById('guestNotice');
                const inputArea = document.getElementById('inputArea');
                const statusMessage = document.getElementById('statusMessage');
                const loadMoreBtn = document.getElementById('loadMoreBtn');

                // Load initial comments
                await loadComments();

                // Connect wallet and initialize Irys
                connectBtn.addEventListener('click', async () => {
                    if (isConnecting) return;
                    
                    try {
                        isConnecting = true;
                        connectBtn.disabled = true;
                        connectBtn.textContent = 'Connecting...';
                        statusMessage.textContent = 'Connecting to wallet...';
                        statusMessage.style.display = 'block';

                        if (!window.solana) {
                            throw new Error('Please install Solana wallet (Phantom or OKX)');
                        }

                        // Connect wallet
                        await window.solana.connect();
                        state.wallet = window.solana;
                        const addr = state.wallet.publicKey.toString();
                        
                        // Initialize Irys
                        statusMessage.textContent = 'Initializing Irys...';
                        state.irys = await getIrysUploader();
                        
                        // Update UI
                        guestNotice.style.display = 'none';
                        inputArea.style.display = 'block';
                        statusMessage.textContent = 'Connected successfully!';
                        
                        commentInput.disabled = false;
                        sendBtn.disabled = false;
                    } catch (error) {
                        console.error('Connection failed:', error);
                        statusMessage.textContent = error.message;
                        connectBtn.disabled = false;
                        connectBtn.textContent = 'Connect Wallet';
                    } finally {
                        isConnecting = false;
                        setTimeout(() => {
                            statusMessage.style.display = 'none';
                        }, 3000);
                    }
                });

                // Send comment
                sendBtn.addEventListener('click', async () => {
                    const comment = commentInput.value.trim();
                    if (!comment) return;

                    try {
                        sendBtn.disabled = true;
                        sendBtn.textContent = 'Sending...';
                        statusMessage.textContent = 'Sending comment...';
                        statusMessage.style.display = 'block';
                        
                        const doi = new URLSearchParams(window.location.search).get('doi');
                        await uploadComment(comment, doi);
                        
                        commentInput.value = '';
                        sendBtn.textContent = 'Comment';
                        statusMessage.textContent = 'Comment sent successfully!';
                        
                        await loadComments(true);
                    } catch (error) {
                        console.error('Failed to send comment:', error);
                        statusMessage.textContent = 'Failed to send comment. Please try again.';
                        sendBtn.textContent = 'Comment';
                    } finally {
                        sendBtn.disabled = false;
                        setTimeout(() => {
                            statusMessage.style.display = 'none';
                        }, 3000);
                    }
                });

                // Load more comments
                loadMoreBtn.addEventListener('click', async () => {
                    if (isLoadingComments || !state.hasMore) return;
                    await loadComments(false);
                });

                // Handle Enter key
                commentInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendBtn.click();
                    }
                });

            } catch (error) {
                console.error('Failed to initialize comments:', error);
                const container = document.getElementById('commentsContainer');
                container.innerHTML = '<div class="loading">Error initializing comments. Please refresh the page.</div>';
            }
        }

        // Upload comment
        async function uploadComment(comment, doi) {
            if (!state.irys) throw new Error("Irys not initialized");

            const tags = [
                { name: "App-Name", value: "SciBoxComments" },
                { name: "Content-Type", value: "text/comment" },
                { name: "Paper-DOI", value: doi },
                { name: "Unix-Time", value: Date.now().toString() },
                { name: "User-Address", value: state.wallet.publicKey.toString() }
            ];

            return await state.irys.upload(comment, { tags });
        }

        // Load comments
        async function loadComments(clear = true) {
            if (isLoadingComments) return;
            
            const container = document.getElementById('commentsContainer');
            const countElement = document.getElementById('commentCount');
            const loadMoreContainer = document.getElementById('loadMoreContainer');
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            const doi = new URLSearchParams(window.location.search).get('doi');
            
            try {
                isLoadingComments = true;
                if (clear) {
                    container.innerHTML = '<div class="loading">Loading comments...</div>';
                    currentCursor = null;
                } else {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.textContent = 'Loading...';
                }
                
                const query = \`{
                    transactions(
                        tags: [
                            { name: "App-Name", values: ["SciBoxComments"] },
                            { name: "Content-Type", values: ["text/comment"] },
                            { name: "Paper-DOI", values: ["\${doi}"] }
                        ],
                        first: \${COMMENTS_PER_PAGE},
                        \${currentCursor ? \`after: "\${currentCursor}",\` : ''}
                        order: DESC
                    ) {
                        edges {
                            node {
                                id
                                tags {
                                    name
                                    value
                                }
                            }
                            cursor
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }\`;

                const response = await fetch('https://uploader.irys.xyz/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });

                const result = await response.json();
                const edges = result.data.transactions.edges;
                state.hasMore = result.data.transactions.pageInfo.hasNextPage;

                // Update comment count
                const totalCount = clear ? edges.length : state.comments.length + edges.length;
                countElement.textContent = \`\${totalCount} comment\${totalCount === 1 ? '' : 's'}\`;

                if (!edges.length && clear) {
                    container.innerHTML = '<div class="loading">No comments yet. Be the first to comment!</div>';
                    loadMoreContainer.style.display = 'none';
                    return;
                }

                if (clear) {
                    container.innerHTML = '';
                    state.comments = [];
                }
                
                for (const edge of edges) {
                    try {
                        const id = edge.node.id;
                        const response = await fetch(\`https://gateway.irys.xyz/\${id}\`);
                        if (!response.ok) {
                            console.error(\`Failed to fetch comment content for ID \${id}\`);
                            continue;
                        }
                        
                        const content = await response.text();
                        const tags = edge.node.tags;
                        const sender = tags.find(t => t.name === "User-Address")?.value || "Unknown";
                        const timestamp = parseInt(tags.find(t => t.name === "Unix-Time")?.value) || Date.now();
                        
                        const commentElement = document.createElement('div');
                        commentElement.className = 'comment';
                        commentElement.innerHTML = \`
                            <div class="comment-header">
                                <span>\${sender.slice(0,4)}...\${sender.slice(-4)}</span>
                                <span>\${new Date(timestamp).toLocaleString()}</span>
                            </div>
                            <div class="comment-content">\${sanitizeText(content)}</div>
                        \`;
                        
                        container.appendChild(commentElement);
                        state.comments.push(edge);
                    } catch (error) {
                        console.error('Error displaying comment:', error);
                        continue;
                    }
                }

                // Update cursor and show/hide load more button
                if (edges.length > 0) {
                    currentCursor = edges[edges.length - 1].cursor;
                }
                
                loadMoreContainer.style.display = state.hasMore ? 'block' : 'none';
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Load More Comments';

            } catch (error) {
                console.error('Failed to load comments:', error);
                if (clear) {
                    container.innerHTML = '<div class="loading">Error loading comments. Please try again.</div>';
                }
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Load More Comments';
            } finally {
                isLoadingComments = false;
            }
        }

        // Sanitize text
        function sanitizeText(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
                .replace(/\\n/g, "<br>");
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeComments);
        } else {
            initializeComments();
        }
    `
};

module.exports = { commentsWidget }; 