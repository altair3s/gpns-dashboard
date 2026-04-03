# GPNS Dashboard

Dashboard React connecté aux Google Sheets de suivi RH (Heures) et stock (Produits).

---

## Stack

| Outil | Rôle |
|---|---|
| Vite + React 18 | Bundler et framework UI |
| React Router v6 | Navigation entre pages |
| Recharts | Graphiques (bar, line, pie) |
| Lucide React | Icônes |
| Google Sheets API v4 | Source de données (lecture seule) |

---

## Structure du projet

```
gpns-dashboard/
├── src/
│   ├── api/
│   │   ├── sheetsConfig.js   ← IDs des sheets + indices des colonnes
│   │   ├── sheetsClient.js   ← Wrapper fetch (batchGet)
│   │   ├── heuresApi.js      ← Récupère la feuille "global"
│   │   └── stockApi.js       ← Récupère Produits / Entrées / Sorties
│   ├── utils/
│   │   ├── parseHeures.js    ← Calcule présences, motifs, heures, KPIs
│   │   └── parseStock.js     ← Calcule stock réel, alertes, mouvements
│   ├── hooks/
│   │   ├── useHeures.js      ← State + fetch heures
│   │   └── useStock.js       ← State + fetch stock
│   ├── components/
│   │   ├── layout/Sidebar.jsx
│   │   ├── ui/index.jsx      ← KpiCard, Badge, ProgressBar, Loader
│   │   ├── heures/index.jsx  ← PresencesChart, MotifsChart, MotifsTable…
│   │   └── stock/index.jsx   ← GpnsTopChart, MouvementsChart, StockTable…
│   ├── pages/
│   │   ├── HeuresPage.jsx
│   │   └── StockPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## 1. Prérequis Google Cloud

### Activer l'API

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer ou sélectionner un projet
3. Menu **APIs & Services → Library** → chercher **"Google Sheets API"** → Activer
4. Menu **APIs & Services → Credentials** → **Create Credentials → API Key**
5. Restreindre la clé : **API restrictions → Google Sheets API**

### Partager les Google Sheets

Pour chaque feuille (Export/Heures et Produits) :
- Ouvrir le fichier → **Partager** → **Tout le monde ayant le lien peut afficher**

> **Feuilles privées ?** Utiliser un Service Account et un proxy backend (voir section avancée).

---

## 2. Configuration

```bash
cp .env.example .env
```

Remplir `.env` :

```env
VITE_GOOGLE_API_KEY=AIza...votre_cle
VITE_SHEET_HEURES_ID=1abc...id_du_fichier_export
VITE_SHEET_PRODUITS_ID=1xyz...id_du_fichier_produits
VITE_FILIALE=GPNS
```

L'ID d'un fichier Google Sheets se trouve dans l'URL :
```
https://docs.google.com/spreadsheets/d/  →SPREADSHEET_ID←  /edit
```

---

## 3. Installation et lancement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

```bash
# Build de production
npm run build
npm run preview
```

---

## 4. Correspondance colonnes → Google Sheets

### Feuille "global" (export heures)

La feuille a **2 lignes d'en-têtes groupées** avant la vraie ligne de colonnes (ligne 3).
Le fetch démarre à `global!A3:AK`.

| Colonne | Indice | Contenu |
|---|---|---|
| A | 0 | Badge |
| B | 1 | Trigramme |
| C | 2 | Nom |
| D | 3 | Prénom |
| E | 4 | Service |
| F | 5 | Site |
| G | 6 | Qualification |
| H | 7 | 1ère tâche |
| I | 8 | Jour (date) |
| L | 11 | Motif |
| O | 14 | Début prévisionnel |
| P | 15 | Fin prévisionnel |
| Q | 16 | **Durée prév.** (`07:00:00` \| `MAL` \| `CP` …) |
| V | 21 | Durée badgeuse |
| Y | 24 | Durée réalisée |
| AB | 27 | **Travail effectif** (`0 days 07:30:00`) |
| AC | 28 | H Sup |
| AE | 30 | Anomalie |

Les indices sont définis dans `src/api/sheetsConfig.js → HEURES_COLS` et peuvent être ajustés si la structure de votre feuille diffère.

### Feuilles Produits

| Feuille | Colonnes |
|---|---|
| Produits | Id, Produit, Categorie, Image, Stock initial, Niveau réapro, Prix HT/Unit, Valeur |
| Entrées | Timestamp, Date, Produit, Quantité, Client, Remarque, user |
| Sorties | Timestamp, Date, Produit, Quantité, Client, Remarque, user |

---

## 5. Ajouter une nouvelle page

1. Créer `src/pages/NomPage.jsx`
2. Créer `src/hooks/useNom.js` + `src/api/nomApi.js` si besoin
3. Ajouter l'entrée dans `src/components/layout/Sidebar.jsx`
4. Ajouter la `<Route>` dans `src/App.jsx`

---

## 6. Service Account (feuilles privées)

Si les Google Sheets sont privées (non partagées publiquement) :

1. Créer un **Service Account** dans GCP → télécharger la clé JSON
2. Partager chaque Sheet avec l'email du service account (Lecteur)
3. Ne **pas** exposer la clé JSON côté client
4. Créer un **proxy backend** (Node/Express ou Edge Function) qui :
   - Reçoit les requêtes du frontend
   - S'authentifie via la clé SA avec `google-auth-library`
   - Retransmet à l'API Sheets
5. Pointer `sheetsClient.js` vers votre proxy au lieu de `sheets.googleapis.com`

---

## 7. Personnalisation rapide

| Besoin | Fichier |
|---|---|
| Changer la filiale filtrée | `.env → VITE_FILIALE` |
| Ajouter un code d'absence | `src/utils/parseHeures.js → ABSENCE_CODES` |
| Modifier les plages de cellules | `src/api/sheetsConfig.js → SHEETS` |
| Changer les couleurs | `src/index.css → :root` |
| Ajouter un graphique | `src/components/heures/index.jsx` ou `stock/index.jsx` |
