import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createSagLookupKey,
  normalizeSagProgramTitle,
  type SagFormDefinition,
  type SagQuestionDefinition,
  type SagUnitDefinition,
} from "@/lib/sag-form-schema";

export type SagQuestionPlacement = {
  noCenterX: number;
  pageIndex: number;
  y: number;
  yesCenterX: number;
};

export type SagIdentityPlacement = {
  candidateLabelRightX: number | null;
  candidateY: number | null;
  dateLabelRightX: number | null;
  dateY: number | null;
  pageIndex: number;
};

type PdfLineWord = {
  text: string;
  width: number;
  x: number;
};

type PdfLine = {
  pageIndex: number;
  text: string;
  words: PdfLineWord[];
  x: number;
  y: number;
};

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
};

const SAG_FORMS_DIRECTORY_PATH = path.join(process.cwd(), "public", "forms", "sag");
const BULLET_LINE_PATTERN = /^[\u2022\u25cf\u00b7\uf0b7]\s*/i;
const NUMBERED_QUESTION_PATTERN = /^\d+\.\s+/;
const CHECKLIST_MARKER_PATTERN = /^(Can I\?|Am I aware)\s+YES\s+NO$/i;
const DEFAULT_AGREEMENT_TEXT =
  "I agree to undertake assessment in the knowledge that information gathered will only be used for professional development purposes and can only be accessed by concerned assessment personnel and my manager/supervisor.";
const DEFAULT_INSTRUCTION_LINES = [
  "Instruction:",
  "Read each of the questions in the left-hand column of the chart.",
  "Place a check in the appropriate box opposite each question to indicate your answer.",
] satisfies string[];

let pdfJsPromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;
let sagSourceFilesPromise: Promise<Map<string, string>> | null = null;
let sagParsedFormsPromise: Promise<SagFormDefinition[]> | null = null;

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function fixMojibake(value: string) {
  return value
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â/g, '"')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“/g, "'")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, "-")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦/g, "...")
    .replace(/ÃƒÆ’Ã‚Â±/g, "n");
}

function cleanText(value: string) {
  return normalizeWhitespace(fixMojibake(String(value ?? "").replace(/\t/g, " ")));
}

function normalizeQuestionText(value: string) {
  return cleanText(value)
    .replace(BULLET_LINE_PATTERN, "")
    .replace(NUMBERED_QUESTION_PATTERN, "")
    .replace(/^-\s+/i, "")
    .replace(/\s+([,.;:!?*])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");
}

function slugify(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createQuestionId(unitTitle: string, questionIndex: number) {
  const prefix = slugify(unitTitle) || "sag";
  return `${prefix}-${String(questionIndex + 1).padStart(2, "0")}`;
}

function createQuestionMatchKey(value: string) {
  return normalizeQuestionText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function isMetadataLine(value: string) {
  const line = cleanText(value);

  if (!line) {
    return true;
  }

  return (
    /^reference\b/i.test(line) ||
    /^rev\.\s*no\./i.test(line) ||
    /^tesda\b/i.test(line) ||
    /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line) ||
    /^[A-Z0-9-]+(?:\s+ver\.\s*[\d.]+)?\s+\d+$/i.test(line) ||
    /^[A-Za-z].*NC\s+[I0-9VXLCDM]+\s+\d+$/i.test(line) ||
    /^[A-Z0-9-]+\s+\d+$/i.test(line)
  );
}

function isInstructionLine(value: string) {
  return /^instruction:?$/i.test(cleanText(value));
}

function isInstructionContentLine(value: string) {
  const line = cleanText(value);
  return (
    /^read each/i.test(line) ||
    /^place a check/i.test(line) ||
    /^answer\.?$/i.test(line) ||
    /^\d+\.\s*read each/i.test(line) ||
    /^\d+\.\s*place a check/i.test(line) ||
    /^[a-z]\.\s*read each/i.test(line) ||
    /^[a-z]\.\s*place a check/i.test(line)
  );
}

function isChecklistHeaderLine(value: string) {
  const line = cleanText(value);
  return CHECKLIST_MARKER_PATTERN.test(line) || /^(Can I\?|Am I aware)$/i.test(line) || /^YES\s+NO$/i.test(line);
}

function isAgreementStartLine(value: string) {
  return /^I agree to undertake assessment/i.test(cleanText(value));
}

function isCandidateOrDateLine(value: string) {
  return /^(candidate['’`]?s?(?: name(?: and signature)?)?|date)\b/i.test(cleanText(value));
}

function isQuestionStartLine(value: string) {
  const line = cleanText(value);
  return BULLET_LINE_PATTERN.test(line) || NUMBERED_QUESTION_PATTERN.test(line);
}

function isAllUpperBanner(value: string) {
  const line = cleanText(value);
  return line.length > 0 && line === line.toUpperCase() && /[A-Z]/.test(line);
}

function isProjectBanner(value: string) {
  return /^project\s+\d+\s*:/i.test(cleanText(value));
}

function splitInstructionLine(value: string) {
  const line = cleanText(value);
  const remainder = line.replace(/^instruction:\s*/i, "").trim();
  return remainder ? ["Instruction:", remainder] : ["Instruction:"];
}

function joinWords(words: PdfLineWord[]) {
  const sortedWords = [...words].sort((left, right) => left.x - right.x);
  let output = "";
  let previousWord: PdfLineWord | null = null;

  for (const word of sortedWords) {
    const text = String(word.text ?? "");

    if (!text) {
      continue;
    }

    if (!previousWord) {
      output += text;
      previousWord = word;
      continue;
    }

    const previousRightEdge = previousWord.x + previousWord.width;
    const gap = word.x - previousRightEdge;
    const previousOutput = output.trimEnd();
    const shouldInsertSpace =
      !/\s$/.test(output) && !/^[,.;:!?)]/.test(text) && !/[-–]$/.test(previousOutput) && gap > 1.5;

    if (shouldInsertSpace) {
      output += " ";
    }

    output += text;
    previousWord = word;
  }

  return cleanText(output);
}

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
      ).href;
      return pdfjs;
    });
  }

  return pdfJsPromise;
}

function getLineRightEdge(line: PdfLine) {
  return line.words.reduce((maxRight, word) => Math.max(maxRight, word.x + word.width), line.x);
}

function getLineRightEdgeBeforeX(line: PdfLine, maxX: number) {
  const eligibleWords = line.words.filter(
    (word) => word.x < maxX && word.text.trim().length > 0,
  );

  if (eligibleWords.length === 0) {
    return null;
  }

  return eligibleWords.reduce((maxRight, word) => Math.max(maxRight, word.x + word.width), line.x);
}

function findBottomMostLine(lines: PdfLine[], matcher: (line: PdfLine) => boolean) {
  return lines
    .filter(matcher)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0] ?? null;
}

function findBottomMostWord(
  lines: PdfLine[],
  matcher: (word: PdfLineWord) => boolean,
  scorer?: (word: PdfLineWord) => number,
) {
  return lines
    .flatMap((line) =>
      line.words.map((word) => ({
        ...word,
        pageIndex: line.pageIndex,
        y: line.y,
      })),
    )
    .filter(matcher)
    .sort((left, right) => {
      if (left.y !== right.y) {
        return left.y - right.y;
      }

      const scoreDelta = (scorer?.(left) ?? 0) - (scorer?.(right) ?? 0);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.x - right.x;
    })[0] ?? null;
}

async function extractPdfLines(filePath: string) {
  const pdfjs = await loadPdfJs();
  const pdfBytes = new Uint8Array(await readFile(filePath));
  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    useSystemFonts: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const allLines: PdfLine[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const groupedLines: Array<{ keyY: number; words: PdfLineWord[] }> = [];

      textContent.items.forEach((item) => {
        if (!("str" in item) || !("transform" in item) || !("width" in item)) {
          return;
        }

        const textItem = item as PdfTextItem;
        const text = String(textItem.str ?? "");

        if (!text) {
          return;
        }

        const x = textItem.transform[4];
        const y = textItem.transform[5];
        const existingLine = groupedLines.find((line) => Math.abs(line.keyY - y) <= 1.5);
        const word = {
          text,
          width: textItem.width,
          x,
        };

        if (existingLine) {
          existingLine.words.push(word);
          existingLine.keyY = Math.max(existingLine.keyY, y);
          return;
        }

        groupedLines.push({
          keyY: y,
          words: [word],
        });
      });

      allLines.push(
        ...groupedLines
          .map(({ keyY, words }) => {
            const sortedWords = words.sort((left, right) => left.x - right.x);
            const firstVisibleWord = sortedWords.find((word) => String(word.text ?? "").trim().length > 0);

            return {
              pageIndex: pageNumber - 1,
              text: joinWords(sortedWords),
              words: sortedWords,
              x: firstVisibleWord?.x ?? 0,
              y: Math.round(keyY * 10) / 10,
            };
          })
          .filter((line) => line.text.length > 0)
          .sort((left, right) => right.y - left.y),
      );
    }

    return allLines;
  } finally {
    await loadingTask.destroy();
  }
}

function getOrCreateUnit(units: SagUnitDefinition[], title: string) {
  const normalizedTitle = cleanText(title);
  const lookupKey = createSagLookupKey(normalizedTitle);
  const existingUnit = units.find((unit) => createSagLookupKey(unit.title) === lookupKey);

  if (existingUnit) {
    return existingUnit;
  }

  const nextUnit: SagUnitDefinition = {
    id: slugify(normalizedTitle) || "unit",
    questions: [],
    title: normalizedTitle,
  };
  units.push(nextUnit);
  return nextUnit;
}

function isLikelyUnitTitle(line: PdfLine, nextMeaningfulLine: PdfLine | null) {
  const text = cleanText(line.text);

  if (
    !text ||
    isQuestionStartLine(text) ||
    isMetadataLine(text) ||
    isInstructionLine(text) ||
    isInstructionContentLine(text) ||
    isChecklistHeaderLine(text) ||
    isAgreementStartLine(text) ||
    isCandidateOrDateLine(text) ||
    isProjectBanner(text) ||
    line.x > 80 ||
    /^qualification\b/i.test(text) ||
    /^projects?\b/i.test(text) ||
    /^units?\s+of\b/i.test(text) ||
    /^covered\b/i.test(text) ||
    /^note\b/i.test(text)
  ) {
    return false;
  }

  if (isAllUpperBanner(text)) {
    return false;
  }

  if (!nextMeaningfulLine) {
    return false;
  }

  return isQuestionStartLine(nextMeaningfulLine.text) || isChecklistHeaderLine(nextMeaningfulLine.text);
}

function findNextMeaningfulLine(lines: PdfLine[], startIndex: number) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line || isMetadataLine(line.text)) {
      continue;
    }

    return line;
  }

  return null;
}

function finalizeForm(form: SagFormDefinition) {
  const units = form.units
    .map((unit) => {
      const mergedQuestions: SagQuestionDefinition[] = [];

      unit.questions.forEach((question) => {
        const normalizedQuestion = {
          ...question,
          text: normalizeQuestionText(question.text),
        };

        const previousQuestion = mergedQuestions[mergedQuestions.length - 1];

        if (
          previousQuestion &&
          !/[.?!*]$/.test(previousQuestion.text) &&
          (/^[a-z(]/.test(normalizedQuestion.text) ||
            /^(and|or|with|without|to|of|for|from|in|on|as|according|based|following|using|being)\b/i.test(
              normalizedQuestion.text,
            ))
        ) {
          previousQuestion.text = cleanText(`${previousQuestion.text} ${normalizedQuestion.text}`);
          return;
        }

        mergedQuestions.push(normalizedQuestion);
      });

      return {
        ...unit,
        id: slugify(unit.title) || "unit",
        questions: mergedQuestions
          .filter((question) => question.text.length > 0)
          .map((question, questionIndex) => ({
            ...question,
            id: createQuestionId(unit.title, questionIndex),
          })),
        title: cleanText(unit.title),
      };
    })
    .filter((unit) => unit.questions.length > 0);

  return {
    ...form,
    agreementText: form.agreementText || DEFAULT_AGREEMENT_TEXT,
    instructionLines: form.instructionLines.length > 0 ? form.instructionLines : [...DEFAULT_INSTRUCTION_LINES],
    units,
  };
}

async function parseSagPdf(filePath: string) {
  const lines = await extractPdfLines(filePath);
  const qualificationTitle = normalizeSagProgramTitle(path.basename(filePath));
  const form: SagFormDefinition = {
    agreementText: "",
    instructionLines: [],
    qualificationTitle,
    title: "SELF-ASSESSMENT GUIDE",
    units: [],
  };

  const coveredTitles: string[] = [];
  let currentUnit: SagUnitDefinition | null = null;
  let activeQuestion: SagQuestionDefinition | null = null;
  let activeQuestionX = 0;
  let collectingCoveredTitles = false;
  let collectingInstructions = false;
  let inChecklist = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const text = cleanText(line.text);
    const nextMeaningfulLine = findNextMeaningfulLine(lines, index + 1);

    if (!text || isMetadataLine(text)) {
      continue;
    }

    if (isAgreementStartLine(text)) {
      const agreementParts = [text];
      let agreementIndex = index + 1;

      while (agreementIndex < lines.length) {
        const agreementLine = cleanText(lines[agreementIndex]?.text ?? "");

        if (!agreementLine || isMetadataLine(agreementLine) || isCandidateOrDateLine(agreementLine)) {
          break;
        }

        agreementParts.push(agreementLine);
        agreementIndex += 1;
      }

      form.agreementText = cleanText(agreementParts.join(" "));
      break;
    }

    if (/^qualification\b/i.test(text) || /^self[- ]assessment guide$/i.test(text)) {
      continue;
    }

    if (/^projects?\b/i.test(text) || /^full qualification\b/i.test(text)) {
      collectingCoveredTitles = true;
      continue;
    }

    if (/^units?\s+of\b/i.test(text) || /^competency\b/i.test(text) || /^covered\b/i.test(text)) {
      collectingCoveredTitles = true;

      const inlineBulletMatch = text.match(/[•\u2022](.+)$/);

      if (inlineBulletMatch?.[1]) {
        coveredTitles.push(cleanText(inlineBulletMatch[1]));
      }

      continue;
    }

    if (collectingCoveredTitles) {
      if (isInstructionLine(text)) {
        collectingCoveredTitles = false;
        collectingInstructions = true;
        form.instructionLines = splitInstructionLine(text);
        continue;
      }

      if (isQuestionStartLine(text) && line.x >= 120) {
        coveredTitles.push(normalizeQuestionText(text));
        continue;
      }

      if (/^[•\u2022]/.test(text) || line.x >= 120) {
        if (coveredTitles.length > 0 && !/^[•\u2022]/.test(text)) {
          coveredTitles[coveredTitles.length - 1] = cleanText(`${coveredTitles[coveredTitles.length - 1]} ${text}`);
          continue;
        }

        coveredTitles.push(normalizeQuestionText(text));
        continue;
      }

      continue;
    }

    if (isInstructionLine(text)) {
      collectingInstructions = true;
      form.instructionLines = splitInstructionLine(text);
      continue;
    }

    if (collectingInstructions) {
      if (isChecklistHeaderLine(text)) {
        collectingInstructions = false;
        inChecklist = true;
        activeQuestion = null;

        if (/^am i aware/i.test(text)) {
          currentUnit = getOrCreateUnit(form.units, "AM I AWARE");
        }

        continue;
      }

      if (isInstructionContentLine(text)) {
        form.instructionLines.push(normalizeQuestionText(text));
      }

      continue;
    }

    if (isChecklistHeaderLine(text)) {
      inChecklist = true;
      activeQuestion = null;

      if (/^am i aware/i.test(text)) {
        currentUnit = getOrCreateUnit(form.units, "AM I AWARE");
      }

      continue;
    }

    if (!inChecklist) {
      continue;
    }

    if (isProjectBanner(text) || isAllUpperBanner(text) || /^note\b/i.test(text)) {
      activeQuestion = null;
      continue;
    }

    if (isLikelyUnitTitle(line, nextMeaningfulLine)) {
      currentUnit = getOrCreateUnit(form.units, text);
      activeQuestion = null;
      continue;
    }

    if (isQuestionStartLine(text)) {
      if (!currentUnit) {
        currentUnit = getOrCreateUnit(form.units, coveredTitles[0] ?? qualificationTitle);
      }

      const nextQuestion: SagQuestionDefinition = {
        id: "",
        text: normalizeQuestionText(text),
      };

      currentUnit.questions.push(nextQuestion);
      activeQuestion = nextQuestion;
      activeQuestionX = line.x;
      continue;
    }

    if (
      activeQuestion &&
      !isLikelyUnitTitle(line, nextMeaningfulLine) &&
      !isChecklistHeaderLine(text) &&
      !isCandidateOrDateLine(text) &&
      !isProjectBanner(text) &&
      !isAllUpperBanner(text) &&
      (line.x >= activeQuestionX + 8 || /^[a-z(]/.test(text) || /^(and|or|with|to|of|for|from|in|on|as|according|based|following|using)\b/i.test(text))
    ) {
      activeQuestion.text = cleanText(`${activeQuestion.text} ${text}`);
    }
  }

  return finalizeForm(form);
}

function scoreSagForm(form: SagFormDefinition) {
  const questions = form.units.flatMap((unit) => unit.questions);
  let penalty = 0;

  questions.forEach((question) => {
    const text = cleanText(question.text);

    if (/^(project|units? of|covered|instruction|reference)\b/i.test(text)) {
      penalty += 10;
    }

    if (/^[A-Z]\.\s+/.test(text)) {
      penalty += 8;
    }

    if (text.split(/\s+/).length <= 2 && !/[?*]$/.test(text)) {
      penalty += 6;
    }

    if (/^(and|or|with|without|to|of|for|from|in|on|as|according|based|following|using)\b/i.test(text)) {
      penalty += 8;
    }
  });

  return questions.length * 10 - penalty;
}

export async function loadSagSourceFiles() {
  if (!sagSourceFilesPromise) {
    const nextPromise = (async () => {
      const entries = await readdir(SAG_FORMS_DIRECTORY_PATH, { withFileTypes: true });
      const fileMap = new Map<string, string>();

      entries
        .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
        .forEach((entry) => {
          const normalizedTitle = entry.name.replace(/\.pdf$/i, "");
          fileMap.set(createSagLookupKey(normalizedTitle), path.join(SAG_FORMS_DIRECTORY_PATH, entry.name));
        });

      return fileMap;
    })();

    sagSourceFilesPromise = nextPromise;
  }

  return sagSourceFilesPromise.finally(() => {
    sagSourceFilesPromise = null;
  });
}

export async function resolveSagSourcePdfPath(qualificationTitle: string) {
  const fileMap = await loadSagSourceFiles();
  const lookupKey = createSagLookupKey(qualificationTitle);
  const directMatch = fileMap.get(lookupKey);

  if (directMatch) {
    return directMatch;
  }

  const fallbackMatch = Array.from(fileMap.entries()).find(([key]) => key.includes(lookupKey) || lookupKey.includes(key));
  return fallbackMatch?.[1] ?? null;
}

export async function loadSagFormsFromPdfFiles() {
  if (!sagParsedFormsPromise) {
    const nextPromise = (async () => {
      const fileMap = await loadSagSourceFiles();
      const settledForms = await Promise.allSettled(
        Array.from(fileMap.values())
          .sort()
          .map((filePath) => parseSagPdf(filePath)),
      );

      return settledForms
        .filter((result): result is PromiseFulfilledResult<SagFormDefinition> => result.status === "fulfilled")
        .map((result) => result.value)
        .sort((left, right) => left.qualificationTitle.localeCompare(right.qualificationTitle));
    })();

    sagParsedFormsPromise = nextPromise;
  }

  return sagParsedFormsPromise.finally(() => {
    sagParsedFormsPromise = null;
  });
}

export async function buildSagQuestionPlacements(sourcePdfPath: string, sagForm: SagFormDefinition) {
  const lines = await extractPdfLines(sourcePdfPath);
  const placements: Record<string, SagQuestionPlacement> = {};
  let activeHeader: { noCenterX: number; pageIndex: number; yesCenterX: number } | null = null;
  const questionRows: Array<PdfLine & { header: { noCenterX: number; pageIndex: number; yesCenterX: number } }> = [];

  lines.forEach((line) => {
    const compactLine = cleanText(line.text).replace(/\s+/g, "");

    if (/^(CanI\?YESNO|AmIawareYESNO)$/i.test(compactLine)) {
      const yesWord = line.words.find((word) => /^YES$/i.test(cleanText(word.text)));
      const noWord = line.words.find((word) => /^NO$/i.test(cleanText(word.text)));

      if (yesWord && noWord) {
        activeHeader = {
          noCenterX: noWord.x + noWord.width / 2,
          pageIndex: line.pageIndex,
          yesCenterX: yesWord.x + yesWord.width / 2,
        };
      }

      return;
    }

    if (!activeHeader) {
      return;
    }

    questionRows.push({
      ...line,
      header: activeHeader,
    });
  });

  const expectedQuestions = sagForm.units.flatMap((unit) => unit.questions);
  let searchStartIndex = 0;

  for (const question of expectedQuestions) {
    const expectedKey = createQuestionMatchKey(question.text);
    let matched = false;

    for (let lineIndex = searchStartIndex; lineIndex < questionRows.length; lineIndex += 1) {
      const startLine = questionRows[lineIndex];
      const startLineKey = createQuestionMatchKey(startLine.text);

      if (!isQuestionStartLine(startLine.text) && (!startLineKey || !expectedKey.startsWith(startLineKey))) {
        continue;
      }

      let combinedText = normalizeQuestionText(startLine.text);

      for (let nextIndex = lineIndex; nextIndex < questionRows.length; nextIndex += 1) {
        const currentLine = questionRows[nextIndex];

        if (nextIndex > lineIndex) {
          if (isQuestionStartLine(currentLine.text) || isChecklistHeaderLine(currentLine.text) || isAgreementStartLine(currentLine.text)) {
            break;
          }

          combinedText = cleanText(`${combinedText} ${currentLine.text}`);
          combinedText = normalizeQuestionText(combinedText);
        }

        const combinedKey = createQuestionMatchKey(combinedText);

        if (combinedKey === expectedKey) {
          placements[question.id] = {
            noCenterX: startLine.header.noCenterX,
            pageIndex: startLine.pageIndex,
            y: startLine.y,
            yesCenterX: startLine.header.yesCenterX,
          };
          searchStartIndex = nextIndex + 1;
          matched = true;
          break;
        }

        if (!expectedKey.startsWith(combinedKey)) {
          break;
        }
      }

      if (matched) {
        break;
      }
    }
  }

  return placements;
}

export async function buildSagIdentityPlacement(sourcePdfPath: string): Promise<SagIdentityPlacement | null> {
  const lines = await extractPdfLines(sourcePdfPath);

  if (lines.length === 0) {
    return null;
  }

  const lastPageIndex = lines.reduce((maxPageIndex, line) => Math.max(maxPageIndex, line.pageIndex), 0);
  const lastPageLines = lines.filter((line) => line.pageIndex === lastPageIndex);
  const candidateLine = findBottomMostLine(lastPageLines, (line) => /^candidate/i.test(cleanText(line.text)));
  const candidateWord = findBottomMostWord(lastPageLines, (word) => /^candidate/i.test(cleanText(word.text)));
  const dateWord =
    findBottomMostWord(lastPageLines, (word) => /^date:?$/i.test(cleanText(word.text)), (word) => word.width) ??
    findBottomMostWord(
      lastPageLines,
      (word) => /^date\b/i.test(cleanText(word.text)) && !/^date here$/i.test(cleanText(word.text)),
      (word) => word.width,
    );

  if (!candidateWord && !dateWord) {
    return null;
  }

  const candidateLabelRightX =
    candidateLine && dateWord && Math.abs((candidateLine.y ?? 0) - (dateWord.y ?? 0)) <= 2
      ? getLineRightEdgeBeforeX(candidateLine, dateWord.x) ?? getLineRightEdge(candidateLine)
      : candidateLine
        ? getLineRightEdge(candidateLine)
        : candidateWord
          ? candidateWord.x + candidateWord.width
          : null;

  return {
    candidateLabelRightX,
    candidateY: candidateLine?.y ?? candidateWord?.y ?? null,
    dateLabelRightX: dateWord ? dateWord.x + dateWord.width : null,
    dateY: dateWord?.y ?? null,
    pageIndex: lastPageIndex,
  };
}

export async function buildSagInstructionLines(sourcePdfPath: string): Promise<string[]> {
  const lines = await extractPdfLines(sourcePdfPath);

  if (lines.length === 0) {
    return [];
  }

  const firstPageLines = lines.filter((line) => line.pageIndex === 0);
  const startIndex = firstPageLines.findIndex(
    (line) => isInstructionLine(line.text) || isInstructionContentLine(line.text),
  );

  if (startIndex === -1) {
    return [];
  }

  const instructionLines: string[] = [];

  for (let lineIndex = startIndex; lineIndex < firstPageLines.length; lineIndex += 1) {
    const line = firstPageLines[lineIndex];

    if (
      lineIndex > startIndex &&
      (isChecklistHeaderLine(line.text) ||
        isAgreementStartLine(line.text) ||
        isCandidateOrDateLine(line.text))
    ) {
      break;
    }

    instructionLines.push(cleanText(line.text));
  }

  const mergedInstructionLines: string[] = [];

  instructionLines
    .filter(Boolean)
    .forEach((line) => {
      const previousLine = mergedInstructionLines[mergedInstructionLines.length - 1];
      const isContinuation =
        previousLine &&
        !/^instruction:?$/i.test(previousLine) &&
        !/^[\u2022\u25cf\u00b7\uf0b7]\s*/i.test(line) &&
        !/^\d+\.\s+/.test(line) &&
        !/^[A-Za-z]\.\s+/.test(line);

      if (isContinuation) {
        mergedInstructionLines[mergedInstructionLines.length - 1] = cleanText(`${previousLine} ${line}`);
        return;
      }

      mergedInstructionLines.push(line);
    });

  return mergedInstructionLines;
}

export function chooseBetterSagForm(primaryForm: SagFormDefinition, fallbackForm: SagFormDefinition) {
  const primaryQuestionCount = primaryForm.units.reduce((total, unit) => total + unit.questions.length, 0);
  const fallbackQuestionCount = fallbackForm.units.reduce((total, unit) => total + unit.questions.length, 0);

  if (primaryQuestionCount !== fallbackQuestionCount) {
    return primaryQuestionCount > fallbackQuestionCount ? primaryForm : fallbackForm;
  }

  return scoreSagForm(primaryForm) >= scoreSagForm(fallbackForm) ? primaryForm : fallbackForm;
}
