# Tests isolés de MedPlatform

Ces tests écrivent uniquement dans le projet fictif `demo-medplatform-audit` sur les émulateurs locaux. Les scripts ne chargent ni `.env` ni clé de service. Le navigateur bloque les requêtes vers des hôtes autres que localhost. Les réponses IA sont simulées : aucun appel payant.

Depuis la racine du dépôt, avec Docker Desktop, Node et Chrome installés :

```powershell
docker build -f tests/Dockerfile.firebase -t medplatform:firebase-audit .
docker run -d --name medplatform-firebase-audit -p 127.0.0.1:19099:9099 -p 127.0.0.1:18080:8080 -p 127.0.0.1:19199:9199 medplatform:firebase-audit
docker logs medplatform-firebase-audit
npm ci --prefix backend
npm ci --prefix frontend
npm ci --prefix tests
npm test --prefix tests
```

Attendre le message `All emulators ready` avant les tests. La suite réinitialise la base de démonstration. Les tests couvrent les droits des profils, le verrouillage du semestre, S1/S2/contenu général, l'accès illimité sans accès aux créations privées d'autrui, les règles Firestore/Storage, les anciens jetons révoqués, les résultats individuels et les routes Express. Ils vérifient aussi qu'un ancien claim admin sans `adminAccessVersion: 1` ne donne aucun privilège API. Le routeur média est testé avec des services simulés : aucun fichier réel ni clé privée.

Dans deux terminaux distincts :

```powershell
node tests/serve-api.cjs
```

```powershell
node tests/serve-frontend.cjs
```

Puis, après compilation du frontend :

```powershell
npm run test:browser --prefix tests
```

Le parcours consacré aux vidéos et au tableau de bord se lance séparément, après les tests d'intégration et avec les deux serveurs locaux actifs :

```powershell
npm run test:student-experience --prefix tests
```

Ce parcours ajoute ses données fictives uniquement au projet d'émulation, active l'abonnement de l'étudiant démo et réinitialise ses tentatives. Il vérifie l'activité réelle sur 7/30 jours, le tableau accessible, les filtres/recherche/tri, les vues grille/liste, le partage par lien interne, l'isolation du semestre, les largeurs 320/390/768 px et l'arabe RTL. Aucun lecteur ni lien signé n'est chargé dans la bibliothèque. Captures dans `.cache/student-experience-qa/`. Les suites navigateur partagent les comptes démo : les exécuter séparément et relancer l'intégration entre les parcours.

Pour les bibliothèques Quiz et Flashcards, après le parcours historique `test:browser` :

```powershell
npm run test:learning-libraries --prefix tests
```

Le script prépare uniquement des comptes et contenus fictifs dans les émulateurs locaux. Il vérifie les espaces personnels/partagés, les quiz IA publiés, les résultats à 0 %, les statistiques indépendantes des filtres, les anciens formats de cartes, la publication/retrait par l'admin, l'isolation entre étudiants et semestres, les écrans mobiles et l'arabe RTL. Les requêtes extérieures sont bloquées. Captures dans `.cache/learning-library-qa/`. Le parcours historique vérifie également la génération depuis PDF, la sauvegarde personnelle et son maintien après rechargement.

Exécuter les tests d'intégration **avant** les tests navigateur, jamais en parallèle : ils utilisent les mêmes comptes fictifs. Relancer la suite d'intégration avant chaque nouveau parcours navigateur pour rétablir les rôles et statuts initiaux.

Le parcours Chrome vérifie la connexion et son retour à la page demandée, le profil persistant, le rendu à 390 px, l'inscription, la gestion admin, l'extraction d'un PDF synthétique, la génération/enregistrement de flashcards, leur confidentialité entre deux comptes, puis la publication et le retrait par l'admin. Captures : `.cache/production-audit/` (ignoré par Git).

Tests unitaires :

```powershell
$env:CI = 'true'
npm test --prefix frontend -- --watchAll=false --runInBand
```

Après usage, arrêter les deux serveurs avec Ctrl+C puis :

```powershell
docker stop medplatform-firebase-audit
docker rm medplatform-firebase-audit
```

`firebase.local.json` est réservé aux émulateurs. Il ne doit pas servir à déployer sur Firebase réel.
