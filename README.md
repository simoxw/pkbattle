<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PokéBattle

Questo progetto è ora configurato per essere sviluppato e testato in locale. Non si lavora più su Google AI Studio: la cartella locale è la base del progetto.

## Run Locally

**Prerequisiti:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` if usi le API Gemini
3. Avvia l'app:
   `npm run dev`

## Build e preparazione per GitHub

- Costruisci il progetto con:
  `npm run build`
- Dopo `npm run build`, copia tu stesso il contenuto di `dist/` nella cartella che vuoi usare per il deploy su GitHub.

## Note

- Il progetto ora usa `vite` in locale.
- La cartella `dist/` è la build standard.
- Non viene creata automaticamente nessuna cartella di staging per GitHub.
