# TODO – MedPlatform Maroc

Ce fichier recense les tâches à réaliser, bugs à corriger et améliorations à apporter au projet.

## Backend

- [ ] Ajouter des tests unitaires pour les services (`backend/src/services/`)
- [ ] Gérer les erreurs de validation dans les contrôleurs
- [ ] Améliorer la gestion des rôles utilisateurs (admin, enseignant, étudiant)
- [ ] Ajouter la pagination pour la liste des vidéos et documents
- [ ] Sécuriser les endpoints sensibles (authentification, autorisation)
- [ ] Documenter les nouveaux endpoints dans [`docs/API.md`](docs/API.md)

## Frontend

- [ ] Ajouter des tests (unitaires et d’intégration) pour les composants principaux
- [ ] Améliorer l’UX sur l’upload de vidéos/documents
- [ ] Gérer les erreurs d’API côté UI
- [ ] Ajouter des notifications utilisateur (succès/erreur)
- [ ] Optimiser le chargement des images et vidéos
- [x] Implémenter un meilleur design UI/UX pour l'onglet `Accueil`



## Base de données

- [ ] Ajouter des seeds pour les cours, quiz et flashcards
- [ ] Vérifier la cohérence des schémas Firestore dans [`database/schemas/`](database/schemas/)

## Déploiement & CI/CD

- [ ] Automatiser les tests avant déploiement (GitHub Actions)
- [ ] Vérifier la configuration des variables d’environnement sur Vercel
- [ ] Mettre à jour la documentation de déploiement dans [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Divers

- [ ] Compléter la documentation utilisateur dans [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
- [ ] Ajouter des exemples d’utilisation d’API dans [`docs/API.md`](docs/API.md)
- [ ] Nettoyer les fichiers inutiles et les .bak

---

> Ajoutez vos tâches ci-dessus et cochez-les au fur et à mesure de l’avancement.