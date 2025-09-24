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
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

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
