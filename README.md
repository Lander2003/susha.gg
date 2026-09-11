# susha.gg

![CI Status](https://github.com/Lander2003/susha.gg/actions/workflows/ci.yml/badge.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=flat&logo=zod&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

A full-stack League of Legends statistics platform built with React, TypeScript, Node.js, Express, Zod, and the Riot Games API.

[![Live Site](https://img.shields.io/badge/Live_Site-susha--gg.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://susha-gg.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend_API-susha--gg.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://susha-gg.onrender.com)

## Overview

susha.gg lets users search for a League of Legends player by Riot ID and region, view ranked Solo/Duo information, inspect recent match history, expand individual matches to see both teams, navigate to another participant's profile, and browse regional Challenger leaderboards.

The frontend and backend are deployed separately. The browser communicates only with the Express API, while the backend owns the Riot API key, calls Riot services, validates upstream data, simplifies match payloads, and returns stable application-specific response shapes.

The application is public and read-only. It does not currently have user accounts, authentication, or a database.

## Features

- Search players by Riot ID and region
- Display ranked Solo/Duo tier, division, LP, wins, losses, games, and win rate
- View paginated recent match history with champion, queue, role, KDA, CS, and duration
- Distinguish victories and defeats with restrained result styling
- Expand a match to inspect both teams and participant statistics
- Search for another player directly from an expanded match
- Browse paginated regional Challenger leaderboards with resolved Riot IDs
- Open a player's full profile directly from the leaderboard
- Cache leaderboard, player-identity, and match-detail responses in memory
- Validate client input, API queries, Riot payloads, and frontend API responses
- Handle Riot not-found, authentication, rate-limit, network, and malformed-payload failures separately
- Protect the backend with CORS, Helmet, request limits, and route-specific rate limiting
- Responsive layouts for desktop, tablet, and mobile

## Frontend Design

The interface preserves the original susha.gg identity: black navigation and footer surfaces, electric-blue accents, serif display headings, sans-serif data typography, and subtle green/red match-result indicators.

The current UI includes:

- An intentional, centered pre-search state
- A compact search experience that becomes less prominent after results load
- A dedicated player and ranked profile card
- Information-dense match rows with larger champion imagery
- Structured two-team match details
- Responsive navigation, search controls, result cards, tables, and About page
- Accessible labels, visible keyboard focus states, and semantic controls

## Tech Stack

### Frontend

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- Zod 4
- CSS
- Vercel

### Backend

- Node.js 22
- Express 5
- TypeScript 6
- Zod 4
- Riot Games API
- Helmet
- CORS
- Express Rate Limit
- In-memory caching
- Render

### Testing and CI

- Node.js test runner for backend schema tests
- Playwright configuration for end-to-end browser tests
- ESLint for frontend static analysis
- GitHub Actions with parallel frontend and backend jobs on non-draft pull requests to `main`

## Architecture

```text
React + Vite frontend (Vercel)
              |
              | HTTPS / JSON
              v
Express API (Render)
  |           |            |
  |           |            +-- In-memory stats and identity cache
  |           +--------------- Zod query and payload validation
  +--------------------------- Riot Account, League, and Match APIs
```

The frontend uses `VITE_API_URL` as the backend base URL. All requests go through a shared client that parses JSON, preserves API error messages, and validates successful responses with route-specific Zod schemas before the data enters React state.

The backend treats Riot responses as unknown data and validates them before transforming them. The Riot API key is stored only in the backend environment and is never sent to the browser.

## Riot APIs Used

- Riot Account API for Riot ID lookup
- League API for ranked Solo/Duo entries and Challenger leaderboards
- Match API for match IDs and match details
- Data Dragon and CommunityDragon assets for champion and ranked-emblem imagery

## API Routes

### `GET /getPlayer`

Fetches the Riot account, ranked Solo/Duo entry, five recent simplified matches, and pagination metadata.

```text
/getPlayer?gameid=Name%23Tag&region=EUW
```

The response contains:

- `puuid`, `gameName`, `gameTag`, and `region`
- Nullable `rankedSolo` data
- `simplifiedMatches`
- `pagination`

### `GET /getMatches`

Fetches the next page of simplified match history. This route intentionally returns a partial match-history response rather than a full player profile.

```text
/getMatches?puuid=PLAYER_PUUID&region=EUW&start=5&count=5
```

The response contains only:

- `simplifiedMatches`
- `pagination`

`count` defaults to `5` and is limited to `10`.

### `GET /leaderboard`

Fetches a paginated regional Challenger Solo/Duo leaderboard.

```text
/leaderboard?region=EUW&start=0&count=25
```

`count` defaults to `25` and is limited to `50`.

The backend resolves Riot IDs only for the requested page, caches successful
PUUID-to-Riot-ID lookups for seven days, and returns nullable `gameName` and
`gameTag` fields. A failed identity lookup does not discard the player's
leaderboard statistics.

### Supported regions

The API supports `NA`, `BR`, `OCE`, `EUNE`, `EUW`, and `KR`. Region values are normalized to uppercase and mapped to the appropriate Riot platform and routing clusters by the backend.

## Validation and Error Handling

Zod provides runtime validation at both application boundaries:

- Backend query schemas validate Riot IDs, regions, identifiers, and pagination values.
- Backend Riot schemas validate account, ranked, match-list, match-detail, and leaderboard payloads.
- Frontend response schemas validate player, match-pagination, leaderboard, and error responses.
- Frontend TypeScript types are inferred from the response schemas so runtime and compile-time contracts stay aligned.

The backend maps failures into meaningful HTTP responses:

| Status | Meaning |
| --- | --- |
| `400` | Invalid query parameters |
| `404` | Requested Riot resource was not found |
| `429` | Local or Riot rate limit was reached |
| `502` | Riot credentials, network, upstream response, or payload failed |
| `500` | Unexpected internal server error |

Riot requests use a 10-second timeout. When Riot supplies a `Retry-After` value for an upstream `429`, the backend forwards it to the client.

## Performance and Security

- Riot API key stored only in `RIOT_API_KEY` on the backend
- Backend refuses to start when the Riot API key is missing
- Riot ID path segments are URL-encoded before upstream requests
- CORS restricted to the local frontend and deployed Vercel origin
- Helmet security headers
- Global rate limit of 100 requests per minute
- Player lookup limit of 20 requests per 15 minutes
- Match-history limit of 40 requests per 15 minutes
- Leaderboard limit of 60 requests per 5 minutes
- JSON request bodies limited to 10 KB
- Generic internal error responses that avoid exposing stack traces or credentials
- Match details cached for 24 hours
- Leaderboard data cached for 5 minutes
- Successful leaderboard identity lookups cached for 7 days
- Cache limited to 500 entries with oldest-entry eviction

The cache is process-local and resets when the backend restarts. Multiple backend instances do not share cached data.

## Local Development

### Prerequisites

- Node.js 22 or a compatible recent Node.js version
- npm
- A Riot Games API key

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
RIOT_API_KEY=your_riot_api_key
PORT=3000
```

`PORT` is optional and defaults to `3000`.

Start the backend:

```bash
npm run dev
```

### Frontend setup

From the repository root:

```bash
cd susha-gg
npm install
```

Create `susha-gg/.env`:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

## Available Scripts

### Frontend (`susha-gg/`)

```bash
npm run dev      # Start the Vite development server
npm run lint     # Run ESLint
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build locally
```

### Backend (`backend/`)

```bash
npm run dev      # Start the API with TypeScript watch mode
npm run build    # Compile TypeScript to dist/
npm test         # Build and run backend schema tests
npm start        # Run the compiled production server
```

The root Playwright configuration contains browser tests for the primary search and leaderboard flows. These tests require the frontend and backend to be available and a working Riot API configuration.

## Production Configuration

### Backend

```env
RIOT_API_KEY=your_production_riot_api_key
PORT=provided_by_the_host
```

### Frontend

```env
VITE_API_URL=https://susha-gg.onrender.com
```

The frontend is deployed to Vercel with an SPA rewrite so React Router routes resolve to `index.html`. The compiled Express backend is deployed separately to Render.

## Project Structure

```text
susha.gg/
├── .github/workflows/ci.yml
├── backend/
│   ├── apiTypes.ts
│   ├── cache.ts
│   ├── errors.ts
│   ├── getLeaderboard.ts
│   ├── getSimplifiedMatches.ts
│   ├── schemas.ts
│   ├── schemas.test.ts
│   └── server.ts
├── susha-gg/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── contracts.ts
│   │   │   ├── getLeaderboard.ts
│   │   │   ├── getMatches.ts
│   │   │   └── searchPlayer.ts
│   │   ├── assets/
│   │   ├── components/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vercel.json
├── tests/
├── playwright.config.ts
└── README.md
```

## What I Learned

- Full-stack TypeScript development
- REST API and response-contract design
- Runtime validation with Zod
- Safely handling and transforming untrusted upstream data
- Riot API routing, platform mapping, rate limits, and error behavior
- Caching strategies for external API data
- React state management and client-side routing
- Responsive, information-dense UI design
- Accessible forms, navigation, and keyboard focus states
- Separate frontend/backend deployment workflows
- GitHub Actions with parallel jobs, npm caching, linting, and production builds

## Future Improvements

- Move shared response schemas into a package consumed by both frontend and backend
- Replace process-local caching with Redis or another shared persistent cache
- Add automated route-level tests for Riot error mapping and pagination
- Run backend tests and browser tests in CI
- Add structured logging, request IDs, and production monitoring
- Improve loading states with profile and match-row skeletons
- Add compact recent-form and aggregate match-summary statistics
- Add lightweight match-history filters
- Keep Data Dragon versions configurable or resolve them dynamically
- Add OpenAPI documentation for the public backend contract

## Author

Built by Luka Susha Mochevikj.

- [GitHub](https://github.com/Lander2003)
- [LinkedIn](https://www.linkedin.com/in/luka-susha)
