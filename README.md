# Pokémon Battle Arena PWA

Un simulatore di battaglie Pokémon Gen 9 ultra-competitivo, 100% client-side, installabile come PWA.

## Funzionalità
- 1025 Pokémon (Gen 1-9) con sprite dinamici
- **Sistema Statistiche Ufficiale**: Calcolo basato su Livello, Base Stats, IVs, EVs e Nature (+/-)
- **Nature Italiane**: Tutte le 25 nature tradotte e funzionanti con modificatori reali
- **Esperienza Reale**: 6 curve di crescita ufficiali (Fast, Slow, Medium-Slow, ecc.)
- **Battle Engine Gen 9**: Calcolo danni accurato, modificatori di stato e priorità
- **Sfide Allenatori**: Sistema di trainer con team ottimizzati e livelli dinamici
- **Lotte Casuali**: Generazione procedurale di team nemici (4 Pokémon) basati sulla media del giocatore
- Evoluzioni complete, Breeding e sistema di mosse per livello
- Modalità Offline (IndexedDB)
- 100% in Italiano

## Stato del Progetto
- [x] Battle Engine Core
- [x] Sincronizzazione Statistiche Gen 9
- [x] UI Home, Box e Dettagli Avanzati
- [x] Sistema di Livellamento e Mosse
- [x] Sfide Trainer e Random Battles

## Prossimi Passi
- Implementazione effetti secondari complessi (Abilità, Meteo)
- Sistema di scambi (Social)
- Tornei a eliminazione diretta


## Comandi

```bash
# Installazione dipendenze
npm install

# Sviluppo locale
npm run dev

# Build di produzione
npm run build

# Deploy su GitHub Pages
# 1. Crea la build
# 2. Carica il contenuto della cartella /dist sul tuo repository (branch gh-pages o root)
```
