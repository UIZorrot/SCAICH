/**
 * Search Service Integration Layer
 * Provides literature search functionality for AI writing assistance
 */

class SearchService {
  constructor() {
    this.baseURL = 'https://api.scai.sh';
    this.irysGraphQLURL = '/api/irys/graphql';
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Search for academic papers using the SCAI API
   */
  async searchPapers(params) {
    const { query, limit = 10, openAccessOnly = false } = params;
    
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty');
    }

    try {
      const response = await fetch(
        `${this.baseURL}/search?query=${encodeURIComponent(query)}&limit=${limit}&oa=${openAccessOnly}`,
        {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Access-Control-Allow-Origin': true,
            'ngrok-skip-browser-warning': true,
            'Content-Type': 'Authorization',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        results: data.results || [],
        summary: data.summary || '',
        total: data.results?.length || 0,
      };
    } catch (error) {
      console.error('Search Service Error:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        summary: '',
        total: 0,
      };
    }
  }

  /**
   * Execute GraphQL query for Irys data
   */
  async executeGraphQLQuery(query) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.irysGraphQLURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 504 || response.status === 502) {
          console.warn('Irys service is currently unavailable');
          return { data: { transactions: { edges: [] } } };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('GraphQL query error:', error);
      if (error.name === 'AbortError') {
        console.warn('Irys query timeout - service may be unavailable');
      }
      return { data: { transactions: { edges: [] } } };
    }
  }

  /**
   * Query PDF versions by DOI
   */
  async queryPdfVersions(doi) {
    if (!doi) return [];

    const query = `
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["scivault"] },
            { name: "Content-Type", values: ["application/pdf"] },
            { name: "Version", values: ["1.0.3"] },
            { name: "doi", values: ["${doi}"] }
          ]
        ) {
          edges {
            node {
              id
              tags { name value }
            }
          }
        }
      }
    `;

    try {
      const result = await this.executeGraphQLQuery(query);
      const versions = [];

      if (result.data?.transactions?.edges?.length > 0) {
        versions.push({
          version: '1.0.3',
          ids: result.data.transactions.edges.map((edge) => edge.node.id),
        });
      }

      return versions;
    } catch (error) {
      console.error('Error querying PDF versions:', error);
      return [];
    }
  }

  /**
   * Search for papers by topic and return formatted results for AI processing
   */
  async searchForAI(params) {
    const { topic, keywords = [], limit = 5, includeAbstracts = true } = params;
    
    // Construct search query from topic and keywords
    const searchTerms = [topic, ...keywords].filter(Boolean);
    const query = searchTerms.join(' ');

    const searchResult = await this.searchPapers({
      query,
      limit,
      openAccessOnly: false,
    });

    if (!searchResult.success) {
      return searchResult;
    }

    // Format results for AI consumption
    const formattedResults = searchResult.results.map((paper, index) => ({
      id: index + 1,
      title: paper.title || 'Untitled',
      authors: Array.isArray(paper.author) ? paper.author.join(', ') : (paper.author || 'Unknown authors'),
      year: paper.year || 'Unknown year',
      abstract: includeAbstracts ? (paper.abstract || 'No abstract available') : '',
      doi: paper.doi || '',
      url: paper.url || '',
      source: paper.source || 'unknown',
      isOpenAccess: paper.is_oa || false,
      similarity: paper.similarity || '0',
      referenceCount: paper.referencecount || 0,
    }));

    return {
      ...searchResult,
      results: formattedResults,
      searchQuery: query,
      formattedForAI: true,
    };
  }

  /**
   * Get paper details by DOI
   */
  async getPaperByDOI(doi) {
    if (!doi) {
      throw new Error('DOI is required');
    }

    // First try to search by DOI
    const searchResult = await this.searchPapers({
      query: doi,
      limit: 1,
    });

    if (searchResult.success && searchResult.results.length > 0) {
      const paper = searchResult.results[0];
      
      // Try to get PDF versions from Irys
      const pdfVersions = await this.queryPdfVersions(doi);
      
      return {
        success: true,
        paper: {
          ...paper,
          pdfVersions,
        },
      };
    }

    return {
      success: false,
      error: 'Paper not found',
      paper: null,
    };
  }

  /**
   * Format search results as citations for AI
   */
  formatAsCitations(searchResults, citationStyle = 'APA') {
    if (!searchResults.results || searchResults.results.length === 0) {
      return [];
    }

    return searchResults.results.map((paper) => {
      const authors = paper.authors || 'Unknown authors';
      const year = paper.year || 'n.d.';
      const title = paper.title || 'Untitled';
      const doi = paper.doi ? `https://doi.org/${paper.doi}` : '';

      // Basic APA format (can be extended for other styles)
      if (citationStyle === 'APA') {
        return {
          citation: `${authors} (${year}). ${title}. ${doi}`,
          title: title,
          authors: authors,
          year: year,
          doi: paper.doi,
          abstract: paper.abstract,
        };
      }

      // Default format
      return {
        citation: `${authors}. ${title}. ${year}. ${doi}`,
        title: title,
        authors: authors,
        year: year,
        doi: paper.doi,
        abstract: paper.abstract,
      };
    });
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      // Test search with a simple query
      const testResult = await this.searchPapers({
        query: 'machine learning',
        limit: 1,
      });

      return {
        available: testResult.success,
        baseURL: this.baseURL,
        lastChecked: new Date().toISOString(),
        error: testResult.success ? null : testResult.error,
      };
    } catch (error) {
      return {
        available: false,
        baseURL: this.baseURL,
        lastChecked: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;
