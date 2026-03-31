import json
import re
from pathlib import Path

base = Path(r"I:\大学\cat\untitled1")
raw_path = base / "docs" / "single_questions_raw.txt"
questions_path = base / "src" / "js" / "questions.json"

text = raw_path.read_text(encoding="utf-8")
lines = [line.strip() for line in text.splitlines()]

# 1. 题号+题干+选项
question_map = {}
# 2. 题干括号答案
inline_answer_map = {}
# 3. 题后统一答案
answer_map = {}

# 先处理题干括号答案格式
for i, line in enumerate(lines):
    m = re.match(r"^(\d+)[．.]?(.*?)[（(]\s*([A-Ea-e])\s*[）)]", line)
    if m:
        num = int(m.group(1))
        qtext = m.group(2).strip()
        answer_letter = m.group(3).upper()
        # 收集选项
        options = []
        j = i + 1
        while j < len(lines):
            opt = re.match(r"^([A-E])\.?[．]?(.*)$", lines[j])
            if opt:
                options.append(opt.group(2).strip())
                j += 1
            else:
                break
        if options:
            inline_answer_map[num] = {
                "question": qtext,
                "options": options,
                "answer_letter": answer_letter
            }

# 再处理题后统一答案格式
# 先收集题干和选项
qnum = 0
for i, line in enumerate(lines):
    m = re.match(r"^(\d+)[．.]?(.*)$", line)
    if m:
        qnum = int(m.group(1))
        qtext = m.group(2).strip()
        options = []
        j = i + 1
        while j < len(lines):
            opt = re.match(r"^([A-E])\.?[．]?(.*)$", lines[j])
            if opt:
                options.append(opt.group(2).strip())
                j += 1
            else:
                break
        if options:
            question_map[qnum] = {"question": qtext, "options": options}
# 收集题后答案
for line in lines:
    m = re.match(r"^(\d+)[．.]?答案[:：]\s*([A-Ea-e])", line)
    if m:
        num = int(m.group(1))
        letter = m.group(2).upper()
        answer_map[num] = letter

# 合并两种格式
single_items = []
used_questions = set()
for num, item in inline_answer_map.items():
    idx = ord(item["answer_letter"]) - ord("A")
    if 0 <= idx < len(item["options"]):
        answer_text = item["options"][idx]
        q = item["question"]
        if q not in used_questions:
            single_items.append({
                "question": q,
                "options": item["options"],
                "answer": answer_text
            })
            used_questions.add(q)
for num, item in question_map.items():
    if num in answer_map:
        idx = ord(answer_map[num]) - ord("A")
        if 0 <= idx < len(item["options"]):
            q = item["question"]
            if q not in used_questions:
                single_items.append({
                    "question": q,
                    "options": item["options"],
                    "answer": item["options"][idx]
                })
                used_questions.add(q)

# 合并进 questions.json
with questions_path.open("r", encoding="utf-8") as f:
    data = json.load(f)
existing_single = {q["question"] for q in data.get("single", [])}
for item in single_items:
    if item["question"] not in existing_single:
        data.setdefault("single", []).append(item)
        existing_single.add(item["question"])

with questions_path.open("w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"提取并合并完成，新增单选题 {len(single_items)} 道。")
