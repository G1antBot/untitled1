import json
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

BASE = Path(r"I:\大学\cat\untitled1")
DOCX_PATH = Path(r"I:\大学\cat\诊断学考试简答及论述.docx")
OUTPUT_PATH = BASE / "src" / "js" / "questions_diagnostics.json"

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def read_docx_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path, "r") as zf:
        xml_bytes = zf.read("word/document.xml")

    root = ET.fromstring(xml_bytes)
    paragraphs: list[str] = []

    for p in root.findall(".//w:p", NS):
        texts = [t.text or "" for t in p.findall(".//w:t", NS)]
        line = "".join(texts).strip()
        if line:
            paragraphs.append(line)

    return paragraphs


def parse_questions(lines: list[str]) -> tuple[list[dict], list[dict]]:
    items: list[dict] = []
    current_q = None

    def push_current():
        nonlocal current_q
        if not current_q:
            return
        question = re.sub(r"\s+", " ", current_q.get("question", "")).strip()
        answer = re.sub(r"\s+", " ", current_q.get("answer", "")).strip()
        if question:
            items.append({"question": question, "answer": answer})
        current_q = None

    question_re = re.compile(r"^(\d+)[、.．]\s*(.+)$")

    for raw in lines:
        line = re.sub(r"\s+", " ", raw).strip()
        if not line:
            continue

        m = question_re.match(line)
        if m:
            push_current()
            current_q = {"question": m.group(2).strip(), "answer": ""}
            continue

        if not current_q:
            continue

        if line.startswith("答：") or line.startswith("答案："):
            current_q["answer"] = re.sub(r"^(答：|答案：)", "", line).strip()
        elif current_q.get("answer"):
            current_q["answer"] += "\n" + line
        else:
            current_q["question"] += " " + line

    push_current()

    # 去重（按题干）
    seen = set()
    deduped = []
    for it in items:
        if it["question"] not in seen:
            seen.add(it["question"])
            deduped.append(it)

    # 启发式分类：偏概述/比较/机制/意义的问题归入论述，其余归入简答
    essay_keywords = re.compile(r"试述|叙述|论述|有何|如何|意义|特点|分度|检查方法|临床意义|鉴别|演变|分期")
    short_items = []
    essay_items = []

    for it in deduped:
        if essay_keywords.search(it["question"]):
            essay_items.append(it)
        else:
            short_items.append(it)

    return short_items, essay_items


def main() -> None:
    lines = read_docx_paragraphs(DOCX_PATH)
    short_items, essay_items = parse_questions(lines)

    payload = {
        "single": [],
        "multiple": [],
        "term": short_items,
        "short": essay_items
    }

    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"提取完成：简答 {len(short_items)} 题，论述 {len(essay_items)} 题")


if __name__ == "__main__":
    main()
