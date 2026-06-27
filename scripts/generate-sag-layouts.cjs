/* eslint-disable @typescript-eslint/no-require-imports */
const fsp = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const SAG_FORMS_PATH = path.join(process.cwd(), "public", "forms", "sag");
const TEMPLATES_FILE_PATH = path.join(process.cwd(), "src", "lib", "sag-form-templates.generated.ts");
const OUTPUT_FILE_PATH = path.join(process.cwd(), "src", "lib", "sag-form-layouts.generated.ts");

function normalizeWhitespace(value) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function fixMojibake(value) {
  return value
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â|Ã¢â‚¬Âœ|Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â„¢|Ã¢â‚¬Ëœ|Ã¢â‚¬â„¢|Ã¢â‚¬Ëœ/g, "'")
    .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(/Ã¢â‚¬Â¦/g, "...")
    .replace(/ÃƒÂ±/g, "n");
}

function normalizeSagLayoutText(value) {
  return normalizeWhitespace(fixMojibake(String(value ?? "").replace(/\u00a0/g, " ")));
}

function normalizeSagQuestionText(value) {
  return normalizeSagLayoutText(value)
    .replace(/^[\u2022\u25cf\u00b7\uf0b7]\s*/i, "")
    .replace(/^\d+\.\s+/i, "")
    .replace(/^-\s+/i, "")
    .replace(/\s+([,.;:!?*])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");
}

function createSagQuestionMatchKey(value) {
  return normalizeSagQuestionText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function createSagSourceLookupKey(value) {
  return normalizeSagLayoutText(value)
    .toLowerCase()
    .replace(/^sag\s*-\s*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9() ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSagMetadataLine(value) {
  const line = normalizeSagLayoutText(value);

  if (!line) {
    return true;
  }

  return (
    /^reference\b/i.test(line) ||
    /^rev\.\s*no\./i.test(line) ||
    /^tesda\b/i.test(line) ||
    /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line) ||
    /^[A-Z0-9-]+(?:\s+ver\.\s*[\d.]+)?\s+\d+$/i.test(line) ||
    /^[A-Z0-9-]+\s+\d+$/i.test(line)
  );
}

function isSagQuestionHeaderText(value) {
  const line = normalizeSagLayoutText(value);
  const compactLine = line.replace(/\s+/g, "");
  return /^(CanI\?YESNO|AmIawareYESNO)$/i.test(compactLine);
}

function isSagNonQuestionLine(value) {
  const line = normalizeSagLayoutText(value);

  if (!line || isSagMetadataLine(line)) {
    return true;
  }

  return (
    /^self[- ]assessment guide$/i.test(line) ||
    /^qualification\b/i.test(line) ||
    /^unit of competenc(?:y|ies)\b/i.test(line) ||
    /^covered:?$/i.test(line) ||
    /^instruction:?$/i.test(line) ||
    /^read each of the questions/i.test(line) ||
    /^place a check in the appropriate box/i.test(line) ||
    /^answer\.?$/i.test(line) ||
    /^i agree to undertake assessment/i.test(line) ||
    /^(candidate['’`]?s?(?: name(?: and signature)?)?|date)\b/i.test(line) ||
    isSagQuestionHeaderText(line)
  );
}

function looksLikeSagHeadingOnly(value) {
  const line = normalizeSagLayoutText(value);

  return (
    /^units?\s+of\s+competenc(?:y|ies)\s*:?\s*$/i.test(line) ||
    /^covered\s*:?\s*$/i.test(line) ||
    /^qualification(?: title)?\s*:?\s*$/i.test(line)
  );
}

function looksLikeSagSectionTitle(value) {
  const line = normalizeSagLayoutText(value);

  if (!line || /[,:*?]/.test(line)) {
    return false;
  }

  const words = line.split(/\s+/).filter(Boolean);

  if (words.length === 0 || words.length > 6) {
    return false;
  }

  return words.every((word) => /^[A-Z][A-Za-z/&()-]*$/.test(word));
}

async function loadSagTemplates() {
  const fileContents = await fsp.readFile(TEMPLATES_FILE_PATH, "utf8");
  const exportMarker = "export const sagFormTemplates: SagFormDefinition[] = ";
  const markerIndex = fileContents.indexOf(exportMarker);

  if (markerIndex < 0) {
    throw new Error("Unable to find sagFormTemplates export.");
  }

  const equalsIndex = fileContents.indexOf("=", markerIndex);
  const startIndex = fileContents.indexOf("[", equalsIndex);
  const endIndex = fileContents.lastIndexOf("];");

  if (startIndex < 0 || endIndex < 0) {
    throw new Error("Unable to read SAG templates JSON payload.");
  }

  return JSON.parse(fileContents.slice(startIndex, endIndex + 1));
}

async function loadPdfJs() {
  return import(pathToFileURL(path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);
}

async function getSagSourceFiles() {
  const entries = await fsp.readdir(SAG_FORMS_PATH, { withFileTypes: true });
  const fileMap = new Map();

  entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    .forEach((entry) => {
      const normalizedTitle = entry.name.replace(/\.pdf$/i, "");
      fileMap.set(createSagSourceLookupKey(normalizedTitle), entry.name);
    });

  return fileMap;
}

function buildSagLines(items, pageIndex) {
  const groupedLines = [];

  items.forEach((item) => {
    const text = item.str ?? "";

    if (!text.trim()) {
      return;
    }

    const lineY = item.transform[5];
    const existingLine = groupedLines.find((line) => Math.abs(line.keyY - lineY) <= 1);

    const word = {
      height: item.height,
      text,
      width: item.width,
      x: item.transform[4],
      y: item.transform[5],
    };

    if (existingLine) {
      existingLine.words.push(word);
      existingLine.keyY = Math.max(existingLine.keyY, lineY);
      return;
    }

    groupedLines.push({
      keyY: lineY,
      words: [word],
    });
  });

  return groupedLines
    .map(({ keyY, words }) => ({
      pageIndex,
      words: words.sort((left, right) => left.x - right.x),
      y: Math.round(keyY * 10) / 10,
    }))
    .sort((left, right) => right.y - left.y);
}

function extractSagHeaderPlacement(line) {
  const text = normalizeSagLayoutText(line.words.map((word) => word.text).join(""));

  if (!isSagQuestionHeaderText(text)) {
    return null;
  }

  const yesWord = line.words.find((word) => /^YES$/i.test(normalizeSagLayoutText(word.text)));
  const noWord = line.words.find((word) => /^NO$/i.test(normalizeSagLayoutText(word.text)));

  if (!yesWord || !noWord) {
    return null;
  }

  return {
    noCenterX: noWord.x + noWord.width / 2,
    pageIndex: line.pageIndex,
    y: line.y,
    yesCenterX: yesWord.x + yesWord.width / 2,
  };
}

async function buildSagQuestionPlacements(pdfjs, sourcePdfPath, sagForm) {
  const pdfBytes = new Uint8Array(await fsp.readFile(sourcePdfPath));
  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    useSystemFonts: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const streamLines = [];
    let activeHeader = null;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines = buildSagLines(textContent.items, pageNumber - 1);

      lines.forEach((line) => {
        const header = extractSagHeaderPlacement(line);

        if (header) {
          activeHeader = header;
          return;
        }

        if (activeHeader) {
          streamLines.push({
            ...line,
            header: activeHeader,
          });
        }
      });
    }

    const placements = [];
    const expectedQuestions = sagForm.units.flatMap((unit) => unit.questions);
    let searchStartIndex = 0;

    function findPlacement(question, startIndex) {
      const expectedKey = createSagQuestionMatchKey(question.text);

      for (let lineIndex = startIndex; lineIndex < streamLines.length; lineIndex += 1) {
        const startLine = streamLines[lineIndex];
        const firstLineText = normalizeSagQuestionText(startLine.words.map((word) => word.text).join(""));

        if (!firstLineText || isSagNonQuestionLine(firstLineText)) {
          continue;
        }

        let combinedText = "";

        for (let nextIndex = lineIndex; nextIndex < streamLines.length; nextIndex += 1) {
          const currentLine = streamLines[nextIndex];
          const currentText = normalizeSagQuestionText(currentLine.words.map((word) => word.text).join(""));

          if (!currentText || isSagQuestionHeaderText(currentText) || /^i agree to undertake assessment/i.test(currentText)) {
            break;
          }

          if (nextIndex > lineIndex && isSagNonQuestionLine(currentText)) {
            break;
          }

          combinedText = normalizeSagQuestionText(`${combinedText} ${currentText}`);
          const combinedKey = createSagQuestionMatchKey(combinedText);

          if (combinedKey === expectedKey) {
            return {
              nextSearchStartIndex: nextIndex + 1,
              placement: {
                noCenterX: startLine.header.noCenterX,
                pageIndex: startLine.pageIndex,
                questionId: question.id,
                y: startLine.y,
                yesCenterX: startLine.header.yesCenterX,
              },
            };
          }

          if (!expectedKey.startsWith(combinedKey)) {
            break;
          }
        }
      }

      return null;
    }

    for (const question of expectedQuestions) {
      const primaryMatch = findPlacement(question, searchStartIndex);
      const fallbackMatch = primaryMatch ? null : findPlacement(question, 0);
      const resolvedMatch = primaryMatch ?? fallbackMatch;
      const matchedPlacement = resolvedMatch?.placement ?? null;

      if (!matchedPlacement) {
        if (
          looksLikeSagHeadingOnly(question.text) ||
          (placements.length === 0 && looksLikeSagSectionTitle(question.text)) ||
          placements.length === 0
        ) {
          console.warn(`Skipping unmapped pre-checklist item for ${sagForm.qualificationTitle}: ${question.text}`);
          continue;
        }

        throw new Error(`Unable to locate the SAG question in the source PDF: ${sagForm.qualificationTitle} :: ${question.text}`);
      }

      searchStartIndex = resolvedMatch?.nextSearchStartIndex ?? searchStartIndex;
      placements.push(matchedPlacement);
    }

    return placements;
  } finally {
    await loadingTask.destroy();
  }
}

async function main() {
  const pdfjs = await loadPdfJs();
  const sagTemplates = await loadSagTemplates();
  const sourceFiles = await getSagSourceFiles();
  const layouts = [];
  const failures = [];

  for (const sagForm of sagTemplates) {
    const lookupKey = createSagSourceLookupKey(sagForm.qualificationTitle);
    const sourceFileName =
      sourceFiles.get(lookupKey) ??
      Array.from(sourceFiles.entries()).find(([key]) => key.includes(lookupKey) || lookupKey.includes(key))?.[1];

    if (!sourceFileName) {
      throw new Error(`No source SAG PDF found for ${sagForm.qualificationTitle}`);
    }

    const sourcePdfPath = path.join(SAG_FORMS_PATH, sourceFileName);

    try {
      const placements = await buildSagQuestionPlacements(pdfjs, sourcePdfPath, sagForm);

      layouts.push({
        placementByQuestionId: Object.fromEntries(
          placements.map((placement) => [
            placement.questionId,
            {
              noCenterX: placement.noCenterX,
              pageIndex: placement.pageIndex,
              y: placement.y,
              yesCenterX: placement.yesCenterX,
            },
          ]),
        ),
        qualificationTitle: sagForm.qualificationTitle,
        sourceFileName,
      });

      console.log(`Mapped ${sagForm.qualificationTitle} -> ${sourceFileName} (${placements.length} questions)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ qualificationTitle: sagForm.qualificationTitle, message, sourceFileName });
      console.warn(`Failed to map ${sagForm.qualificationTitle}: ${message}`);
    }
  }

  const output = `export type SagGeneratedLayoutPlacement = {
  noCenterX: number;
  pageIndex: number;
  y: number;
  yesCenterX: number;
};

export type SagGeneratedLayout = {
  placementByQuestionId: Record<string, SagGeneratedLayoutPlacement>;
  qualificationTitle: string;
  sourceFileName: string;
};

export const sagGeneratedLayouts: SagGeneratedLayout[] = ${JSON.stringify(layouts, null, 2)};\n`;

  await fsp.writeFile(OUTPUT_FILE_PATH, output, "utf8");
  console.log(`Wrote ${layouts.length} SAG layouts to ${OUTPUT_FILE_PATH}`);

  if (failures.length > 0) {
    console.warn(`Skipped ${failures.length} SAG layouts due to mapping issues.`);
    failures.forEach((failure) => {
      console.warn(`- ${failure.qualificationTitle} (${failure.sourceFileName}): ${failure.message}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
