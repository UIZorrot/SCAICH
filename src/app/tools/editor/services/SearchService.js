/**
 * Search Service Integration Layer
 * Provides literature search functionality for AI writing assistance
 */

class SearchService {
  constructor() {
    this.baseURL = "https://api.scai.sh";
    this.irysGraphQLURL = "/api/irys/graphql";
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Search for academic papers using the SCAI API
   */
  async searchPapers(params) {
    const { query, limit = 10 } = params;

    if (!query || query.trim() === "") {
      throw new Error("Search query cannot be empty");
    }

    try {
      const response = await fetch(`${this.baseURL}/search?query=${encodeURIComponent(query)}&limit=${limit}&oa=false&ai=false`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Access-Control-Allow-Origin": true,
          "ngrok-skip-browser-warning": true,
          "Content-Type": "Authorization",
        },
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        results: data.results || [],
        total: data.results?.length || 0,
      };
    } catch (error) {
      console.error("Search Service Error:", error);
      return {
        success: false,
        error: error.message,
        results: [],
        total: 0,
      };
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;
