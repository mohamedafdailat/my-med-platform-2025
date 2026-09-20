# Comptes, contenus et confidentialité

Les droits d'administration viennent exclusivement des claims Firebase Auth (`role: admin`). Le champ `role` du profil n'accorde aucun accès. Un administrateur utilise toutes les fonctions pédagogiques sans abonnement et peut gérer les comptes et les contenus. Le claim `unlimitedAccess: true` donne accès aux fonctions pédagogiques sans donner les droits admin.

| Données | Propriétaire | Autre utilisateur connecté | Administrateur |
| --- | --- | --- | --- |
| Profil et coordonnées | Lecture, modification des informations personnelles | Aucun accès | Consultation et gestion par API |
| Quiz/flashcards `visibility: private` | Lecture et gestion | Aucun accès, même par identifiant direct | Consultation et gestion |
| Quiz/flashcards `visibility: shared` | Lecture | Lecture | Gestion de la bibliothèque |
| Tentatives de quiz et résultats QCM | Lecture de ses résultats | Aucun accès | Consultation |
| Cours, vidéos et QCM pédagogiques | Lecture | Lecture | Création, modification, suppression |

Les quiz utilisent `creatorId`, les flashcards `ownerId`, les résultats `userId`. La création personnelle fixe le propriétaire connecté et `visibility: private`. Les règles interdisent l'usurpation de propriétaire et la publication par un étudiant. Seul l'admin peut publier ou retirer un contenu de la bibliothèque via les boutons prévus.

Les listes, suggestions et recommandations respectent ces limites. Les règles Firestore les imposent également pour les accès directs ; l'API des quiz impose la même politique et nécessite une authentification. Les résultats de quiz sont enregistrés par le serveur dans `quiz_attempts`, séparément du quiz partagé. Les résultats QCM portent désormais l'UID de leur auteur.

La génération de flashcards crée un véritable deck dans `flashcards`. Le PDF est lu dans le navigateur ; seul le texte choisi est transmis au service IA. Aucun document source n'est enregistré dans la bibliothèque. Les réponses IA doivent être vérifiées avant utilisation pédagogique.

## Mise en ligne coordonnée

Les changements applicatifs, les règles dans `firebase/` et la classification des anciennes données doivent être livrés ensemble. Ne pas appliquer les règles seules : les anciennes listes non filtrées seraient refusées. Ne pas publier automatiquement des contenus anciens dont le propriétaire ou l'origine sont inconnus.

Avant migration : sauvegarder Auth (avec paramètres de hachage pour les comptes avec mot de passe), Firestore et les règles actives ; vérifier les administrateurs par leurs claims ; définir précisément les comptes conservés. Les scripts de suppression doivent utiliser une liste d'UID revue, préserver les contenus pédagogiques communs et refuser toute suppression du compte conservé.

Pour les anciennes données : attribuer une visibilité explicite, sortir les tentatives des documents de quiz et conserver les résultats non attribuables hors de la vue des étudiants. La migration doit être idempotente et conserver un journal privé permettant la restauration. Une rétrogradation Railway seule ne restaure ni données ni règles.

## Limites connues

Le contrôle de l'abonnement reste le mécanisme existant, distinct de cette isolation des données. Le raccordement bancaire, les paiements et leur contrôle côté serveur restent à traiter avant la commercialisation.

Auth et Firestore ne partagent pas de transaction. L'API compense une modification Auth si l'écriture du profil échoue. La désactivation/rétrogradation révoque les sessions pour l'API ; un jeton Firebase déjà émis peut rester utilisable directement auprès de Firestore jusqu'à son expiration. Les modifications sensibles nécessitent une reconnexion.

Validation reproductible : [tests/README.md](../tests/README.md). Documentation Firebase : [gestion des utilisateurs](https://firebase.google.com/docs/auth/admin/manage-users), [restauration/import des comptes](https://firebase.google.com/docs/auth/admin/import-users), [conditions des règles Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions).
