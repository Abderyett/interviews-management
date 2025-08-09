# Guide - Sauvegarde Automatique des Évaluations Professeurs

## Fonctionnalité
Le système sauvegarde automatiquement les données d'évaluation pendant que vous tapez, pour éviter la perte de données en cas de problème de connexion internet.

## Comment ça fonctionne

### ✅ Sauvegarde Automatique
- **Auto-sauvegarde** : Les données sont automatiquement sauvegardées toutes les 1 seconde après chaque modification
- **Stockage local** : Les données sont stockées dans le navigateur (localStorage)
- **Récupération automatique** : Si vous fermez accidentellement le formulaire, vos données seront restaurées à la réouverture

### 🔍 Indicateurs Visuels

**En haut du formulaire, vous verrez :**
- 🟡 **"Sauvegarde..."** avec icône animée : Le système est en train de sauvegarder
- 🟢 **"Sauvé 14:35:20"** avec icône cloud : Dernière sauvegarde réussie avec l'heure
- 🔴 **"Erreur sauvegarde"** : Problème de sauvegarde (rare)

### 📝 Bannière de Récupération
Si des données sont récupérées, vous verrez une bannière bleue :
*"Données d'évaluation restaurées depuis la dernière sauvegarde (12/01/2025 14:35:20)"*

### 🔄 Options Disponibles

**Nouveau brouillon :**
- Bouton "Nouveau brouillon" (apparaît uniquement si des données sauvegardées existent)
- Permet de supprimer le brouillon et recommencer à zéro
- Demande confirmation avant suppression

**Soumission finale :**
- Quand vous cliquez "Sauvegarder l'évaluation", les données localStorage sont automatiquement supprimées
- Plus besoin de les garder après soumission réussie

## Cas d'Usage

### ✅ Scénarios Protégés
- **Coupure internet** : Vos données sont sauvées localement, continuez à travailler
- **Fermeture accidentelle** : Rouvrez le formulaire, tout sera restauré
- **Problème navigateur** : Données récupérables au redémarrage
- **Changement d'étudiant** : Chaque évaluation est sauvée séparément par professeur + étudiant

### 🔑 Clé de Stockage
Chaque évaluation utilise une clé unique :
`professor_evaluation_{professorId}_{studentId}`

Exemple : `professor_evaluation_3_42`

## Sécurité et Vie Privée
- Les données sont stockées uniquement dans votre navigateur
- Pas de transmission sur internet pour la sauvegarde automatique
- Seule la soumission finale envoie les données au serveur
- Données automatiquement supprimées après soumission réussie

## Dépannage

**Problème de sauvegarde (icône rouge) :**
1. Vérifiez l'espace disponible du navigateur
2. Videz le cache si nécessaire
3. Continuez votre travail normalement - la fonctionnalité se rétablira

**Données non restaurées :**
1. Vérifiez si vous utilisez le même navigateur et la même session
2. Assurez-vous que le localStorage n'a pas été vidé
3. Les données sont spécifiques à chaque couple professeur-étudiant

---

*Cette fonctionnalité protège votre travail contre les interruptions inattendues et améliore votre expérience d'évaluation.*