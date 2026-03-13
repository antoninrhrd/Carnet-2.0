# Mes Fiches — App culinaire

Application web personnelle pour gérer fiches de plats, préparations et produits.
Stack : **Next.js 14** + **TypeScript** + **Tailwind CSS** + **Supabase**

---

## Mise en route (20 min)

### 1. Créer un projet Supabase gratuit

1. Aller sur [supabase.com](https://supabase.com) → **New project**
2. Dans **SQL Editor**, coller et exécuter le contenu de `supabase/schema.sql`
3. Dans **Settings → API**, copier :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configurer le projet en local

```bash
# Cloner / dézipper le projet
cd fiches-app

# Installer les dépendances
npm install

# Créer le fichier d'environnement
cp .env.local.example .env.local
# → Remplir les 3 valeurs Supabase dans .env.local

# Lancer en développement
npm run dev
# → Ouvrir http://localhost:3000
```

### 3. Déployer sur Vercel (accès depuis n'importe où)

1. Pousser le projet sur GitHub (ou GitLab)
2. Sur [vercel.com](https://vercel.com) → **New Project** → importer le repo
3. Dans **Environment Variables**, ajouter les 3 variables Supabase
4. **Deploy** → votre URL personnelle est prête !

---

## Structure des fiches

| Type | Champs |
|------|--------|
| **Plat** | Nom, Source, Dressage, Saison, Note perso, Image |
| **Préparation** | Nom, Ingrédients (qty + unité + nom), Étapes, Saison, Note perso, Image |
| **Fiche produit** | Nom, Prix min/max (€/kg), Note libre |

## Navigation

- **Plats** → Entrées / Entrées végé / Plats végé / Plats viande / Plats poisson / Desserts
- **Préparations** → Pâtes / Pasta / Sauces / Condiments
- **Fiches produit** → liste unique

Le bouton **+** dans la sidebar crée directement une fiche dans la bonne catégorie.
