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
