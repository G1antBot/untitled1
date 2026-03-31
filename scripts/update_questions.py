import json
import re
from pathlib import Path

base = Path(r"I:\大学\cat\untitled1")
choice_path = base / "docs" / "choice_docx_lines.txt"
questions_path = base / "src" / "js" / "questions.json"

text = choice_path.read_text(encoding="utf-8")
lines = [line.strip() for line in text.splitlines()]

question_map = {}

i = 0
while i < len(lines):
    line = lines[i]
    m = re.match(r"^(\d+)\.(.+)$", line)
    if m:
        num = int(m.group(1))
        qtext = m.group(2).strip()
        options = []
        i += 1
        while i < len(lines):
            cur = lines[i].strip()
            if re.match(r"^\d+\.", cur):
                i -= 1
                break
            mopt = re.match(r"^([A-E])\.(.*)$", cur)
            if mopt:
                options.append(mopt.group(2).strip())
            i += 1
        if options:
            question_map[num] = {"question": qtext, "options": options}
    i += 1

answer_map = {}
for line in lines:
    m = re.match(r"^(\d+)\.答案：([A-E])", line)
    if m:
        num = int(m.group(1))
        letter = m.group(2)
        if num not in answer_map:
            answer_map[num] = letter

single_items = []
for num in sorted(question_map.keys()):
    if num not in answer_map:
        continue
    item = question_map[num]
    letter = answer_map[num]
    idx = ord(letter) - ord("A")
    if idx < 0 or idx >= len(item["options"]):
        continue
    answer_text = item["options"][idx]
    single_items.append({
        "question": item["question"],
        "options": item["options"],
        "answer": answer_text
    })

with questions_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

existing_single = {q["question"] for q in data.get("single", [])}
for item in single_items:
    if item["question"] not in existing_single:
        data.setdefault("single", []).append(item)
        existing_single.add(item["question"])

# Multi-choice questions provided by user
multi_items = [
    {
        "question": "无菌术的内容包括（）",
        "options": ["灭菌", "消毒法", "操作规则", "管理制度", "抗生素使用"],
        "answer": ["灭菌", "消毒法", "操作规则", "管理制度"]
    },
    {
        "question": "常用的物理灭菌方法有（）",
        "options": ["高温", "紫外线", "电离辐射", "酒精浸泡", "碘伏擦拭"],
        "answer": ["高温", "紫外线", "电离辐射"]
    },
    {
        "question": "低渗性缺水的病因包括（）",
        "options": ["消化液慢性丢失", "大创面慢性渗液", "补钠不足", "等渗性缺水治疗时补水过多", "水分摄入不足"],
        "answer": ["消化液慢性丢失", "大创面慢性渗液", "补钠不足", "等渗性缺水治疗时补水过多"]
    },
    {
        "question": "低钾血症的病因包括（）",
        "options": ["长期进食不足", "应用排钾利尿剂", "呕吐、胃肠减压", "代谢性碱中毒", "肾功能衰竭排钾障碍"],
        "answer": ["长期进食不足", "应用排钾利尿剂", "呕吐、胃肠减压", "代谢性碱中毒"]
    },
    {
        "question": "高钾血症的治疗措施包括（）",
        "options": ["停止补钾", "静注葡萄糖酸钙", "输注碳酸氢钠", "透析疗法", "大量补充生理盐水"],
        "answer": ["停止补钾", "静注葡萄糖酸钙", "输注碳酸氢钠", "透析疗法"]
    },
    {
        "question": "输血的适应症有（）",
        "options": ["大量失血", "贫血或低蛋白血症", "严重感染", "凝血异常", "常规补液"],
        "answer": ["大量失血", "贫血或低蛋白血症", "严重感染", "凝血异常"]
    },
    {
        "question": "输血的常见并发症包括（）",
        "options": ["发热反应", "溶血反应", "过敏反应", "循环超负荷", "低钾血症"],
        "answer": ["发热反应", "溶血反应", "过敏反应", "循环超负荷"]
    },
    {
        "question": "休克的分类包括（）",
        "options": ["低血容量性休克", "感染性休克", "心源性休克", "神经源性休克", "过敏性休克"],
        "answer": ["低血容量性休克", "感染性休克", "心源性休克", "神经源性休克", "过敏性休克"]
    },
    {
        "question": "休克的一般监测指标包括（）",
        "options": ["精神状态", "皮肤温度色泽", "血压", "脉率", "尿量"],
        "answer": ["精神状态", "皮肤温度色泽", "血压", "脉率", "尿量"]
    },
    {
        "question": "感染性休克的分型包括（）",
        "options": ["高动力型（暖休克）", "低动力型（冷休克）", "失血性休克", "创伤性休克", "心源性休克"],
        "answer": ["高动力型（暖休克）", "低动力型（冷休克）"]
    },
    {
        "question": "MODS 的常见病因包括（）",
        "options": ["严重脓毒症", "严重创伤、烧伤", "休克", "缺血 - 再灌注损伤", "急腹症合并感染"],
        "answer": ["严重脓毒症", "严重创伤、烧伤", "休克", "缺血 - 再灌注损伤", "急腹症合并感染"]
    },
    {
        "question": "急性肾衰少尿期的主要死亡原因包括（）",
        "options": ["水中毒", "高钾血症", "酸中毒", "低钙血症", "感染"],
        "answer": ["水中毒", "高钾血症", "酸中毒"]
    },
    {
        "question": "麻醉前用药的目的包括（）",
        "options": ["消除紧张焦虑", "提高痛阈", "抑制腺体分泌", "抑制不良反射", "增强麻醉效果"],
        "answer": ["消除紧张焦虑", "提高痛阈", "抑制腺体分泌", "抑制不良反射", "增强麻醉效果"]
    },
    {
        "question": "局部麻醉的不良反应包括（）",
        "options": ["毒性反应", "过敏反应", "发热反应", "溶血反应", "恶心呕吐"],
        "answer": ["毒性反应", "过敏反应"]
    },
    {
        "question": "心肺复苏初期复苏的核心步骤 ABC 是指（）",
        "options": ["保持呼吸道通畅", "有效人工呼吸", "建立有效人工循环", "药物治疗", "脑复苏"],
        "answer": ["保持呼吸道通畅", "有效人工呼吸", "建立有效人工循环"]
    },
    {
        "question": "外科营养支持的方式包括（）",
        "options": ["肠内营养", "肠外营养", "口服补液", "静脉补液", "管饲饮食"],
        "answer": ["肠内营养", "肠外营养"]
    },
    {
        "question": "外科非特异性感染的局部症状包括（）",
        "options": ["红", "肿", "热", "痛", "功能障碍"],
        "answer": ["红", "肿", "热", "痛", "功能障碍"]
    },
    {
        "question": "破伤风的典型临床表现包括（）",
        "options": ["开口困难", "苦笑面容", "颈项强直", "角弓反张", "意识不清"],
        "answer": ["开口困难", "苦笑面容", "颈项强直", "角弓反张"]
    },
    {
        "question": "烧伤的现场急救措施包括（）",
        "options": ["迅速脱离热源", "保护受伤部位", "维护呼吸道通畅", "处理复合伤", "大量涂擦药膏"],
        "answer": ["迅速脱离热源", "保护受伤部位", "维护呼吸道通畅", "处理复合伤"]
    },
    {
        "question": "恶性肿瘤的转移方式包括（）",
        "options": ["直接蔓延", "淋巴道转移", "血行转移", "种植转移", "接触传播"],
        "answer": ["直接蔓延", "淋巴道转移", "血行转移", "种植转移"]
    }
]

existing_multi = {q["question"] for q in data.get("multiple", [])}
for item in multi_items:
    if item["question"] not in existing_multi:
        data.setdefault("multiple", []).append(item)
        existing_multi.add(item["question"])

term_items = [
    {"question": "无菌术", "answer": "针对微生物及感染途径所采取的一系列预防措施，包括灭菌、消毒法、操作规则及管理制度。"},
    {"question": "等渗性缺水", "answer": "又称急性缺水或混合性缺水，水钠成比例丧失，血清钠及细胞外液渗透压正常，是外科最常见的缺水类型。"},
    {"question": "低钾血症", "answer": "血钾浓度低于 3.5mmol/L，引发肌无力、心律失常等一系列代谢紊乱的病症。"},
    {"question": "高钾血症", "answer": "血钾浓度超过 5.5mmol/L，易导致心搏骤停，是临床危急的电解质紊乱。"},
    {"question": "休克", "answer": "多种病因引起，以有效循环血容量减少、组织灌注不足、细胞代谢紊乱和功能受损为主要病理生理改变的综合征。"},
    {"question": "中心静脉压（CVP）", "answer": "代表右心房或胸腔内大静脉的血压，正常值 5~10cmHO，反映全身血容量及心功能状态。"},
    {"question": "全身炎症反应综合征（SIRS）", "answer": "细菌内毒素促使炎性介质释放引起的全身炎症反应，是 MODS 的发病基础。"},
    {"question": "多器官功能障碍综合征（MODS）", "answer": "急性疾病过程中，同时或序贯继发两个或更多重要器官的功能障碍或衰竭。"},
    {"question": "急性呼吸窘迫综合征（ARDS）", "answer": "肺实质急性弥漫性损伤导致的急性缺氧性呼吸衰竭，以进行性呼吸困难和顽固性低氧血症为特征。"},
    {"question": "全身麻醉", "answer": "麻醉药经呼吸道吸入或静脉、肌内注射进入体内，抑制中枢神经，产生神志消失、痛觉丧失、肌肉松弛等效果的麻醉方法。"},
    {"question": "局部麻醉", "answer": "用局麻药暂时阻断周围神经冲动传导，使相应区域产生麻醉作用，患者意识清醒。"},
    {"question": "心肺复苏（CPR）", "answer": "针对呼吸、循环骤停采取的抢救措施，以人工呼吸替代自主呼吸，心脏按压建立人工循环。"},
    {"question": "肠外营养（PN）", "answer": "通过静脉途径供给患者所需的全部营养物质，适用于不能经口进食的患者。"},
    {"question": "肠内营养（EN）", "answer": "经胃肠道供给营养物质，符合生理、副作用小，是营养支持的首选方式。"},
    {"question": "破伤风", "answer": "与创伤相关的革兰阳性菌特异性感染，以肌肉强直性收缩为典型症状。"}
]

existing_term = {q["question"] for q in data.get("term", [])}
for item in term_items:
    if item["question"] not in existing_term:
        data.setdefault("term", []).append(item)
        existing_term.add(item["question"])

short_items = [
    {
        "question": "简述无菌术的内容及应用最普遍的灭菌方法。",
        "answer": "无菌术包括灭菌、消毒法、操作规则、管理制度；最普遍的灭菌方法为高压蒸气灭菌，121~126维持约30分钟，可杀灭芽胞。"
    },
    {
        "question": "简述等渗性缺水、低渗性缺水、高渗性缺水的核心特点及治疗原则。",
        "answer": "等渗性缺水：水钠成比例丧失，血清钠正常，细胞外液渗透压正常；治原发病，静注含电解质等渗溶液补血容量并补日需水量，尿量恢复后补钾。低渗性缺水：失钠大于失水，血清钠降低，细胞外液低渗；治原发病，纠正休克/脑水肿，补充血容量，选用含钠高渗溶液（轻中度等渗或50%GNS，重度5%NaCl 200~300ml）。高渗性缺水：失水大于失钠，血清钠升高，细胞外液高渗；解除病因，静注5%葡萄糖或0.45%NaCl，总量=日需水量+体重每丧失1%补液约400~500ml。"
    },
    {
        "question": "简述低钾血症的病因、典型临床表现及心电图改变。",
        "answer": "病因：长期进食不足、排钾利尿剂、补液中钾盐不足、呕吐/胃肠减压/肠瘘等肾外丢失、钾向细胞内转移（糖+胰岛素或碱中毒）。表现：肌无力、软瘫、腱反射减退或消失、腹胀肠麻痹、心律失常。心电图：T波低平或倒置、ST段降低、QT间期延长、出现U波。"
    },
    {
        "question": "简述休克的一般监测指标及各指标的临床意义。",
        "answer": "精神状态反映脑灌注；皮肤温度和色泽反映外周灌注；血压与脉压反映循环状态，收缩压<90mmHg、脉压<20mmHg提示休克；脉率及休克指数提示休克程度；尿量反映肾灌注（<25ml/h提示不足）；中心静脉压反映血容量与心功能。"
    },
    {
        "question": "简述休克的总体治疗原则。",
        "answer": "积极处理原发伤/病，保持呼吸道通畅、给氧保温并建立静脉通路；补充血容量为重中之重（晶体液为主，必要时血液制品或高渗盐）；纠正酸碱及电解质紊乱；应用血管活性药物并改善微循环/防治DIC；必要时激素及营养支持等综合治疗。"
    },
    {
        "question": "简述急性肾衰（ARF）少尿期的治疗要点。",
        "answer": "控制入水量，量出为入；调整电解质，严禁钾摄入并积极降钾；纠正酸中毒；维持营养和供给热量；控制感染，必要时透析治疗。"
    },
    {
        "question": "简述麻醉前用药的目的。",
        "answer": "消除紧张焦虑、稳定情绪并增强全麻效果；提高痛阈、使病人安静合作；抑制呼吸道腺体分泌保持通畅；消除不良反射（尤其迷走反射）；减少麻醉用量及副作用。"
    },
    {
        "question": "简述烧伤后第一个 24 小时的补液原则（总量、晶胶比、输注速度）。",
        "answer": "总量=晶胶体+生理量（5%GS）。成人：TBSA%体重(kg)1.5ml + 2000ml；儿童：TBSA%体重2.0ml + 60~80ml/kg；婴儿：TBSA%体重2.0ml + 100ml/kg。补什么：晶体为电解质平衡液，胶体为血浆或白蛋白。晶胶比：中重度0.5:1，特重度1:1。速度：前8小时输入晶胶体的1/2，余下1/2在后两个8小时完成；生理量每8小时各1/3，电解质/胶体/水分交替输入。"
    }
]

existing_short = {q["question"] for q in data.get("short", [])}
for item in short_items:
    if item["question"] not in existing_short:
        data.setdefault("short", []).append(item)
        existing_short.add(item["question"])

with questions_path.open("w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"Single added: {len(single_items)} total single now {len(data.get('single', []))}")
print(f"Multiple total: {len(data.get('multiple', []))}")
print(f"Term total: {len(data.get('term', []))}")
print(f"Short total: {len(data.get('short', []))}")
