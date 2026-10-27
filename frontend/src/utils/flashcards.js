export const FLASHCARD_CATEGORIES = [
  "anatomy",
  "physiology",
  "pharmacology",
  "general",
  "clinical",
  "public_health",
  "terminology",
  "other",
];

export const flashcardText = (value, language, fallback = "") => {
  if (typeof value === "string" && value.trim()) return value.trim();
  for (const locale of [language, "fr", "ar"]) {
    if (typeof value?.[locale] === "string" && value[locale].trim())
      return value[locale].trim();
  }
  return fallback;
};

export const flashcardSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .toLocaleLowerCase()
    .trim();

const categoryAliases = {
  anatomie: "anatomy",
  physiologie: "physiology",
  pharmacologie: "pharmacology",
  "public-health": "public_health",
  "santé publique": "public_health",
};
export const flashcardCategory = (value) => {
  if (typeof value !== "string") return value == null ? "general" : "other";
  const category = value.toLowerCase().trim();
  return FLASHCARD_CATEGORIES.includes(category)
    ? category
    : Object.prototype.hasOwnProperty.call(categoryAliases, category)
      ? categoryAliases[category]
      : "other";
};

const difficultyAliases = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};
const difficulty = (value) =>
  ["easy", "medium", "hard"].includes(value)
    ? value
    : typeof value === "string" &&
        Object.prototype.hasOwnProperty.call(difficultyAliases, value)
      ? difficultyAliases[value]
      : "unspecified";

export const flashcardDate = (value) => {
  if (!value) return null;
  if (
    !(value instanceof Date) &&
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value.toDate !== "function" &&
    typeof value.seconds !== "number"
  )
    return null;
  const parsed =
    typeof value.toDate === "function"
      ? value.toDate()
      : typeof value.seconds === "number"
        ? new Date(value.seconds * 1000)
        : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeFlashcardDeck = (id, raw, language = "fr") => {
  if (!raw || typeof raw !== "object" || !id) return null;
  const source =
    [raw.cards, raw.flashcards, raw.items].find(
      (value) => Array.isArray(value) && value.length,
    ) || (raw.question || raw.front || raw.prompt ? [raw] : []);
  const cards = source
    .map((card, index) => {
      if (!card || typeof card !== "object") return null;
      const front = [card.question, card.front, card.prompt]
        .map((value) => flashcardText(value, language))
        .find(Boolean);
      const back = [card.answer, card.back, card.response]
        .map((value) => flashcardText(value, language))
        .find(Boolean);
      if (!front || !back) return null;
      return {
        id: typeof card.id === "string" ? card.id : `card-${index}`,
        front,
        back,
        conceptSource: flashcardText(
          card.concept_source || card.conceptSource,
          language,
        ),
        category: flashcardCategory(card.category || raw.category),
        difficulty: difficulty(card.difficulty || raw.difficulty),
      };
    })
    .filter(Boolean);
  if (!cards.length) return null;
  return {
    id,
    source: raw,
    cards,
    cardCount: cards.length,
    title: flashcardText(
      raw.title,
      language,
      language === "ar" ? "مجموعة بدون عنوان" : "Deck sans titre",
    ),
    description: flashcardText(raw.description, language),
    category: flashcardCategory(raw.category || cards[0].category),
    difficulty: difficulty(raw.difficulty || cards[0].difficulty),
    createdAt: flashcardDate(raw.createdAt),
    ownerId: typeof raw.ownerId === "string" ? raw.ownerId : null,
    visibility: raw.visibility === "shared" ? "shared" : "private",
    semester: raw.semester ?? null,
    status: raw.status || "active",
  };
};

export const orderFlashcardDecks = (decks, sort, language) =>
  [...decks].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title, language);
    if (sort === "cards")
      return (
        b.cardCount - a.cardCount || a.title.localeCompare(b.title, language)
      );
    const aTime = a.createdAt?.getTime() ?? -Infinity;
    const bTime = b.createdAt?.getTime() ?? -Infinity;
    if (aTime === bTime) return a.title.localeCompare(b.title, language);
    // Undated decks stay last in either chronological order.
    if (aTime === -Infinity) return 1;
    if (bTime === -Infinity) return -1;
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

export const flashcardSessionCounts = (responses) =>
  responses.reduce(
    (counts, response) => {
      if (
        response === "correct" ||
        response === "incorrect" ||
        response === "skip"
      ) {
        counts[response] += 1;
        counts.assessed += 1;
      }
      return counts;
    },
    { correct: 0, incorrect: 0, skip: 0, assessed: 0 },
  );
