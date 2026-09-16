const FILE_TYPES = {
  projects: {
    category: "Projetos",
    title: ["project name", "name", "title"],
    subtitle: ["organization"],
    content: ["description"],
    external_url: ["url", "project url"],
  },
  positions: {
    category: "Empresas",
    title: ["title", "position"],
    subtitle: ["company name", "company"],
    content: ["description", "location"],
    external_url: ["url", "company url"],
  },
  education: {
    category: "Instituições de ensino",
    title: ["school name", "school", "institution"],
    subtitle: ["degree name", "field of study"],
    content: ["notes", "description"],
    external_url: ["url", "school url"],
  },
  honors: {
    category: "Prêmios",
    title: ["title", "name"],
    subtitle: ["issuer"],
    content: ["description"],
    external_url: ["url"],
  },
  certifications: {
    category: "Certificações",
    title: ["name", "title"],
    subtitle: ["authority", "organization"],
    content: ["url"],
    external_url: ["url"],
  },
  volunteer: {
    category: "Voluntariado",
    title: ["organization name", "organization", "role"],
    subtitle: ["role"],
    content: ["description"],
    external_url: ["url"],
  },
};

function normalize(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const delimiter = text.split(/\r?\n/, 1)[0].includes("\t") ? "\t" : ",";

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map(normalize);
  return rows.slice(1).map((values) => {
    const result = {};
    headers.forEach((header, index) => {
      result[header] = (values[index] || "").trim();
    });
    return result;
  });
}

function getFirstValue(row, names) {
  for (const name of names) {
    const value = row[normalize(name)];
    if (value) return value;
  }
  return "";
}

function typeForFilename(filename) {
  const name = normalize(filename);
  return Object.keys(FILE_TYPES).find((type) => name.includes(type));
}

function recordFromRow(row, type) {
  const definition = FILE_TYPES[type];
  const title = getFirstValue(row, definition.title);
  if (!title) return null;

  const subtitle = getFirstValue(row, definition.subtitle);
  const content = getFirstValue(row, definition.content);
  const externalUrl = getFirstValue(row, definition.external_url);
  const dates = [
    getFirstValue(row, ["started on", "start date"]),
    getFirstValue(row, ["finished on", "end date", "issue date"]),
  ].filter(Boolean);

  return {
    title,
    subtitle,
    content: [content, dates.join(" - ")].filter(Boolean).join("\n"),
    external_url: externalUrl,
    categoryName: definition.category,
  };
}

async function readEntries(file) {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return [{ name: file.name, text: await file.text() }];
  }

  const JSZip = (await import("jszip")).default;
  const archive = await JSZip.loadAsync(file);
  const entries = [];
  for (const [name, entry] of Object.entries(archive.files)) {
    if (!entry.dir && name.toLowerCase().endsWith(".csv")) {
      entries.push({ name, text: await entry.async("text") });
    }
  }
  return entries;
}

export async function parseLinkedInExport(file) {
  const entries = await readEntries(file);
  const records = [];

  entries.forEach(({ name, text }) => {
    const type = typeForFilename(name);
    if (!type) return;
    parseCsv(text).forEach((row) => {
      const record = recordFromRow(row, type);
      if (record) records.push(record);
    });
  });

  if (!records.length) {
    throw new Error(
      "Nenhum arquivo compatível foi encontrado. Use um CSV ou ZIP exportado pelo LinkedIn.",
    );
  }

  return records;
}

const PDF_SECTIONS = [
  { label: "experience", categoryName: "Empresas" },
  { label: "experiência", categoryName: "Empresas" },
  { label: "education", categoryName: "Instituições de ensino" },
  { label: "educação", categoryName: "Instituições de ensino" },
  { label: "projects", categoryName: "Projetos" },
  { label: "projetos", categoryName: "Projetos" },
  { label: "honors & awards", categoryName: "Prêmios" },
  { label: "certifications", categoryName: "Certificações" },
  { label: "certificações", categoryName: "Certificações" },
  { label: "volunteer experience", categoryName: "Voluntariado" },
  { label: "experiência voluntária", categoryName: "Voluntariado" },
];

function sectionForLine(line) {
  return PDF_SECTIONS.find((section) => normalize(line) === section.label);
}

function recordsFromPdfText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const records = [];
  let section = null;
  let block = [];

  function flushBlock() {
    if (!section || !block.length) return;
    const title = block[0];
    if (title && title.length <= 140) {
      records.push({
        title,
        subtitle: block[1] || "",
        content: block.slice(2).join("\n"),
        external_url: "",
        categoryName: section.categoryName,
        partial: true,
      });
    }
    block = [];
  }

  lines.forEach((line) => {
    const nextSection = sectionForLine(line);
    if (nextSection) {
      flushBlock();
      section = nextSection;
      return;
    }
    if (!section) return;
    if (/^https?:\/\//i.test(line)) return;
    if (/^(present|presente|\d{4}|\w+ \d{4})$/i.test(line)) {
      block.push(line);
      return;
    }
    if (block.length >= 3) flushBlock();
    block.push(line);
  });
  flushBlock();
  return records;
}

export async function parseLinkedInPdf(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join("\n"));
  }

  const records = recordsFromPdfText(pages.join("\n"));
  if (!records.length) {
    throw new Error(
      "Não foi possível identificar seções no PDF. Revise o arquivo e use a prévia antes de importar.",
    );
  }
  return records;
}
