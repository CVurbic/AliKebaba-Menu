# AliKebaba Menu

Javni digitalni jelovnik za Ali Kebaba restorane. Prikazuje jelovnik po poslovnici, s podrškom za višejezičnost i prikaz radnog vremena.

Deployano na Netlify. Admin sučelje je u zasebnoj aplikaciji ([my-app](../my-app)).

---

## Tehnologije

- **React + TypeScript** (Vite)
- **Supabase** — čitanje podataka (read-only, anon key)
- **Tailwind CSS**
- **React Router v7**
- **lucide-react** — ikone

---

## Kako radi

### Routing

```
/              → prikazuje jelovnik za default poslovnicu ("dubrava")
/:branchSlug   → prikazuje jelovnik za specifičnu poslovnicu
```

`branchSlug` je slugified verzija naziva poslovnice:
`"Dubrava"` → `"dubrava"`, `"Langov trg"` → `"langov-trg"`

### Dohvat podataka (`Jelovnik.tsx`)

Svaki učitaj stranice radi 3 Supabase upita:

```
1. SELECT id, lokacija FROM lokacije WHERE active = true
   → pronađi poslovnicu po slug-u (ili uzmi prvu aktivnu kao fallback)

2. SELECT jelovnik_id, enabled, price_override, order_override
   FROM lokacija_jelovnik
   WHERE lokacija_id = <id> AND enabled = true
   → koji artikli su aktivni za tu poslovnicu + lokalni overrides

3. SELECT * FROM jelovnik WHERE id IN (<ids>)
   → dohvati detalje artikala
```

Nakon toga se primjenjuju overrides:
- `price_override` — lokalna cijena (ako nije null, zamjenjuje globalnu)
- `order_override` — lokalni redoslijed unutar kategorije

Artikli se sortiraju po `collection_order`, pa grupiraju u kategorije.

### Grupiranje u kategorije

`groupMenuItems()` u `Jelovnik.tsx` mapira `collection` polje iz baze na interni ključ:

| `collection` (baza) | Interni ključ |
|---|---|
| STEAK KEBAB | `steak` |
| CLASSIC KEBAB | `classic` |
| CHICKEN KEBAB | `chicken` |
| MIX KEBAB | `mix` |
| NUGGETS | `nuggets` |
| FALAFEL / MOZZARELLA | `vege` |
| PRILOZI | `prilozi` |
| NAPITCI | `napitci` |
| DESERT | `desert` |

Artikli koji ne odgovaraju ni jednom ključu **neće biti prikazani**.

### Komponente

```
Jelovnik.tsx              — root komponenta, fetching, state
  ├── HeroHeader          — hero slika, logo, language switcher
  ├── MenuAccordion       — grid kategorija + accordion (desktop/mobile)
  │     └── MenuSection   — lista artikala unutar kategorije
  └── Footer
        └── LocationsDisplayFooter — popis poslovnica + radno vrijeme
```

**`MenuAccordion`** ima dva layouta:
- **Desktop (md+):** grid kartica kategorija, klik otvara sadržaj ispod grida
- **Mobile:** accordion lista, klik otvara sadržaj inline

**`LocationsDisplayFooter`** dohvaća sve aktivne poslovnice i prikazuje:
- Kartica za svaku poslovnicu s adresom i statusom otvoreno/zatvoreno
- Radno vrijeme (desktop: uvijek vidljivo; mobile: accordion)
- Klik na poslovnicu navigira na `/:branchSlug` te poslovnice
- "Otvoreno/Zatvoreno" badge s dinamičkim odbrojavanjem (refresh svakih 60s)

### Višejezičnost

Podržana su 4 jezika: **HR** (default), **EN**, **DE**, **TR**.

- Odabir se sprema u `localStorage.preferredLanguage`
- Prijevodi su u `src/services/language.ts` (statički objekt)
- `useLanguage()` hook daje `t(key)`, `getProductTranslation()`, `formatItemsCount()`
- `getProductTranslation()` čita polja `product_name_en`, `description_de` itd. direktno iz Supabase retka

---

## Supabase shema

Projekt koristi **shared Supabase instancu** s my-app adminskom aplikacijom.

### Ključne tablice

**`lokacije`** — poslovnice
```
id          int (PK)
lokacija    text      — naziv poslovnice ("Dubrava", "Langov trg")
adresa      text
active      boolean   — samo active=true se prikazuje
radno_vrijeme jsonb   — { ponedjeljak: { otvaranje, zatvaranje }, ... }
```

**`jelovnik`** — globalni katalog artikala
```
id              int (PK)
product_name    text
product_name_en / _de / _tr   text (prijevodi)
description     text
description_en / _de / _tr    text
price           numeric
collection      text    — npr. "CLASSIC KEBAB S"
collection_order int
image           text    — URL slike
```

**`lokacija_jelovnik`** — pivot: koji artikli su dostupni gdje
```
id              int (PK)
lokacija_id     int (FK → lokacije)
jelovnik_id     int (FK → jelovnik)
enabled         boolean        — je li artikl dostupan u toj poslovnici
price_override  numeric|null   — lokalna cijena (null = koristi globalnu)
order_override  int|null       — lokalni redoslijed (null = koristi globalni)
```

---

## Lokalni razvoj

```bash
npm install
npm run dev
```

Supabase credentials su u `src/supabaseClient.ts` (anon/public key, read-only).

```bash
npm run build    # produkcijski build
npm run preview  # lokalni preview builda
```

---

## Deployment

Automatski deploy na Netlify pri pushu na `master` granu.
Config: `netlify.toml` (SPA redirect `/* → /index.html`).
