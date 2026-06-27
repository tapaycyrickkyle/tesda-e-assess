import {
  getSagFormDefinition,
  normalizeSagProgramTitle,
  type SagAnswerValue,
  type SagFormDefinition,
  type SagQuestionDefinition,
  type SagUnitDefinition,
} from "@/lib/sag-form-schema";
import { sagGeneratedLayouts } from "@/lib/sag-form-layouts.generated";
import { getSagIdentityMetadata } from "@/lib/sag-identity-metadata";
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

function splitInstructionBodyText(value: string) {
  const normalized = normalizeSagText(value).replace(/^(instruction|introduction)\s*:\s*/i, "").trim();

  if (!normalized) {
    return [];
  }

  const splitParts = normalized
    .replace(/\b(place a (?:check|tick)\b)/gi, "\n$1")
    .replace(/\b(indicate your answer\.?)$/i, "\n$1")
    .split(/\n+/)
    .map((part) => normalizeSagText(part))
    .filter(Boolean);

  if (splitParts.length === 0) {
    return [normalized];
  }

  const rebuiltParts: string[] = [];

  splitParts.forEach((part) => {
    const previousPart = rebuiltParts[rebuiltParts.length - 1];

    if (previousPart && /^indicate your answer\.?$/i.test(part)) {
      rebuiltParts[rebuiltParts.length - 1] = mergeQuestionText(previousPart, part);
      return;
    }

    rebuiltParts.push(part);
  });

  return rebuiltParts;
}

function sanitizeInstructionLines(lines: string[]) {
  const normalizedLines = lines.map(normalizeSagText).filter(Boolean);
  const instructionLines = normalizedLines
    .filter((line) => line.toLowerCase() !== "s" && isInstructionLikeLine(line))
    .flatMap((line) => {
      if (/^instruction:?$/i.test(line)) {
        return ["Instruction:"];
      }

      return splitInstructionBodyText(line);
    });

  if (instructionLines.length === 0) {
    return [...DEFAULT_INSTRUCTION_LINES];
  }

  const bodyLines = instructionLines.filter((line) => !/^instruction:?$/i.test(line));

  if (bodyLines.length === 0) {
    return [...DEFAULT_INSTRUCTION_LINES];
  }

  return ["Instruction:", ...bodyLines];
}

function sanitizeQuestionText(value: string) {
  return repairKnownQuestionText(normalizeSagText(value)
    .replace(/\b[A-Z0-9-]+(?:\s+[–-]\s+)?\d+(?:\s+Ver\.\s*[\d.]+)?\s+\d+\s*$/i, "")
    .replace(/\b[A-Z0-9-]+(?:\s+[–-]\s+)?\d+(?:\s+Ver\.\s*[\d.]+)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim());
}

function repairKnownQuestionText(text: string) {
  const replacements: Record<string, string> = {
    "Remove side plates and knives from the table as per": "Remove side plates and knives from the table as per SOPs.",
    "Apply safety measure in accordance with Occupational Safety and":
      "Apply safety measure in accordance with Occupational Safety and Health Standards (OSHS).",
    "Employ food safety practices in accordance with HACCP and":
      "Employ food safety practices in accordance with HACCP and CGMP.",
    "Demonstrate construction of contour for sloping areas using":
      "Demonstrate construction of contour for sloping areas using A-frame, according to industry standard procedures*",
    "Identify classes and characteristics of quality seeds based on":
      "Identify classes and characteristics of quality seeds based on Philippine Laboratory Standard for Seeds Certification*",
    "Establish location of concrete hollow block wall based on":
      "Establish location of concrete hollow block wall based on reference building/wall lines*",
    "Follows Safety procedures according to Occupational Safety and":
      "Follows Safety procedures according to Occupational Safety and Health Standards.",
    "Perform vermin and insects control according to Fertilizer and":
      "Perform vermin and insects control according to Fertilizer and Pesticides Authority guidelines and DENR regulations.*",
    "Perform vermin control following industry": "Perform vermin control following industry procedures.",
    "Transfer ready-to-lay-pullets to laying house reference to":
      "Transfer ready-to-lay-pullets to laying house reference to Animal Welfare Act and Good Animal Practices.",
    "Transfer poultry breeder to appropriate breeder sheds following":
      "Transfer poultry breeder to appropriate breeder sheds following GAHP.",
    "Employ safety practices according to Occupational Safety and":
      "Employ safety practices according to Occupational Safety and Hazard Standards.",
    "Wear appropriate personal protective equipment (PPE) following":
      "Wear appropriate personal protective equipment (PPE) following Occupational Safety and Health Standard (OSHS).",
    "Provide proper temperature/micro-climate based on the minimum requirements for the welfare of pigs and the code of Good Animal":
      "Provide proper temperature/micro-climate based on the minimum requirements for the welfare of pigs and the code of Good Animal Husbandry Practices (GAHP).",
    "Perform castration when needed based on the minimum requirements for the welfare of pigs and the code of Good Animal":
      "Perform castration when needed based on the minimum requirements for the welfare of pigs and the code of Good Animal Husbandry Practices (GAHP).",
    "Monitor and provide proper temperature based on the minimum standards on the welfare of pigs and code of Good Animal":
      "Monitor and provide proper temperature based on the minimum standards on the welfare of pigs and code of Good Animal Husbandry Practices (GAHP).",
    "Check and adjust height of drinkers to ensure proper functioning based on the minimum standards on the welfare of pigs and code of":
      "Check and adjust height of drinkers to ensure proper functioning based on the minimum standards on the welfare of pigs and code of Good Animal Husbandry Practices (GAHP).",
    "Monitor changes in animal behavior following Animal Welfare Act and":
      "Monitor changes in animal behavior following Animal Welfare Act and GAHP.*",
    "Monitor changes in skin color following Animal Welfare Act and":
      "Monitor changes in skin color following Animal Welfare Act and GAHP.*",
    "Prepare loading facility and ramp with reference to Animal Welfare":
      "Prepare loading facility and ramp with reference to Animal Welfare Act.",
    "Discuss how to establish community relationship in accordance with":
      "Discuss how to establish community relationship in accordance with Department of Health's objectives",
  };

  return replacements[text] ?? text;
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

function shouldMergeUnitTitleIntoPreviousQuestion(previousText: string, unitTitle: string, unitQuestionCount: number) {
  const previous = normalizeSagText(previousText);
  const title = normalizeSagText(unitTitle);

  if (unitQuestionCount > 1) {
    return false;
  }

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

function rebuildSequentialUnits(
  sourceUnit: SagUnitDefinition,
  slices: ReadonlyArray<{ count: number; id: string; title: string }>,
) {
  let cursor = 0;

  return slices.map((slice) => {
    const questions = sourceUnit.questions.slice(cursor, cursor + slice.count).map((question, questionIndex) => ({
      ...question,
      id: `${slice.id}-${String(questionIndex + 1).padStart(2, "0")}`,
    }));
    cursor += slice.count;

    return {
      id: slice.id,
      questions,
      title: slice.title,
    };
  });
}

function repairHousekeepingForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Housekeeping NC II (FULL)" || form.units.length !== 1) {
    return form;
  }

  const [sourceUnit] = form.units;

  if (sourceUnit.questions.length !== 85) {
    return form;
  }

  return {
    ...form,
    units: rebuildSequentialUnits(sourceUnit, [
      { count: 17, id: "provide-valet-butler-service", title: "PROVIDE VALET/BUTLER SERVICE" },
      { count: 38, id: "provide-housekeeping-to-guests", title: "PROVIDE HOUSEKEEPING TO GUESTS" },
      { count: 17, id: "clean-public-areas", title: "CLEAN PUBLIC AREAS" },
      { count: 13, id: "provide-laundry-service", title: "PROVIDE LAUNDRY SERVICE" },
    ]),
  };
}

function repairPoultryChickenForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Animal Production (Poultry-Chicken) NC II" || form.units.length !== 1) {
    return form;
  }

  const [sourceUnit] = form.units;

  if (sourceUnit.questions.length !== 105) {
    return form;
  }

  const questions = sourceUnit.questions.map((question) => ({ ...question }));

  const mergeQuestionAt = (targetIndex: number, sourceIndex: number) => {
    const targetQuestion = questions[targetIndex];
    const sourceQuestion = questions[sourceIndex];

    if (targetQuestion && sourceQuestion) {
      targetQuestion.text = mergeQuestionText(targetQuestion.text, sourceQuestion.text);
      questions[sourceIndex] = { ...sourceQuestion, text: "" };
    }
  };

  mergeQuestionAt(0, 1);
  mergeQuestionAt(2, 3);
  mergeQuestionAt(10, 11);

  const compactedQuestions = questions.filter((question) => question.text);

  return {
    ...form,
    units: rebuildSequentialUnits(
      {
        ...sourceUnit,
        questions: compactedQuestions,
      },
      [
        { count: 17, id: "maintain-poultry-house", title: "Maintain poultry house" },
        { count: 27, id: "brood-and-grow-chicks", title: "Brood and grow chicks" },
        { count: 22, id: "perform-pre-lay-and-lay-activities", title: "Perform pre-lay and lay activities" },
        { count: 8, id: "trim-beak", title: "Trim beak" },
        { count: 28, id: "raise-breeders", title: "Raise breeders" },
      ],
    ),
  };
}

function repairMasonryForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Masonry NC II" || form.units.length !== 2) {
    return form;
  }

  const [layBlocksUnit, ruleUnit] = form.units;

  if (!/^Rule 1080/i.test(ruleUnit.title) || layBlocksUnit.questions.length !== 1 || ruleUnit.questions.length !== 16) {
    return form;
  }

  const questions = [
    {
      ...layBlocksUnit.questions[0],
      text: mergeQuestionText(layBlocksUnit.questions[0].text, ruleUnit.title),
    },
    ...ruleUnit.questions.map((question) => ({ ...question })),
  ];

  return {
    ...form,
    units: [
      {
        id: "lay-concrete-hollow-blocks-for-structures",
        questions: questions.slice(0, 13).map((question, questionIndex) => ({
          ...question,
          id: `lay-concrete-hollow-blocks-for-structures-${String(questionIndex + 1).padStart(2, "0")}`,
        })),
        title: "Lay Concrete Hollow Blocks for Structures",
      },
      {
        id: "plaster-wall-surface",
        questions: questions.slice(13).map((question, questionIndex) => ({
          ...question,
          id: `plaster-wall-surface-${String(questionIndex + 1).padStart(2, "0")}`,
        })),
        title: "Plaster Wall Surface",
      },
    ],
  };
}

function repairTileSettingForm(form: SagFormDefinition): SagFormDefinition {
  if (form.qualificationTitle !== "SAG-Tile Setting NC II" || form.units.length !== 7) {
    return form;
  }

  const [plansUnit, ruleUnit, ...remainingUnits] = form.units;

  if (!/^Rule 1080/i.test(ruleUnit.title) || plansUnit.questions.length !== 1) {
    return form;
  }

  const plansQuestions = [
    {
      ...plansUnit.questions[0],
      text: mergeQuestionText(plansUnit.questions[0].text, ruleUnit.title),
    },
    ...ruleUnit.questions.map((question) => ({ ...question })),
  ].map((question, questionIndex) => ({
    ...question,
    id: `plans-and-prepares-for-work-${String(questionIndex + 1).padStart(2, "0")}`,
  }));

  return {
    ...form,
    units: [
      {
        id: "plans-and-prepares-for-work",
        questions: plansQuestions,
        title: "Plans and prepares for work",
      },
      ...remainingUnits,
    ],
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

    if (
      previousUnit &&
      previousQuestion &&
      shouldMergeUnitTitleIntoPreviousQuestion(previousQuestion.text, normalizedUnit.title, normalizedUnit.questions.length)
    ) {
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
  return [
    repairDomesticWorkForm,
    repairEccdForm,
    repairFoodAndBeverageServicesNcII,
    repairSwineForm,
    repairHousekeepingForm,
    repairPoultryChickenForm,
    repairMasonryForm,
    repairTileSettingForm,
    repairBrokenContinuations,
  ].reduce((currentForm, repair) => repair(currentForm), form);
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
    sagFormsPromise = Promise.all(
      sagFormTemplates.map((template) => {
        const sanitizedForm = sanitizeSagForm(template);
        const layout = sagGeneratedLayouts.find(
          (entry) => normalizeSagProgramTitle(entry.sourceFileName) === sanitizedForm.qualificationTitle,
        );
        const identityMetadata = getSagIdentityMetadata(layout?.sourceFileName ?? null);

        return {
          ...sanitizedForm,
          candidateFieldLabel: identityMetadata.candidateFieldLabel,
          shouldAutofillCandidateName: identityMetadata.shouldAutofillCandidateName,
        };
      }),
    );
  }

  return sagFormsPromise;
}
