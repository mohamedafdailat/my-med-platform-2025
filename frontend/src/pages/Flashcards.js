import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { deleteDoc, doc } from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import ContentPublication from "../components/ContentPublication";
import FlashcardGenerator from "./FlashcardGenerator";
import { getVisibleDocuments } from "../services/contentService";
import { hasAdminAccess } from "../utils/access";
import {
  FLASHCARD_CATEGORIES,
  flashcardSearchText,
  normalizeFlashcardDeck,
  orderFlashcardDecks,
  flashcardSessionCounts,
} from "../utils/flashcards";
import { flashcardLabel } from "../utils/flashcardLabels";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Shuffle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  Trophy,
  Target,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Layers,
  Sparkles,
  LockKeyhole,
  Library,
  FileText,
  X,
  RefreshCw,
  Check,
  SlidersHorizontal,
  Keyboard,
  ArrowLeft,
} from "lucide-react";
import "../styles/flashcard-library.css";

const DeckCard = ({
  deck,
  t,
  language,
  onStudy,
  onDelete,
  canDelete,
  canPublish,
  onPublished,
  deleting,
}) => (
  <article
    className={`fcl-deck fcl-theme-${deck.category}`}
    data-deck-id={deck.id}
    aria-label={deck.title}
  >
    <div className="fcl-deck-art" aria-hidden="true">
      <span className="fcl-art-category">{t(deck.category)}</span>
      <span className="fcl-art-stack">
        <Layers size={22} />
        <span>{deck.cards[0].front}</span>
      </span>
      <span className="fcl-art-caption">{t("preview")}</span>
    </div>
    <div className="fcl-deck-body">
      <div className="fcl-deck-labels">
        <span
          className={`fcl-badge ${deck.visibility === "shared" ? "fcl-badge-shared" : ""}`}
        >
          {deck.visibility === "shared" ? (
            <Library size={12} aria-hidden="true" />
          ) : (
            <LockKeyhole size={12} aria-hidden="true" />
          )}
          {t(deck.visibility === "shared" ? "shared" : "private")}
        </span>
        {deck.status === "inactive" && (
          <span className="fcl-badge">{t("inactive")}</span>
        )}
      </div>
      <h3>{deck.title}</h3>
      <p className="fcl-deck-description">
        {deck.description || t("deckDescription")}
      </p>
      <div className="fcl-deck-meta">
        <span>
          <Layers size={14} aria-hidden="true" />
          {deck.cardCount} {t("cards")}
        </span>
        <span className={`fcl-difficulty fcl-difficulty-${deck.difficulty}`}>
          {t(deck.difficulty)}
        </span>
      </div>
      {deck.createdAt && (
        <p className="fcl-deck-date">
          {t("createdOn")}{" "}
          <time dateTime={deck.createdAt.toISOString()}>
            {deck.createdAt.toLocaleDateString(
              language === "ar" ? "ar-MA" : "fr-FR",
              { day: "numeric", month: "short", year: "numeric" },
            )}
          </time>
        </p>
      )}
      <div className="fcl-deck-actions">
        <button
          type="button"
          className="fcl-button fcl-button-study"
          onClick={() => onStudy(deck)}
        >
          <BookOpen size={16} aria-hidden="true" />
          {t("study")}
          <ArrowRight
            size={16}
            className="fcl-directional"
            aria-hidden="true"
          />
        </button>
        {canDelete && (
          <button
            type="button"
            className="fcl-icon-button fcl-delete"
            disabled={deleting}
            onClick={() => onDelete(deck.id)}
            aria-label={`${t("delete")} : ${deck.title}`}
            title={t("delete")}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      {canPublish && (
        <div className="fcl-publication">
          <ContentPublication
            collectionName="flashcards"
            item={deck}
            language={language}
            onUpdated={onPublished}
          />
        </div>
      )}
    </div>
  </article>
);

const Flashcards = () => {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isRTL = language === "ar";
  const t = useCallback((key) => flashcardLabel(key, language), [language]);
  const uid = user?.uid;
  const role = user?.customClaims?.role;
  const adminAccessVersion = user?.customClaims?.adminAccessVersion;
  const unlimited = user?.customClaims?.unlimitedAccess === true;
  const semester = user?.semester;
  const administrator = hasAdminAccess(user?.customClaims);
  const isStudent =
    role === "student" || (!role && (!user?.role || user.role === "student"));
  const hasAccess =
    !!uid &&
    !authLoading &&
    (administrator ||
      unlimited ||
      (isStudent && user?.subscriptionStatus === "paid"));
  const accessKey = JSON.stringify([
    uid,
    role,
    adminAccessVersion,
    unlimited,
    semester,
    hasAccess,
  ]);
  const activeAccess = useRef(accessKey);
  activeAccess.current = accessKey;
  const requestVersion = useRef(0);
  const advanceTimer = useRef(null);
  const headingRef = useRef(null);
  const [library, setLibrary] = useState({
    key: null,
    items: [],
    loading: true,
    error: "",
  });
  const [viewState, setViewState] = useState({ key: null, name: "list" });
  const view =
    viewState.key === accessKey && hasAccess ? viewState.name : "list";
  const setView = useCallback(
    (name) => setViewState({ key: accessKey, name }),
    [accessKey],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState("recent");
  const [deletingId, setDeletingId] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [order, setOrder] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [responses, setResponses] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [isShuffled, setIsShuffled] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);

  useEffect(() => {
    setDeletingId(null);
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setScope("all");
  }, [accessKey]);

  const fetchDecks = useCallback(async () => {
    const version = ++requestVersion.current;
    if (authLoading) return;
    if (!hasAccess) {
      setLibrary({ key: accessKey, items: [], loading: false, error: "" });
      return;
    }
    setLibrary({ key: accessKey, items: [], loading: true, error: "" });
    try {
      const accessUser = {
        uid,
        semester,
        customClaims: { role, adminAccessVersion, unlimitedAccess: unlimited },
      };
      const documents = await getVisibleDocuments("flashcards", accessUser);
      if (
        version !== requestVersion.current ||
        activeAccess.current !== accessKey
      )
        return;
      setLibrary({
        key: accessKey,
        items: [
          ...new Map(
            documents.map((snapshot) => [
              snapshot.id,
              { id: snapshot.id, source: snapshot.data() },
            ]),
          ).values(),
        ],
        loading: false,
        error: "",
      });
    } catch {
      if (
        version === requestVersion.current &&
        activeAccess.current === accessKey
      )
        setLibrary({
          key: accessKey,
          items: [],
          loading: false,
          error: "loadError",
        });
    }
  }, [
    uid,
    role,
    adminAccessVersion,
    unlimited,
    semester,
    hasAccess,
    accessKey,
    authLoading,
  ]);

  useEffect(() => {
    fetchDecks();
    return () => {
      requestVersion.current += 1;
    };
  }, [fetchDecks]);
  const currentLibrary =
    library.key === accessKey
      ? library
      : { items: [], loading: true, error: "" };
  const loading = authLoading || currentLibrary.loading;
  const allDecks = useMemo(
    () =>
      library.key !== accessKey || !hasAccess
        ? []
        : library.items
            .map((item) =>
              normalizeFlashcardDeck(item.id, item.source, language),
            )
            .filter(
              (deck) => deck && (administrator || deck.status !== "inactive"),
            ),
    [library, accessKey, hasAccess, language, administrator],
  );
  const filteredDecks = useMemo(() => {
    const search = flashcardSearchText(searchQuery);
    return orderFlashcardDecks(
      allDecks.filter(
        (deck) =>
          (selectedCategory === "all" || deck.category === selectedCategory) &&
          (selectedDifficulty === "all" ||
            deck.difficulty === selectedDifficulty) &&
          (scope === "all" ||
            (scope === "mine"
              ? deck.ownerId === uid && deck.visibility !== "shared"
              : deck.visibility === "shared")) &&
          (!search ||
            flashcardSearchText(
              `${deck.title} ${deck.description} ${t(deck.category)}`,
            ).includes(search)),
      ),
      sort,
      language,
    );
  }, [
    allDecks,
    selectedCategory,
    selectedDifficulty,
    scope,
    uid,
    searchQuery,
    sort,
    language,
    t,
  ]);
  const ownDecks = filteredDecks.filter(
    (deck) => deck.visibility !== "shared" && deck.ownerId === uid,
  );
  const sharedDecks = filteredDecks.filter(
    (deck) => deck.visibility === "shared",
  );
  const otherPrivateDecks = administrator
    ? filteredDecks.filter(
        (deck) => deck.visibility !== "shared" && deck.ownerId !== uid,
      )
    : [];
  const firstDeck =
    allDecks.find(
      (deck) => deck.ownerId === uid && deck.visibility !== "shared",
    ) || allDecks[0];
  const filtersActive =
    !!searchQuery ||
    selectedCategory !== "all" ||
    selectedDifficulty !== "all" ||
    scope !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setScope("all");
  };
  const cancelAdvance = useCallback(() => {
    clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setPendingAdvance(false);
  }, []);
  useEffect(() => {
    cancelAdvance();
    return () => clearTimeout(advanceTimer.current);
  }, [accessKey, view, cancelAdvance]);
  const selectedDeck = useMemo(
    () =>
      selectedSource?.key === accessKey
        ? normalizeFlashcardDeck(
            selectedSource.id,
            selectedSource.source,
            language,
          )
        : null,
    [selectedSource, accessKey, language],
  );
  const counts = flashcardSessionCounts(responses);
  const gradedCount = counts.correct + counts.incorrect;
  const accuracy = gradedCount
    ? Math.round((counts.correct / gradedCount) * 100)
    : null;
  const realIndex = order[cardIndex] ?? cardIndex;
  const currentCard = selectedDeck?.cards[realIndex];
  const elapsed = startedAt
    ? Math.max(0, Math.floor(((finishedAt ?? now) - startedAt) / 1000))
    : 0;
  const elapsedLabel = `${Math.floor(elapsed / 60)} ${t("minutes")} ${elapsed % 60} ${t("seconds")}`;

  useEffect(() => {
    if (view !== "play" || studyComplete) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [view, studyComplete]);
  useEffect(() => {
    if (view === "play") headingRef.current?.focus();
  }, [view, cardIndex, studyComplete]);

  const beginStudy = useCallback(
    (deck) => {
      if (
        !hasAccess ||
        activeAccess.current !== accessKey ||
        !deck?.cards.length
      )
        return;
      cancelAdvance();
      setSelectedSource({ key: accessKey, id: deck.id, source: deck.source });
      setOrder(deck.cards.map((_, index) => index));
      setResponses(deck.cards.map(() => "unseen"));
      setCardIndex(0);
      setShowAnswer(false);
      setStudyComplete(false);
      setIsShuffled(false);
      setStartedAt(Date.now());
      setFinishedAt(null);
      setNow(Date.now());
      setView("play");
    },
    [hasAccess, accessKey, cancelAdvance, setView],
  );
  const finishStudy = useCallback(() => {
    cancelAdvance();
    setFinishedAt(Date.now());
    setStudyComplete(true);
  }, [cancelAdvance]);
  const handleNext = useCallback(() => {
    if (!selectedDeck) return;
    cancelAdvance();
    if (cardIndex + 1 >= selectedDeck.cards.length) finishStudy();
    else {
      setCardIndex((index) =>
        Math.min(index + 1, selectedDeck.cards.length - 1),
      );
      setShowAnswer(false);
    }
  }, [selectedDeck, cardIndex, cancelAdvance, finishStudy]);
  const handlePrevious = useCallback(() => {
    cancelAdvance();
    setCardIndex((index) => Math.max(0, index - 1));
    setShowAnswer(false);
  }, [cancelAdvance]);
  const handleResponse = useCallback(
    (response) => {
      if (
        !hasAccess ||
        !selectedDeck ||
        !showAnswer ||
        advanceTimer.current !== null ||
        !["correct", "incorrect", "skip"].includes(response)
      )
        return;
      setResponses((previous) =>
        previous.map((value, index) =>
          index === realIndex ? response : value,
        ),
      );
      if (autoAdvance) {
        setPendingAdvance(true);
        advanceTimer.current = setTimeout(() => {
          advanceTimer.current = null;
          setPendingAdvance(false);
          handleNext();
        }, 350);
      }
    },
    [hasAccess, selectedDeck, showAnswer, realIndex, autoAdvance, handleNext],
  );
  const shuffleCards = () => {
    if (!selectedDeck) return;
    cancelAdvance();
    const indices = selectedDeck.cards.map((_, index) => index);
    for (let index = indices.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [indices[index], indices[target]] = [indices[target], indices[index]];
    }
    setOrder(indices);
    setCardIndex(0);
    setShowAnswer(false);
    setIsShuffled(true);
  };
  useEffect(() => {
    if (view !== "play" || studyComplete) return undefined;
    const onKeyDown = (event) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.target?.closest?.(
          'input, textarea, select, button, a, [contenteditable="true"], [role="button"]',
        )
      )
        return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setShowAnswer((value) => !value);
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        if ((event.key === "ArrowRight") !== isRTL) handleNext();
        else handlePrevious();
      } else if (showAnswer && ["1", "2", "3"].includes(event.key)) {
        event.preventDefault();
        handleResponse({ 1: "incorrect", 2: "skip", 3: "correct" }[event.key]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    view,
    studyComplete,
    showAnswer,
    isRTL,
    handleNext,
    handlePrevious,
    handleResponse,
  ]);

  const handleDeckSaved = (newDeck) => {
    if (activeAccess.current !== accessKey || !hasAccess || !newDeck?.id)
      return;
    requestVersion.current += 1;
    setLibrary((previous) => ({
      key: accessKey,
      items: [
        { id: newDeck.id, source: newDeck },
        ...(previous.key === accessKey
          ? previous.items.filter((item) => item.id !== newDeck.id)
          : []),
      ],
      loading: false,
      error: "",
    }));
    clearFilters();
    setSort("recent");
    setView("list");
  };
  const handleDeleteDeck = async (id) => {
    const deck = allDecks.find((item) => item.id === id);
    if (
      !hasAccess ||
      !deck ||
      (!administrator &&
        (deck.ownerId !== uid || deck.visibility === "shared")) ||
      deletingId
    )
      return;
    if (!window.confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "flashcards", id));
      if (activeAccess.current === accessKey)
        setLibrary((previous) => ({
          ...previous,
          items: previous.items.filter((item) => item.id !== id),
        }));
    } catch {
      if (activeAccess.current === accessKey)
        setLibrary((previous) => ({ ...previous, error: "deleteError" }));
    } finally {
      if (activeAccess.current === accessKey) setDeletingId(null);
    }
  };
  const renderDeckGroup = (decks, title, id, icon) =>
    !decks.length ? null : (
      <section className="fcl-deck-section" aria-labelledby={id}>
        <div className="fcl-group-heading">
          <span>{icon}</span>
          <h2 id={id}>{title}</h2>
          <span className="fcl-count-badge">{decks.length}</span>
        </div>
        <div className="fcl-deck-grid">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              t={t}
              language={language}
              onStudy={beginStudy}
              onDelete={handleDeleteDeck}
              deleting={deletingId === deck.id}
              canDelete={
                administrator ||
                (deck.ownerId === uid && deck.visibility !== "shared")
              }
              canPublish={administrator}
              onPublished={fetchDecks}
            />
          ))}
        </div>
      </section>
    );

  if (view === "generate")
    return (
      <div
        className="flashcard-library fcl-generator-page"
        dir={isRTL ? "rtl" : "ltr"}
        lang={language}
      >
        <div className="fcl-shell">
          <button
            className="fcl-back-link"
            type="button"
            onClick={() => setView("list")}
          >
            <ArrowLeft
              size={17}
              className="fcl-directional"
              aria-hidden="true"
            />
            {t("libraryBack")}
          </button>
          <header className="fcl-generation-heading">
            <span className="fcl-kicker">
              <FileText size={15} aria-hidden="true" />
              {t("createFromPDF")}
            </span>
            <h1>{t("createFromPDF")}</h1>
            <p>{t("generatorDescription")}</p>
          </header>
          <FlashcardGenerator
            key={accessKey}
            onClose={() => setView("list")}
            onDeckSaved={handleDeckSaved}
            initialCategory={
              selectedCategory === "all" ? "general" : selectedCategory
            }
          />
        </div>
      </div>
    );

  if (view === "play" && selectedDeck && currentCard) {
    if (studyComplete)
      return (
        <div
          className="flashcard-library fcl-summary-page"
          dir={isRTL ? "rtl" : "ltr"}
          lang={language}
        >
          <section className="fcl-summary">
            <span className="fcl-summary-icon">
              <Trophy size={32} aria-hidden="true" />
            </span>
            <span className="fcl-kicker">{t("sessionOnly")}</span>
            <h1 ref={headingRef} tabIndex={-1}>
              {t("sessionTitle")}
            </h1>
            <p>{t("sessionDescription")}</p>
            <h2>{selectedDeck.title}</h2>
            <div className="fcl-summary-grid">
              {[
                {
                  value: `${counts.assessed} / ${selectedDeck.cardCount}`,
                  label: t("reviewed"),
                },
                { value: counts.correct, label: t("correct") },
                { value: counts.incorrect, label: t("incorrect") },
                { value: counts.skip, label: t("skip") },
                {
                  value: selectedDeck.cardCount - counts.assessed,
                  label: t("unreviewed"),
                },
                {
                  value: accuracy === null ? "—" : `${accuracy} %`,
                  label: t("accuracy"),
                },
              ].map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="fcl-summary-time">
              <Clock3 size={16} aria-hidden="true" />
              {t("timeSpent")} : {elapsedLabel}
            </p>
            <div className="fcl-summary-actions">
              <button
                type="button"
                className="fcl-button fcl-button-primary"
                onClick={() => beginStudy(selectedDeck)}
              >
                <RotateCcw size={16} aria-hidden="true" />
                {t("nextSession")}
              </button>
              <button
                type="button"
                className="fcl-button fcl-button-secondary"
                onClick={() => setView("list")}
              >
                {t("libraryBack")}
              </button>
            </div>
            <small>{t("sessionLocal")}</small>
          </section>
        </div>
      );
    return (
      <div
        className="flashcard-library fcl-study-page"
        dir={isRTL ? "rtl" : "ltr"}
        lang={language}
      >
        <div className="fcl-study-shell">
          <button
            type="button"
            className="fcl-back-link"
            onClick={() => setView("list")}
          >
            <ArrowLeft
              size={17}
              className="fcl-directional"
              aria-hidden="true"
            />
            {t("libraryBack")}
          </button>
          <header className="fcl-study-header">
            <div>
              <span className="fcl-kicker">{t("studyEyebrow")}</span>
              <h1>{selectedDeck.title}</h1>
              <div className="fcl-study-tags">
                <span>{t(selectedDeck.category)}</span>
                <span>
                  {cardIndex + 1} {t("cardOf")} {selectedDeck.cardCount}
                </span>
                {isShuffled && <span>{t("shuffle")}</span>}
              </div>
            </div>
            <div className="fcl-study-tools">
              <button
                type="button"
                className="fcl-icon-button"
                onClick={shuffleCards}
                aria-label={t("shuffle")}
                aria-pressed={isShuffled}
              >
                <Shuffle size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="fcl-icon-button"
                onClick={() => beginStudy(selectedDeck)}
                aria-label={t("reset")}
              >
                <RotateCcw size={18} aria-hidden="true" />
              </button>
            </div>
          </header>
          <section
            className="fcl-session-metrics"
            aria-label={t("sessionOnly")}
          >
            <div>
              <CheckCircle size={17} aria-hidden="true" />
              <strong>{counts.correct}</strong>
              <span>{t("correct")}</span>
            </div>
            <div>
              <Target size={17} aria-hidden="true" />
              <strong>{accuracy === null ? "—" : `${accuracy} %`}</strong>
              <span>{t("accuracy")}</span>
            </div>
            <div>
              <Clock3 size={17} aria-hidden="true" />
              <strong>{elapsedLabel}</strong>
              <span>{t("timeSpent")}</span>
            </div>
          </section>
          <div className="fcl-session-progress">
            <div>
              <span>{t("evaluated")}</span>
              <strong>
                {counts.assessed} / {selectedDeck.cardCount}
              </strong>
            </div>
            <progress
              aria-label={t("evaluated")}
              value={counts.assessed}
              max={selectedDeck.cardCount}
            />
            <div className="fcl-progress-dots" aria-hidden="true">
              {responses.map((response, index) => (
                <span
                  key={index}
                  className={`is-${response}${index === realIndex ? " is-current" : ""}`}
                />
              ))}
            </div>
          </div>
          <section className="fcl-study-card">
            <div className="fcl-question">
              <div>
                <span className="fcl-kicker">{t("question")}</span>
                <span>
                  {cardIndex + 1} / {selectedDeck.cardCount}
                </span>
              </div>
              <h2 ref={headingRef} tabIndex={-1}>
                {currentCard.front}
              </h2>
              <p>{t("answerHint")}</p>
            </div>
            <div className="fcl-answer-zone">
              <button
                type="button"
                className="fcl-reveal-button"
                onClick={() => setShowAnswer((value) => !value)}
                aria-expanded={showAnswer}
                aria-controls="flashcard-answer"
              >
                <Eye size={18} aria-hidden="true" />
                {t(showAnswer ? "hideAnswer" : "showAnswer")}
                <span aria-hidden="true">
                  <Keyboard size={14} />
                  {language === "ar" ? "مسافة" : "Espace"}
                </span>
              </button>
              {showAnswer && (
                <div
                  id="flashcard-answer"
                  className="fcl-answer"
                  aria-live="polite"
                >
                  <h3>
                    <Check size={17} aria-hidden="true" />
                    {t("answer")}
                  </h3>
                  <p>{currentCard.back}</p>
                  {currentCard.conceptSource && (
                    <small>
                      {t("sourceLabel")} : {currentCard.conceptSource}
                    </small>
                  )}
                  <div className="fcl-rating-block">
                    <p>{t("responseHelp")}</p>
                    <div className="fcl-rating-actions">
                      {[
                        {
                          response: "incorrect",
                          icon: XCircle,
                          key: 1,
                          label: "incorrect",
                        },
                        {
                          response: "skip",
                          icon: AlertCircle,
                          key: 2,
                          label: "skip",
                        },
                        {
                          response: "correct",
                          icon: CheckCircle,
                          key: 3,
                          label: "correct",
                        },
                      ].map(({ response, icon: Icon, key, label }) => (
                        <button
                          key={response}
                          type="button"
                          className={`fcl-rating fcl-rating-${response}`}
                          disabled={pendingAdvance}
                          aria-pressed={responses[realIndex] === response}
                          onClick={() => handleResponse(response)}
                        >
                          <Icon size={17} aria-hidden="true" />
                          {t(label)}
                          <kbd aria-hidden="true">{key}</kbd>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
          <nav className="fcl-study-navigation" aria-label={t("study")}>
            <button
              type="button"
              className="fcl-button fcl-button-secondary"
              onClick={handlePrevious}
              disabled={cardIndex === 0}
            >
              <ChevronLeft
                size={17}
                className="fcl-directional"
                aria-hidden="true"
              />
              {t("prev")}
            </button>
            <label className="fcl-auto-advance">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(event) => {
                  cancelAdvance();
                  setAutoAdvance(event.target.checked);
                }}
              />
              {t("autoAdvance")}
            </label>
            <button
              type="button"
              className="fcl-button fcl-button-primary"
              onClick={handleNext}
            >
              {t(cardIndex === selectedDeck.cardCount - 1 ? "finish" : "next")}
              <ChevronRight
                size={17}
                className="fcl-directional"
                aria-hidden="true"
              />
            </button>
          </nav>
          <p className="fcl-keyboard-help">
            <Keyboard size={17} aria-hidden="true" />
            {t("keyboardShortcuts")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flashcard-library"
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      <div className="fcl-shell">
        <header className="fcl-hero">
          <div className="fcl-hero-copy">
            <span className="fcl-eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              {t("eyebrow")}
            </span>
            <h1>{t("title")}</h1>
            <p className="fcl-hero-line">{t("heroLine")}</p>
            <p className="fcl-hero-description">{t("heroDescription")}</p>
            <div className="fcl-hero-actions">
              <button
                type="button"
                className="fcl-button fcl-button-light"
                disabled={!hasAccess}
                onClick={() => setView("generate")}
              >
                <Plus size={18} aria-hidden="true" />
                {t("createFromPDF")}
              </button>
              {firstDeck && (
                <button
                  type="button"
                  className="fcl-button fcl-button-ghost"
                  onClick={() => beginStudy(firstDeck)}
                >
                  {t("launchSession")}
                  <ArrowRight
                    size={16}
                    className="fcl-directional"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
            <span className="fcl-private-note">
              <LockKeyhole size={13} aria-hidden="true" />
              {t("privateNote")}
            </span>
          </div>
          <div className="fcl-hero-art" aria-hidden="true">
            <span className="fcl-floating-spark">
              <Sparkles size={25} />
            </span>
            <div className="fcl-hero-card fcl-hero-card-back" />
            <div className="fcl-hero-card fcl-hero-card-front">
              <span>
                <Layers size={21} />
                {t("heroArt")}
              </span>
              <strong>{t("heroArtTitle")}</strong>
              <span className="fcl-hero-card-line" />
              <small>{t("heroArtDescription")}</small>
              <span className="fcl-card-check">
                <Check size={17} />
              </span>
            </div>
          </div>
        </header>
        <section className="fcl-overview" aria-label={t("libraryTitle")}>
          {[
            { label: t("deckCount"), value: allDecks.length, icon: Library },
            {
              label: t("cardCount"),
              value: allDecks.reduce((sum, deck) => sum + deck.cardCount, 0),
              icon: Layers,
            },
            {
              label: t("personalCount"),
              value: allDecks.filter(
                (deck) => deck.ownerId === uid && deck.visibility !== "shared",
              ).length,
              icon: LockKeyhole,
            },
            {
              label: t("sharedCount"),
              value: allDecks.filter((deck) => deck.visibility === "shared")
                .length,
              icon: BookOpen,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <span className="fcl-overview-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <strong>{loading || currentLibrary.error ? "—" : value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
        <section
          className="fcl-library-controls"
          aria-labelledby="fcl-library-title"
        >
          <div className="fcl-library-heading">
            <div>
              <h2 id="fcl-library-title">{t("libraryTitle")}</h2>
              <p>{t("libraryDescription")}</p>
            </div>
            <span className="fcl-controls-icon">
              <SlidersHorizontal size={20} aria-hidden="true" />
            </span>
          </div>
          <div
            className="fcl-scope"
            role="group"
            aria-label={t("libraryTitle")}
          >
            {[
              { id: "all", title: t("allDecks"), count: allDecks.length },
              {
                id: "mine",
                title: t("personalTab"),
                count: allDecks.filter(
                  (deck) =>
                    deck.ownerId === uid && deck.visibility !== "shared",
                ).length,
              },
              {
                id: "shared",
                title: t("sharedTab"),
                count: allDecks.filter((deck) => deck.visibility === "shared")
                  .length,
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={scope === item.id}
                onClick={() => setScope(item.id)}
              >
                {item.title}
                <span>{loading ? "—" : item.count}</span>
              </button>
            ))}
          </div>
          <div className="fcl-filters">
            <label className="fcl-search" htmlFor="flashcard-search">
              <span>{t("searchLabel")}</span>
              <span>
                <Search size={17} aria-hidden="true" />
                <input
                  id="flashcard-search"
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </span>
            </label>
            <label htmlFor="flashcard-category">
              <span>{t("subjectLabel")}</span>
              <select
                id="flashcard-category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="all">{t("allCategories")}</option>
                {FLASHCARD_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(category)}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="flashcard-difficulty">
              <span>{t("difficultyLabel")}</span>
              <select
                id="flashcard-difficulty"
                value={selectedDifficulty}
                onChange={(event) => setSelectedDifficulty(event.target.value)}
              >
                <option value="all">{t("allDifficulties")}</option>
                {["easy", "medium", "hard", "unspecified"].map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {t(difficulty)}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="flashcard-sort">
              <span>{t("sortLabel")}</span>
              <select
                id="flashcard-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {[
                  { id: "recent", label: "recentSort" },
                  { id: "oldest", label: "oldestSort" },
                  { id: "title", label: "titleSort" },
                  { id: "cards", label: "cardsSort" },
                ].map((option) => (
                  <option key={option.id} value={option.id}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="fcl-results-line">
            <p role="status" aria-live="polite">
              {loading
                ? t("loading")
                : `${filteredDecks.length} ${t("resultCount")}`}
            </p>
            {filtersActive && (
              <button type="button" onClick={clearFilters}>
                <X size={14} aria-hidden="true" />
                {t("clearFilters")}
              </button>
            )}
          </div>
        </section>
        {currentLibrary.error && (
          <div className="fcl-alert" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <p>{t(currentLibrary.error)}</p>
            <button type="button" onClick={fetchDecks}>
              <RefreshCw size={15} aria-hidden="true" />
              {t("retry")}
            </button>
          </div>
        )}
        {loading ? (
          <div className="fcl-loading-grid" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
        ) : !hasAccess ? (
          <section className="fcl-empty">
            <LockKeyhole size={32} aria-hidden="true" />
            <h2>{t("subscriptionRequired")}</h2>
            <p>{t("subtitle")}</p>
            <button
              type="button"
              className="fcl-button fcl-button-primary"
              onClick={() => navigate("/subscription")}
            >
              {t("subscribe")}
            </button>
          </section>
        ) : currentLibrary.error &&
          !allDecks.length ? null : filteredDecks.length === 0 ? (
          <section className="fcl-empty">
            <span className="fcl-empty-icon">
              {filtersActive ? (
                <Search size={30} aria-hidden="true" />
              ) : (
                <Layers size={30} aria-hidden="true" />
              )}
            </span>
            <h2>{t(filtersActive ? "noResultTitle" : "noDeckTitle")}</h2>
            <p>{t(filtersActive ? "noResultMessage" : "noDeckDescription")}</p>
            <button
              type="button"
              className="fcl-button fcl-button-primary"
              onClick={filtersActive ? clearFilters : () => setView("generate")}
            >
              {filtersActive ? (
                <>
                  <X size={16} aria-hidden="true" />
                  {t("clearFilters")}
                </>
              ) : (
                <>
                  <Plus size={16} aria-hidden="true" />
                  {t("createFromPDF")}
                </>
              )}
            </button>
          </section>
        ) : (
          <>
            {renderDeckGroup(
              ownDecks,
              t("myDecks"),
              "fcl-personal-title",
              <LockKeyhole size={18} aria-hidden="true" />,
            )}
            {renderDeckGroup(
              sharedDecks,
              t("defaultDecks"),
              "fcl-shared-title",
              <Library size={18} aria-hidden="true" />,
            )}
            {renderDeckGroup(
              otherPrivateDecks,
              t("otherPrivate"),
              "fcl-other-title",
              <Layers size={18} aria-hidden="true" />,
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
