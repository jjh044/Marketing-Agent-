type VercelRequest = {
  body?: unknown;
  method?: string;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): void;
};

type StudyGuide = {
  reference: string;
  verse: string;
  wordStudies: Array<{
    term: string;
    original: string;
    language: "Hebrew" | "Greek";
    meaning: string;
  }>;
  summary: string;
  questions: string[];
};

const fallbackGuides: Record<string, StudyGuide> = {
  "john 3:16": {
    reference: "John 3:16",
    verse:
      "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
    wordStudies: [
      {
        term: "loved",
        original: "agapao",
        language: "Greek",
        meaning:
          "A self-giving love shown through action, commitment, and sacrificial care rather than only emotion."
      },
      {
        term: "believes",
        original: "pisteuo",
        language: "Greek",
        meaning:
          "To trust, rely on, and place confidence in someone. In this passage it carries the idea of active dependence."
      }
    ],
    summary:
      "This verse presents the heart of the gospel: God's love moves toward the world through the gift of the Son, and the invited response is trusting him for life that does not end in separation from God.",
    questions: [
      "Where do you most need to receive God's love as an action, not just an idea?",
      "What would it look like today to trust Jesus with active dependence?"
    ]
  },
  "psalm 23": {
    reference: "Psalm 23",
    verse:
      "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters.",
    wordStudies: [
      {
        term: "shepherd",
        original: "ra'ah",
        language: "Hebrew",
        meaning:
          "To pasture, tend, feed, and care for a flock. The image points to guidance, provision, and protection."
      },
      {
        term: "still waters",
        original: "me menuchot",
        language: "Hebrew",
        meaning:
          "Waters of rest or quietness, suggesting refreshment that comes from being led to a safe place."
      }
    ],
    summary:
      "Psalm 23 describes the Lord as the faithful shepherd who provides, guides, restores, protects, and welcomes his people into secure fellowship with him.",
    questions: [
      "What part of your life feels most in need of the Shepherd's guidance right now?",
      "Where might God be inviting you to receive rest instead of forcing your own provision?"
    ]
  }
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const reference = getReference(request.body);

  if (!reference) {
    response.status(400).json({ error: "A scripture reference is required." });
    return;
  }

  try {
    const guide = process.env.OPENAI_API_KEY
      ? await createAiStudyGuide(reference)
      : createFallbackGuide(reference);

    response.status(200).json(guide);
  } catch {
    response.status(200).json(createFallbackGuide(reference));
  }
}

function getReference(body: unknown) {
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body) as { reference?: unknown };
      return typeof parsed.reference === "string" ? parsed.reference.trim() : "";
    } catch {
      return "";
    }
  }

  if (body && typeof body === "object" && "reference" in body) {
    const reference = (body as { reference?: unknown }).reference;
    return typeof reference === "string" ? reference.trim() : "";
  }

  return "";
}

async function createAiStudyGuide(reference: string): Promise<StudyGuide> {
  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content:
            "You create careful Bible study notes. Return only valid JSON matching this TypeScript type: { reference: string; verse: string; wordStudies: { term: string; original: string; language: 'Hebrew' | 'Greek'; meaning: string }[]; summary: string; questions: string[] }. Include exactly two word studies and exactly two reflection questions. Use Greek for New Testament and Hebrew for Old Testament. Mention that meanings are study aids, not doctrine, inside the summary when useful.",
          role: "system"
        },
        {
          content: `Create a study guide for ${reference}. Use a public domain style verse quote or a concise paraphrase if needed.`,
          role: "user"
        }
      ],
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      text: {
        format: {
          type: "json_object"
        }
      }
    }),
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!aiResponse.ok) {
    throw new Error("AI study guide failed.");
  }

  const payload = (await aiResponse.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  const text =
    payload.output_text ??
    payload.output?.flatMap((item) => item.content ?? []).find((content) => content.text)?.text;

  if (!text) {
    throw new Error("AI response did not include text.");
  }

  return JSON.parse(text) as StudyGuide;
}

function createFallbackGuide(reference: string): StudyGuide {
  const key = reference.toLowerCase().trim();

  if (fallbackGuides[key]) {
    return fallbackGuides[key];
  }

  const isNewTestament = /matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation/i.test(
    reference
  );

  return {
    reference,
    verse:
      "Open your Bible to this passage and read it slowly before using these notes as a starting point for study.",
    wordStudies: isNewTestament
      ? [
          {
            term: "grace",
            original: "charis",
            language: "Greek",
            meaning:
              "A gift of favor freely given. In New Testament study, it often points to God's generous action toward people."
          },
          {
            term: "faith",
            original: "pistis",
            language: "Greek",
            meaning:
              "Trust, faithfulness, or confidence. The word often carries both belief and loyal reliance."
          }
        ]
      : [
          {
            term: "steadfast love",
            original: "hesed",
            language: "Hebrew",
            meaning:
              "Covenant loyalty, mercy, and faithful love expressed through dependable action."
          },
          {
            term: "peace",
            original: "shalom",
            language: "Hebrew",
            meaning:
              "Wholeness, welfare, completeness, and restored order rather than only the absence of conflict."
          }
        ],
    summary:
      "Use this passage as a place to slow down, observe what God reveals about his character, and notice the response invited from the reader. Word meanings are study aids and should be weighed alongside the full passage and trusted teaching.",
    questions: [
      "What does this passage reveal about God's character or desire for his people?",
      "What is one honest response this passage invites from you today?"
    ]
  };
}
