export const VENDOR_CHECKLIST = [
  {
    id: "S1",
    title: "Section 1: Legal & Contractual Requirements",
    questions: [
      {
        id: "S1Q1",
        text: "Has your organization signed a valid Data Protection Agreement (DPA) with Company's Name?",
      },
      {
        id: "S1Q2",
        text: "Is the purpose, scope, and duration of Personal Data processing clearly defined in the agreement with Company's Name?",
      },
      {
        id: "S1Q3",
        text: "Does your organization agree not to process Personal Data for any purpose beyond Company's Name’s documented instructions?",
      },
      {
        id: "S1Q4",
        text: "Do you agree to provide timely breach notifications to Company's Name, in compliance with PDPL Article 20?",
      },
      {
        id: "S1Q5",
        text: "Will your organization return or securely destroy Personal Data upon contract termination or Company's Name’s request?",
      },
      {
        id: "S1Q6",
        text: "Has your organization acknowledged its role as a Processor (as defined by PDPL)?",
      },
    ],
  },
  {
    id: "S2",
    title: "Section 2: Technical & Organizational Security Controls",
    questions: [
      {
        id: "S2Q1",
        text: "Do you enforce access control mechanisms (e.g., role-based access, least privilege)?",
      },
      {
        id: "S2Q2",
        text: "Is Personal Data encrypted both at rest and during transmission?",
      },
      {
        id: "S2Q3",
        text: "Do you maintain secure authentication methods (e.g., MFA, strong password policies)?",
      },
      {
        id: "S2Q4",
        text: "Do you monitor and log access to Personal Data systems and applications?",
      },
      {
        id: "S2Q5",
        text: "Do you perform regular vulnerability scanning and penetration testing?",
      },
      {
        id: "S2Q6",
        text: "Do you have an incident response plan that includes data breaches?",
      },
      {
        id: "S2Q7",
        text: "Do you conduct regular security awareness training for employees handling Personal Data?",
      },
    ],
  },
  {
    id: "S3",
    title: "Section 3: Privacy Governance & Compliance",
    questions: [
      {
        id: "S3Q1",
        text: "Do you have a documented privacy policy aligned with applicable regulations (e.g., PDPL)?",
      },
      {
        id: "S3Q2",
        text: "Have you appointed a Data Protection Officer (DPO) or equivalent privacy lead?",
      },
      {
        id: "S3Q3",
        text: "Do you support data subject rights requests (access, correction, deletion) promptly?",
      },
      {
        id: "S3Q4",
        text: "Do you perform privacy impact assessments where required?",
      },
      {
        id: "S3Q5",
        text: "Do you maintain records of processing activities and data flows?",
      },
    ],
  },
  {
    id: "S4",
    title: "Section 4: Breach Response & Notification",
    questions: [
      {
        id: "S4Q1",
        text: "Do you have a defined process to detect, report, and investigate Personal Data breaches?",
      },
      {
        id: "S4Q2",
        text: "Do you notify Company's Name without undue delay upon discovering a breach?",
      },
      {
        id: "S4Q3",
        text: "Can you provide evidence of your internal breach reporting and escalation policy?",
      },
    ],
  },
  {
    id: "S5",
    title: "Section 5 Termination, Exit & Data Handling",
    questions: [
      {
        id: "S5Q1",
        text: "Do you have formal procedures for data return, transfer, or destruction upon termination of service?",
      },
      {
        id: "S5Q2",
        text: "Will you certify the secure deletion or anonymization of Personal Data upon request?",
      },
      {
        id: "S5Q3",
        text: "Do you ensure removal of system and user access after the contract ends?",
      },
    ],
  },
];
