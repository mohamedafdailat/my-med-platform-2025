import {
  flashcardCategory,
  flashcardDate,
  flashcardSearchText,
  flashcardSessionCounts,
  flashcardText,
  normalizeFlashcardDeck,
  orderFlashcardDecks,
} from "./flashcards";

test("accepts legacy collections and card aliases while discarding malformed content", () => {
  const deck = normalizeFlashcardDeck("legacy", {
    title: { fr: "Médecine", ar: "الطب" },
    category: 42,
    difficulty: {},
    items: [
      null,
      "invalid",
      {},
      { front: { fr: {} }, back: "No question" },
      { prompt: "Question", response: "Réponse" },
      { question: { ar: "سؤال" }, answer: { ar: "جواب" } },
    ],
  });
  expect(deck.cards).toHaveLength(2);
  expect(deck.cards[0]).toMatchObject({
    id: "card-4",
    front: "Question",
    back: "Réponse",
  });
  expect(deck.category).toBe("other");
  expect(deck.difficulty).toBe("unspecified");
  expect(deck.createdAt).toBeNull();
  expect(
    normalizeFlashcardDeck("legacy", {
      flashcards: [{ front: "Q", back: "A" }],
    }).cardCount,
  ).toBe(1);
  expect(
    normalizeFlashcardDeck("single", { question: "Q", answer: "A" }).cardCount,
  ).toBe(1);
  expect(
    normalizeFlashcardDeck("empty", { cards: [null, false, {}] }),
  ).toBeNull();
});

test("uses valid aliases when a higher priority localized field is malformed", () => {
  const deck = normalizeFlashcardDeck("fallback", {
    cards: [
      {
        question: { fr: {} },
        front: "Question",
        answer: false,
        back: "Réponse",
      },
    ],
  });
  expect(deck.cards[0]).toMatchObject({ front: "Question", back: "Réponse" });
  expect(flashcardText({ fr: 123, ar: "المعرفة" }, "fr")).toBe("المعرفة");
  expect(flashcardText({ fr: {} }, "fr", "Sans titre")).toBe("Sans titre");
});

test.each(["constructor", "__proto__", "toString", "hasOwnProperty"])(
  "metadata cannot escape its enums through %s",
  (value) => {
    expect(flashcardCategory(value)).toBe("other");
    const deck = normalizeFlashcardDeck("untrusted", {
      cards: [{ front: "Q", back: "A" }],
      difficulty: value,
    });
    expect(deck.difficulty).toBe("unspecified");
  },
);

test("does not fabricate dates and sorts undated decks last in either order", () => {
  expect(flashcardDate(null)).toBeNull();
  expect(flashcardDate({})).toBeNull();
  expect(flashcardDate("invalid")).toBeNull();
  expect(flashcardDate({ seconds: 1000 }).getTime()).toBe(1000000);
  const decks = [
    { id: "missing", title: "Absent", cardCount: 2, createdAt: null },
    {
      id: "older",
      title: "B",
      cardCount: 1,
      createdAt: new Date("2020-01-01"),
    },
    {
      id: "newer",
      title: "A",
      cardCount: 3,
      createdAt: new Date("2021-01-01"),
    },
  ];
  expect(
    orderFlashcardDecks(decks, "recent", "fr").map((deck) => deck.id),
  ).toEqual(["newer", "older", "missing"]);
  expect(
    orderFlashcardDecks(decks, "oldest", "fr").map((deck) => deck.id),
  ).toEqual(["older", "newer", "missing"]);
  expect(
    orderFlashcardDecks(decks, "cards", "fr").map((deck) => deck.id),
  ).toEqual(["newer", "missing", "older"]);
  expect(decks[0].id).toBe("missing");
});

test("searches accent variations and Arabic diacritics", () => {
  expect(flashcardSearchText("  MÉDECINE  ")).toBe("medecine");
  expect(flashcardSearchText("الطِّبّ")).toBe("الطب");
});

test("session counts measure distinct evaluated cards rather than navigation", () => {
  expect(
    flashcardSessionCounts(["unseen", "correct", "incorrect", "skip"]),
  ).toEqual({ assessed: 3, correct: 1, incorrect: 1, skip: 1 });
  expect(flashcardSessionCounts(["unseen", "unseen"]).assessed).toBe(0);
  expect(flashcardSessionCounts(["incorrect", "incorrect"]).correct).toBe(0);
});
