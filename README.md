# ⚽ Nations League Tracker

**Every group, every goal, every road to the final — live.**
A fast, no-login dashboard for the 2026/27 UEFA Nations League.

**Live site:** https://nl-tracker.vercel.app

## What it does

- **Live scores and standings.** Results update every 15–30 seconds; tables are calculated from results with
  head-to-head tie-breaking (not just goal difference).
- **Tree view.** One click turns any league into a bracket-style tree: groups → outcomes, and for League A all the
  way to the final.
- **Top scorers and assisters.** Top 5 per league, built from match reports.
- **Highlights, only where they play.** Free official YouTube highlights appear only when the video is actually
  playable in the visitor's country.
- **Promotion, relegation and rules** straight from UEFA's published format.
- **Honest data labels.** Live, cached, or offline is always shown; nothing is invented (no predicted pairings).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Deploys to Vercel with zero config.

## How it's built

| Piece | File |
|---|---|
| Groups, teams, fixtures, verified results | `lib/data.ts` |
| Standings and tie-breakers | `lib/standings.ts` |
| Live match provider (ESPN, per-day requests) | `lib/espn.ts` |
| Player stats | `lib/stats.ts` |
| Highlights discovery and country check | `lib/highlights.ts` |
| Tree view | `app/Tree.tsx` |

The provider layer is isolated, so swapping ESPN for another feed means editing one file.

## Known limits

- ESPN's feed is unofficial and can change without notice.
- Highlight availability depends on publishers' territory rules; many matches will have no playable video in your
  country.
- Group and rules data follow UEFA's published format; check uefa.com for official tables.

## Data and credits

Rules and dates: UEFA · Live data: ESPN · Highlights: official YouTube publishers. Not affiliated with UEFA.
