import { loadSagFormDefinitions } from "../src/lib/sag-forms";

const SUSPICIOUS_UNIT_TITLE_PATTERN =
  /^(title\b|systems$|products and systems$|requirements$|drawings?\.?$|working drawings$|job specifications\.?$|cookery nc ii$|rule 1080\b)/i;
const SUSPICIOUS_QUESTION_PATTERN =
  /(Prepare required documentation for tools and materials Prepare the Client|Ensure client['’]s safety and comfort throughout the service.*Advise client|Position and fix jamb and panels to openings Layout ceiling elevation|Title ASSEMBLE ELECTRONICS PRODUCTS|FOOD AND BEVERAGE SERVICES NC II \d)/i;

const EXPECTED_FORM_COUNTS: Record<string, { questions: number; units: number }> = {
  "SAG-Agricultural Crops Production NC II": { units: 6, questions: 76 },
  "SAG-Agricultural Crops Production NC III": { units: 11, questions: 131 },
  "SAG-AgroEntrepreneurship NC II": { units: 4, questions: 31 },
  "SAG-Animal Production (Poultry-Chicken) NC II": { units: 5, questions: 102 },
  "SAG-Animal Production (Swine) NC II": { units: 6, questions: 129 },
  "SAG-Barangay Health Services NC II": { units: 9, questions: 40 },
  "SAG-Bartending NC II": { units: 4, questions: 63 },
  "SAG-Beauty Care (Nail Care) Services NC II (FULL)": { units: 6, questions: 54 },
  "SAG-Bookkeeping NC III": { units: 1, questions: 12 },
  "SAG-Bread and Pastry Production NC II - Amended": { units: 1, questions: 38 },
  "SAG-Caregiving NC II": { units: 13, questions: 94 },
  "SAG-Carpentry NC II": { units: 13, questions: 34 },
  "SAG-Computer Systems Servicing NC II (FULL)": { units: 16, questions: 73 },
  "SAG-Cookery NC II": { units: 3, questions: 73 },
  "SAG-Domestic Work NC II Full": { units: 26, questions: 149 },
  "SAG-Dressmaking NC II": { units: 3, questions: 46 },
  "SAG-Driving NC II": { units: 1, questions: 6 },
  "SAG-ECCDNC3": { units: 3, questions: 63 },
  "SAG-Electrical Installation and Maintenance NC II": { units: 1, questions: 37 },
  "SAG-Electronic Product Assembly and Servicing NC II": { units: 3, questions: 74 },
  "SAG-Events management Services NC III": { units: 2, questions: 17 },
  "SAG-Food and Beverage Services NC II": { units: 3, questions: 97 },
  "SAG-Food and Beverage Services NC III": { units: 5, questions: 88 },
  "SAG-Food Processing NC II (FULL)": { units: 1, questions: 43 },
  "SAG-Front Office Services NC II": { units: 23, questions: 94 },
  "SAG-Grains Production NC II (Corn)": { units: 7, questions: 38 },
  "SAG-Grains Production NC II (Rice)": { units: 6, questions: 44 },
  "SAG-Heavy Equipment Servicing (Mechanical) NC II": { units: 1, questions: 15 },
  "SAG-Horticulture NC III": { units: 11, questions: 141 },
  "SAG-Housekeeping NC II (FULL)": { units: 4, questions: 85 },
  "SAG-Masonry NC II": { units: 2, questions: 17 },
  "SAG-Massage Therapy NC II": { units: 3, questions: 22 },
  "SAG-Motorcycle Small Engine Servicing NC II": { units: 5, questions: 27 },
  "SAG-Organic Agriculture Production NC II (New)": { units: 8, questions: 94 },
  "SAG-Plumbing NC I": { units: 4, questions: 49 },
  "SAG-Plumbing NC II": { units: 4, questions: 39 },
  "SAG-PV System Servicing NC III": { units: 1, questions: 18 },
  "SAG-PV Systems Installation NC II": { units: 1, questions: 24 },
  "SAG-SMAW NC II": { units: 1, questions: 14 },
  "SAG-Technical Drafting NC II": { units: 1, questions: 8 },
  "SAG-Tile Setting NC II": { units: 6, questions: 22 },
  "SAG-Trainers Methodology (TM) Level I": { units: 5, questions: 130 },
};

async function main() {
  const forms = await loadSagFormDefinitions();
  const issues: string[] = [];

  if (forms.length === 0) {
    issues.push("No hardcoded SAG forms were loaded.");
  }

  forms.forEach((form) => {
    const instructionBody = form.instructionLines.filter((line) => !/^instruction:?$/i.test(line.trim()));
    const expectedCounts = EXPECTED_FORM_COUNTS[form.qualificationTitle];
    const questionCount = form.units.reduce((total, unit) => total + unit.questions.length, 0);

    if (!expectedCounts) {
      issues.push(`${form.qualificationTitle}: missing expected validator count`);
    } else {
      if (form.units.length !== expectedCounts.units) {
        issues.push(`${form.qualificationTitle}: expected ${expectedCounts.units} units, got ${form.units.length}`);
      }

      if (questionCount !== expectedCounts.questions) {
        issues.push(`${form.qualificationTitle}: expected ${expectedCounts.questions} questions, got ${questionCount}`);
      }
    }

    if (instructionBody.length === 0) {
      issues.push(`${form.qualificationTitle}: missing instruction body lines`);
    }

    instructionBody.forEach((line) => {
      if (/^instruction:/i.test(line.trim())) {
        issues.push(`${form.qualificationTitle}: instruction body still contains heading text -> ${line}`);
      }
    });

    if (form.units.length === 0) {
      issues.push(`${form.qualificationTitle}: no units`);
    }

    form.units.forEach((unit) => {
      if (!unit.title.trim()) {
        issues.push(`${form.qualificationTitle}: empty unit title`);
      }

      if (SUSPICIOUS_UNIT_TITLE_PATTERN.test(unit.title.trim())) {
        issues.push(`${form.qualificationTitle}: suspicious unit title -> ${unit.title}`);
      }

      if (unit.questions.length === 0) {
        issues.push(`${form.qualificationTitle}: unit has no questions -> ${unit.title}`);
      }

      unit.questions.forEach((question) => {
        if (!question.text.trim()) {
          issues.push(`${form.qualificationTitle}: empty question in ${unit.title}`);
        }

        if (SUSPICIOUS_QUESTION_PATTERN.test(question.text)) {
          issues.push(`${form.qualificationTitle}: suspicious merged question in ${unit.title} -> ${question.text}`);
        }
      });
    });
  });

  if (issues.length > 0) {
    console.error("SAG hardcoded validation failed:");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${forms.length} hardcoded SAG forms successfully.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
