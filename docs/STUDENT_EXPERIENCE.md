# Vidéos et tableau de bord étudiant

La refonte conserve les routes, collections Firebase, contrôles d'abonnement et de semestre, ainsi que le lecteur existant. Les styles des deux pages sont isolés dans `video-library.css` et `student-dashboard.css`.

La bibliothèque utilise des aperçus légers et ouvre `/videos/:id` pour la lecture. Les fichiers identifiés uniquement par `storagePath` restent visibles. Le partage produit un lien interne et ne diffuse jamais de lien Storage permanent ou signé. Les catégories historiques françaises et les titres stockés sous forme de chaîne ou d'objet multilingue restent compatibles. Les réponses d'une ancienne session ne remplacent pas les données du compte actuel.

Le tableau de bord calcule son activité à partir des tentatives individuelles `quiz_attempts` et de leurs dates `completedAt`. Les autres agrégats `users.stats` restent affichés lorsqu'ils existent ; aucune durée ou progression n'est inventée lorsqu'une mesure manque. Ces agrégats historiques ne sont pas automatiquement alimentés par tous les parcours actuels. Les sélections de contenu passent par les requêtes existantes autorisées. Une erreur du catalogue ne masque pas l'activité personnelle.

Le lecteur accepte les formats YouTube usuels avec validation stricte de l'hôte et de l'identifiant. L'indisponibilité des flashcards ou QCM complémentaires n'empêche plus la lecture. Après une erreur de lecture d'un fichier protégé, « Réessayer » demande un nouveau lien autorisé et restaure la position.

L'accès administrateur exige désormais le même couple de claims côté API et navigateur que dans les règles Firebase : `role: admin` et `adminAccessVersion: 1`. Aucun changement des règles ou du schéma n'est nécessaire pour ce delta. Les anciennes sessions admin sans cette version doivent être remises à jour par la gestion de comptes existante.

Le parseur JSON rejette les corps compressés (`inflate: false`) tout en conservant la limite de 2 Mo et le JSON ordinaire. Cette mitigation suit [l'avis du mainteneur body-parser](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828) pour éviter un déni de service avant authentification. Les autres dépendances anciennes restent à mettre à jour dans un lot dédié ; cette mitigation ne supprime pas l'ensemble des alertes de `npm audit`.

La désactivation `status: inactive` masque une vidéo dans la liste et le lecteur. Elle ne constitue pas une révocation d'accès dans les règles Firestore actuelles : une telle politique demande un changement coordonné des requêtes, index et documents historiques. Le contrôle bancaire et l'alimentation complète des métriques restent hors de cette refonte.

Validation reproductible : [tests/README.md](../tests/README.md). Avant publication, exécuter les tests d'accès, les tests frontend, la compilation et le parcours navigateur. Le bundle de démonstration utilise les émulateurs et ne doit jamais être livré en production ; Railway reconstruit avec sa configuration publique Firebase.
