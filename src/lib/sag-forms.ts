import {
  getSagFormDefinition,
  normalizeSagProgramTitle,
  type SagAnswerValue,
  type SagFormDefinition,
  type SagQuestionDefinition,
  type SagUnitDefinition,
} from "@/lib/sag-form-schema";
import { getSagIdentityMetadata } from "@/lib/sag-identity-metadata";
import { buildSagInstructionLines, resolveSagSourcePdfPath } from "@/lib/sag-pdf";
import { sagFormTemplates } from "@/lib/sag-form-templates.generated";

export { getSagFormDefinition, normalizeSagProgramTitle };
export type { SagAnswerValue, SagFormDefinition, SagQuestionDefinition, SagUnitDefinition };

let sagFormsPromise: Promise<SagFormDefinition[]> | null = null;

const DEFAULT_INSTRUCTION_LINES = [
  "Instruction:",
  "Read each question and check the appropriate box to indicate your answer.",
] satisfies string[];

const COMMON_QUESTION_VERB_PATTERN =
  /^(adjust|answer|apply|arrange|assess|assist|bring|breed|carry|check|clean|clear|communicate|conduct|confirm|coordinate|create|demonstrate|design|determine|dispose|document|encode|ensure|escort|establish|evaluate|explain|feed|file|follow|gather|give|guide|identify|implement|inject|inspect|install|interpret|isolate|label|maintain|make|measure|monitor|move|observe|open|organize|perform|pick|place|plan|play|position|prepare|present|prioritize|provide|record|refer|remove|repeat|report|respond|sanitize|scrub|secure|select|send|serve|set|shift|show|sort|store|sustain|take|taste|thank|transfer|treat|turn|update|use|wash|wear|wean|welcome|wipe|withdraw|write)\b/i;

const CONTINUATION_PREFIX_PATTERN =
  /^(and|or|with|without|to|of|for|from|in|on|as|according|based|following|using|within|required|needed|necessary|appropriate|relevant|industry|current|established|standard|assessment|being|development|developmental|guidelines|handbook|requirement)\b/i;

function normalizeSagText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â|Ã¢â‚¬Âœ|Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â„¢|Ã¢â‚¬Ëœ|Ã¢â‚¬â„¢|Ã¢â‚¬Ëœ/g, "'")
    .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(/Ã¢â‚¬Â¦/g, "...")
    .replace(/ÃƒÂ±/g, "n")
    .replace(/\s+/g, " ")
    .trim();
}

function isInstructionLikeLine(value: string) {
  return (
    /^instruction:?$/i.test(value) ||
    /^instruction:\s*/i.test(value) ||
    /^read each/i.test(value) ||
    /^place a check/i.test(value) ||
    /^indicate your answer/i.test(value) ||
    /^answer\.?$/i.test(value)
  );
}

function sanitizeInstructionLines(lines: string[]) {
  const normalizedLines = lines.map(normalizeSagText).filter(Boolean);
  const instructionLines = normalizedLines.filter((line) => line.toLowerCase() !== "s" && isInstructionLikeLine(line));

  if (instructionLines.length === 0) {
    return [...DEFAULT_INSTRUCTION_LINES];
  }

  const withNormalizedHeading = instructionLines.map((line, index) => {
    if (index === 0) {
      return /^instruction:?$/i.test(line) ? "Instruction:" : line;
    }

    return line;
  });

  if (!/^instruction:?$/i.test(withNormalizedHeading[0] ?? "")) {
    return ["Instruction:", ...withNormalizedHeading];
  }

  return withNormalizedHeading;
}

function sanitizeQuestionText(value: string) {
  return normalizeSagText(value)
    .replace(/\b[A-Z0-9-]+(?:\s+[–-]\s+)?\d+(?:\s+Ver\.\s*[\d.]+)?\s+\d+\s*$/i, "")
    .replace(/\b[A-Z0-9-]+(?:\s+[–-]\s+)?\d+(?:\s+Ver\.\s*[\d.]+)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldKeepQuestion(text: string) {
  if (!text) {
    return false;
  }

  return !(
    /^can i\??$/i.test(text) ||
    /^am i aware$/i.test(text) ||
    /^yes$/i.test(text) ||
    /^no$/i.test(text) ||
    /^instruction:?$/i.test(text) ||
    /^reference no\.?$/i.test(text) ||
    /^units?\s+of\s+competenc(?:y|ies)\s*:/i.test(text) ||
    /^covered\s*:?\s*$/i.test(text)
  );
}

function mergeQuestionText(...parts: string[]) {
  return parts
    .map(normalizeSagText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAlphabeticSectionHeading(text: string) {
  return /^[A-O]\.\s+/.test(normalizeSagText(text));
}

function hasTerminalQuestionPunctuation(text: string) {
  return /[.?!*]$/.test(normalizeSagText(text));
}

function shouldMergeQuestionContinuation(previousText: string, currentText: string) {
  const previous = normalizeSagText(previousText);
  const current = normalizeSagText(currentText);

  if (!previous || !current || hasTerminalQuestionPunctuation(previous)) {
    return false;
  }

  if (/^[a-z(]/.test(current) || CONTINUATION_PREFIX_PATTERN.test(current)) {
    return true;
  }

  return false;
}

function mergeQuestionContinuations(questions: SagQuestionDefinition[]) {
  const mergedQuestions: SagQuestionDefinition[] = [];

  questions.forEach((question) => {
    const normalizedQuestion = {
      ...question,
      text: normalizeSagText(question.text),
    };
    const previousQuestion = mergedQuestions[mergedQuestions.length - 1];

    if (previousQuestion && shouldMergeQuestionContinuation(previousQuestion.text, normalizedQuestion.text)) {
      previousQuestion.text = mergeQuestionText(previousQuestion.text, normalizedQuestion.text);
      return;
    }

    mergedQuestions.push(normalizedQuestion);
  });

  return mergedQuestions;
}

function shouldMergeUnitTitleIntoPreviousQuestion(previousText: string, unitTitle: string) {
  const previous = normalizeSagText(previousText);
  const title = normalizeSagText(unitTitle);

  if (!previous || !title || hasTerminalQuestionPunctuation(previous) || isAlphabeticSectionHeading(title)) {
    return false;
  }

  if (/^[a-z]/.test(title) || CONTINUATION_PREFIX_PATTERN.test(title)) {
    return true;
  }

  if (/^(Handbook|Development Council Guidelines|Development checklist)\*?$/i.test(title)) {
    return true;
  }

  return title.split(/\s+/).length <= 6 && !COMMON_QUESTION_VERB_PATTERN.test(title);
}

function rebuildUnit(unit: SagUnitDefinition, questions: SagQuestionDefinition[]): SagUnitDefinition {
  return {
    ...unit,
    questions,
  };
}

function repairDomesticWorkForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Domestic Work NC II Full" || form.units.length < 6) {
    return form;
  }

  const cleanFurnishings = form.units.find((unit) => unit.id === "clean-furnishing-and-fixtures");
  const standardOperating = form.units.find((unit) => unit.id === "standard-operating-procedure");
  const makeUpBeds = form.units.find((unit) => unit.id === "make-up-beds-and-cots");
  const cleanBedroom = form.units.find((unit) => unit.id === "clean-bedroom-and-bathroom");

  if (!cleanFurnishings || !standardOperating || !makeUpBeds || !cleanBedroom) {
    return form;
  }

  const repairedCleanFurnishings = cleanFurnishings.questions.map((question) => ({ ...question }));
  const lastFurnishingQuestion = repairedCleanFurnishings[repairedCleanFurnishings.length - 1];

  if (lastFurnishingQuestion) {
    lastFurnishingQuestion.text = mergeQuestionText(lastFurnishingQuestion.text, standardOperating.title);
  }

  const makeUpBedsQuestions = [
    {
      ...makeUpBeds.questions[0],
      text: mergeQuestionText(makeUpBeds.questions[0]?.text ?? "", standardOperating.title),
    },
    {
      ...standardOperating.questions[1],
      text: mergeQuestionText(standardOperating.questions[1]?.text ?? "", standardOperating.title),
    },
    { ...standardOperating.questions[2] },
    { ...standardOperating.questions[3] },
  ].filter((question) => question.id && question.text);

  const cleanBedroomQuestions = cleanBedroom.questions
    .slice(0, 8)
    .map((question) => ({ ...question }));

  const sanitizeRoomsQuestions = cleanBedroom.questions
    .slice(9)
    .map((question) => ({ ...question }));

  return {
    ...form,
    units: form.units.flatMap((unit) => {
      if (unit.id === "clean-furnishing-and-fixtures") {
        return [rebuildUnit(unit, repairedCleanFurnishings)];
      }

      if (unit.id === "standard-operating-procedure") {
        return [];
      }

      if (unit.id === "make-up-beds-and-cots") {
        return [
          rebuildUnit(unit, makeUpBedsQuestions),
        ];
      }

      if (unit.id === "clean-bedroom-and-bathroom") {
        return [
          rebuildUnit(unit, cleanBedroomQuestions),
          {
            id: "sanitize-rooms",
            title: "Sanitize rooms*",
            questions: sanitizeRoomsQuestions,
          },
        ];
      }

      return [unit];
    }),
  };
}

function repairEccdForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-ECCDNC3" || form.units.length < 6) {
    return form;
  }

  const [unit1, unit2, unit3, unit4, unit5, unit6] = form.units;
  const unit1Questions = unit1.questions
    .filter((question) => !isAlphabeticSectionHeading(question.text))
    .map((question) => ({ ...question }));

  if (unit1Questions.length > 0) {
    const lastQuestion = unit1Questions[unit1Questions.length - 1];
    lastQuestion.text = mergeQuestionText(lastQuestion.text, unit2.title);
  }

  const manageCenterOperationsQuestions = [
    ...unit1Questions,
    ...unit2.questions
      .filter((question) => !isAlphabeticSectionHeading(question.text))
      .map((question) => ({ ...question })),
  ];

  const unit3Questions = unit3.questions
    .filter((question) => !isAlphabeticSectionHeading(question.text))
    .map((question) => ({ ...question }));

  if (unit3Questions.length > 0) {
    const lastQuestion = unit3Questions[unit3Questions.length - 1];
    lastQuestion.text = mergeQuestionText(lastQuestion.text, unit4.title);
  }

  const conductAssessmentQuestions = [
    ...unit3Questions,
    ...unit4.questions.slice(0, 1).map((question) => ({ ...question })),
    ...unit4.questions.slice(1, 2).map((question) => ({
      ...question,
      text: mergeQuestionText(question.text, unit5.title),
    })),
    ...unit5.questions
      .filter((question) => !isAlphabeticSectionHeading(question.text))
      .map((question) => ({ ...question })),
  ];

  const curriculumQuestions = unit6.questions
    .filter((question) => !isAlphabeticSectionHeading(question.text))
    .map((question) => ({ ...question }));

  return {
    ...form,
    units: [
      rebuildUnit(unit1, manageCenterOperationsQuestions),
      rebuildUnit(unit3, conductAssessmentQuestions),
      rebuildUnit(unit6, curriculumQuestions),
    ],
  };
}

function repairFoodAndBeverageServicesNcII(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Food and Beverage Services NC II") {
    return form;
  }

  return {
    ...form,
    units: form.units.map((unit) => ({
      ...unit,
      questions: unit.questions.map((question) =>
        question.text === "FOOD AND BEVERAGE SERVICES NC II 5 Maintain restaurant supplies and equipment."
          ? { ...question, text: "Maintain restaurant supplies and equipment." }
          : question,
      ),
    })),
  };
}

function repairSwineForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Animal Production (Swine) NC II" || form.units.length !== 1) {
    return form;
  }

  const sourceQuestions = form.units[0]?.questions ?? [];
  const expectedSlices = [
    { count: 26, title: "Handle breeders" },
    { count: 30, title: "Handle farrowing sows and sucklings" },
    { count: 18, title: "Raise weanlings" },
    { count: 28, title: "Produce finishers" },
    { count: 7, title: "Maintain healthy animal environment" },
    { count: 20, title: "Apply bio-security measures" },
  ] as const;

  const expectedTotal = expectedSlices.reduce((total, slice) => total + slice.count, 0);

  if (sourceQuestions.length !== expectedTotal) {
    return form;
  }

  let cursor = 0;
  const rebuiltUnits = expectedSlices.map((slice, index) => {
    const questions = sourceQuestions.slice(cursor, cursor + slice.count).map((question) => ({ ...question }));
    cursor += slice.count;

    return {
      id: index === 0 ? form.units[0].id : `${form.units[0].id}-${index + 1}`,
      title: slice.title,
      questions,
    };
  });

  return {
    ...form,
    units: rebuiltUnits,
  };
}

function repairBrokenContinuations(form: SagFormDefinition): SagFormDefinition {
  const repairedUnits: SagUnitDefinition[] = [];

  form.units.forEach((unit) => {
    const normalizedUnit = {
      ...unit,
      title: normalizeSagText(unit.title),
      questions: mergeQuestionContinuations(unit.questions.map((question) => ({ ...question }))),
    };
    const previousUnit = repairedUnits[repairedUnits.length - 1];
    const previousQuestion = previousUnit?.questions[previousUnit.questions.length - 1];

    if (previousUnit && previousQuestion && shouldMergeUnitTitleIntoPreviousQuestion(previousQuestion.text, normalizedUnit.title)) {
      previousQuestion.text = mergeQuestionText(previousQuestion.text, normalizedUnit.title);

      normalizedUnit.questions.forEach((question) => {
        const trailingQuestion = previousUnit.questions[previousUnit.questions.length - 1];

        if (trailingQuestion && shouldMergeQuestionContinuation(trailingQuestion.text, question.text)) {
          trailingQuestion.text = mergeQuestionText(trailingQuestion.text, question.text);
          return;
        }

        previousUnit.questions.push({ ...question });
      });

      return;
    }

    repairedUnits.push(normalizedUnit);
  });

  return {
    ...form,
    units: repairedUnits.filter((unit) => unit.questions.length > 0),
  };
}

function applyFormOverrides(form: SagFormDefinition): SagFormDefinition {
  return [repairDomesticWorkForm, repairEccdForm, repairFoodAndBeverageServicesNcII, repairSwineForm, repairBrokenContinuations].reduce(
    (currentForm, repair) => repair(currentForm),
    form,
  );
}

function sanitizeSagForm(form: SagFormDefinition): SagFormDefinition {
  return applyFormOverrides({
    ...form,
    agreementText: normalizeSagText(form.agreementText),
    candidateFieldLabel: form.candidateFieldLabel ?? null,
    instructionLines: sanitizeInstructionLines(form.instructionLines),
    qualificationTitle: normalizeSagText(form.qualificationTitle),
    shouldAutofillCandidateName: form.shouldAutofillCandidateName ?? true,
    title: normalizeSagText(form.title),
    units: form.units.map((unit) => ({
      ...unit,
      title: normalizeSagText(unit.title),
      questions: unit.questions
        .map((question) => ({
          ...question,
          text: sanitizeQuestionText(question.text),
        }))
        .filter((question) => shouldKeepQuestion(question.text)),
    })),
  });
}

export async function loadSagFormDefinitions() {
  if (!sagFormsPromise) {
    const nextPromise = Promise.all(
      sagFormTemplates.map(async (template) => {
        const sanitizedForm = sanitizeSagForm(template);
        const sourcePdfPath = await resolveSagSourcePdfPath(sanitizedForm.qualificationTitle);
        const identityMetadata = getSagIdentityMetadata(sourcePdfPath);
        const instructionLinesFromPdf = sourcePdfPath ? await buildSagInstructionLines(sourcePdfPath) : [];

        return {
          ...sanitizedForm,
          candidateFieldLabel: identityMetadata.candidateFieldLabel,
          instructionLines: instructionLinesFromPdf.length > 0 ? instructionLinesFromPdf : sanitizedForm.instructionLines,
          shouldAutofillCandidateName: identityMetadata.shouldAutofillCandidateName,
        };
      }),
    );
    sagFormsPromise = nextPromise;
  }

  return sagFormsPromise.finally(() => {
    sagFormsPromise = null;
  });
}
