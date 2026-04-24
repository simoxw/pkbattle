# Struttura del Progetto: Pokémon Battle Arena PWA

Questo documento fornisce una panoramica della struttura delle cartelle e dei file del progetto, descrivendo il contenuto e lo scopo di ciascuno.

## Albero delle Cartelle

```text
/
├── public/                # Asset statici pubblici
├── src/
│   ├── components/        # Componenti React riutilizzabili
│   ├── constants/         # Costanti globali e dati statici
│   ├── data/              # Dati JSON iniziali o mock
│   ├── lib/               # Logica di core, utility e servizi
│   │   └── pokemon/       # Moduli specifici per la logica Pokémon
│   ├── pages/             # Componenti pagina (Route)
│   ├── store/             # Gestione dello stato globale (Zustand)
│   │   └── slices/        # Slice modulari dello store
│   ├── types/             # Definizioni dei tipi TypeScript
│   ├── App.tsx            # Componente principale e routing
│   ├── index.css          # Stili globali (Tailwind CSS)
│   └── main.tsx           # Entry point dell'applicazione React
├── .env.example           # Esempio di variabili d'ambiente
├── .gitignore             # File da ignorare in Git
├── README.md              # Documentazione generale del progetto
├── index.html             # Template HTML principale
├── metadata.json          # Metadati dell'applicazione
├── package.json           # Dipendenze e script NPM
├── tailwind.config.ts     # Configurazione di Tailwind CSS
├── tsconfig.json          # Configurazione di TypeScript
└── vite.config.ts         # Configurazione di Vite
```

## Descrizione dei File

### `src/components/`
- **`BottomNav.tsx`**: Barra di navigazione inferiore per il passaggio tra le sezioni principali della PWA.

### `src/constants/`
- **`items.ts`**: Elenco e proprietà degli oggetti disponibili nel gioco (es. Poké Ball, Pozioni).

### `src/data/`
- **`minimalData.json`**: Dataset iniziale di Pokémon per il seeding del database locale.

### `src/lib/`
- **`battleEngine.ts`**: Motore di calcolo del danno (formule Gen 9 ufficiali), gestione delle Nature (25 tipi con localizzazione IT) e applicazione dei modificatori di statistica (Stages).
- **`breedingUtils.ts`**: Logica per l'accoppiamento dei Pokémon e generazione di uova con passaggio di IVs.
- **`db.ts`**: Configurazione di IndexedDB tramite Dexie.js. Include logica di auto-repair per dati corrotti e seeding iniziale sincronizzato con il motore statistiche.
- **`evolutionUtils.ts`**: Gestione dei requisiti e dei processi di evoluzione.
- **`pokeApi.ts`**: Client per PokéAPI con sistema di caching integrato su IndexedDB.
- **`pokemonUtils.ts`**: Punto di accesso centralizzato per le utility Pokémon (re-export dai moduli in `lib/pokemon/`).
- **`serialization.ts`**: Funzioni per l'importazione ed esportazione dei dati di gioco.
- **`typeChart.ts`**: Matrice delle debolezze e resistenze tra i tipi Pokémon.

#### `src/lib/pokemon/`
- **`sprites.ts`**: Generazione URL per sprite e artwork.
- **`stats.ts`**: Calcolo statistiche ufficiali (Level, Base, IV, EV, Nature) e gestione delle 6 curve di crescita (Growth Rates).
- **`evolution.ts`**: Logica di recupero dati evolutivi.
- **`moves.ts`**: Recupero mosse consigliate e per livello.
- **`ui.ts`**: Utility per badge, colori e formattazione tipi.

### `src/pages/`
- **`Backpack.tsx`**: Visualizzazione dell'inventario degli oggetti del giocatore.
- **`BattleHub.tsx`**: Centro per la selezione delle modalità di battaglia (Sfida Trainer, Lotta Casuale, Inserimento Codice).
- **`BattlePlay.tsx`**: Schermata di combattimento. Gestisce turni, IA nemica, logica di fine lotta, distribuzione EXP e apprendimento mosse.
- **`Box.tsx`**: Visualizzazione dei Pokémon catturati nel deposito.
- **`BoxDetail.tsx`**: Dettagli avanzati di un Pokémon: Statistiche reali vs Base, IV/EV, Nature e barra EXP dinamica.
- **`BoxImport.tsx`**: Pagina per l'importazione di dati esterni nel Box.
- **`DailyCatch.tsx`**: Meccanica di cattura giornaliera.
- **`Home.tsx`**: Dashboard principale dell'utente.
- **`Pokedex.tsx`**: Enciclopedia dei Pokémon incontrati e catturati.
- **`Settings.tsx`**: Impostazioni dell'applicazione.
- **`Shop.tsx`**: Negozio per l'acquisto di oggetti tramite monete di gioco.
- **`Social.tsx`**: Funzionalità social.
- **`Stub.tsx`**: Pagina segnaposto per funzionalità non ancora implementate.
- **`Teams.tsx`**: Gestione e composizione delle squadre di Pokémon.

### `src/store/`
- **`useStore.ts`**: Store principale che combina le slice modulari.
- **`slices/`**: Contiene `createUserSlice.ts`, `createInventorySlice.ts` e `createSettingsSlice.ts`.

### `src/types/`
- **`index.ts`**: Entry point che esporta tutti i tipi.
- **`pokemon.types.ts`**: Tipi relativi a Pokémon, Statistiche e Mosse.
- **`team.types.ts`**: Tipi relativi alle squadre.
- **`masterData.types.ts`**: Tipi per i dati di riferimento.
- **`store.types.ts`**: Definizioni per le slice di Zustand.

---
*Ultimo aggiornamento: 2026-04-24*
