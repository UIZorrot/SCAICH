const doiSearchWidget = {
    html: `
        <div class="search-container" style="display: none;">
            <input type="text" id="doiInput" placeholder="Enter DOI to view paper...">
            <button onclick="window.searchPaper()">View</button>
        </div>
    `,
    css: `
        .search-container {
            display: flex;
            gap: 10px;
            padding: 20px;
            margin: 0 auto 20px;
            max-width: 600px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
        }

        .search-container input {
            flex: 1;
            padding: 8px 12px;
            font-size: 16px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-color);
            color: var(--text-color);
        }

        .search-container button {
            padding: 8px 20px;
            font-size: 16px;
            border: none;
            border-radius: 4px;
            background: #3182ce;
            color: white;
            cursor: pointer;
        }

        .search-container button:hover {
            background: #2c5282;
        }

        @media (max-width: 768px) {
            .search-container {
                flex-direction: column;
                padding: 15px;
            }
        }
    `,
    js: `
        // Check URL for DOI parameter and show/hide search accordingly
        function checkAndToggleSearch() {
            const searchContainer = document.querySelector('.search-container');
            const doi = new URLSearchParams(window.location.search).get('doi');
            
            if (doi) {
                searchContainer.style.display = 'none';
                window.eventBus.emit('load-paper', { doi });
            } else {
                searchContainer.style.display = 'flex';
            }
        }

        window.searchPaper = function() {
            const doi = document.getElementById('doiInput').value.trim();
            if (!doi) return;

            window.eventBus.emit('load-paper', { doi });
            const url = new URL(window.location);
            url.searchParams.set('doi', doi);
            window.history.pushState({}, '', url);
            checkAndToggleSearch();
        }

        window.eventBus.on('load-paper', data => {
            document.getElementById('doiInput').value = data.doi;
        });

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndToggleSearch);
        } else {
            checkAndToggleSearch();
        }

        // Handle browser back/forward buttons
        window.addEventListener('popstate', checkAndToggleSearch);
    `
};

module.exports = { doiSearchWidget }; 