# Diet Mate

A personal nutrition tracking web app that syncs with Fatsecret and helps maintain healthy eating habits without a coach.

## What it does

- Pulls daily food diary from Fatsecret via OAuth 1.0
- Categorizes food items using GPT-4o-mini with local caching
- Tracks 7 nutrition parameters with progress bars
- Manual daily input for weight and steps
- Weekly report showing trends and goal hit rate

## Tracked parameters

| Parameter | Unit |
|---|---|
| Calories | kcal/day |
| Vegetables, fruits & greens | g/day |
| Avocado | g/day |
| Calcium | mg/day |
| Omega-3 | g/day |
| Eggs | pcs/day |
| Seafood | portions/day |

All targets are configurable in the Settings screen.

## Tech stack

- **Next.js** — frontend + API routes
- **Fatsecret API** — food diary (OAuth 1.0)
- **OpenAI GPT-4o-mini** — food categorization
- **USDA FoodData Central** — Omega-3 data
- **SQLite** (better-sqlite3) — local storage

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```
   FATSECRET_CLIENT_ID=your_client_id
   FATSECRET_CLIENT_SECRET=your_oauth2_client_secret
   FATSECRET_CONSUMER_SECRET=your_oauth1_consumer_secret
   OPENAI_API_KEY=your_openai_key
   USDA_API_KEY=your_usda_key        # optional, DEMO_KEY used if empty
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Authorize Fatsecret by opening:
   ```
   http://localhost:3000/api/auth/start
   ```

5. Open the app at [http://localhost:3000](http://localhost:3000)

## Notes

- Fatsecret food diary access requires OAuth 1.0 via `authentication.fatsecret.com`
- Food categories are cached in SQLite after the first classification — no repeated API calls
- The database file `diet-mate.db` is created automatically in the project root
