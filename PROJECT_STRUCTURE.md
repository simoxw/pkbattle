# Project Structure

Questo file descrive la struttura del progetto e il ruolo di ogni file principale.

```
pkbattle/
├── README.md
├── PROJECT_STRUCTURE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── metadata.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── constants.ts
│   ├── types.ts
│   ├── store/
│   │   └── gameStore.ts
│   ├── data/
│   │   └── trainers.ts
│   └── services/
│       ├── api.ts
│       └── base64.ts
```

## Descrizione dei file

- `README.md`
  - Istruzioni per installare, eseguire e pubblicare il progetto in locale.

- `PROJECT_STRUCTURE.md`
  - Documentazione del progetto e memoria strutturale per sviluppo futuro.

- `package.json`
  - Definisce dipendenze, script di sviluppo e build.

- `tsconfig.json`
  - Configurazione TypeScript del progetto.

- `vite.config.ts`
  - Configurazione di Vite, compreso il supporto PWA e il base path relativo per build statiche.

- `index.html`
  - Pagina HTML principale usata da Vite come template per l'app React.

- `metadata.json`
  - File iniziale ereditato da AI Studio; può rimanere come riferimento ma non è necessario per l'app locale.

- `src/store/gameStore.ts`
  - Store Zustand che persiste il box dei Pokémon e lo sincronizza con IndexedDB.

- `src/main.tsx`
  - Entry point React che monta l'app in `#root`.

- `src/App.tsx`
  - Componente principale dell'app.
  - Gestisce lo stato della battaglia, le schermate del menu e l'interfaccia utente.
  - Ora supporta layout a tutta altezza su schermi mobili e si adatta in orizzontale/verticale.

- `src/index.css`
  - Stili globali e configurazione Tailwind.
  - Aggiunge il supporto a layout a schermo intero e stili di base.

- `src/constants.ts`
  - Palette colori, helper e costanti utili al gioco.

- `src/types.ts`
  - Tipi TypeScript per Pokemon, mosse, allenatori e stato di battaglia.

- `src/data/trainers.ts`
  - Dati degli allenatori e preset di sfide.

- `src/services/api.ts`
  - Funzioni per caricare i dati dei Pokémon e calcolare il danno durante le battaglie.

- `src/services/base64.ts`
  - Codifica e decodifica del team per import/export.

- `dist/`
  - Output generato da Vite al momento del build.

