from flask import Flask, request, jsonify
from scholarly import scholarly

from scihub_search import paragraph_to_json_ollama, search_scihub
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app)  # 启用 CORS，允许所有来源访问
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route("/search", methods=["GET"])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def search():
    try:
        # 从 URL 参数获取 query 值
        query = request.args.get("query")
        limit = request.args.get("limit")
        if not query:
            return jsonify({"error": "Query parameter is required"}), 400

        if not limit or int(limit) < 3:
            limit = 3
        else:
            limit = int(limit)

        data = search_scihub(query, limit)

        results = []
        for item in data:
            # 校验每个 JSON 是否包含 'title' 和 'doi'
            if "title" not in item or "doi" not in item:
                return (
                    jsonify(
                        {
                            "error": 'Each object in the query list must contain "title" and "doi" keys'
                        }
                    ),
                    400,
                )

            title = item["title"]
            doi = item["doi"]
            try:
                # 使用 scholarly 搜索 Google Scholar
                search_results = scholarly.search_pubs(doi)
                first_result = next(search_results, None)  # 获取第一个结果
                if first_result:
                    results.append(
                        {
                            "doi": doi,
                            "scihub_url": f"https://sci-hub.se/{doi}",  # Sci-Hub URL
                            "title": first_result["bib"]["title"],
                            "author": first_result["bib"].get("author", "N/A"),
                            "abstract": first_result["bib"].get("abstract", "N/A"),
                            "url": first_result.get("pub_url", "N/A"),
                            "year": first_result["bib"].get("pub_year", "N/A"),
                        }
                    )
                else:
                    # 如果没有结果，返回空信息
                    results.append(
                        {
                            "doi": doi,
                            "scihub_url": f"https://sci-hub.se/{doi}",
                            "title": title,
                            "error": "No results found",
                        }
                    )
            except Exception as e:
                results.append(
                    {
                        "doi": doi,
                        "scihub_url": f"https://sci-hub.se/{doi}",
                        "title": title,
                        "error": f"Error during search: {str(e)}",
                    }
                )

        # 调用 paragraph_to_json_ollama 生成 summary
        sum = paragraph_to_json_ollama(query, str(results))

        # 将 summary 加入到返回结果中
        response = {
            "summary": sum,
            "results": results,
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6677)
