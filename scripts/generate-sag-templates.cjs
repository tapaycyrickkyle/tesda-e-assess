/* eslint-disable @typescript-eslint/no-require-imports */
const fsp = require("node:fs/promises");
const path = require("node:path");
const { PDFParse } = require("pdf-parse");

const SAG_FORMS_PATH = path.join(process.cwd(), "public", "forms", "sag");
const OUTPUT_FILE_PATH = process.env.SAG_TEMPLATE_OUTPUT
  ? path.resolve(process.cwd(), process.env.SAG_TEMPLATE_OUTPUT)
  : path.join(process.cwd(), "src", "lib", "sag-form-templates.generated.ts");
const COMMON_AGREEMENT_TEXT =
  "I agree to undertake assessment in the knowledge that information gathered will only be used for professional development purposes and can only be accessed by concerned assessment personnel and my manager/supervisor.";
const BULLET_LINE_PATTERN = /^[\u2022\u25cf\u00b7\uf0b7]\s*/i;
const NUMBERED_QUESTION_PATTERN = /^\d+\.\s+/;
const DASH_SUBPOINT_PATTERN = /^-\s+/;
const FOOTER_PAGE_COUNTER_PATTERN = /^--\s*\d+\s+of\s+\d+\s*--$/i;
const CHECKLIST_MARKER_PATTERN = /^(Can I\?|Am I aware)\s+YES\s+NO$/i;
const LEGACY_UNIT_ID_PREFIXES = {
  "perform nursery operations": "nursery",
  "plant crops": "plant",
  "care and maintain crops": "care",
  "carry-out harvest and postharvest operations": "harvest",
};

function normalizeWhitespace(value) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function fixMojibake(value) {
  return value
    .replace(/â€œ|â€|â€|â€/g, '"')
    .replace(/â€™|â€˜|â€™|â€˜/g, "'")
    .replace(/â€“|â€”/g, "-")
    .replace(/â€¦/g, "...")
    .replace(/Ã±/g, "n");
}

function cleanLine(value) {
  return normalizeWhitespace(fixMojibake(value.replace(/\t/g, " ")));
}

function normalizeSagProgramTitle(fileName) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/^SAG\s*-\s*/i, "SAG-")
    .replace(/\s+/g, " ")
    .replace(/\s+\d+$/i, "")
    .trim();
}

function createSagLookupKey(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/^sag\s*-\s*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9() ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQualificationLookupKey(value) {
  return createSagLookupKey(value)
    .replace(/\bfull\b/g, "")
    .replace(/\(\s*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createQuestionId(unitTitle, questionIndex) {
  const legacyPrefix = LEGACY_UNIT_ID_PREFIXES[createSagLookupKey(unitTitle)];
  const prefix = legacyPrefix || slugify(unitTitle) || "sag";
  return `${prefix}-${String(questionIndex + 1).padStart(2, "0")}`;
}

function buildDefaultInstructionLines() {
  return [
    "Instruction:",
    "Read each of the questions in the left-hand column of the chart.",
    "Place a check in the appropriate box opposite each question to indicate your answer.",
  ];
}

function stripLeadingMarker(value) {
  return cleanLine(value).replace(BULLET_LINE_PATTERN, "").replace(NUMBERED_QUESTION_PATTERN, "").replace(DASH_SUBPOINT_PATTERN, "");
}

function isBlankLine(value) {
  return cleanLine(value).length === 0;
}

function isChecklistMarkerLine(value) {
  return CHECKLIST_MARKER_PATTERN.test(cleanLine(value));
}

function isChecklistPromptLine(value) {
  return /^(Can I\?|Am I aware)$/i.test(cleanLine(value));
}

function isChecklistYesNoLine(value) {
  return /^YES\s+NO$/i.test(cleanLine(value));
}

function isSplitChecklistLeadLine(value) {
  const line = cleanLine(value);
  return /^can$/i.test(line) || /^am i aware$/i.test(line);
}

function isAgreementStartLine(value) {
  return /^I agree to undertake assessment/i.test(cleanLine(value));
}

function isCandidateOrDateLine(value) {
  return /^(candidate['’`]?s?(?: name(?: and signature)?)?|date)\b/i.test(cleanLine(value));
}

function isSelfAssessmentHeaderLine(value) {
  return /^self-assessment guide$/i.test(cleanLine(value)) || /^self assessment guide$/i.test(cleanLine(value));
}

function isInstructionLine(value) {
  const line = cleanLine(value);
  return /^(instruction|introduction)\s*:$/i.test(line) || /^(instruction|introduction)\s*:\s+.+$/i.test(line);
}

function isProjectHeaderLine(value) {
  return /^project\s+\d+\s*:/i.test(cleanLine(value));
}

function isQuestionStartLine(value) {
  const line = cleanLine(value);
  return BULLET_LINE_PATTERN.test(line) || NUMBERED_QUESTION_PATTERN.test(line);
}

function isSubpointLine(value) {
  return DASH_SUBPOINT_PATTERN.test(cleanLine(value));
}

function isCoveredUnitsHeaderStart(value) {
  const line = cleanLine(value);
  return /^(?:unit\/s|units?)\s+of\s+competenc(?:y|ies)(?:\s+covered)?\s*:?\s*$/i.test(line);
}

function isCoveredUnitsHeaderContinuation(value) {
  return /^covered\s*:?\s*$/i.test(cleanLine(value));
}

function matchCoveredUnitsHeader(value) {
  return cleanLine(value).match(/^(?:unit\/s|units?)\s+of\s+competenc(?:y|ies)(?:\s+covered)?\s*:?\s*(.*)$/i);
}

function isCompetenciesCoveredHeader(value) {
  return /^competencies\s+covered\s*:?\s*$/i.test(cleanLine(value));
}

function extractHeaderValue(value) {
  const normalized = stripLeadingMarker(cleanLine(value)).replace(/^[:\-–]+\s*/, "").trim();
  return /^[A-Za-z0-9]/.test(normalized) ? normalized : "";
}

function isMetadataLine(value) {
  const line = cleanLine(value);

  if (!line) {
    return true;
  }

  return (
    /^reference\b/i.test(line) ||
    /^rev\.\s*no\./i.test(line) ||
    /^tesda\b/i.test(line) ||
    FOOTER_PAGE_COUNTER_PATTERN.test(line) ||
    /^[A-Za-z].*NC\s+[I0-9VXLCDM]+\s+\d+$/i.test(line) ||
    /^[A-Z0-9-]+(?:\s+ver\.\s*[\d.]+)?\s+\d+$/i.test(line) ||
    /^[A-Z0-9-]+\s+\d+$/i.test(line)
  );
}

function isQualificationEchoLine(value, qualificationTitle) {
  const lineKey = createSagLookupKey(value);
  const qualificationKey = createSagLookupKey(qualificationTitle);
  const baseQualificationKey = normalizeQualificationLookupKey(qualificationTitle);
  const unprefixedQualificationKey = qualificationKey.replace(/^sag\s+/, "");
  const unprefixedBaseQualificationKey = baseQualificationKey.replace(/^sag\s+/, "");

  return (
    lineKey === qualificationKey ||
    lineKey === baseQualificationKey ||
    lineKey === unprefixedQualificationKey ||
    lineKey === unprefixedBaseQualificationKey
  );
}

function splitInstructionLine(value) {
  const line = cleanLine(value);
  const remainder = line.replace(/^(instruction|introduction)\s*:\s*/i, "").trim();
  return remainder ? ["Instruction:", remainder] : ["Instruction:"];
}

function getCombinedChecklistLine(currentLine, nextLine) {
  const line = cleanLine(currentLine);
  const next = cleanLine(nextLine);

  if (isChecklistMarkerLine(line)) {
    return line;
  }

  if (/^can$/i.test(line) && /^i\?\s+yes\s+no$/i.test(next)) {
    return "Can I? YES NO";
  }

  if (/^am i aware$/i.test(line) && /^yes\s+no$/i.test(next)) {
    return "Am I aware YES NO";
  }

  return "";
}

function createForm(qualificationTitle) {
  return {
    agreementText: "",
    instructionLines: [],
    qualificationTitle,
    title: "SELF-ASSESSMENT GUIDE",
    units: [],
  };
}

let pdfJsPromise = null;

function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import(pathToFileURL(path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);
  }

  return pdfJsPromise;
}

function joinLineWords(words) {
  const sortedWords = [...words].sort((left, right) => left.x - right.x);
  let output = "";
  let previousWord = null;

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
      !/\s$/.test(output) &&
      !/^[,.;:!?)]/.test(text) &&
      !/[-–]$/.test(previousOutput) &&
      gap > 1.5;

    if (shouldInsertSpace) {
      output += " ";
    }

    output += text;
    previousWord = word;
  }

  return cleanLine(output);
}

function buildPdfLines(items, pageIndex) {
  const groupedLines = [];

  for (const item of items) {
    const text = String(item.str ?? "");

    if (!text) {
      continue;
    }

    const x = item.transform[4];
    const y = item.transform[5];
    const existingLine = groupedLines.find((line) => Math.abs(line.keyY - y) <= 1.5);

    const word = {
      text,
      width: item.width,
      x,
      y,
    };

    if (existingLine) {
      existingLine.words.push(word);
      existingLine.keyY = Math.max(existingLine.keyY, y);
      continue;
    }

    groupedLines.push({
      keyY: y,
      words: [word],
    });
  }

  return groupedLines
    .map(({ keyY, words }) => {
      const sortedWords = words.sort((left, right) => left.x - right.x);
      const firstVisibleWord = sortedWords.find((word) => String(word.text ?? "").trim().length > 0);

      return {
        pageIndex,
        rawText: joinLineWords(sortedWords),
        words: sortedWords,
        x: firstVisibleWord?.x ?? 0,
        y: Math.round(keyY * 10) / 10,
      };
    })
    .filter((line) => line.rawText.length > 0)
    .sort((left, right) => {
      if (left.pageIndex !== right.pageIndex) {
        return left.pageIndex - right.pageIndex;
      }

      return right.y - left.y;
    });
}

async function extractStructuredPdfLines(filePath) {
  const pdfjs = await loadPdfJs();
  const pdfBytes = new Uint8Array(await fsp.readFile(filePath));
  const loadingTask = pdfjs.getDocument({
    data: pdfBytes,
    useSystemFonts: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const lines = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      lines.push(...buildPdfLines(textContent.items, pageNumber - 1));
    }

    return lines;
  } finally {
    await loadingTask.destroy();
  }
}

function stripQuestionLeadFromLine(value) {
  return normalizeSagQuestionText(value)
    .replace(BULLET_LINE_PATTERN, "")
    .replace(NUMBERED_QUESTION_PATTERN, "")
    .replace(DASH_SUBPOINT_PATTERN, "")
    .trim();
}

function isStructuredChecklistHeader(line) {
  return isChecklistMarkerLine(line.rawText) || isChecklistPromptLine(line.rawText);
}

function isStructuredQuestionStart(line) {
  return isQuestionStartLine(line.rawText);
}

function isStructuredQuestionContinuation(line) {
  return line.x >= 80;
}

function isChecklistSectionBanner(text) {
  const line = cleanLine(text);

  if (!line || line !== line.toUpperCase()) {
    return false;
  }

  return /[A-Z]/.test(line);
}

function looksLikeChecklistUnitTitle(line, nextLine) {
  const text = cleanLine(line.rawText);

  if (
    !text ||
    isMetadataLine(text) ||
    isStructuredChecklistHeader(line) ||
    isInstructionLine(text) ||
    isAgreementStartLine(text) ||
    isCandidateOrDateLine(text) ||
    isStructuredQuestionStart(line) ||
    isChecklistPromptLine(text) ||
    isChecklistYesNoLine(text) ||
    line.x > 90
  ) {
    return false;
  }

  if (isChecklistSectionBanner(text)) {
    return true;
  }

  if (
    /^[A-Z][A-Za-z0-9/&(),'" .-]+\*?$/.test(text) &&
    !/:$/.test(text) &&
    text.split(/\s+/).length <= 12
  ) {
    return true;
  }

  return Boolean(nextLine) && (isStructuredQuestionStart(nextLine) || isChecklistPromptLine(nextLine.rawText));
}

function collectAgreementTextFromLines(lines, startIndex) {
  const parts = [];
  let currentIndex = startIndex;

  while (currentIndex < lines.length) {
    const line = cleanLine(lines[currentIndex]?.rawText ?? "");

    if (!line) {
      currentIndex += 1;
      continue;
    }

    if (parts.length > 0 && (isCandidateOrDateLine(line) || isSelfAssessmentHeaderLine(line) || isMetadataLine(line))) {
      break;
    }

    if (isCandidateOrDateLine(line)) {
      break;
    }

    parts.push(line);
    currentIndex += 1;
  }

  return {
    nextIndex: currentIndex - 1,
    text: normalizeWhitespace(parts.join(" ")),
  };
}

function parseSagPdfFromStructuredLines(qualificationTitle, lines) {
  const form = createForm(qualificationTitle);
  const coveredUnitTitles = [];
  let currentUnit = null;
  let activeQuestion = null;
  let collectingCoveredUnits = false;
  let collectingInstructions = false;
  let inChecklist = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const text = cleanLine(line.rawText);
    const nextLine = lines[index + 1] ?? null;
    const nextText = cleanLine(nextLine?.rawText ?? "");

    if (!text || isMetadataLine(text) || isSelfAssessmentHeaderLine(text) || isQualificationEchoLine(text, qualificationTitle)) {
      continue;
    }

    if (isAgreementStartLine(text)) {
      const agreement = collectAgreementTextFromLines(lines, index);

      if (!form.agreementText && agreement.text) {
        form.agreementText = agreement.text;
      }

      activeQuestion = null;
      collectingCoveredUnits = false;
      collectingInstructions = false;
      inChecklist = false;
      index = agreement.nextIndex;
      continue;
    }

    if (/^(qualification|full qualification)(?:\s+title)?\s*:?\s*(.+)?$/i.test(text)) {
      continue;
    }

    if (
      matchCoveredUnitsHeader(text) ||
      isCoveredUnitsHeaderStart(text) ||
      isCoveredUnitsHeaderContinuation(text) ||
      isCompetenciesCoveredHeader(text)
    ) {
      collectingCoveredUnits = true;
      collectingInstructions = false;
      activeQuestion = null;

      const coveredUnitsHeaderMatch = matchCoveredUnitsHeader(text);
      const inlineCoveredTitle = extractHeaderValue(coveredUnitsHeaderMatch?.[1] ?? "");

      if (inlineCoveredTitle) {
        coveredUnitTitles.push(inlineCoveredTitle);
      }

      continue;
    }

    if (collectingCoveredUnits && isInstructionLine(text)) {
      collectingCoveredUnits = false;
      collectingInstructions = true;
      form.instructionLines = splitInstructionLine(text);
      continue;
    }

    if (collectingCoveredUnits) {
      if (isStructuredQuestionStart(line)) {
        coveredUnitTitles.push(stripQuestionLeadFromLine(text));
        continue;
      }

      if (line.x >= 180) {
        coveredUnitTitles.push(text);
        currentUnit = getOrCreateUnit(form, text);
        collectingCoveredUnits = false;
        continue;
      }

      if (coveredUnitTitles.length > 0 && line.x >= 220) {
        coveredUnitTitles[coveredUnitTitles.length - 1] = normalizeWhitespace(
          `${coveredUnitTitles[coveredUnitTitles.length - 1]} ${text}`,
        );
      }

      continue;
    }

    if (isInstructionLine(text)) {
      collectingInstructions = true;
      form.instructionLines = splitInstructionLine(text);
      continue;
    }

    if (collectingInstructions) {
      if (isStructuredChecklistHeader(line)) {
        collectingInstructions = false;
        inChecklist = true;
        activeQuestion = null;

        if (/^am i aware/i.test(text)) {
          currentUnit = getOrCreateUnit(form, "AM I AWARE");
        } else if (!currentUnit && coveredUnitTitles.length === 1) {
          currentUnit = getOrCreateUnit(form, coveredUnitTitles[0]);
        }

        continue;
      }

      form.instructionLines.push(stripQuestionLeadFromLine(text));
      continue;
    }

    if (isStructuredChecklistHeader(line)) {
      inChecklist = true;
      activeQuestion = null;

      if (/^am i aware/i.test(text)) {
        currentUnit = getOrCreateUnit(form, "AM I AWARE");
      }

      continue;
    }

    if (!inChecklist) {
      if (isChecklistYesNoLine(text)) {
        continue;
      }

      continue;
    }

    if (isCandidateOrDateLine(text)) {
      continue;
    }

    if (looksLikeChecklistUnitTitle(line, nextLine)) {
      if (!isChecklistSectionBanner(text)) {
        currentUnit = getOrCreateUnit(form, text);
      }

      activeQuestion = null;
      continue;
    }

    if (isStructuredQuestionStart(line)) {
      if (!currentUnit) {
        currentUnit = getOrCreateUnit(form, coveredUnitTitles[0] ?? qualificationTitle);
      }

      const nextQuestion = {
        id: "",
        text: stripQuestionLeadFromLine(text),
      };

      currentUnit.questions.push(nextQuestion);
      activeQuestion = nextQuestion;
      continue;
    }

    if (
      activeQuestion &&
      !isStructuredChecklistHeader(line) &&
      !looksLikeChecklistUnitTitle(line, nextLine) &&
      !isInstructionLine(text) &&
      !isAgreementStartLine(text) &&
      isStructuredQuestionContinuation(line)
    ) {
      appendQuestionText(activeQuestion, text);
    }
  }

  return finalizeSagForm(form);
}

function getOrCreateUnit(form, title) {
  const normalizedTitle = normalizeWhitespace(title);
  const lookupKey = createSagLookupKey(normalizedTitle);
  const existing = form.units.find((unit) => createSagLookupKey(unit.title) === lookupKey);

  if (existing) {
    return existing;
  }

  const nextUnit = {
    id: slugify(normalizedTitle) || "unit",
    questions: [],
    title: normalizedTitle,
  };
  form.units.push(nextUnit);
  return nextUnit;
}

function normalizeSagQuestionText(value) {
  return normalizeWhitespace(fixMojibake(value))
    .replace(/\s+([,.;:!?*])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");
}

function stripTrailingQuestionMetadata(value) {
  return normalizeSagQuestionText(value)
    .replace(/\s+[A-Z0-9-]+(?:\s+[–-]\s+)?\d+(?:\s+Ver\.\s*[\d.]+)?(?:\s+\d+)?$/i, "")
    .trim();
}

function stripQualificationEchoFromQuestion(value, qualificationTitle) {
  const normalized = stripTrailingQuestionMetadata(value).replace(/\s+\d+$/i, "");
  const qualification = normalizeWhitespace(String(qualificationTitle ?? "").replace(/^SAG-/, ""));

  if (!normalized || !qualification) {
    return normalized;
  }

  const escapedQualification = qualification.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

  return normalized
    .replace(new RegExp(`^${escapedQualification}\\s+\\d+\\s+`, "i"), "")
    .replace(new RegExp(`\\s+${escapedQualification}\\s+\\d+$`, "i"), "")
    .replace(new RegExp(`\\s+${escapedQualification}$`, "i"), "")
    .replace(/^[A-Z][A-Z\s()/.-]+NC\s*[I0-9VXLCDM]+(?:\s+\d+)?\s+/i, "")
    .replace(/\s+[A-Z][A-Z\s()/.-]+NC\s*[I0-9VXLCDM]+(?:\s+\d+)?$/i, "")
    .replace(/\s+[A-Z][A-Za-z\s()/.-]+NC\s*[I0-9VXLCDM]+$/i, "")
    .replace(/\s+\d+$/i, "")
    .trim();
}

function splitMergedQuestionText(value) {
  const normalized = stripTrailingQuestionMetadata(value);

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/(?<=[?*])\s+(?=[A-Z][A-Za-z0-9/'"(])/g)
    .map((part) => stripTrailingQuestionMetadata(part))
    .filter(Boolean);
}

function isQuestionGarbage(value) {
  const line = normalizeSagQuestionText(value);

  return (
    !line ||
    /^\*+$/.test(line) ||
    /^[A-Z0-9-]+\s+[–-]\s+\d+(?:\s+v(?:er)?\.?\s*[\d.]+)?$/i.test(line) ||
    /^(?:guidelines|act|sops?|competency)\.?:?$/i.test(line) ||
    /^can i\??$/i.test(line) ||
    /^am i aware$/i.test(line) ||
    /^yes$/i.test(line) ||
    /^no$/i.test(line) ||
    /^units?\s+of\s+competenc(?:y|ies)\s*:/i.test(line) ||
    /^covered\s*:?\s*$/i.test(line) ||
    /^reference\.?\s*no\.?$/i.test(line)
  );
}

function isQuestionMetadataEcho(value) {
  const line = normalizeSagQuestionText(value);

  return (
    !line ||
    /^reference\.?\s*no\.?$/i.test(line) ||
    /^tesda\b/i.test(line) ||
    /^rev\.\s*no\./i.test(line) ||
    /^[A-Z0-9-]+\s+[–-]\s+\d+(?:\s+v(?:er)?\.?\s*[\d.]+)?$/i.test(line) ||
    /^[A-Z0-9-]+(?:\s+ver\.\s*[\d.]+)?$/i.test(line) ||
    /^[A-Za-z].*NC\s+[I0-9VXLCDM]+\s+\d+$/i.test(line)
  );
}

function isCodeLikeTitle(value) {
  const line = normalizeWhitespace(value);
  return /^[A-Z]{3,}[A-Z0-9_-]*\d+(?:[-_]\d+)*$/i.test(line);
}

function isQuestionContinuation(previousText, currentText) {
  const current = normalizeSagQuestionText(currentText);
  const previous = normalizeSagQuestionText(previousText);

  if (!current || !previous) {
    return false;
  }

  if (isQuestionMetadataEcho(current)) {
    return true;
  }

  if (/[.?!*]$/.test(previous)) {
    return false;
  }

  if (/^[a-z(]/.test(current)) {
    return true;
  }

  if (/^(and|or|with|without|to|of|for|from|in|on|as|according|based|following|using)\b/.test(current)) {
    return true;
  }

  if (/^[a-z(]/.test(current) && /\b(and|or|with|without|to|of|for|from|in|on|as|according|based|following|using)$/i.test(previous)) {
    return true;
  }

  return false;
}

function appendQuestionText(question, suffix) {
  question.text = normalizeWhitespace(`${question.text} ${suffix}`);
}

function collectAgreementText(lines, startIndex) {
  const parts = [];
  let currentIndex = startIndex;

  while (currentIndex < lines.length) {
    const line = cleanLine(lines[currentIndex] ?? "");

    if (!line) {
      currentIndex += 1;
      continue;
    }

    if (parts.length > 0 && (isCandidateOrDateLine(line) || isSelfAssessmentHeaderLine(line) || isMetadataLine(line))) {
      break;
    }

    if (isCandidateOrDateLine(line)) {
      break;
    }

    parts.push(line);
    currentIndex += 1;
  }

  return {
    nextIndex: currentIndex - 1,
    text: normalizeWhitespace(parts.join(" ")),
  };
}

function findNextMeaningfulLine(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = cleanLine(lines[index] ?? "");

    if (!line || isMetadataLine(line)) {
      continue;
    }

    return line;
  }

  return "";
}

function isAllUppercaseHeading(value) {
  const line = cleanLine(value);

  if (!line || line !== line.toUpperCase()) {
    return false;
  }

  return /[A-Z]/.test(line);
}

function shouldCreateStandaloneQuestion(line, nextLine) {
  if (!line || isMetadataLine(line) || isChecklistMarkerLine(line) || isInstructionLine(line) || isProjectHeaderLine(line)) {
    return false;
  }

  if (line.endsWith("*") && (!nextLine || isQuestionStartLine(nextLine))) {
    return true;
  }

  return (
    Boolean(nextLine) &&
    isQuestionStartLine(nextLine) &&
    !isAllUppercaseHeading(line) &&
    /^[A-Z]/.test(line) &&
    !/^[a-z]/.test(line) &&
    line.split(/\s+/).length <= 12
  );
}

function isLikelyUnitHeading(line, nextLine, coveredUnitTitles) {
  if (
    !line ||
    !nextLine ||
    isMetadataLine(line) ||
    isChecklistMarkerLine(line) ||
    isInstructionLine(line) ||
    isProjectHeaderLine(line)
  ) {
    return false;
  }

  if (!isQuestionStartLine(nextLine)) {
    return false;
  }

  if (coveredUnitTitles.some((title) => createSagLookupKey(title) === createSagLookupKey(line))) {
    return true;
  }

  const normalizedLine = cleanLine(line);
  const withoutCriticalMarker = normalizedLine.replace(/\*+\s*$/, "").trim();

  if (/^[A-Z0-9 ,/&()'-]+$/.test(withoutCriticalMarker) && /[A-Z]/.test(withoutCriticalMarker)) {
    return true;
  }

  if (
    /^[A-Z][A-Za-z0-9/&(),'" -]*\*?$/.test(normalizedLine) &&
    !/[.?!:]$/.test(withoutCriticalMarker) &&
    withoutCriticalMarker.split(/\s+/).length <= 10
  ) {
    return true;
  }

  if (line.split(/\s+/).length > 12) {
    return false;
  }

  return /^[A-Z][A-Za-z0-9/&(),'"-]*(?:\s+[A-Za-z0-9/&(),'"-]+)*$/.test(line);
}

function finalizeSagForm(form) {
  const allUnits = form.units
    .map((unit, unitIndex) => {
      const mergedQuestions = [];

      for (const question of unit.questions) {
        const normalizedText = stripQualificationEchoFromQuestion(question.text, form.qualificationTitle);

        if (!normalizedText || isQuestionMetadataEcho(normalizedText) || isQuestionGarbage(normalizedText)) {
          continue;
        }

        const previousQuestion = mergedQuestions[mergedQuestions.length - 1];

        if (previousQuestion && isQuestionContinuation(previousQuestion.text, normalizedText)) {
          previousQuestion.text = normalizeSagQuestionText(`${previousQuestion.text} ${normalizedText}`);
          continue;
        }

        mergedQuestions.push({
          ...question,
          text: normalizedText,
        });
      }

      const splitQuestions = mergedQuestions.flatMap((question) =>
        splitMergedQuestionText(question.text).map((text) => ({
          ...question,
          text,
        })),
      );

      const questions = splitQuestions
        .filter((question) => !isQuestionGarbage(question.text))
        .filter((question) => !isQualificationEchoLine(question.text, form.qualificationTitle))
        .filter((question, questionIndex, collection) => {
          return (
            collection.findIndex((candidate) => createSagLookupKey(candidate.text) === createSagLookupKey(question.text)) ===
            questionIndex
          );
        })
        .map((question, questionIndex) => ({
          ...question,
          id: createQuestionId(unit.title, questionIndex),
        }));

      return {
        id: slugify(unit.title) || `unit-${unitIndex + 1}`,
        questions,
        title: normalizeWhitespace(unit.title),
      };
    })
    .filter((unit) => unit.questions.length > 0)
    .filter((unit) => !/^[:\-\s]+$/.test(unit.title))
    .filter((unit) => !/^document description$/i.test(unit.title));

  const baseQualificationKey = normalizeQualificationLookupKey(form.qualificationTitle).replace(/^sag\s+/, "").trim();
  const mergedUnits = [];

  for (const unit of allUnits) {
    const unitKey = normalizeQualificationLookupKey(unit.title).replace(/^sag\s+/, "").trim();

    if (mergedUnits.length > 0 && unitKey === baseQualificationKey) {
      mergedUnits[mergedUnits.length - 1].questions.push(...unit.questions);
      continue;
    }

    mergedUnits.push({
      ...unit,
      questions: [...unit.questions],
    });
  }

  const units = mergedUnits.filter((unit) => !isCodeLikeTitle(unit.title));

  return {
    ...form,
    agreementText: form.agreementText || COMMON_AGREEMENT_TEXT,
    instructionLines: form.instructionLines.length > 0 ? form.instructionLines : buildDefaultInstructionLines(),
    units: units.length > 0 ? units : allUnits,
  };
}

function parseSagPdfText(qualificationTitle, pageTexts) {
  const form = createForm(qualificationTitle);
  const coveredUnitTitles = [];
  const documentHeaderKeys = new Set();
  let currentUnit = null;
  let activeQuestion = null;
  let collectingCoveredUnits = false;
  let collectingInstructions = false;
  let collectingProjectTitles = false;
  let skipUntilNextFormStart = true;

  for (const pageText of pageTexts) {
    const rawLines = pageText.split(/\r?\n/);

    for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex += 1) {
      const line = cleanLine(rawLines[lineIndex] ?? "");
      const nextLine = cleanLine(rawLines[lineIndex + 1] ?? "");
      const combinedChecklistLine = getCombinedChecklistLine(line, nextLine);

      if (isBlankLine(line)) {
        continue;
      }

      if (isAgreementStartLine(line)) {
        const agreement = collectAgreementText(rawLines, lineIndex);

        if (!form.agreementText && agreement.text) {
          form.agreementText = agreement.text;
        }

        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        collectingProjectTitles = false;
        skipUntilNextFormStart = true;
        lineIndex = agreement.nextIndex;
        continue;
      }

      if (skipUntilNextFormStart) {
        if (
          isSelfAssessmentHeaderLine(line) ||
          /^qualification(?:\s+title)?\s*:?\s*(.+)$/i.test(line) ||
          /^full qualification\s+/i.test(line) ||
          /^unit\s+of\s+competenc/i.test(line) ||
          /^coc\s*\d+\s*:?/i.test(line) ||
          /^certificate of$/i.test(line) ||
          /^competency\s*\(coc\s*\d+\)/i.test(line)
        ) {
          skipUntilNextFormStart = false;
        } else {
          if (!isMetadataLine(line)) {
            documentHeaderKeys.add(createSagLookupKey(line));
          }
          continue;
        }
      }

      if (isCandidateOrDateLine(line) || isSelfAssessmentHeaderLine(line) || isMetadataLine(line)) {
        continue;
      }

      if (isQualificationEchoLine(line, qualificationTitle)) {
        continue;
      }

      if (documentHeaderKeys.has(createSagLookupKey(line))) {
        continue;
      }

      if (/^(qualification|full qualification)(?:\s+title)?\s*:?\s*(.+)$/i.test(line)) {
        continue;
      }

      if (collectingProjectTitles) {
        if (/^(?:unit\/s|unit|units)\s+of\s+competenc/i.test(line) || isInstructionLine(line)) {
          collectingProjectTitles = false;
        } else {
          continue;
        }
      }

      if (/^projects?\b/i.test(line)) {
        collectingProjectTitles = true;
        activeQuestion = null;
        continue;
      }

      const coveredUnitsHeaderMatch = matchCoveredUnitsHeader(line);

      if (coveredUnitsHeaderMatch) {
        const inlineCoveredTitleSource = coveredUnitsHeaderMatch[1] ?? "";
        const inlineCoveredTitle = extractHeaderValue(inlineCoveredTitleSource);

        activeQuestion = null;
        collectingInstructions = false;
        collectingCoveredUnits = true;

        if (inlineCoveredTitle) {
          coveredUnitTitles.push(inlineCoveredTitle);

          if (!BULLET_LINE_PATTERN.test(inlineCoveredTitleSource)) {
            currentUnit = getOrCreateUnit(form, inlineCoveredTitle);
            collectingCoveredUnits = false;
          }
        }

        continue;
      }

      const unitHeaderMatch = line.match(/^(?:unit\/s|unit|units)\s+of\s+competenc(?:y|ies)\s*:?\s*(.*)$/i);

      if (unitHeaderMatch && extractHeaderValue(unitHeaderMatch[1] ?? "")) {
        currentUnit = getOrCreateUnit(form, extractHeaderValue(unitHeaderMatch[1] ?? "") || qualificationTitle);
        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        continue;
      }

      const cocHeaderMatch = line.match(/^coc\s*\d+\s*:?\s*(.+)$/i);

      if (cocHeaderMatch) {
        currentUnit = getOrCreateUnit(form, cocHeaderMatch[1] ?? qualificationTitle);
        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        continue;
      }

      const splitCocHeaderMatch = line.match(/^competency\s*\(coc\s*\d+\)\s*(.+)$/i);

      if (splitCocHeaderMatch) {
        currentUnit = getOrCreateUnit(form, splitCocHeaderMatch[1] ?? qualificationTitle);
        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        continue;
      }

      const certificateHeaderMatch = line.match(/^certificate of\s+competency(?:\s*\d+)?\s*:?\s*(.+)$/i);

      if (certificateHeaderMatch) {
        currentUnit = getOrCreateUnit(form, certificateHeaderMatch[1] ?? qualificationTitle);
        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        continue;
      }

      if (/^certificate of$/i.test(line) && /^competency\s*\(coc\s*\d+\)\s*(.+)$/i.test(nextLine)) {
        const nextCocMatch = nextLine.match(/^competency\s*\(coc\s*\d+\)\s*(.+)$/i);

        currentUnit = getOrCreateUnit(form, nextCocMatch?.[1] ?? qualificationTitle);
        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        lineIndex += 1;
        continue;
      }

      if (/^certificate of$/i.test(line) && /^competency(?:\s*\d+)?\s*:?\s*(.+)$/i.test(nextLine)) {
        const nextCertificateMatch = nextLine.match(/^competency(?:\s*\d+)?\s*:?\s*(.+)$/i);

        currentUnit = getOrCreateUnit(form, nextCertificateMatch?.[1] ?? qualificationTitle);
        activeQuestion = null;
        collectingCoveredUnits = false;
        collectingInstructions = false;
        lineIndex += 1;
        continue;
      }

      if (isCoveredUnitsHeaderStart(line) || isCoveredUnitsHeaderContinuation(line) || isCompetenciesCoveredHeader(line)) {
        collectingCoveredUnits = true;
        currentUnit = null;
        activeQuestion = null;
        continue;
      }

      if (collectingCoveredUnits) {
        const coveredContinuationMatch = line.match(/^covered\s*:?\s*(.+)$/i);

        if (coveredContinuationMatch) {
          const inlineCoveredTitle = extractHeaderValue(coveredContinuationMatch[1] ?? "");

          if (inlineCoveredTitle) {
            coveredUnitTitles.push(inlineCoveredTitle);
          }

          continue;
        }

        if (isInstructionLine(line)) {
          collectingCoveredUnits = false;
          collectingInstructions = true;
          form.instructionLines = splitInstructionLine(line);
          continue;
        }

        if (isQuestionStartLine(line)) {
          coveredUnitTitles.push(stripLeadingMarker(line));
          continue;
        }

        if (coveredUnitTitles.length > 0 && !isQuestionStartLine(line)) {
          coveredUnitTitles[coveredUnitTitles.length - 1] = normalizeWhitespace(
            `${coveredUnitTitles[coveredUnitTitles.length - 1]} ${line}`,
          );
        }

        continue;
      }

      if (isInstructionLine(line)) {
        collectingInstructions = true;
        form.instructionLines = splitInstructionLine(line);
        continue;
      }

      if (collectingInstructions) {
        if (combinedChecklistLine) {
          collectingInstructions = false;
          activeQuestion = null;

          if (/^am i aware/i.test(combinedChecklistLine)) {
            currentUnit = getOrCreateUnit(form, "AM I AWARE");
          } else if (!currentUnit) {
            currentUnit = getOrCreateUnit(form, coveredUnitTitles[0] ?? qualificationTitle);
          }

          if (isSplitChecklistLeadLine(line)) {
            lineIndex += 1;
          }
          continue;
        }

        form.instructionLines.push(stripLeadingMarker(line));
        continue;
      }

      if (combinedChecklistLine) {
        activeQuestion = null;

        if (/^am i aware/i.test(combinedChecklistLine)) {
          currentUnit = getOrCreateUnit(form, "AM I AWARE");
        }

        if (isSplitChecklistLeadLine(line)) {
          lineIndex += 1;
        }
        continue;
      }

      const coveredUnitHeading = coveredUnitTitles.find((title) => createSagLookupKey(title) === createSagLookupKey(line));

      if (coveredUnitHeading) {
        currentUnit = getOrCreateUnit(form, coveredUnitHeading);
        activeQuestion = null;
        continue;
      }

      if (!currentUnit && coveredUnitTitles.length === 1) {
        currentUnit = getOrCreateUnit(form, coveredUnitTitles[0]);
      }

      if (isQuestionStartLine(line)) {
        if (!currentUnit) {
          currentUnit = getOrCreateUnit(form, qualificationTitle);
        }

        const nextQuestion = {
          id: "",
          text: stripLeadingMarker(line),
        };

        currentUnit.questions.push(nextQuestion);
        activeQuestion = nextQuestion;
        continue;
      }

      const nextMeaningfulLine = findNextMeaningfulLine(rawLines, lineIndex + 1);

      if (isProjectHeaderLine(line)) {
        activeQuestion = null;
        continue;
      }

      if (
        activeQuestion &&
        !isChecklistMarkerLine(line) &&
        !isInstructionLine(line) &&
        !isQuestionStartLine(line) &&
        isQuestionContinuation(activeQuestion.text, line)
      ) {
        appendQuestionText(activeQuestion, line);
        continue;
      }

      if (isLikelyUnitHeading(line, nextMeaningfulLine, coveredUnitTitles)) {
        currentUnit = getOrCreateUnit(form, line);
        activeQuestion = null;
        continue;
      }

      if (
        activeQuestion &&
        !isChecklistMarkerLine(line) &&
        !isInstructionLine(line) &&
        !isAllUppercaseHeading(line) &&
        !coveredUnitTitles.some((title) => createSagLookupKey(title) === createSagLookupKey(line)) &&
        !shouldCreateStandaloneQuestion(line, nextMeaningfulLine)
      ) {
        appendQuestionText(activeQuestion, line);
        continue;
      }

      if (isAllUppercaseHeading(line) && !activeQuestion) {
        currentUnit = getOrCreateUnit(form, line);
        activeQuestion = null;
        continue;
      }

      if (shouldCreateStandaloneQuestion(line, nextMeaningfulLine)) {
        if (!currentUnit) {
          currentUnit = getOrCreateUnit(form, qualificationTitle);
        }

        const nextQuestion = {
          id: "",
          text: line,
        };

        currentUnit.questions.push(nextQuestion);
        activeQuestion = nextQuestion;
        continue;
      }

      if (isSubpointLine(line) && activeQuestion) {
        appendQuestionText(activeQuestion, stripLeadingMarker(line));
        continue;
      }
    }
  }

  return finalizeSagForm(form);
}

async function parseSagPdfFile(fileName) {
  const filePath = path.join(SAG_FORMS_PATH, fileName);
  const pdfBuffer = await fsp.readFile(filePath);
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const result = await parser.getText();
    const qualificationTitle = normalizeSagProgramTitle(fileName);
    return parseSagPdfText(qualificationTitle, result.pages.map((page) => page.text));
  } finally {
    await parser.destroy();
  }
}

async function generateTemplates() {
  const entries = await fsp.readdir(SAG_FORMS_PATH, { withFileTypes: true });
  const pdfFiles = entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const forms = [];

  for (const fileName of pdfFiles) {
    const form = await parseSagPdfFile(fileName);

    if (form.units.length > 0) {
      forms.push(form);
    }
  }

  const fileContents = `import type { SagFormDefinition } from "@/lib/sag-form-schema";

export const sagFormTemplates: SagFormDefinition[] = ${JSON.stringify(forms, null, 2)};
`;

  await fsp.mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
  await fsp.writeFile(OUTPUT_FILE_PATH, fileContents, "utf8");
  console.log(`Generated ${forms.length} SAG template definitions at ${OUTPUT_FILE_PATH}`);
}

generateTemplates().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
