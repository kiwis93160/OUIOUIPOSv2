<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1meoqOtR5vy-dbHklLN4Aqh5CoAnw1U-i

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Dupliquez [.env.example](.env.example) en `.env.local` et renseignez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
3. Run the app:
   `npm run dev`

## Configuration Supabase

### Tables attendues

| Table | Colonnes clés |
|-------|---------------|
| `roles` | `id` (uuid), `name` (text), `pin` (text), `permissions` (jsonb) |
| `restaurant_tables` | `id`, `nom`, `capacite`, `statut`, `commande_id` (uuid nullable), `couverts` |
| `orders` | `id`, `type`, `table_id`, `table_nom`, `couverts`, `statut`, `estado_cocina`, `date_creation` (timestamptz), `date_envoi_cuisine`, `date_listo_cuisine`, `date_servido`, `payment_status`, `payment_method`, `payment_receipt_url`, `client_nom`, `client_telephone`, `client_adresse`, `receipt_url`, `total`, `profit` |
| `order_items` | `id`, `order_id` (fk `orders.id`), `produit_id` (fk `products.id`), `nom_produit`, `prix_unitaire`, `quantite`, `excluded_ingredients` (jsonb), `commentaire`, `estado`, `date_envoi` |
| `products` | `id`, `nom_produit`, `description`, `prix_vente`, `categoria_id` (fk `categories.id`), `estado`, `image` |
| `product_recipes` | `id`, `product_id`, `ingredient_id`, `qte_utilisee` (numérique, exprimée en g/ml/unité) |
| `categories` | `id`, `nom` |
| `ingredients` | `id`, `nom`, `unite`, `stock_minimum`, `stock_actuel`, `prix_unitaire` |
| `purchases` | `id`, `ingredient_id`, `quantite_achetee`, `prix_total`, `date_achat` |
| `sales` | `id`, `order_id`, `product_id`, `product_name`, `category_id`, `category_name`, `quantity`, `unit_price`, `total_price`, `unit_cost`, `total_cost`, `profit`, `payment_method`, `sale_date` |

Chaque commande finalisée (ou livraison validée) doit générer des lignes dans `sales`. Une fonction ou un trigger Supabase peut reproduire la logique du client (cf. `createSalesEntriesForOrder` dans `services/api.ts`).

### Politiques RLS recommandées

Toutes les tables sont protégées par RLS. Exemple de stratégies à appliquer pour le rôle `anon` (utilisé par la clé `VITE_SUPABASE_ANON_KEY`) :

- `roles`
  - **SELECT** : `true` (lecture des métadonnées de rôle depuis la caisse).
  - **INSERT/UPDATE/DELETE** : restreindre à un rôle personnalisé (`auth.role() = 'service_role'`) ou à une clé service via Edge Functions.
- `restaurant_tables`, `orders`, `order_items`
  - **SELECT** : `true`.
  - **INSERT/UPDATE/DELETE** : `auth.role() = 'anon'` (les mises à jour se font côté front), ou remplacer par des RPC sécurisées si besoin de validation serveur.
- `products`, `product_recipes`, `categories`, `ingredients`
  - **SELECT** : `true`.
  - **INSERT/UPDATE/DELETE** : autoriser `auth.role() = 'anon'` pour l'interface d'administration ou limiter à un rôle spécifique.
- `purchases`, `sales`
  - **SELECT** : `true` (tableau de bord).
  - **INSERT** : autoriser `auth.role() = 'anon'` si l'application web doit écrire directement, sinon déléguer à des triggers/Edge Functions.

Adaptez ces stratégies à vos contraintes (par exemple en combinant `auth.jwt() ->> 'email'` pour filtrer les utilisateurs).

### Déploiement Netlify

- **Commande de build** : `npm run build`
- **Répertoire de publication** : `dist`

Dans l'interface Netlify (`Site settings > Environment variables`), ajoutez les variables :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

Netlify redémarrera automatiquement après mise à jour. Vérifiez également que la configuration Supabase autorise le domaine Netlify (`Settings > API > Allowed Redirect URLs`) si vous activez l'authentification Supabase ultérieurement.

## QA manuel – gestion des rôles

1. Démarrer l'application avec `npm run dev` et se connecter avec le code PIN administrateur (`004789`).
2. Ouvrir le tableau de bord et cliquer sur « Gestion des rôles ».
3. Créer un nouveau rôle avec différents niveaux d'accès, puis vérifier qu'il apparaît dans la liste des rôles.
4. Sélectionner un rôle existant (par exemple « mesero »), modifier plusieurs permissions et enregistrer.
5. Vérifier immédiatement que la barre latérale met à jour la visibilité des onglets en fonction des nouvelles permissions.
6. Naviguer sur quelques pages protégées pour confirmer que les restrictions correspondent aux niveaux choisis (`editor`/`readonly`/`none`).
7. Supprimer un rôle de test et confirmer qu'il disparaît de la liste et que, si le rôle courant est supprimé, l'utilisateur est déconnecté.

## Guide de style rapide

### Palette de couleurs

| Token Tailwind        | Hex      | Usage principal                        |
|-----------------------|----------|----------------------------------------|
| `brand-primary`       | `#F9A826`| Couleur d'action principale (CTA, accents chauds) |
| `brand-primary-dark`  | `#DD8C00`| Survol des actions principales          |
| `brand-secondary`     | `#2D2D2D`| Texte par défaut, boutons foncés        |
| `brand-accent`        | `#E63946`| Actions accentuées / alertes            |
| `status-ready`        | `#2E7D32`| États positifs / succès                 |
| `status-cooking`      | `#F9A826`| États en préparation                    |
| `status-waiting`      | `#1976D2`| États en attente                        |
| `status-paid`         | `#388E3C`| Confirmation de paiement                |
| `status-unpaid`       | `#D32F2F`| Alerte de paiement manquant             |

### Utilitaires réutilisables (`styles/globals.css`)

- **`ui-card`** : conteneur blanc arrondi avec ombre douce pour cartes et panneaux.
- **`ui-input`, `ui-select`, `ui-textarea`** : champs de formulaire harmonisés (focus jaune, coins arrondis, placeholder gris).
- **`ui-btn`** variantes :
  - `ui-btn-primary` : CTA jaune (texte `brand-secondary`).
  - `ui-btn-secondary` : bouton neutre gris.
  - `ui-btn-success` / `ui-btn-info` / `ui-btn-danger` : actions de confirmation, information ou danger.
  - `ui-btn-accent` : actions fortes (rouge). 
  - `ui-btn-dark` : fond `brand-secondary` contrasté.
- **`ui-tag`** : badges arrondis gris clairs.
- **`text-heading`** : titres de section cohérents (`text-3xl`, gras, `brand-secondary`).

Importez `./styles/globals.css` (déjà référencé dans `index.tsx`) pour bénéficier de ces utilitaires. Préférez ces classes aux combinaisons Tailwind manuelles pour conserver une identité visuelle homogène.
