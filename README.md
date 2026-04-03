# Podcasten om Odense Bulldogs

Astro + TypeScript website til podcasten med dansk forside, automatisk hentning af seneste episode fra Buzzsprout RSS og daglig deployment til GitHub Pages.

## Lokal udvikling

```bash
npm install
npm run dev
```

## RSS-kilde

Sitet bruger som standard:

- `https://feeds.buzzsprout.com/2388927.rss`

Du kan overskrive feedet med miljøvariablen `PODCAST_RSS_URL`.

## Build

```bash
npm run build
```

## GitHub Pages deployment

Workflow ligger i:

- `.github/workflows/deploy-pages.yml`

Det kører ved:

- push til `main`
- daglig cron (`05:17 UTC`)
- manuel kørsel (`workflow_dispatch`)

Sitet henter RSS-data ved build, så daglig workflow-kørsel opdaterer automatisk forsideindhold med nye episoder.

## Custom domain

GitHub Pages understøtter custom domain.

For at aktivere:

1. Opret filen `public/CNAME` med dit domæne (fx `podcast.ditdomæne.dk`).
2. Konfigurer DNS hos din domæneudbyder til GitHub Pages.
3. Aktivér custom domain i repoets Pages-indstillinger.

## Abonnér-links

Forsiden viser links til:

- Spotify
- Apple Podcasts
- Pocket Casts
- Overcast
- Google Podcasts
- Amazon Music
- RSS feed

Bemærk: `Google Podcasts` er udfaset globalt, men linket er beholdt som ønsket.
