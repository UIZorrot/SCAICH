const nftMarketWidget = {
    html: `
        <div class="nft-market" style="display: none;">
            <div class="market-header">
                <h3>Paper NFT</h3>
                <div class="auth-controls">
                    <button id="marketConnectBtn">Connect Wallet</button>
                </div>
            </div>
            <div class="nft-info">
                <div class="nft-preview">
                    <div class="preview-placeholder">
                        <span>Paper Preview</span>
                    </div>
                </div>
                <div class="nft-details">
                    <div class="detail-item">
                        <span class="label">Status</span>
                        <span class="value" id="nftStatus">Not Minted</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Owner</span>
                        <span class="value" id="nftOwner">-</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Price</span>
                        <span class="value" id="nftPrice">-</span>
                    </div>
                </div>
                <div class="nft-actions">
                    <button id="mintBtn" disabled>Mint NFT</button>
                    <button id="buyBtn" disabled>Buy Now</button>
                    <button id="sellBtn" disabled>Sell NFT</button>
                </div>
            </div>
            <div class="market-history">
                <h4>Transaction History</h4>
                <div id="transactionList" class="transaction-list">
                    <div class="loading">Connect wallet to view history...</div>
                </div>
            </div>
        </div>
    `,
    css: `
        .nft-market {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
        }

        .market-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .market-header h3 {
            margin: 0;
            font-size: 18px;
            color: var(--text-color);
        }

        .auth-controls button {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            background: #3182ce;
            color: white;
            cursor: pointer;
            font-size: 14px;
        }

        .nft-info {
            padding: 20px;
        }

        .nft-preview {
            margin-bottom: 20px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
        }

        .preview-placeholder {
            aspect-ratio: 3/4;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.03);
            color: var(--text-color);
            font-size: 14px;
        }

        .nft-details {
            margin-bottom: 20px;
        }

        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid var(--border-color);
            font-size: 14px;
        }

        .detail-item:last-child {
            border-bottom: none;
        }

        .detail-item .label {
            color: var(--text-color);
            opacity: 0.7;
        }

        .detail-item .value {
            font-weight: 500;
        }

        .nft-actions {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(2, 1fr);
        }

        .nft-actions button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #3182ce;
            color: white;
            cursor: pointer;
            font-size: 14px;
        }

        .nft-actions button:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
        }

        #mintBtn {
            grid-column: 1 / -1;
        }

        .market-history {
            padding: 20px;
            border-top: 1px solid var(--border-color);
        }

        .market-history h4 {
            margin: 0 0 15px;
            font-size: 16px;
            color: var(--text-color);
        }

        .transaction-list {
            font-size: 14px;
        }

        .transaction-item {
            padding: 10px;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.03);
            margin-bottom: 8px;
        }

        .transaction-item:last-child {
            margin-bottom: 0;
        }

        .transaction-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 12px;
            opacity: 0.7;
        }

        .transaction-content {
            color: var(--text-color);
        }

        @media (max-width: 900px) {
            .nft-actions {
                grid-template-columns: repeat(3, 1fr);
            }

            #mintBtn {
                grid-column: auto;
            }
        }
    `,
    js: `
        let paperNFT = {
            isMinted: false,
            owner: null,
            price: null,
            transactions: []
        };

        // Initialize market
        async function initializeMarket() {
            // Temporarily disable initialization
            return;
            
            const connectBtn = document.getElementById('marketConnectBtn');
            const mintBtn = document.getElementById('mintBtn');
            const buyBtn = document.getElementById('buyBtn');
            const sellBtn = document.getElementById('sellBtn');

            // Connect wallet
            connectBtn.addEventListener('click', async () => {
                try {
                    if (!window.solana) {
                        alert('Please install Solana wallet');
                        return;
                    }

                    await window.solana.connect();
                    window.wallet = window.solana;
                    const addr = window.wallet.publicKey.toString();
                    connectBtn.textContent = \`\${addr.slice(0,4)}...\${addr.slice(-4)}\`;
                    
                    await checkNFTStatus();
                } catch (error) {
                    console.error('Wallet connection failed:', error);
                    alert('Failed to connect wallet');
                }
            });

            // Mint NFT
            mintBtn.addEventListener('click', async () => {
                try {
                    if (!window.wallet) {
                        alert('Please connect wallet first');
                        return;
                    }

                    mintBtn.disabled = true;
                    mintBtn.textContent = 'Minting...';

                    // TODO: Implement actual minting logic
                    await simulateMinting();

                    await checkNFTStatus();
                } catch (error) {
                    console.error('Minting failed:', error);
                    alert('Failed to mint NFT');
                } finally {
                    mintBtn.textContent = 'Mint NFT';
                }
            });

            // Buy NFT
            buyBtn.addEventListener('click', async () => {
                try {
                    if (!window.wallet) {
                        alert('Please connect wallet first');
                        return;
                    }

                    buyBtn.disabled = true;
                    buyBtn.textContent = 'Processing...';

                    // TODO: Implement actual buying logic
                    await simulateTransaction('buy');

                    await checkNFTStatus();
                } catch (error) {
                    console.error('Purchase failed:', error);
                    alert('Failed to purchase NFT');
                } finally {
                    buyBtn.textContent = 'Buy Now';
                }
            });

            // Sell NFT
            sellBtn.addEventListener('click', async () => {
                try {
                    if (!window.wallet) {
                        alert('Please connect wallet first');
                        return;
                    }

                    const price = prompt('Enter selling price in SOL:');
                    if (!price) return;

                    sellBtn.disabled = true;
                    sellBtn.textContent = 'Processing...';

                    // TODO: Implement actual selling logic
                    await simulateTransaction('sell', price);

                    await checkNFTStatus();
                } catch (error) {
                    console.error('Listing failed:', error);
                    alert('Failed to list NFT');
                } finally {
                    sellBtn.textContent = 'Sell NFT';
                }
            });

            // Listen for paper loading
            window.eventBus.on('load-paper', async () => {
                await checkNFTStatus();
            });
        }

        // Check NFT status
        async function checkNFTStatus() {
            const statusElement = document.getElementById('nftStatus');
            const ownerElement = document.getElementById('nftOwner');
            const priceElement = document.getElementById('nftPrice');
            const mintBtn = document.getElementById('mintBtn');
            const buyBtn = document.getElementById('buyBtn');
            const sellBtn = document.getElementById('sellBtn');

            try {
                // TODO: Implement actual status checking
                // For now, using mock data
                if (!paperNFT.isMinted) {
                    statusElement.textContent = 'Not Minted';
                    ownerElement.textContent = '-';
                    priceElement.textContent = '-';
                    
                    mintBtn.disabled = !window.wallet;
                    buyBtn.disabled = true;
                    sellBtn.disabled = true;
                } else {
                    statusElement.textContent = paperNFT.price ? 'For Sale' : 'Minted';
                    ownerElement.textContent = \`\${paperNFT.owner.slice(0,4)}...\${paperNFT.owner.slice(-4)}\`;
                    priceElement.textContent = paperNFT.price ? \`\${paperNFT.price} SOL\` : 'Not for sale';

                    const isOwner = window.wallet && paperNFT.owner === window.wallet.publicKey.toString();
                    
                    mintBtn.disabled = true;
                    buyBtn.disabled = !paperNFT.price || isOwner;
                    sellBtn.disabled = !isOwner || paperNFT.price;
                }

                updateTransactionHistory();
            } catch (error) {
                console.error('Failed to check NFT status:', error);
            }
        }

        // Update transaction history
        function updateTransactionHistory() {
            const listElement = document.getElementById('transactionList');
            
            if (!paperNFT.transactions.length) {
                listElement.innerHTML = '<div class="loading">No transactions yet</div>';
                return;
            }

            listElement.innerHTML = paperNFT.transactions
                .map(tx => \`
                    <div class="transaction-item">
                        <div class="transaction-header">
                            <span>\${tx.from.slice(0,4)}...\${tx.from.slice(-4)} → \${tx.to.slice(0,4)}...\${tx.to.slice(-4)}</span>
                            <span>\${new Date(tx.time).toLocaleString()}</span>
                        </div>
                        <div class="transaction-content">
                            \${tx.type === 'mint' ? 'Minted NFT' : 
                              tx.type === 'buy' ? \`Purchased for \${tx.price} SOL\` :
                              tx.type === 'sell' ? \`Listed for \${tx.price} SOL\` : ''}
                        </div>
                    </div>
                \`).join('');
        }

        // Simulate minting (temporary)
        async function simulateMinting() {
            await new Promise(resolve => setTimeout(resolve, 1000));
            paperNFT.isMinted = true;
            paperNFT.owner = window.wallet.publicKey.toString();
            paperNFT.transactions.push({
                type: 'mint',
                from: 'SYSTEM',
                to: window.wallet.publicKey.toString(),
                time: Date.now()
            });
        }

        // Simulate transaction (temporary)
        async function simulateTransaction(type, price) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (type === 'sell') {
                paperNFT.price = price;
                paperNFT.transactions.push({
                    type: 'sell',
                    from: window.wallet.publicKey.toString(),
                    to: 'MARKET',
                    price,
                    time: Date.now()
                });
            } else if (type === 'buy') {
                const oldOwner = paperNFT.owner;
                paperNFT.owner = window.wallet.publicKey.toString();
                paperNFT.price = null;
                paperNFT.transactions.push({
                    type: 'buy',
                    from: oldOwner,
                    to: window.wallet.publicKey.toString(),
                    price: paperNFT.price,
                    time: Date.now()
                });
            }
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeMarket);
        } else {
            initializeMarket();
        }
    `
};

module.exports = { nftMarketWidget }; 