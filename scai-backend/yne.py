import requests
import json
import os
from datetime import datetime
import time

class ArticleCrawler:
    def __init__(self, output_file='articles.json', cache_file='article_ids.json'):
        self.base_url = "https://yesnoerror.com/api/yne-proxy"
        self.output_file = output_file
        self.cache_file = cache_file
        self.existing_ids = self.load_existing_ids()
        self.articles = []
        
    def load_existing_ids(self):
        """加载已爬取的文章ID"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return set(json.load(f))
            return set()
        except Exception as e:
            print(f"加载缓存文件失败: {e}")
            return set()

    def save_existing_ids(self):
        """保存已爬取的文章ID"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(list(self.existing_ids), f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存缓存文件失败: {e}")

    def save_articles(self):
        """保存文章数据到JSON文件"""
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(self.articles, f, ensure_ascii=False, indent=2)
            print(f"文章数据已保存到 {self.output_file}")
        except Exception as e:
            print(f"保存文章数据失败: {e}")

    def fetch_article_list(self, page=1, size=6):
        """获取文章列表"""
        params = {
            'path': f"/api/v2/analysis/search?size={size}&status=COMPLETE&model=o1&sort_by=created_at&reverse_sort=true&error_filter=HAS_ERRORS&check_names_use_and=true&page={page}"
        }
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"获取文章列表失败 (page {page}): {e}")
            return None

    def fetch_article_detail(self, article_id):
        """获取文章详情"""
        params = {'path': f"/api/v2/analysis/{article_id}"}
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"获取文章详情失败 (ID: {article_id}): {e}")
            return None

    def crawl(self):
        """主爬取逻辑"""
        page = 1
        size = 6
        while True:
            print(f"正在爬取第 {page} 页...")
            article_list = self.fetch_article_list(page, size)
            
            if not article_list or not article_list.get('success') or not article_list.get('data'):
                print("获取文章列表失败或无更多数据")
                break

            items = article_list['data']['items']
            total_pages = article_list['data']['pages']
            
            if not items:
                print("无更多文章")
                break

            for item in items:
                article_id = item['id']
                # 跳过已爬取的文章
                if article_id in self.existing_ids:
                    print(f"跳过已爬取文章: {article_id}")
                    continue

                # 获取文章详情
                detail = self.fetch_article_detail(article_id)
                if detail and detail.get('success'):
                    self.articles.append(detail['data'])
                    self.existing_ids.add(article_id)
                    print(f"成功爬取文章: {article_id}")
                else:
                    print(f"跳过文章详情获取失败: {article_id}")
                
                # 防止请求过快
                time.sleep(1)

            # 保存当前进度
            self.save_articles()
            self.save_existing_ids()

            page += 1
            if page > total_pages:
                break

            # 每页之间稍作暂停
            time.sleep(2)

        return self.articles

def main():
    crawler = ArticleCrawler()
    articles = crawler.crawl()
    print(f"共爬取 {len(articles)} 篇新文章")
    
    # 返回结果作为JSON
    result = {
        "success": True,
        "message": "爬取完成",
        "data": {
            "total_articles": len(articles),
            "timestamp": datetime.now().isoformat(),
            "articles": articles
        }
    }
    return result

if __name__ == "__main__":
    result = main()
    print(json.dumps(result, ensure_ascii=False, indent=2))