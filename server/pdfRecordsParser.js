import fs from "fs";
import path from "path";

const CATEGORY_KEYWORDS = [
  ["geography", ["гора", "озер", "река", "каньон", "пустын", "впадин", "остров", "ледник", "жер", "тау", "өзен", "көл"]],
  ["population", ["населен", "семь", "жител", "человек", "халық", "отбасы"]],
  ["history", ["истор", "древн", "перв", "археолог", "тарих"]],
  ["economy", ["компан", "банк", "бизнес", "завод", "производ", "экспорт", "тенге", "эконом"]],
  ["politics", ["президент", "парламент", "депутат", "министр", "выбор", "саясат"]],
  ["law", ["суд", "закон", "прав", "юрид", "құқық"]],
  ["tourism", ["тури", "гостини", "отел", "посетител", "саяхат"]],
  ["education", ["школ", "университет", "студент", "учен", "образован", "білім"]],
  ["science", ["наук", "учен", "исслед", "открыт", "ғылым"]],
  ["healthcare", ["медицин", "врач", "больниц", "здрав", "денсаулық"]],
  ["culture", ["культур", "театр", "музе", "фестив", "искус", "өнер"]],
  ["architecture", ["здан", "башн", "архитект", "строит", "құрылыс"]],
  ["sports", ["спорт", "чемпион", "матч", "олимп", "марафон", "футбол"]],
];

const RECORD_HINTS = [
  "сам", "самая", "самый", "самое", "самые", "наиболее", "крупнейш", "наибольш",
  "перв", "единствен", "рекорд", "длинн", "высок", "низк", "старейш", "молод",
  "ең ", "тұңғыш", "алғаш", "рекорд",
];

const cleanText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

const normalizeKey = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const inferCategory = (text) => {
  const haystack = text.toLowerCase();
  let best = { id: "history", score: 0 };
  for (const [id, words] of CATEGORY_KEYWORDS) {
    const score = words.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { id, score };
  }
  return best.id;
};

const looksLikeRecordSentence = (sentence) => {
  const value = sentence.toLowerCase();
  return sentence.length >= 24 && sentence.length <= 260 && RECORD_HINTS.some((hint) => value.includes(hint));
};

const splitSentences = (text) =>
  cleanText(text)
    .split(/(?<=[.!?])\s+(?=[А-ЯA-ZӘІҢҒҮҰҚӨҺЁ0-9])/u)
    .map(cleanText)
    .filter((item) => item.length >= 20);

const makeTitle = (sentence) => {
  const title = cleanText(sentence.replace(/^[\d\s.:-]+/, ""));
  if (title.length <= 150) return title;
  const comma = title.indexOf(",");
  if (comma > 40 && comma < 150) return title.slice(0, comma);
  return `${title.slice(0, 147).trim()}...`;
};

export const extractPdfTextPages = async (filePath) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = cleanText(content.items.map((item) => item.str || "").join(" "));
    pages.push({ page: pageNumber, text });
  }

  return pages;
};

export const extractRecordCandidates = (pages, issueTitle) => {
  const records = [];
  const seen = new Set();
  const issueYear = String(issueTitle || "").match(/\b(19|20)\d{2}\b/)?.[0] || "";

  for (const page of pages) {
    const sentences = splitSentences(page.text);
    for (let index = 0; index < sentences.length; index += 1) {
      const sentence = sentences[index];
      if (!looksLikeRecordSentence(sentence)) continue;

      const title = makeTitle(sentence);
      const key = normalizeKey(title);
      if (key.length < 20 || seen.has(key)) continue;
      seen.add(key);

      const next = sentences[index + 1] || "";
      const description = cleanText([sentence, next].join(" "));
      records.push({
        title,
        description: description.slice(0, 900),
        category: inferCategory(`${sentence} ${next} ${page.text.slice(0, 800)}`),
        holder: issueTitle || "PDF issue",
        location: "",
        date: issueYear ? `${issueYear}-01-01` : "",
        image: "/placeholder.svg",
        sourcePage: page.page,
      });
    }
  }

  return records;
};

export const resolveLocalIssuePath = (pdfUrl) => {
  if (!pdfUrl || /^https?:\/\//i.test(pdfUrl)) return null;
  const relative = pdfUrl.startsWith("/") ? pdfUrl.slice(1) : pdfUrl;
  const fullPath = path.resolve(process.cwd(), "public", relative.replace(/^uploads[\\/]/, "uploads/"));
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  if (!fullPath.startsWith(uploadsRoot) || !fs.existsSync(fullPath)) return null;
  return fullPath;
};
