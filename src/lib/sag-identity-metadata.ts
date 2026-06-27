import path from "node:path";

export type SagIdentityFieldMetadata = {
  candidateFieldLabel: string | null;
  shouldAutofillCandidateName: boolean;
};

const sagIdentityMetadataBySourceFileName: Record<string, SagIdentityFieldMetadata> = {
  "SAG - Bartending NC II.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Beauty Care (Nail Care) Services NC II (FULL).pdf": {
    candidateFieldLabel: null,
    shouldAutofillCandidateName: false,
  },
  "SAG - Bookkeeping NC III.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Bread and Pastry Production NC II - Amended.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Caregiving NC II.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Carpentry NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Computer Systems Servicing NC II (FULL).pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Cookery NC II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Domestic Work NC II Full.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Dressmaking NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Driving NC II.pdf": {
    candidateFieldLabel: "Candidate's Name",
    shouldAutofillCandidateName: true,
  },
  "SAG - ECCDNC3.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Electrical Installation and Maintenance NC II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Electronic Product Assembly and Servicing NC II.pdf": {
    candidateFieldLabel: null,
    shouldAutofillCandidateName: false,
  },
  "SAG - Events management Services NC III.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Food Processing NC II (FULL).pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Food and Beverage Services NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Food and Beverage Services NC III.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Front Office Services NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Grains Production NC II (Corn).pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Grains Production NC II (Rice).pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Heavy Equipment Servicing (Mechanical) NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Horticulture NC III.pdf": {
    candidateFieldLabel: "Candidate's Name",
    shouldAutofillCandidateName: true,
  },
  "SAG - Housekeeping NC II (FULL).pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Masonry NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Massage Therapy NC II.pdf": {
    candidateFieldLabel: null,
    shouldAutofillCandidateName: false,
  },
  "SAG - Motorcycle Small Engine Servicing NC II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Organic Agriculture Production NC II (New).pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - PV System Servicing NC III.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - PV Systems Installation NC II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Plumbing NC I.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Plumbing NC II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - SMAW NC II.pdf": {
    candidateFieldLabel: "Candidate's Name",
    shouldAutofillCandidateName: true,
  },
  "SAG - Technical Drafting NC II.pdf": {
    candidateFieldLabel: "Candidate's Name",
    shouldAutofillCandidateName: true,
  },
  "SAG - Tile Setting NC II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG - Trainers Methodology (TM) Level I.pdf": {
    candidateFieldLabel: "Candidate's Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG-Agricultural_Crops_Production_NC_II.pdf": {
    candidateFieldLabel: "Candidate's Name",
    shouldAutofillCandidateName: true,
  },
  "SAG-Agricultural_Crops_Production_NC_III.pdf": {
    candidateFieldLabel: "Candidate's Name",
    shouldAutofillCandidateName: true,
  },
  "SAG-AgroEntrepreneurship_NC_II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG-Animal_Production_(Poultry-Chicken)_NC_II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG-Animal_Production_(Swine)_NC_II.pdf": {
    candidateFieldLabel: "Candidate's Name & Signature",
    shouldAutofillCandidateName: false,
  },
  "SAG-Barangay_Health_Services_NC_II.pdf": {
    candidateFieldLabel: "Candidate's Name and Signature",
    shouldAutofillCandidateName: false,
  },
};

export function getSagIdentityMetadata(sourcePdfPath: string | null): SagIdentityFieldMetadata {
  const sourceFileName = sourcePdfPath ? path.basename(sourcePdfPath) : null;

  if (!sourceFileName) {
    return {
      candidateFieldLabel: "Candidate's Name",
      shouldAutofillCandidateName: true,
    };
  }

  return (
    sagIdentityMetadataBySourceFileName[sourceFileName] ?? {
      candidateFieldLabel: "Candidate's Name",
      shouldAutofillCandidateName: true,
    }
  );
}
