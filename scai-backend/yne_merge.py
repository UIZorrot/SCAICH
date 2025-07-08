import json

# 文件路径
ids_file = "article_ids.json"  # 第一个 JSON 文件（ID 列表）
analyses_file = "articles.json"  # 第二个 JSON 文件（分析数据）
output_file = "articles_merged.json"  # 输出文件

# 读取 JSON 文件
with open(ids_file, "r", encoding="utf-8") as f:
    id_list = json.load(f)

with open(analyses_file, "r", encoding="utf-8") as f:
    analyses = json.load(f)

# 创建 ID 集合以加速查找
id_set = set(id_list)

# 合并数据
merged_data = []
for analysis in analyses:
    analysis_id = analysis.get("id")
    if analysis_id in id_set:
        merged_entry = {
            "id": analysis_id,
             "paperid": analysis["paper"]["id"],
            "title": analysis["paper"]["title"]
        }
        merged_data.append(merged_entry)

# 写入输出文件
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(merged_data, f, indent=2, ensure_ascii=False)

print(f"合并完成，结果已保存到 {output_file}")