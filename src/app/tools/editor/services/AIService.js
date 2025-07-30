/**
 * AI Service Integration Layer
 * Provides AI-powered writing assistance for academic writing
 */

import searchService from "./SearchService";

class AIService {
  constructor() {
    // Default configuration - can be overridden by user
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || "";
    this.baseURL = process.env.REACT_APP_OPENAI_BASE_URL || "";
    this.model = process.env.REACT_APP_OPENAI_MODEL || "gemini-2.5-pro";
    this.maxTokens = 150000;
    this.temperature = 0.7;

    // Load user configuration from localStorage
    this.loadUserConfiguration();
  }

  /**
   * Load user configuration from localStorage
   */
  loadUserConfiguration() {
    try {
      const savedConfig = localStorage.getItem("ai_service_config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.apiKey) this.apiKey = config.apiKey;
        if (config.baseURL) this.baseURL = config.baseURL;
        if (config.model) this.model = config.model;
      }
    } catch (error) {
      console.warn("Failed to load AI service configuration:", error);
    }
  }

  /**
   * Save user configuration to localStorage
   */
  saveUserConfiguration(config) {
    try {
      const configToSave = {
        apiKey: config.apiKey || this.apiKey,
        baseURL: config.baseURL || this.baseURL,
        model: config.model || this.model,
      };
      localStorage.setItem("ai_service_config", JSON.stringify(configToSave));

      // Update current instance
      this.apiKey = configToSave.apiKey;
      this.baseURL = configToSave.baseURL;
      this.model = configToSave.model;

      return true;
    } catch (error) {
      console.error("Failed to save AI service configuration:", error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getCurrentConfiguration() {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
    };
  }

  /**
   * Check if service is properly configured
   */
  isConfigured() {
    return !!(this.apiKey && this.baseURL);
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
   * Generate enhanced academic paper outline with literature search
   */
  async generateEnhancedOutline(params, onChunk = null, onComplete = null, onError = null) {
    const { topic, keywords, researchFocus, paperType = "research", targetLength = "medium" } = params;

    let literatureContext = "";

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
      stream: onChunk ? true : false, // Only stream if callback is provided
    };

    // If streaming callbacks are provided, use streaming
    if (onChunk) {
      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let contentBuffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Final processing when stream ends
              if (contentBuffer.trim()) {
                // 改进的JSON解析逻辑
                let finalContent = contentBuffer.trim();

                // 处理可能的markdown包装
                if (finalContent.startsWith("```json")) {
                  finalContent = finalContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                } else if (finalContent.startsWith("```")) {
                  finalContent = finalContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
                }

                // 如果内容是转义的JSON字符串，先解析一层
                if (finalContent.startsWith('"') && finalContent.endsWith('"') && finalContent.includes('\\"')) {
                  try {
                    finalContent = JSON.parse(finalContent);
                  } catch (e) {
                    console.log("Content is not an escaped JSON string");
                  }
                }

                // 尝试解析为JSON对象
                try {
                  const finalJson = JSON.parse(finalContent);
                  onComplete?.(finalJson);
                  return finalJson;
                } catch (parseError) {
                  console.warn("Failed to parse final JSON content:", parseError);
                  console.warn("Raw content:", contentBuffer);
                  // 如果无法解析为JSON，返回原始内容字符串
                  onComplete?.(finalContent);
                  return finalContent;
                }
              } else {
                onComplete?.("");
                return "";
              }
            }

            // Decode chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines (Server-Sent Events format)
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === "") continue;
              if (line.trim() === "data: [DONE]") continue;

              if (line.startsWith("data: ")) {
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  const content = jsonData.choices?.[0]?.delta?.content;

                  if (content) {
                    contentBuffer += content;
                    onChunk?.(content, contentBuffer);
                  }
                } catch (e) {
                  // Skip malformed JSON chunks
                  console.warn("Skipping malformed chunk:", line);
                }
              }
            }
          }
        } catch (streamError) {
          throw streamError;
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error("AI Service Streaming Error:", error);
        onError?.(error);
        throw error;
      }
    } else {
      // Use traditional API call for non-streaming
      const result = await this.makeAPICall("/chat/completions", data);
      return result;
    }
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

    const suggestions = {
      general: {
        instruction: "提供综合性的写作改进建议",
        examples: ["将'因为'改为'由于'提升正式性", "删除多余的'的'字优化表达", "添加过渡词连接句子"],
      },
      grammar: {
        instruction: "专注于语法、标点和用词错误",
        examples: ["修正主谓不一致", "统一时态表达", "纠正标点符号用法"],
      },
      style: {
        instruction: "专注于文风和语言表达优化",
        examples: ["替换口语化表达", "使用更正式的词汇", "调整句式结构"],
      },
      clarity: {
        instruction: "专注于提升表达清晰度和逻辑性",
        examples: ["拆分复杂长句", "明确指代关系", "增强逻辑连接"],
      },
      conciseness: {
        instruction: "专注于精简表达和去除冗余",
        examples: ["删除重复词汇", "合并冗余句子", "简化复杂表述"],
      },
    };

    const currentType = suggestions[suggestionType] || suggestions.general;

    // 智能上下文：只在需要时提供简化的上下文
    let contextInfo = "";
    if (context && (suggestionType === "clarity" || suggestionType === "style")) {
      // 提取选中文本前后的简短上下文（最多200字符）
      const plainContext = this.stripHtmlTags(context);
      const selectedIndex = plainContext.indexOf(content);

      if (selectedIndex !== -1) {
        const start = Math.max(0, selectedIndex - 100);
        const end = Math.min(plainContext.length, selectedIndex + content.length + 100);
        const surroundingText = plainContext.slice(start, end);

        if (surroundingText !== content) {
          contextInfo = `\n\n上下文参考：\n${surroundingText}`;
        }
      }
    }

    const prompt = `${currentType.instruction}，分析以下文本：

文本内容：
${content}${contextInfo}

要求：
- 只提供3-5条具体的改进建议
- 每条建议不超过20个字
- 建议应该可直接应用
- 专注于${suggestionType === "general" ? "综合优化" : currentType.instruction}

示例格式：
${currentType.examples.map((ex) => `- ${ex}`).join("\n")}

请按照上述格式提供建议：`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: `你是专业的中文写作助手，专注于${currentType.instruction}。只提供简短、具体、可操作的建议。`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Translate text to target language
   */
  async translateText(params) {
    const { content, targetLanguage = "英语" } = params;

    const prompt = `请将以下文本翻译成${targetLanguage}：

原文：
${content}

要求：
- 直接返回翻译结果
- 保持原文的语气和风格
- 对于学术文本，使用正式的表达
- 不要添加解释或说明

翻译结果：`;

    const data = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: `你是专业的翻译助手。提供准确、自然的翻译，保持原文的语气和风格。直接返回翻译结果，不要解释。`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: Math.min(this.maxTokens, 800), // 翻译可能需要更多token
      temperature: 0.1, // 低温度确保翻译准确性
    };

    return await this.makeAPICall("/chat/completions", data);
  }

  /**
   * Helper method to strip HTML tags for context extraction
   */
  stripHtmlTags(html) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
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
