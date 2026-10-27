import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { getVisibleDocuments } from "../services/contentService";
import { deleteDoc } from "firebase/firestore";
import Flashcards from "./Flashcards";

let mockUser;
let mockLanguage;
jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));
jest.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: mockLanguage }),
}));
jest.mock("../firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  deleteDoc: jest.fn(),
}));
jest.mock("../services/contentService", () => ({
  getVisibleDocuments: jest.fn(),
}));
jest.mock("./FlashcardGenerator", () => () => <p>Générateur PDF</p>);
jest.mock("../components/ContentPublication", () => () => (
  <button type="button">Publier dans la bibliothèque</button>
));

const snapshot = (id, overrides = {}) => ({
  id,
  data: () => ({
    title: id === "mine" ? "Médecine du cœur" : id,
    ownerId: "student",
    visibility: "private",
    semester: "1",
    status: "active",
    category: "anatomy",
    difficulty: "medium",
    cards: [
      { front: "Première question", back: "Première réponse" },
      { front: "Deuxième question", back: "Deuxième réponse" },
    ],
    ...overrides,
  }),
});
const app = () => (
  <MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Flashcards />
  </MemoryRouter>
);
beforeEach(() => {
  jest.clearAllMocks();
  mockLanguage = "fr";
  mockUser = {
    uid: "student",
    role: "student",
    semester: "1",
    subscriptionStatus: "paid",
    customClaims: { role: "student" },
  };
  getVisibleDocuments.mockResolvedValue([snapshot("mine")]);
  deleteDoc.mockResolvedValue();
});
afterEach(() => {
  jest.useRealTimers();
});

test("keeps private decks and shared library separate and searches accent variants", async () => {
  getVisibleDocuments.mockResolvedValue([
    snapshot("mine"),
    snapshot("Partagé", { visibility: "shared", ownerId: "teacher" }),
    snapshot("Masqué", { status: "inactive" }),
    snapshot("Invalide", { cards: [null, false, {}] }),
  ]);
  render(app());
  expect(
    await screen.findByRole("heading", { name: "Mes decks personnalisés" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Bibliothèque partagée" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(
    within(screen.getByRole("article", { name: "Partagé" })).queryByRole(
      "button",
      { name: /Supprimer/ },
    ),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Rechercher dans les decks"), {
    target: { value: "medecine" },
  });
  expect(
    screen.getByRole("heading", { name: "Médecine du cœur" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Partagé" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Effacer les filtres" }));
  expect(screen.getByRole("heading", { name: "Partagé" })).toBeInTheDocument();
});

test("admin publication requires a versioned claim", async () => {
  mockUser = {
    ...mockUser,
    role: "admin",
    customClaims: { role: "admin", adminAccessVersion: 1 },
  };
  const { rerender } = render(app());
  expect(
    await screen.findByRole("button", { name: "Publier dans la bibliothèque" }),
  ).toBeInTheDocument();
  mockUser = { ...mockUser, customClaims: { role: "admin" } };
  rerender(app());
  expect(
    screen.queryByRole("button", { name: "Publier dans la bibliothèque" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Médecine du cœur" }),
  ).not.toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "Un abonnement payant est requis." })).toBeInTheDocument();
  expect(getVisibleDocuments).toHaveBeenCalledTimes(1);
});

test("a late response cannot restore the previous account library", async () => {
  let resolveOld;
  getVisibleDocuments
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValueOnce([
      snapshot("Nouveau deck", { ownerId: "new-student" }),
    ]);
  const { rerender } = render(app());
  await waitFor(() => expect(getVisibleDocuments).toHaveBeenCalledTimes(1));
  mockUser = { ...mockUser, uid: "new-student" };
  rerender(app());
  expect(
    await screen.findByRole("heading", { name: "Nouveau deck" }),
  ).toBeInTheDocument();
  await act(async () => resolveOld([snapshot("Ancien compte")]));
  expect(
    screen.queryByRole("heading", { name: "Ancien compte" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Nouveau deck" }),
  ).toBeInTheDocument();
});

test("study ratings measure unique cards and focused controls keep native keyboard handling", async () => {
  render(app());
  await screen.findByRole("heading", { name: "Médecine du cœur" });
  fireEvent.click(screen.getByRole("button", { name: "Étudier" }));
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
  const reveal = screen.getByRole("button", { name: "Voir la réponse" });
  fireEvent.keyDown(reveal, { key: "Enter" });
  expect(screen.queryByText("Première réponse")).not.toBeInTheDocument();
  fireEvent.click(reveal);
  fireEvent.click(
    screen.getByRole("checkbox", {
      name: "Passer automatiquement à la carte suivante",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Correct", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Correct", exact: true }));
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1");
  expect(
    within(screen.getByRole("region", { name: "Bilan de cette session" })).getByText("1", { selector: "strong" }),
  ).toHaveTextContent("1");
  fireEvent.click(
    screen.getByRole("button", { name: "Incorrect", exact: true }),
  );
  expect(
    within(screen.getByRole("region", { name: "Bilan de cette session" })).getByText("0", { selector: "strong" }),
  ).toHaveTextContent("0");
  fireEvent.click(screen.getByRole("button", { name: "Suivant", exact: true }));
  fireEvent.click(
    screen.getByRole("button", { name: "Terminer", exact: true }),
  );
  expect(screen.getByText("1 / 2", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("Non évaluées")).toBeInTheDocument();
});

test("leaving and restarting a session cancels queued auto advancement", async () => {
  render(app());
  await screen.findByRole("heading", { name: "Médecine du cœur" });
  jest.useFakeTimers();
  fireEvent.click(screen.getByRole("button", { name: "Étudier" }));
  fireEvent.click(screen.getByRole("button", { name: "Voir la réponse" }));
  fireEvent.click(screen.getByRole("button", { name: "Correct", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Retour aux decks" }));
  fireEvent.click(screen.getByRole("button", { name: "Étudier" }));
  act(() => jest.advanceTimersByTime(500));
  expect(
    screen.getByRole("heading", { name: "Première question" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
});
