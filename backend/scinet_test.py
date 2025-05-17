import requests
import urllib.parse

def check_sci_net_article(doi):
    """
    检查 Sci-Net 上是否存在指定 DOI 的文章。
    
    Args:
        doi (str): 要检查的 DOI，例如 "10.1007/s12083-023-01582-x"
    
    Returns:
        bool: 如果文章存在返回 True，否则返回 False
    """
    # 清洗 DOI，移除可能的 "https://doi.org/" 前缀
    clean_doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "")
    
    # 构造 Sci-Net URL
    sci_net_url = f"https://sci-net.xyz/{urllib.parse.quote(clean_doi)}"
    
    # 设置请求头，模拟浏览器
    headers = {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        # 发送 GET 请求，允许重定向以捕获最终 URL
        response = requests.get(sci_net_url, headers=headers, timeout=10, allow_redirects=True)
        
        # 获取最终 URL（处理重定向）
        final_url = response.url
        
        # 检查响应
        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "")
            
            # 判断是否为有效论文页面
            is_valid_page = (
                content_type.startswith("text/html") and  # 确保是 HTML 页面
                final_url == sci_net_url and  # 未重定向
                not final_url.endswith("sci-net.xyz/") and  # 不是主页
                not final_url.endswith("sci-net.xyz")
            )
            
            if is_valid_page:
                print(f"DOI {clean_doi}: 文章存在，URL: {sci_net_url}")
                return True
            else:
                print(f"DOI {clean_doi}: 文章不存在，重定向到 {final_url}")
                return False
        else:
            print(f"DOI {clean_doi}: 请求失败，状态码 {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"DOI {clean_doi}: 请求错误 - {e}")
        return False

def main():
    # 测试用 DOI 列表
    test_dois = [
        "10.1007/s12083-023-01582-x",  # 有效 DOI
        "10.1007/s12083-023-01582",    # 无效 DOI
    ]
    
    print("开始检查 Sci-Net 文章存在性...\n")
    
    for doi in test_dois:
        exists = check_sci_net_article(doi)
        print(f"结果: DOI {doi} {'存在' if exists else '不存在'}\n")

if __name__ == "__main__":
    main()