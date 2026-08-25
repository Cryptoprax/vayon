import type { PolicySection } from "../components/LegalPolicyPage";
const governance = [
  {
    title: "Scope",
    paragraphs: [
      "This policy applies to the VAYON service, public website and associated customer operations.",
    ],
  },
  {
    title: "Customer responsibilities",
    paragraphs: [
      "Customers must ensure authorized, lawful use and appropriate human review of business and AI-assisted outputs.",
    ],
  },
  {
    title: "Security and privacy",
    paragraphs: [
      "Access controls, tenant boundaries and audit history support the service. Customers remain responsible for user access and submitted content.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "Material changes will be reflected through an updated version and effective date. Questions may be submitted to VAYON Legal.",
    ],
  },
] as const satisfies readonly PolicySection[];
export const legalPolicies = {
  terms: {
    title: "Terms of Service",
    description: "The terms governing authorized access to and use of VAYON.",
    sections: governance,
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "How VAYON processes account, organization, product, website and support data.",
    sections: [
      ...governance,
      {
        title: "Data rights",
        paragraphs: [
          "Applicable access, correction, export, objection and deletion requests may be submitted through the privacy contact channel.",
        ],
      },
    ],
  },
  acceptable: {
    title: "Acceptable Use Policy",
    description:
      "Rules protecting customers, users and the VAYON platform from misuse.",
    sections: [
      ...governance,
      {
        title: "Prohibited activity",
        paragraphs: [
          "Users must not abuse services, violate rights, introduce malicious content, evade controls, conduct unlawful surveillance or use VAYON to cause harm.",
        ],
      },
    ],
  },
  ai: {
    title: "AI Usage Policy",
    description: "Responsible use requirements for AI-assisted work in VAYON.",
    sections: [
      ...governance,
      {
        title: "Human oversight",
        paragraphs: [
          "AI output may be incomplete or inaccurate and must receive qualified human review before consequential use.",
        ],
      },
    ],
  },
  dpa: {
    title: "Data Processing Addendum",
    description:
      "A launch-ready framework for enterprise personal-data processing terms.",
    sections: [
      ...governance,
      {
        title: "Processing instructions",
        paragraphs: [
          "VAYON processes customer personal data only under documented instructions and applicable contractual terms.",
        ],
      },
      {
        title: "International transfers",
        paragraphs: [
          "Transfer safeguards and regional terms will be documented in the executed customer agreement where required.",
        ],
      },
    ],
  },
  subprocessors: {
    title: "Subprocessor List",
    description:
      "Transparency for third parties that may process customer data when configured.",
    sections: [
      {
        title: "Current disclosure",
        paragraphs: [
          "The authoritative subprocessor list will identify provider, purpose and processing location before applicable production processing. Provider availability does not imply configuration or use.",
        ],
      },
      {
        title: "Change notices",
        paragraphs: [
          "Material subprocessor changes will follow applicable contractual notice requirements.",
        ],
      },
    ],
  },
  copyright: {
    title: "Copyright Policy",
    description:
      "How VAYON protects copyrighted material and receives rights-holder notices.",
    sections: [
      ...governance,
      {
        title: "Rights notices",
        paragraphs: [
          "A complete notice should identify the work, relevant material, contact details, authority and a good-faith statement.",
        ],
      },
    ],
  },
  trademark: {
    title: "Trademark Policy",
    description:
      "Guidance for authorized use of VAYON names, logos and brand assets.",
    sections: [
      ...governance,
      {
        title: "Brand use",
        paragraphs: [
          "VAYON marks may not imply endorsement, partnership or certification without written authorization.",
        ],
      },
    ],
  },
} as const;
