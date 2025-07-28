/**
 * AI Service Integration Layer
 * Provides AI-powered writing assistance for academic writing
 */

import searchService from "./SearchService";

class AIService {
  constructor() {
    // Support for custom API configuration
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || "sk-1UUUQmO8a5SZiAdX8uQgo4rg0AZspMyCxizjhtbaPVOcBm9g";
    this.baseURL = process.env.REACT_APP_OPENAI_BASE_URL || "https://x666.me/v1";
    this.model = process.env.REACT_APP_OPENAI_MODEL || "gemini-2.5-pro";
    this.maxTokens = 150000;
    this.temperature = 0.7;
  }

  /**
   * Generic API call method
   */
  async makeAPICall(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI Service API Error:", error);
      throw error;
    }
  }

  /**
   * Generate academic paper outline based on topic and requirements
   */
  async generateOutline(params) {
    const { topic, keywords, researchFocus, paperType = "research", targetLength = "medium" } = params;

    const prompt = `Generate a detailed academic paper outline for the following:

Topic: ${topic}
Keywords: ${keywords?.join(", ") || "N/A"}
Research Focus: ${researchFocus || "General research"}
Paper Type: ${paperType}
Target Length: ${targetLength}

Please provide a structured outline with:
1. Title suggestions (3 options)
2. Abstract structure
3. Main sections with subsections
4. Key points for each section
5. Suggested methodology (if applicable)
6. References structure

Format the response as JSON with clear hierarchy.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic writing assistant. Generate comprehensive, well-structured outlines for academic papers.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Generate enhanced academic paper outline with literature search
   */
  async generateEnhancedOutline(params) {
    const { topic, keywords, researchFocus, paperType = "research", targetLength = "medium", includeLiterature = false } = params;

    let literatureContext = "";
    let citations = [];

    if (includeLiterature) {
      try {
        // Search for relevant literature
        const searchResult = await searchService.searchForAI({
          topic,
          keywords,
          limit: 8,
          includeAbstracts: true,
        });

        if (searchResult.success && searchResult.results.length > 0) {
          // Format literature for AI context
          literatureContext = `

RELEVANT LITERATURE FOUND:
${searchResult.results
  .map(
    (paper, index) => `
${index + 1}. ${paper.title}
   Authors: ${paper.authors}
   Year: ${paper.year}
   Abstract: ${paper.abstract.substring(0, 200)}...
   DOI: ${paper.doi}
`
  )
  .join("")}

Please incorporate insights from this literature into the outline and suggest how these papers could be referenced in different sections.`;

          citations = searchService.formatAsCitations(searchResult, "APA");
        }
      } catch (error) {
        console.warn("Literature search failed, generating outline without literature context:", error);
      }
    }

    const prompt = `# Role
You are a senior academic research consultant and TipTap JSON specialist, responsible for generating academic paper outlines in precise TipTap editor format.

# Task
Generate a detailed academic paper outline (structure only, not full content) for: "${topic}"

Research Parameters:
- Keywords: ${keywords?.join(", ") || "N/A"}
- Research Focus: ${researchFocus || "General research"}
- Paper Type: ${paperType}
- Target Length: ${targetLength}${literatureContext}

# TipTap JSON Schema Requirements
Strictly follow these rules for a single, syntactically correct JSON object:

1. Root node: {"type": "doc", "content": [...]}
2. Section headers: {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "引言"}]}
3. Subsection headers: {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "研究背景"}]}
4. Key points: Use "bulletList" with nested "listItem" and "paragraph" nodes for outline points
5. All text wrapped in: {"type": "text", "text": "..."}

# Content Structure Requirements
Generate a structured outline with headings and key points (NOT full paragraphs):

- **引言 (Introduction)**: Research background, problem statement, objectives
- **文献综述 (Literature Review)**: Theoretical foundation, current research, research gaps
- **研究方法 (Methodology)**: Research design, data collection, analysis methods
- **结果与分析 (Results and Analysis)**: Expected findings, analysis framework
- **结论 (Conclusion)**: Summary, implications, future research

# Example Structure (Follow This Pattern)
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "引言"}]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "研究背景"}]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{"type": "text", "text": "${topic}领域的发展现状"}]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{"type": "text", "text": "当前研究的主要挑战"}]
            }
          ]
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {"level": 2},
      "content": [{"type": "text", "text": "研究问题"}]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{"type": "text", "text": "核心研究问题的定义"}]
            }
          ]
        }
      ]
    }
  ]
}

# Output Constraints
Return ONLY the complete TipTap JSON object. No markdown code blocks, explanations, or additional text. Your entire response should be a parseable JSON string that can be directly inserted into a TipTap editor.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic writing assistant. Generate complete academic papers with substantial content in TipTap JSON format. Provide detailed, scholarly writing with proper academic tone, not just outlines or bullet points. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens, // 增加token限制以支持完整内容
      temperature: this.temperature,
    };

    const result = await this.makeAPICall("/chat/completions", data);

    // Attach found citations to the result
    if (result && citations.length > 0) {
      result.citations = citations;
      result.literatureSearched = true;
    }

    return result;
  }

  /**
   * Generate content for a specific section
   */
  async generateSectionContent(params) {
    const { sectionTitle, outline, context, wordCount = 300, style = "academic" } = params;

    const prompt = `Write content for the following section of an academic paper:

Section Title: ${sectionTitle}
Context/Outline: ${outline || "N/A"}
Previous Context: ${context || "N/A"}
Target Word Count: ${wordCount}
Writing Style: ${style}

Please write clear, academic content that:
1. Follows academic writing conventions
2. Uses appropriate terminology
3. Maintains logical flow
4. Includes proper transitions
5. Is suitable for peer review

Provide the content in plain text format.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic writer. Generate high-quality, scholarly content for academic papers.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: Math.min(this.maxTokens, wordCount * 2),
      temperature: this.temperature,
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Generate enhanced section content with literature support
   */
  async generateEnhancedSectionContent(params) {
    const { sectionTitle, outline, context, wordCount = 300, style = "academic", topic, keywords = [], includeLiterature = true } = params;

    let literatureContext = "";
    let citations = [];

    if (includeLiterature && (topic || sectionTitle)) {
      try {
        // Search for relevant literature based on section title and topic
        const searchQuery = topic || sectionTitle;
        const searchResult = await searchService.searchForAI({
          topic: searchQuery,
          keywords,
          limit: 5,
          includeAbstracts: true,
        });

        if (searchResult.success && searchResult.results.length > 0) {
          literatureContext = `

RELEVANT LITERATURE FOR THIS SECTION:
${searchResult.results
  .map(
    (paper, index) => `
${index + 1}. ${paper.title} (${paper.authors}, ${paper.year})
   Abstract: ${paper.abstract.substring(0, 150)}...
   DOI: ${paper.doi}
`
  )
  .join("")}

Please incorporate relevant findings from this literature into the section content and include appropriate in-text citations.`;

          citations = searchService.formatAsCitations(searchResult, "APA");
        }
      } catch (error) {
        console.warn("Literature search failed for section content:", error);
      }
    }

    const prompt = `Write content for the following section of an academic paper:

Section Title: ${sectionTitle}
Context/Outline: ${outline || "N/A"}
Previous Context: ${context || "N/A"}
Target Word Count: ${wordCount}
Writing Style: ${style}${literatureContext}

Please write clear, academic content that:
1. Follows academic writing conventions
2. Uses appropriate terminology
3. Maintains logical flow
4. Includes proper transitions
5. Is suitable for peer review
6. Incorporates relevant literature findings (if provided)
7. Includes proper in-text citations where appropriate

Provide the content in plain text format with citations in APA style.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic writer with access to current literature. Generate high-quality, scholarly content that integrates relevant research findings.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens, // Allow more tokens for literature-enhanced content
      temperature: this.temperature,
    };

    const result = await this.makeAPICall("/chat/completions", data);

    // Attach found citations to the result
    if (result && citations.length > 0) {
      result.citations = citations;
      result.literatureSearched = true;
    }

    return result;
  }

  /**
   * Improve existing content
   */
  async improveContent(params) {
    const { content, improvementType = "general", targetAudience = "academic" } = params;

    const improvementPrompts = {
      grammar: "Fix grammar, punctuation, and syntax errors while maintaining the original meaning.",
      clarity: "Improve clarity and readability while maintaining academic tone.",
      style: "Enhance academic writing style and flow.",
      conciseness: "Make the text more concise while preserving key information.",
      expansion: "Expand the content with more details and examples.",
      general: "Improve overall quality, clarity, and academic style.",
    };

    const prompt = `Please improve the following academic text:

Original Content:
${content}

Improvement Focus: ${improvementPrompts[improvementType]}
Target Audience: ${targetAudience}

Provide the improved version with clear, academic language suitable for scholarly publication.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic editor. Improve academic writing while maintaining scholarly standards.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: 0.3, // Lower temperature for editing tasks
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Generate writing suggestions
   */
  async getWritingSuggestions(params) {
    const { content, context, suggestionType = "general" } = params;

    const prompt = `Analyze the following academic text and provide writing suggestions:

Content:
${content}

Context: ${context || "N/A"}
Suggestion Type: ${suggestionType}

Please provide:
1. Specific improvement suggestions
2. Alternative phrasings
3. Structural recommendations
4. Academic writing best practices
5. Potential issues to address

Format as a structured list with explanations.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic writing coach. Provide constructive, actionable feedback for academic writing.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: 0.5,
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Generate citations and references
   */
  async generateCitations(params) {
    const { topic, citationStyle = "APA", numberOfSources = 10 } = params;

    const prompt = `Generate ${numberOfSources} relevant academic citations for research on: ${topic}

Citation Style: ${citationStyle}

Please provide:
1. Realistic academic sources (journals, books, conferences)
2. Proper ${citationStyle} formatting
3. Mix of recent and foundational sources
4. Diverse source types
5. Brief annotation for each source

Note: These are example citations for outline purposes. Always verify and use actual sources in real research.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an academic librarian expert in citation formats. Generate properly formatted example citations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: 0.3,
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Improve content with literature support
   */
  async improveContentWithLiterature(params) {
    const { content, improvementType = "general", targetAudience = "academic", topic, keywords = [], includeLiterature = true } = params;

    let literatureContext = "";
    let citations = [];

    if (includeLiterature && topic) {
      try {
        // Search for relevant literature to support content improvement
        const searchResult = await searchService.searchForAI({
          topic,
          keywords,
          limit: 3,
          includeAbstracts: true,
        });

        if (searchResult.success && searchResult.results.length > 0) {
          literatureContext = `

RELEVANT LITERATURE FOR REFERENCE:
${searchResult.results
  .map(
    (paper, index) => `
${index + 1}. ${paper.title} (${paper.authors}, ${paper.year})
   Key findings: ${paper.abstract.substring(0, 120)}...
`
  )
  .join("")}

Please use insights from this literature to enhance the content and add appropriate citations where relevant.`;

          citations = searchService.formatAsCitations(searchResult, "APA");
        }
      } catch (error) {
        console.warn("Literature search failed for content improvement:", error);
      }
    }

    const improvementPrompts = {
      grammar: "Fix grammar, punctuation, and syntax errors while maintaining the original meaning.",
      clarity: "Improve clarity and readability while maintaining academic tone.",
      style: "Enhance academic writing style and flow.",
      conciseness: "Make the text more concise while preserving key information.",
      expansion: "Expand the content with more details and examples.",
      general: "Improve overall quality, clarity, and academic style.",
      literature: "Enhance the content by incorporating relevant literature and citations.",
    };

    const prompt = `Please improve the following academic text:

Original Content:
${content}

Improvement Focus: ${improvementPrompts[improvementType]}
Target Audience: ${targetAudience}${literatureContext}

Provide the improved version with clear, academic language suitable for scholarly publication. If literature was provided, incorporate relevant citations and strengthen arguments with research evidence.`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an expert academic editor with access to current literature. Improve academic writing while maintaining scholarly standards and incorporating relevant research findings.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: 0.3, // Lower temperature for editing tasks
    };

    const result = await this.makeAPICall("/chat/completions", data);

    // Attach found citations to the result
    if (result && citations.length > 0) {
      result.citations = citations;
      result.literatureSearched = true;
    }

    return result;
  }

  /**
   * Search and format literature for a given topic
   */
  async searchLiterature(params) {
    const { topic, keywords = [], limit = 10, citationStyle = "APA" } = params;

    try {
      const searchResult = await searchService.searchForAI({
        topic,
        keywords,
        limit,
        includeAbstracts: true,
      });

      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error,
          citations: [],
          papers: [],
        };
      }

      const citations = searchService.formatAsCitations(searchResult, citationStyle);

      return {
        success: true,
        citations,
        papers: searchResult.results,
        searchQuery: searchResult.searchQuery,
        total: searchResult.total,
      };
    } catch (error) {
      console.error("Literature search error:", error);
      return {
        success: false,
        error: error.message,
        citations: [],
        papers: [],
      };
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      searchServiceAvailable: true, // Will be checked dynamically
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
