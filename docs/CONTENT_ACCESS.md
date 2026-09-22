# Comptes, contenus et confidentialité

Les droits d'administration viennent exclusivement des claims Firebase Auth (`role: admin`, `adminAccessVersion: 1`). Le champ `role` du profil n'accorde aucun accès. La plateforme conserve un administrateur unique ; l'API refuse la création d'un second administrateur et empêche l'admin de se désactiver ou de retirer son propre rôle. L'administrateur utilise toutes les fonctions pédagogiques sans abonnement et peut gérer les comptes et les contenus. Le claim serveur `unlimitedAccess: true` donne accès aux fonctions pédagogiques et aux niveaux de la bibliothèque sans donner les droits admin ni accès aux créations privées des autres personnes.

| Données | Propriétaire | Autre utilisateur connecté | Administrateur |
| --- | --- | --- | --- |
| Profil et coordonnées | Lecture, modification des informations personnelles | Aucun accès | Consultation et gestion par API |
| Quiz/flashcards `visibility: private` | Lecture et gestion | Aucun accès, même par identifiant direct | Consultation et gestion |
| Quiz/flashcards `visibility: shared` | Lecture selon le semestre | Lecture selon le semestre | Gestion de la bibliothèque |
| Tentatives de quiz et résultats QCM | Lecture de ses résultats | Aucun accès | Consultation |
| Cours, vidéos et QCM pédagogiques | Lecture selon le semestre | Lecture selon le semestre | Création, modification, suppression |

Le semestre du profil est une chaîne de `1` à `12`. L'étudiant peut le choisir une fois s'il n'est pas renseigné ; il ne peut ensuite ni le remplacer ni l'effacer, même par une écriture directe dans Firestore. Seul l'admin le modifie par l'API. Les changements automatiques liés à un paiement restent à implémenter.

Les contenus de bibliothèque portent `semester: '1'` … `'12'` ou explicitement `'all'` pour un contenu général. Les contenus historiques sans classement sont masqués aux élèves ordinaires et conservés pour l'admin et le compte test illimité. Aucun semestre n'est déduit arbitrairement d'un titre médical. L'admin peut affecter les anciens cours, vidéos, quiz, flashcards et QCM depuis leurs écrans de gestion. Une création personnelle reste accessible à son auteur indépendamment de son semestre ; après publication dans la bibliothèque, le semestre publié s'applique.

Les quiz utilisent `creatorId`, les flashcards `ownerId`, les résultats `userId`. La création personnelle fixe le propriétaire connecté et `visibility: private`. Les règles interdisent l'usurpation de propriétaire et la publication par un étudiant. Seul l'admin peut publier ou retirer un contenu de la bibliothèque via les boutons prévus.

Les listes, suggestions et recommandations respectent ces limites. Les règles Firestore les imposent également pour les accès directs ; les API des quiz, cours et vidéos imposent la même politique et nécessitent une authentification. Les résultats de quiz sont enregistrés par le serveur dans `quiz_attempts`, séparément du quiz partagé. Les résultats QCM portent l'UID de leur auteur.

Les fichiers hébergés sont identifiés par `pdfStoragePath` (cours) ou `storagePath` (vidéos). `GET /api/courses/:id/media` et `GET /api/videos/:id/media` vérifient le compte et le semestre avant de produire une URL signée valable dix minutes. Les élèves n'accèdent pas aux métadonnées Storage ; les anciens jetons permanents doivent être révoqués pendant la migration. Les liens YouTube et PDF externes restent accessibles chez leur hébergeur : leur publication externe n'est pas contrôlée par la plateforme. Une URL signée peut aussi être utilisée jusqu'à son expiration par quiconque la possède ([documentation Google Cloud](https://cloud.google.com/storage/docs/access-control/signed-urls)).

La génération de flashcards crée un véritable deck dans `flashcards`. Le PDF est lu dans le navigateur ; seul le texte choisi est transmis au service IA. Aucun document source n'est enregistré dans la bibliothèque. Les réponses IA doivent être vérifiées avant utilisation pédagogique.

## Mise en ligne coordonnée

Les changements applicatifs, les règles dans `firebase/` et la classification des anciennes données doivent être livrés ensemble. Ne pas appliquer les règles seules : les anciennes listes non filtrées seraient refusées. Ne pas publier automatiquement des contenus anciens dont le propriétaire ou l'origine sont inconnus.

Avant migration : sauvegarder Auth (avec paramètres de hachage pour les comptes avec mot de passe), Firestore, les règles actives et les métadonnées Storage ; vérifier les administrateurs par leurs claims ; définir précisément les comptes conservés. Chiffrer la sauvegarde et comparer son déchiffrement aux données originales, y compris les caractères français et arabes. Les scripts de suppression doivent utiliser une liste d'UID revue, préserver les contenus pédagogiques communs et refuser toute suppression d'un compte conservé.

Pour les anciennes données : attribuer une visibilité explicite, normaliser le format des questions historiques, sortir les tentatives des documents de quiz et conserver les résultats non attribuables sous `admin/accessMigration/quarantine`. Refuser l'application si l'inventaire des comptes ou les versions des documents ont changé depuis la sauvegarde. Conserver un journal privé et un marqueur empêchant la répétition de la migration. Une rétrogradation Railway seule ne restaure ni données ni règles.

Déployer l'application, vérifier sa santé, appliquer les données et les claims, puis activer les règles validées sans délai. Les comptes supprimés sont inscrits dans `accountRevocations` (écriture serveur uniquement), ce qui bloque leurs anciens jetons dans Firestore et la recréation de leur profil. `adminAccessVersion: 1` écarte les anciens jetons admin dans Firestore et Storage. Supprimer ensuite les comptes Auth, révoquer les jetons de téléchargement permanents, et vérifier les deux comptes conservés et les fichiers avec des sessions neuves. Ne jamais publier les sauvegardes, mots de passe, clés privées ou URL signées dans Git.

## Limites connues

Le contrôle de l'abonnement reste le mécanisme existant, distinct de cette isolation des données. Le raccordement bancaire, les paiements et leur contrôle côté serveur restent à traiter avant la commercialisation.

Auth et Firestore ne partagent pas de transaction. L'API compense une modification Auth si l'écriture du profil échoue. La désactivation/rétrogradation révoque les sessions pour l'API ; un jeton Firebase déjà émis peut rester utilisable directement auprès de Firestore jusqu'à son expiration. Les modifications sensibles nécessitent une reconnexion.

Validation reproductible : [tests/README.md](../tests/README.md). Documentation Firebase : [gestion des utilisateurs](https://firebase.google.com/docs/auth/admin/manage-users), [restauration/import des comptes](https://firebase.google.com/docs/auth/admin/import-users), [conditions des règles Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions).
