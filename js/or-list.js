// OR (Organisation Registration) Dashboard data.
// Each item carries SSG's requirement (paraphrased from TPGateway documentation)
// and "How we assist" — the practice's working role.

window.TB_OR_STAGES = [
  {
    id: "stage-1",
    label: "Stage 1",
    title: "OR pre-requisites",
    blurb:
      "The foundations SSG looks for before an Organisation Registration application is accepted into review.",
    items: [
      {
        id: "1a",
        ref: "1 · a",
        name: "Legal Entity",
        summary:
          "A Singapore-registered legal entity, evidenced at ACRA or the Registry of Societies (ROS).",
        body:
          "A Training Provider must be a legal entity registered in Singapore with the relevant authorities, Accounting and Corporate Regulatory Authority (ACRA) or Registry of Societies (ROS). Registered societies must additionally provide the constitution list naming the Management Committee as registered with ROS.",
        assist:
          "We confirm the entity is registered in a form SSG accepts and, where the existing legal vehicle is unsuitable, we work alongside your corporate advisers to recommend a structure that does. Where ROS registration is the route, we assemble the Management Committee list to the form SSG expects."
      },
      {
        id: "1b",
        ref: "1 · b",
        name: "Legal Entity Name",
        summary:
          "Proscribed terms such as 'National', 'University', 'Singapore' and 'Ministry' are not permitted in the legal name.",
        body:
          "The Training Provider name must not use proscribed terms such as 'National', 'University', 'Singapore', any derivative of these terms, or misleading terms such as 'Ministry'. The name on file with SSG must match the name on file with ACRA or ROS.",
        assist:
          "We pre-clear the proposed legal name against SSG's naming rules and the equivalent ACRA reserve-name check, so the entity is not registered under a name that will later need to be changed for SSG purposes."
      },
      {
        id: "1c",
        ref: "1 · c",
        name: "Declarations by Management Staff and Adult Educators",
        summary:
          "Three formal declarations on contractual record, criminal record and e-attendance readiness.",
        body:
          "The application requires declarations that (i) the organisation, Key Person In-Charge (KPIC), Management Representatives (MRs) and Adult Educators are free from contractual breach in the last five years against the SSG Act 2016, the Skills Development Levy Act 1979, the Private Education Act 2009, the Terms for Training Providers, EduTrust Certification and the WSQ framework; (ii) the same parties are free from relevant criminal offences in the last five years; and (iii) the Management Staff are aware of and will comply with mandatory e-attendance requirements for classroom and synchronous e-learning sessions.",
        assist:
          "We draft the declarations in the form SSG expects, prepare the supporting checklists for KPIC and MR sign-off, and brief the leadership team on the e-attendance obligations they are committing to from the first course run forward."
      },
      {
        id: "1d",
        ref: "1 · d",
        name: "Financial Records",
        summary:
          "Latest final Notice of Assessment from IRAS showing positive trade income, an ECI notice will not be accepted.",
        body:
          "The Training Provider must demonstrate sound financial health by submitting the latest final Notice of Assessment (NOA) from IRAS showing positive trade income, together with key financial figures. A NOA showing only Estimated Chargeable Income (ECI) will not be accepted. Limited Liability Partnerships must additionally submit the Allocation of Profit/Loss to Partners and each partner's final NOA.",
        assist:
          "We work with your finance team to retrieve the correct NOA from myTax Portal, prepare the key-figures schedule SSG asks for, and, where the entity is an LLP, assemble the partner-level documentation in the order SSG expects."
      },
      {
        id: "1e",
        ref: "1 · e",
        name: "Training Track Record",
        summary:
          "At least one year of regular training activity, with at least one course in every quarter, supported by structured evidence.",
        body:
          "A minimum one-year training and education track record is required, with activity in each quarter. The submission comprises (i) a written record using SSG's template covering course titles, durations, run dates and learner age profiles; (ii) operational evidence, invoices, attendance records, registration confirmations, and video recordings where training was conducted online; and (iii) evidence that the activities had clearly defined objectives, structured lesson plans, formal assessment plans, and industry consultation and feedback loops.",
        assist:
          "For organisations new to the sector, this is the requirement most likely to disqualify a fresh application. We sit with you to construct a programme of training that meets the cadence and depth SSG expects, deliver it under the practice's quality framework, and assemble the supporting evidence pack in the form SSG accepts. Where you already have a year of activity, we audit it against SSG's criteria and remediate any gaps before submission."
      }
    ]
  },
  {
    id: "stage-2",
    label: "Stage 2",
    title: "Other OR requirements",
    blurb:
      "The operating systems, premises and policy documentation SSG assesses alongside the pre-requisites.",
    items: [
      {
        id: "2a",
        ref: "2 · a",
        name: "Information Disclosure",
        summary:
          "Course information published on the website or brochures in the form SSG specifies, without SSG or SkillsFuture logos.",
        body:
          "The Training Provider must publish course title, training duration, fees, funding validity period, modes of training, course objectives, names of Senior Management staff and trainers, organisation structure, and facilities and equipment. A sample brochure or mock-up website must be submitted to demonstrate compliance. SSG and SkillsFuture logos may not be used in advertising material; the Marketing Guidelines in the Terms for Training Providers govern the rest.",
        assist:
          "We draft the disclosure copy and a sample brochure to SSG's content schedule, and produce a mock-up of the website pages SSG will inspect during assessment. The copywriting is held to the same plain-language register as the rest of the practice."
      },
      {
        id: "2b",
        ref: "2 · b",
        name: "Premises",
        summary:
          "Adequate facilities and a real training address, P.O. Boxes are not accepted.",
        body:
          "Documentary proof is required: a written description of facilities and equipment matched to learner and delivery needs; photographs of training and assessment rooms; and proof of the training location and administrative office, typically the latest rental invoice and lease agreement. P.O. Box addresses do not satisfy the premises requirement.",
        assist:
          "We prepare the premises file in the form SSG accepts, advise on the photographic record so that the rooms read as audit-ready on the day of assessment, and review the lease arrangements to ensure they meet SSG's intent rather than just its letter."
      },
      {
        id: "2c",
        ref: "2 · c",
        name: "Registration Form / Learner Contract",
        summary:
          "A signed registration form or Learner Contract that names the course, funding sums and balance payable.",
        body:
          "The Training Provider must use a registration form or agreement signed with each learner. The form must carry the registered course title with commencement and end dates, the amount of SkillsFuture Credit and other SSG funding to be applied, and the balance of fees payable by the learner directly.",
        assist:
          "We draft the Learner Contract template, vet it for compliance with SSG's funding rules and the Consumer Protection (Fair Trading) Act, and prepare an internal procedure note for the staff who will be administering it cohort by cohort."
      },
      {
        id: "2d",
        ref: "2 · d",
        name: "Policies and Operations Manual",
        summary:
          "The systems-and-capabilities manual covering Course Administration and Outcomes, assessed onsite by SSG over half a day.",
        body:
          "The Policies and Operations Manual is the central documentary deliverable: it sets out the Training Provider's processes across Course Administration and Outcomes, collectively known as Systems and Capabilities. The submission is evaluated against SSG's Requirements Specifications and Document Preparation List, and is followed by a half-day onsite assessment by SSG officers.",
        assist:
          "This is the centre of the practice's work on an OR application. We draft the full Policies and Operations Manual from the Requirements Specifications outward, version-stamp every component, rehearse the leadership team for the half-day onsite assessment, and remain on hand throughout the assessment day."
      },
      {
        id: "2e",
        ref: "2 · e",
        name: "OR Declaration Form",
        summary:
          "The single SSG declaration form bundled with the supporting Stage 1 and Stage 2 documents.",
        body:
          "Training Providers must complete and submit the OR Declaration Form together with the Stage 1 and Stage 2 documents when filing the OR application via TPGateway. Failure to meet any OR requirement leads to rejection; missing documents lead to delay or rejection. The OR application fee is non-refundable.",
        assist:
          "We file the OR application end to end via TPGateway, with the Declaration Form, the Stage 1 dossier and the Stage 2 manual prepared in the order SSG expects. We are not given to filing speculative applications; the application leaves our desk only when we believe it will be accepted."
      }
    ]
  },
  {
    id: "stage-3",
    label: "Practicalities",
    title: "What else you will need",
    blurb:
      "The administrative scaffolding around the application, accounts, banking, and the decision about who you are training.",
    items: [
      {
        id: "3a",
        ref: "3 · a",
        name: "Corppass Account",
        summary:
          "Singapore Corppass is the single digital identity used to transact in TPGateway.",
        body:
          "A Corppass account is required to transact in TPGateway. The Training Provider's authorised personnel use their Corppass credentials to log in. Corppass registration is at www.corppass.gov.sg or via the Corppass enquiry line at +65 6335 3530.",
        assist:
          "We brief your authorised personnel on the Corppass roles they will need and the access rights to assign, KPIC, MR and operational users, so the gateway access mirrors the governance you have committed to in the declarations."
      },
      {
        id: "3b",
        ref: "3 · b",
        name: "PayNow Account",
        summary:
          "A corporate PayNow account is needed to transact in TPGateway.",
        body:
          "The Training Provider must hold a corporate PayNow account to receive disbursements and settle TPGateway charges. Set-up is typically arranged through the organisation's primary bank.",
        assist:
          "We confirm the PayNow account is in place and tied to the legal entity registered with SSG, before the OR application leaves our desk."
      },
      {
        id: "3c",
        ref: "3 · c",
        name: "Target Training Group",
        summary:
          "Public, In-House, or both, a decision that constrains marketing posture, funding eligibility and policy wording.",
        body:
          "Three categories of target training group are recognised: Public Training Provider (offering training to the general public and corporate clients), In-House Training Provider (training the employer's own employees only), and Both Public and In-House (offering training to both audiences). The choice affects fee-funding eligibility, marketing latitude, and the wording of several policy clauses in the Operations Manual.",
        assist:
          "We work through the implications of each option with the leadership team, funding, marketing, governance, audit posture, and make a recommendation in writing before the OR application is drafted."
      }
    ]
  }
];

window.TB_OR_NOTE =
  "An Organisation Registration (OR) application must be submitted together with a Course Application (CA). The two are reviewed in tandem by SSG. Where 2birds is engaged on an ATO setup, both submissions are prepared on the same working schedule and lodged together.";
