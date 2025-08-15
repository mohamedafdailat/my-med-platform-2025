MedPlatform Maroc
MedPlatform Maroc est une plateforme éducative conçue pour les étudiants en médecine au Maroc, offrant des cours interactifs, des vidéos, des quiz, des flashcards, et des outils d'intelligence artificielle (chatbot, tuteur, recommandations personnalisées). La plateforme prend en charge le français et l'arabe pour une expérience utilisateur accessible.
Fonctionnalités principales

Authentification : Inscription/connexion sécurisée via Firebase Authentication.
Gestion des utilisateurs : Rôles (étudiant, enseignant, admin) avec gestion des profils.
Contenu éducatif : Vidéos, quiz, et flashcards stockés dans Firebase Firestore et Storage.
Outils IA : Chatbot et tuteur alimentés par une API externe (ex. OpenAI) pour des réponses et explications médicales.
Multilinguisme : Interface et messages en français et arabe.
Tableau de bord : Suivi des progrès et recommandations personnalisées.
Administration : Gestion des utilisateurs et du contenu pour les admins.

Structure du projet
my-med-platform/
├── frontend/              # Application React
├── backend/               # API Node.js/Express
├── database/              # Schémas et données initiales Firestore
├── docs/                  # Documentation (API, Setup, Deployment, User Guide)
├── .gitignore             # Fichiers/dossiers ignorés par Git
├── README.md              # Introduction au projet
└── package.json           # Dépendances et scripts globaux

Technologies

Frontend : React, Tailwind CSS, Firebase SDK
Backend : Node.js, Express, Firebase Admin SDK
Base de données : Firebase Firestore
Stockage : Firebase Storage
IA : API OpenAI (ou alternative)
Autres : Nodemailer (emails), Multer (uploads), Joi (validation)

Installation

Cloner le dépôt :
git clone <repository-url>
cd my-med-platform


Installer les dépendances globales :
npm install


Configurer le frontend :

Suivez frontend/README.md ou docs/SETUP.md pour les instructions.


Configurer le backend :

Suivez backend/README.md ou docs/SETUP.md pour les instructions.


Configurer Firebase :

Créez un projet Firebase et configurez Firestore, Storage, et Authentication.
Appliquez les règles Firestore/Storage décrites dans docs/SETUP.md.


Initialiser la base de données :
node database/seed.js



Déploiement

Frontend et backend peuvent être déployés sur Vercel.
Suivez docs/DEPLOYMENT.md pour les instructions détaillées.

Documentation

API : docs/API.md (détails des endpoints)
Installation : docs/SETUP.md
Déploiement : docs/DEPLOYMENT.md
Guide utilisateur : docs/USER_GUIDE.md

Contribution

Forkez le dépôt.
Créez une branche pour votre fonctionnalité (git checkout -b feature/nom-fonctionnalite).
Commitez vos changements (git commit -m "Ajout de fonctionnalité").
Poussez votre branche (git push origin feature/nom-fonctionnalite).
Ouvrez une Pull Request.

Support

Email : support@medplatform.ma
Issues : Créez un ticket sur GitHub.

Licence
ISC © MedPlatform Team
