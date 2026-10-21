# FantaSmart 2026/2027

Copilot per l'asta del **Fantacalcio Serie A 2026/2027**: durante la battuta live calcola in tempo reale quanto vale un giocatore, quanto conviene spenderci e cosa fare se l'asta va male. Funziona interamente nel browser (*local-first*) ed è pensata per essere installata come **PWA** da smartphone.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react · xlsx

---

## Funzionalità

### Motore decisionale (`src/lib/advisor`)
- **xFM / CPS** – fantamedia attesa e punteggio composito per ogni giocatore, calcolati da titolarità, rigoristi, piazzati e rischio infortuni.
- **VORP e prezzo consigliato fisso** – il prezzo consigliato di ogni giocatore è stabilito dalle regole della lega (budget, numero di squadre, slot per reparto, modificatore difesa) e dalle sue caratteristiche (FVM, titolarità, rigori, infortuni). **Non cambia durante l'asta**: pagare un giocatore più o meno del consigliato non altera il prezzo degli altri. Il denaro totale della lega viene ripartito tra i giocatori che verranno acquistati in ogni reparto; cambiando budget o modificatore i prezzi si ricalcolano. Indice di inflazione di mercato in tempo reale.
- **Controllo del budget** – crediti rimasti sempre visibili, "dopo l'acquisto" in tempo reale, avviso e blocco se l'offerta supera il massimo possibile (si riserva 1 credito per ogni slot ancora da riempire).
- **Ribilanciamento del budget per slot** – vista di pianificazione: un overspending viene assorbito dagli slot inferiori dello stesso reparto; un risparmio viene redistribuito sugli slot ancora aperti.
- **Pairing calendario (38 giornate)** – alternanza casa/trasferta e complementarità di calendario (FDR) tra portieri e compagni di reparto, su matrice 20×20.
- **Sostituti k-NN** – se perdi un obiettivo, propone i migliori alternativi per rendimento e prezzo.
- **Suggerimenti di chiamata** – quali giocatori nominare per chiudere slot a buon prezzo e quali usare come "esche" per far spendere gli avversari.
- **Intelligence sugli avversari** – budget residuo, slot aperti e indice di scarsità per reparto.
- **Best 11** – formazione ottimale per 6 moduli (3-4-3, 4-3-3, 3-5-2, 4-4-2, 4-2-3-1, 3-4-2-1) e rilevamento delle lacune di rosa.

### App
| Rotta | Contenuto |
|---|---|
| `/login` | Accesso (account demo) oppure modalità **Ospite** (non salva nulla) |
| `/hub` | Elenco delle tue leghe/aste: crea, duplica, elimina, apri |
| `/auction` | Workspace d'asta a schede: **Live Cockpit**, **Mia Rosa**, **Campo 2D**, **Sostituto**, **Listone** |
| `/admin` | Editor del database dei calciatori (solo ruolo `ADMIN`, altrimenti 403) |

Altre caratteristiche:
- **Multi-asta**: ogni account può gestire più leghe indipendenti (budget, partecipanti, modificatore difesa, slot per ruolo).
- **Scorciatoie da tastiera (solo desktop)**: `Cmd/Ctrl+K` ricerca, `Invio` preso da me, `Maiusc+Invio` perso, `Ctrl+Z` annulla l'ultima transazione. Su smartphone e tablet sono disattivate e nascoste.
- **Listone** con filtro stato (Liberi / Mia Rosa / Persi / Tutti): di default mostra solo i giocatori ancora liberi, quindi chi viene preso o perso sparisce subito.
- **Gestione rosa**: modifica prezzo pagato, svincolo con riapertura slot, aggiunta manuale, esportazione CSV / testo per chat.
- **Tema** chiaro/scuro/sistema e pannello impostazioni (lega, algoritmo, backup JSON, reset).
- **UI mobile-first**: modali come bottom sheet, input anti-zoom iOS, barra di navigazione inferiore.

> I dati (leghe, rose, impostazioni) sono salvati nel **`localStorage` del browser**. Non c'è backend né sincronizzazione tra dispositivi: cambiando browser o telefono si riparte da zero (usa il backup JSON dalle impostazioni).

---

## Avvio in locale

Requisiti: **Node.js 20+** e npm.

```bash
npm install
cp .env.example .env.local   # poi imposta le password in .env.local
npm run dev
```

L'app è su http://localhost:3000.

Altri comandi:

```bash
npm run build   # build di produzione
npm start       # serve la build di produzione
npm run lint    # ESLint
npx tsc --noEmit
```

### Account e variabili d'ambiente

Gli account `admin` e `utente` sono configurati **solo tramite variabili d'ambiente** (vedi `.env.example`): nel codice non c'è nessuna password. Se `NEXT_PUBLIC_ADMIN_PASS` / `NEXT_PUBLIC_USER_PASS` non sono impostate, l'account corrispondente è disabilitato (restano disponibili registrazione e modalità Ospite).

L'autenticazione è comunque **simulata lato client** e serve a separare i dati per utente e a nascondere `/admin` nell'interfaccia: **non è un sistema di sicurezza reale**. Le variabili `NEXT_PUBLIC_*` finiscono nel bundle JavaScript e sono leggibili da chiunque apra l'app, quindi non riutilizzare password usate altrove.

---

## Deploy su Vercel (PWA)

L'app è pubblicata su Vercel, che rileva automaticamente Next.js.

1. Importa il repository su [vercel.com/new](https://vercel.com/new) (preset *Next.js*, nessuna configurazione richiesta).
2. In *Settings → Environment Variables* imposta le variabili di `.env.example` (in particolare le due password), poi rifai il deploy: senza di esse non si può accedere con `admin` / `utente`.
3. Ogni push sul branch principale genera un nuovo deploy in produzione.

### Installarla come app

- **Android / desktop (Chrome, Edge):** apri l'URL di produzione → menu → *Installa app*.
- **iPhone (Safari):** *Condividi* → *Aggiungi a Home*.

Gli asset PWA sono in `public/manifest.json` (nome, colori, `display: standalone`) e `public/sw.js` (cache offline).

### Stato attuale della PWA

Il manifest è collegato, ma ci sono ancora due passi aperti per una PWA completa:

- [ ] **Service worker non attivo**: `registerServiceWorker()` (`src/lib/storage/pwaServiceWorker.ts`) esiste ma non viene richiamata da nessuna parte, quindi la cache offline oggi non è in funzione. Quando lo si attiva, rivedere `public/sw.js`: la strategia *cache-first* con `CACHE_NAME` fisso serve versioni vecchie dopo un nuovo deploy.
- [ ] **Icone del manifest**: è dichiarata solo `favicon.ico`. Per l'installabilità su Chrome/Android servono icone PNG 192×192 e 512×512 (e idealmente una *maskable*).

---

## Struttura del progetto

```
app/            Route (layout, login, hub, auction, admin) e risorse (icon, apple-icon)
components/     Componenti di pagina; alcune cartelle riesportano da src/components
src/components/ Cockpit d'asta, hub, campo 2D, impostazioni, UI condivisa
src/lib/        advisor/ (motore), auth/, ingestion/, storage/, export/, mock/ (dataset)
lib/, hooks/    Tipi condivisi, engine base, hook useFanta
providers/      ThemeProvider
public/         manifest.json, sw.js, icone
```

Alias TypeScript: `@/*` → radice del progetto. Il codice è distribuito tra la radice e `src/` e le due parti si importano a vicenda: non rimuovere `src/`.

### Dataset

L'app non legge file a runtime: usa il dataset già generato in `src/lib/mock/realDataset2026.ts` (515 calciatori con quotazioni, titolarità, rigoristi, infortuni e calendario Serie A). Lo script di rigenerazione è `src/lib/ingestion/mergeStatusData.ts` (`npx tsx src/lib/ingestion/mergeStatusData.ts`) e richiede i file sorgente in `.footballData/` (`calciatori.xlsx`, `statusData.json`, `calendario.json`), che **non sono inclusi nel repository**.

### Test e benchmark del motore

```bash
npx tsx src/lib/advisor/testBench.ts           # benchmark del calcolo
npx tsx src/lib/advisor/simulateFullAuction.ts # simulazione di un'asta completa a 8 squadre
```

---

## Note

Next.js 16 introduce cambiamenti rispetto alle versioni precedenti: prima di modificare il codice consulta la documentazione in `node_modules/next/dist/docs/`.
