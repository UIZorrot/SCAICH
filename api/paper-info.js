// Vercel Serverless Function for DOI paper information lookup
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { doi } = req.query;
    
    if (!doi) {
      return res.status(400).json({ error: 'DOI parameter is required' });
    }

    // 清理DOI，移除可能的URL前缀
    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    
    console.log(`Querying DOI: ${cleanDoi}`);

    // 调用OpenAlex API获取论文信息
    const response = await fetch(`https://api.openalex.org/works/doi:${cleanDoi}`, {
      headers: {
        'User-Agent': 'SCAI-Box/1.0 (mailto:contact@scai.com)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`OpenAlex API error: ${response.status} ${response.statusText}`);
      return res.status(404).json({ error: 'Paper not found' });
    }

    const paper = await response.json();
    
    // 处理摘要 - 重建倒排索引
    const restoreAbstract = (abstractInvertedIndex) => {
      if (!abstractInvertedIndex || typeof abstractInvertedIndex !== 'object') {
        return "Abstract Not Available";
      }
      
      try {
        const words = [];
        for (const [word, positions] of Object.entries(abstractInvertedIndex)) {
          if (Array.isArray(positions)) {
            for (const pos of positions) {
              if (typeof pos === 'number') {
                words[pos] = word;
              }
            }
          }
        }
        const result = words.filter(Boolean).join(' ');
        return result || "Abstract Not Available";
      } catch (error) {
        console.error('Error restoring abstract:', error);
        return "Abstract Not Available";
      }
    };

    // 处理作者信息
    const authors = paper.authorships?.map(authorship => 
      authorship.author?.display_name || "Unknown"
    ) || [];

    // 处理期刊/会议信息
    const locations = paper.locations?.map(loc => 
      loc.source?.display_name || loc.source?.host_organization_name
    ).filter(Boolean) || [];

    // 格式化返回数据
    const paperInfo = {
      source: "openalex",
      title: paper.title || "Unknown",
      doi: cleanDoi,
      abstract: restoreAbstract(paper.abstract_inverted_index),
      referencecount: paper.cited_by_count || 0,
      author: authors.join(", ") || "Unknown",
      year: paper.publication_year || "Unknown",
      url: `https://www.doi.org/${cleanDoi}`,
      location: locations.join(", ") || "Not Available",
      scihub_url: `https://www.doi.org/${cleanDoi}`,
      is_oa: paper.open_access?.is_oa || false,
      oa_url: paper.open_access?.oa_url || null,
      type: paper.type || "article",
      language: paper.language || "en"
    };

    console.log(`Successfully processed DOI: ${cleanDoi}`);
    res.json(paperInfo);
  } catch (error) {
    console.error('DOI query error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
