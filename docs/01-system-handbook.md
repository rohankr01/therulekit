# TheRuleKit / ecai-ai System Handbook

This handbook is based only on the current codebase in `D:\ecai-ai`.

## 1. Project Overview

### Project Name

The repository/package name is `ecai-ai`. The user-facing product name shown across the UI is `TheRuleKit`. The root layout metadata also uses `Electrical Code AI | ECAI`.

### Goal

The project is a web application that lets authenticated users ask California electrical code questions and receive AI-generated answers with source citations from local code-section data stored in Supabase.

### Real-World Problem Solved

Electricians, inspectors, and code users often need quick answers to practical electrical code questions. Manually searching long code documents is slow. This app creates a chat interface where the user asks a natural-language question, the backend retrieves relevant stored code sections, and an AI model writes an answer using those sections.

### Target Users

The codebase directly supports:

- Authenticated beta users.
- People asking California electrical code questions.
- Users who want saved chat history.
- Users who need jurisdiction-filtered answers.

The UI copy targets electricians. The code does not implement organization accounts, admin dashboards, paid plans, or role-specific user types.

### Why This Project Exists

The codebase exists to combine:

- A mobile-friendly chat UI.
- Supabase authentication and persistent chat history.
- Supabase/Postgres retrieval over stored electrical code sections.
- OpenAI embeddings for semantic search.
- Anthropic Claude for final answer generation.
- Usage limits for beta access.

### Architecture Choice

The chosen architecture is a Next.js App Router application with server API routes. This fits the current implementation because:

- The UI and backend live in one repo.
- API routes can safely call Supabase and AI providers from the server.
- Supabase SSR helpers allow cookie-based authentication.
- Supabase stores users, chats, messages, usage counts, and code-section vectors.
- Retrieval and generation are separated into `lib/vector-search.ts`, `lib/embedding.ts`, and `lib/ai-generate.ts`.

### Why It Is Better Than Manual Workflow

Based on the implementation, the app improves on manual lookup by:

- Accepting natural-language questions.
- Retrieving relevant source sections automatically.
- Producing a concise answer.
- Showing cited sections.
- Saving prior conversations.
- Tracking beta usage so abuse is limited.

It does not eliminate the need to verify official code books. The UI, terms, privacy policy, and prompt all state or imply verification with official sources/local inspectors.

### Business Value

Implemented business value:

- A working beta product for electrical code Q&A.
- Authenticated user accounts.
- Limited beta quota of `25` counted questions per user.
- Saved chat history.
- A source-citation trust layer.
- Practical field-intelligence support when stored section metadata contains it.

Not Implemented Yet:

- Payment/subscription billing.
- Admin analytics dashboard.
- Self-serve account deletion.
- Team/company workspaces.
- A public documented API for third-party use.

### Future Roadmap From Code Gaps

The roadmap that follows naturally from current code gaps:

- Add first-party SQL migration files for schema, indexes, RLS, and RPC functions.
- Mount or remove `components/supabase-listener.tsx`; it exists but is not currently used by `Providers`.
- Add delete-account UI; legal pages mention it as future.
- Improve saved citation completeness; `/api/chat` saves a reduced citation object, while live answers can contain full content.
- Add tests for API routes, retrieval, auth, and UI behavior.
- Add deployment documentation for Vercel/Supabase environment setup.

## 2. Complete Folder Structure

```text
D:\ecai-ai
|-- app/
|   |-- api/
|   |   |-- auth/me/route.ts
|   |   |-- chat/route.ts
|   |   |-- chats/route.ts
|   |   |-- chats/[id]/route.ts
|   |   `-- usage/route.ts
|   |-- auth/callback/route.ts
|   |-- privacy/page.tsx
|   |-- terms/page.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|-- data/code-sections/
|-- hooks/
|-- lib/
|-- scripts/
|-- types/
|-- middleware.ts
|-- package.json
|-- tailwind.config.js
|-- next.config.js
|-- tsconfig.json
`-- docs/
```

### `app/`

Purpose: Next.js App Router source.

Why it exists: It defines pages, layout, styles, auth callback, and server API routes.

Files:

- `layout.tsx`: Root HTML, Inter font, metadata, viewport, `Providers`.
- `page.tsx`: Main landing/chat page.
- `globals.css`: Tailwind and global CSS.
- `privacy/page.tsx`: Static privacy page.
- `terms/page.tsx`: Static terms page.
- `auth/callback/route.ts`: Supabase OAuth callback handler.
- `api/auth/me/route.ts`: Current-user auth check.
- `api/chat/route.ts`: Main question-answer route.
- `api/chats/route.ts`: Chat list route.
- `api/chats/[id]/route.ts`: Chat detail/update/delete route.
- `api/usage/route.ts`: Usage quota route.

Execution flow: `layout.tsx` wraps `page.tsx` in providers. Client actions call `app/api/*` routes. API routes call `lib/*` utilities and Supabase.

### `components/`

Purpose: Client UI components.

Why it exists: Separates display and interaction pieces from the main page.

Files:

- `answer-display.tsx`
- `auth-modal.tsx`
- `chat-input.tsx`
- `chat-message.tsx`
- `example-questions.tsx`
- `header.tsx`
- `jurisdiction-selector.tsx`
- `providers.tsx`
- `sidebar.tsx`
- `supabase-listener.tsx`
- `usage-meter.tsx`

Interaction: Used mainly by `app/page.tsx`; `providers.tsx` is used by `app/layout.tsx`.

### `hooks/`

Purpose: Client state and side effects.

Files:

- `use-auth.tsx`: Auth context.
- `use-chat.ts`: Current conversation behavior.
- `use-chat-history.ts`: SWR chat-history helper.

Interaction: `page.tsx`, `sidebar.tsx`, and `auth-modal.tsx` use these hooks.

### `lib/`

Purpose: Shared backend/client utilities.

Files:

- `ai-generate.ts`: Anthropic answer generation.
- `auth.ts`: Auth helper functions. Present but current API routes do not import it.
- `embedding.ts`: OpenAI embeddings.
- `env-loader.ts`: Script-only `.env.local` loader.
- `logger.ts`: Sanitized logger.
- `rate-limit.ts`: In-memory rate limiter.
- `supabase.ts`: Browser and SSR Supabase clients.
- `supabase-admin.ts`: Service-role admin client.
- `usage-limits.ts`: Beta quota logic.
- `vector-search.ts`: Retrieval and ranking.

Interaction: API routes call these files. Scripts call admin, embedding, logger, and env-loader.

### `scripts/`

Purpose: Standalone command-line scripts.

Files:

- `setup-vector-db.ts`: Reads text files, chunks, embeds, and inserts `code_sections`.
- `test-questions.ts`: Runs sample RAG quality checks.

Execution flow: Run through npm scripts such as `npm run setup-vector-db`.

### `types/`

Purpose: TypeScript source of truth for app-level data structures.

File:

- `index.ts`: Database type shapes, app interfaces, constants, type guards, date helper.

### `data/code-sections/`

Purpose: Local text source files for ingestion.

Current codebase contains 16 `.txt` files. Two are 4 bytes long:

- `cross-reference-gfci-LA.txt`
- `cross-reference-kitchen-circuits-LA.txt`

That means those two source files are effectively empty or placeholder-like from file size alone.

### Root Files

- `middleware.ts`: Body size guard, CSRF guard, protected-page auth check, Supabase cookie preservation.
- `package.json`: Scripts, dependencies, metadata.
- `tailwind.config.js`, `postcss.config.js`: Styling toolchain.
- `next.config.js`: Next.js config.
- `tsconfig.json`: TypeScript config and path aliases.
- `.env.local`: Environment variables. Present locally, but secrets are not documented here.

## 3. Important Files

### `app/page.tsx`

Purpose: Main page and top-level UI coordinator.

Why it exists: It decides whether to show anonymous landing page or authenticated chat app.

Calls:

- `useAuth()`
- `useChat()`
- `/api/usage` through `fetchUsage`
- UI components: `Sidebar`, `Header`, `ChatInput`, `ChatMessage`, `ExampleQuestions`, `AuthModal`, `UsageMeter`

Important state:

- `showAuthModal`
- `showMobileSidebar`
- `usageData`
- `selectedJurisdiction`

Important refs:

- `messagesEndRef`: Scrolls to bottom.
- `usageFetchedRef`: Avoids repeated initial usage fetch.
- `lastMessageCountRef`: Detects new assistant message and refreshes usage.

Important logic:

- Anonymous users see `PremiumLandingPage`.
- Authenticated users see the chat layout.
- `handleSendMessage` blocks unauthenticated users and users with no remaining beta quota.
- Usage data refreshes on login and after assistant responses.

Error handling:

- `/api/usage` failures reset usage display to default beta limit.
- Load chat failures show toast.

Security:

- Client-side auth gating is UX only. Server API routes still authenticate.

Interview explanation:

> `app/page.tsx` is the orchestration layer for the frontend. It reads auth state, manages the selected jurisdiction and usage display, and delegates real chat behavior to `useChat`.

Common interview questions:

- Why is auth checked both on client and server?
- What happens if `/api/usage` fails?
- Why store selected jurisdiction in React state?

### `app/layout.tsx`

Purpose: Root layout.

Calls:

- Imports `globals.css`
- Loads Inter font
- Wraps children in `Providers`

Important metadata:

- Title: `Electrical Code AI | ECAI`
- Description: instant verifiable California Electrical Code answers.

### `components/providers.tsx`

Purpose: Client provider wrapper.

Calls:

- `AuthProvider`
- `Toaster`

Important nuance:

- It comments about an auth sync listener, but does not render `SupabaseAuthSync`. Therefore `components/supabase-listener.tsx` is Not Implemented Yet as an active runtime feature.

### `hooks/use-auth.tsx`

Purpose: Client auth context.

Calls:

- `getBrowserClient()` from `lib/supabase.ts`
- `supabase.auth.getUser()`
- `supabase.auth.onAuthStateChange()`

State:

- `user`
- `loading`

Important module variables:

- `redirecting`
- `authProviderMountCount`

Important logic:

- Creates one memoized browser Supabase client.
- On mount, calls `getUser()` to validate current session.
- Subscribes to auth events and updates `user`.
- On `SIGNED_OUT`, redirects to `/` if needed.

Security:

- Uses `getUser()` instead of trusting only local session.
- Does not sync with `/api/auth/me` on every auth event; comments say this was intentionally removed.

### `components/auth-modal.tsx`

Purpose: Email/password login and signup modal.

Calls:

- `supabase.auth.signInWithPassword`
- `supabase.auth.signUp`
- `/api/auth/me`

State:

- `isLogin`, `email`, `password`
- `agreedToTerms`
- `loading`, `error`
- cooldown state for security throttling
- request lock refs to block duplicate submissions

Important logic:

- Signup requires terms checkbox.
- Signup uses `emailRedirectTo: window.location.origin + '/auth/callback'`.
- After login/signup with session, it calls `/api/auth/me` up to 3 times to sync/validate cookies.
- If signup returns no session, it tells user to check email.

Security:

- Prevents duplicate submissions.
- Masks email in debug logs.
- Password minimum length is 6 in the HTML input.

Not Implemented Yet:

- OAuth provider buttons are not present in this modal, although `auth/callback` supports OAuth callback handling.

### `middleware.ts`

Purpose: Global request middleware.

Important constants:

- `PUBLIC_API = ['/api/auth', '/api/public', '/api/health']`
- `PUBLIC_PAGES = ['/', '/terms', '/privacy', '/error']`
- `PROTECTED_PAGES = ['/dashboard', '/chat', '/profile']`
- `MAX_PAYLOAD = 900000`

Flow:

```text
Request
  |
  +-- OPTIONS? allow
  |
  +-- POST /api with content-length > 900KB? 413
  |
  +-- create NextResponse.next()
  |
  +-- create Supabase SSR client with req/res
  |
  +-- protected page? supabase.auth.getUser()
  |
  +-- api route?
        |
        +-- public API? allow
        +-- modifying method? origin must include host
        +-- allow
```

Security:

- Basic payload size check.
- Basic same-origin check for mutating API requests.
- Protected UI route redirect.
- Supabase cookie preservation on redirects.

Important limitation:

- `/api/chat`, `/api/chats`, and `/api/usage` are not blocked by middleware auth, but each route performs its own auth check.

### `lib/supabase.ts`

Purpose: Supabase client factory.

Exports:

- `getBrowserClient()`
- `createServerClient({ req, res })`
- `headersWithSupabaseCookies(res, init?)`
- Types `SupabaseClient`, `ServerClient`

Important logic:

- Browser client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server client uses `@supabase/ssr` and custom cookie get/set/remove handlers.
- Cookie setter sets `sameSite: 'lax'`, `secure` in production, `path: '/'`, and `httpOnly` defaults to false unless provided.

Security:

- Uses anon key for browser/server auth client.
- Does not expose service-role key.

### `lib/supabase-admin.ts`

Purpose: Service-role Supabase client for scripts/backend operations.

Exports:

- `getAdminClient()`
- `createAdminClient()`
- `testAdminConnection()`

Environment:

- `SUPABASE_URL` or fallback `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Security:

- Throws if called in browser.
- Disables persisted auth sessions.
- Comments clearly warn that it bypasses RLS.

### `app/api/chat/route.ts`

Purpose: Main backend route for asking questions.

Method:

- `POST /api/chat`

Input schema:

- `question`: string, 1 to 500 chars.
- `chatId`: optional UUID/null.
- `jurisdiction`: optional supported jurisdiction.
- `codeYear`: optional supported code year.
- `compareYears`: optional boolean.

Execution flow:

```text
POST /api/chat
  |
  +-- IP rate limit: 10/min
  +-- create Supabase SSR client
  +-- supabase.auth.getUser()
  +-- checkUsageLimit(user.id)
  +-- zod validate body
  +-- create new chat OR verify existing chat belongs to user
  +-- build searchOptions
  +-- getRelevantSectionsWithQuality()
  +-- generateAnswer()
  +-- save user message
  +-- save assistant message
  +-- increment usage only if sections found and confidence not low
  +-- return answer, citations, quality, chat id
```

Database operations:

- `chats.insert`
- `chats.select`
- `messages.insert` twice
- `messages.select(... count ...)`
- usage logic uses `user_usage` and RPC indirectly.

AI calls:

- OpenAI indirectly through `getRelevantSectionsWithQuality`.
- Anthropic indirectly through `generateAnswer`.

Error handling:

- Rate limit: 429.
- Auth error/no user: 401.
- Zod validation: 400.
- Missing/denied chat: 403.
- Search failure: saves fallback assistant message and returns 200 with `usageCounted: false`.
- AI failure: saves fallback assistant message and returns 200 with `usageCounted: false`.
- Message save failure: 500 database error.

Security:

- Auth required.
- Existing chat is verified by `id` and `user_id`.
- Request body validated with Zod.
- Rate limited.

### `lib/vector-search.ts`

Purpose: Retrieval layer for RAG.

Exports:

- `getRelevantSections()`
- `getRelevantSectionsWithQuality()`
- `getHybridRelevantSections()`
- `clearSearchCache()`
- `getSearchCacheStats()`

Important internal functions:

- `normalizeJurisdictionBeforeQuery`
- `expandQuery`
- `extractKeyTerms`
- `calculateLexicalScore`
- `calculateMetadataScore`
- `rerankSections`
- `validateEmbedding`
- `validateRelevance`
- `determineConfidenceLevel`
- `smartTextSearch`
- `vectorSearchWithQuality`
- `convertToCodeSection`
- `extractFieldIntelligence`

Important config:

- Default vector threshold: `0.72`
- Fallback threshold: `0.65`
- Minimum threshold: `0.55`
- Embedding dimension expected: `3072`
- Search cache max size: `500`
- Cache TTL: `5 minutes`, medium-confidence TTL: `2.5 minutes`

Search flow:

```text
Question
  |
  +-- validate non-empty and <= 1000 chars
  +-- normalize jurisdiction
  +-- build date filter
  +-- cache lookup
  +-- expand query into up to 3 variations
  +-- for each variation:
        |
        +-- generate OpenAI embedding
        +-- validate embedding dimension/magnitude
        +-- RPC match_code_sections
        +-- rerank semantic + lexical + metadata
        +-- validate relevance
  |
  +-- if no useful results: lower threshold fallback
  +-- if still none and jurisdiction != California State: California State fallback
  +-- if still none: smart text search
  +-- return sections + quality object
```

Supabase request:

- RPC: `match_code_sections`
- Args: `query_embedding`, `match_threshold`, `match_count`, `p_jurisdiction`, `p_as_of_date`

Text-search fallback:

- Queries `code_sections` by exact jurisdiction.
- Applies date constraints if provided.
- Loads up to `EMERGENCY_SEARCH_LIMIT = 200`.
- Scores rows in application memory by term matches.

Limitations:

- Actual SQL implementation of `match_code_sections` is not in the repo.
- Exact vector index type cannot be determined from current codebase.

### `lib/embedding.ts`

Purpose: Create OpenAI embeddings.

Exports:

- `generateEmbedding(text)`
- `getEmbeddingStatus()`
- `resetRateLimiter()`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`

AI provider:

- OpenAI SDK.

Default model:

- `text-embedding-3-large`

Dimensions:

- `3072` by default.

Important logic:

- Loads `.env.local` with `readEnv()`.
- Throws at import time if `OPENAI_API_KEY` is missing.
- Cleans text by replacing newlines and trimming.
- Returns zero vector for empty/whitespace text.
- Rate limits embedding calls with an in-memory token bucket.
- Validates embedding length, magnitude, finite numbers, and not all zero.

Error handling:

- Maps rate limit, quota, invalid API key, and invalid request errors into user-friendly errors.

### `lib/ai-generate.ts`

Purpose: Generate final answer from retrieved sections.

AI provider:

- Anthropic Messages API via `fetch('https://api.anthropic.com/v1/messages')`.

Important correction:

- This project does not use OpenAI for final answer generation. It uses Anthropic Claude for final answers and OpenAI for embeddings.

Default model in code:

- `claude-3-haiku-20240307`

Important config:

- Temperature: `0.0`
- Max tokens: `2048`
- Timeout: `30000ms`
- Retries: `3`
- Answer cache max size: `200`
- Answer cache TTL: `5 minutes`

Important functions/classes:

- `SafeCache`
- `sanitizeInput`
- `validateInput`
- `safeJsonParse`
- `withTimeout`
- `withRetry`
- `extractFieldIntelligence`
- `detectPrimarySourceType`
- `generateAIAnswer`
- `generateAnswer`

Prompt behavior:

- Instructs Claude to answer only from provided sections.
- Requires JSON output.
- Distinguishes official/raw code sections from enhanced guides.
- Caps enhanced-guide confidence conceptually by prompt.
- Adds verification language for enhanced/mixed sources.

Error handling:

- No sections: returns low-confidence fallback.
- Invalid user input: returns warning answer.
- Invalid AI JSON: returns fallback with retrieved section excerpts.
- AI API failure: returns retrieved sections for manual review.

Security:

- Sanitizes user question.
- Blocks basic prompt-injection phrases like “ignore instructions” and “system prompt”.
- Does not send user email/user id to Anthropic from this file.

### `scripts/setup-vector-db.ts`

Purpose: Ingest local `.txt` data into Supabase `code_sections`.

Calls:

- `readEnv()`
- `getAdminClient()`
- `generateEmbedding()`
- `SecureLogger`
- filesystem APIs

Important config:

- `CODE_SECTIONS_DIR`
- `PARALLEL_EMBEDDINGS`
- `PARALLEL_FILES`
- `INSERT_CHUNK_SIZE`
- `MAX_RETRIES`
- `ENABLE_CHUNKING`
- `TARGET_CHUNK_SIZE = 600`
- `CHUNK_OVERLAP = 100`
- `MIN_CHUNK_SIZE = 200`
- `ENABLE_CONTEXTUAL_HEADERS`
- `ENABLE_KEYWORD_ENRICHMENT`
- `EMBEDDING_MODEL`
- `EMBEDDING_VERSION`
- `ALLOW_DELETE_ALL`
- `DRY_RUN`
- `ENABLE_BACKUP`
- `ENABLE_INGESTION_LOG`

Implemented ingestion stages:

```text
setup-vector-db.ts
  |
  +-- load env
  +-- validate required env vars
  +-- create admin Supabase client
  +-- optional ingestion log start
  +-- optional backup and delete existing data
  +-- read data/code-sections/*.txt
  +-- parse sections from files
  +-- semantic chunking
  +-- contextual header / keyword enrichment if enabled
  +-- OpenAI embedding per chunk
  +-- insert chunks into code_sections
  +-- report metrics
  +-- optional ingestion log complete/failed
```

Database operations:

- Selects from `code_sections`.
- Optionally deletes from `code_sections`.
- Inserts into `code_sections`.
- Optionally inserts/updates `ingestion_runs`.

Important limitation:

- `ingestion_runs` is used by the script, but it is not defined in `types/index.ts`. Its table schema cannot be determined from the current codebase.

### `types/index.ts`

Purpose: Type definitions.

Database tables represented:

- `profiles`
- `code_sections`
- `chats`
- `messages`
- `user_usage`

Database functions represented:

- `match_code_sections`
- `increment_user_usage`

Constants:

- `DEFAULT_JURISDICTION = 'Los Angeles County, CA'`
- `DEFAULT_CODE_YEAR = 2023`
- `SUPPORTED_CODE_YEARS = [2026]`
- `SUPPORTED_JURISDICTIONS = ['California State', 'Los Angeles County, CA', 'San Francisco, CA', 'San Diego County, CA', 'Orange County, CA', 'All California']`

Important mismatch:

- Current/default code year is 2023, but selectable supported code years only include 2026. The UI presents “Current (2023)” plus `2026`.

### `components/answer-display.tsx`

Purpose: Render AI answer, citations, action items, inspector tips, and enhanced metadata.

Hooks:

- `useState` for expanded citation and copied state.
- `useCallback` for copy/toggle handlers.

Security:

- Uses DOMPurify to sanitize generated HTML before `dangerouslySetInnerHTML`.

Performance:

- Memoizes small subcomponents with `memo`.

Important limitation:

- Citation rendering expects fields like `content`, `source_type`, and `enhanced_metadata`, but `/api/chat` saves only reduced citation fields into `messages.sources`. Therefore historical loaded answers may display less citation detail than fresh live answers.

### `components/sidebar.tsx`

Purpose: Desktop/mobile sidebar with recent chats and logout.

Calls:

- `/api/chats`
- Supabase realtime channel on `public.chats`
- `supabase.auth.signOut()`

State:

- `chats`
- `loadingChats`
- `error`

Realtime:

- Listens for `INSERT`, `UPDATE`, `DELETE` on `chats` filtered by `user_id`.

### `hooks/use-chat.ts`

Purpose: Client chat state machine.

State:

- `messages`
- `isLoading`
- `cooldownUntil`
- `now`
- `currentChatId`

Refs:

- `abortControllerRef`

Calls:

- `GET /api/chats/:id` to verify/load chat.
- `POST /api/chat` to ask question.
- `mutate('/api/chats')` to refresh SWR cache after new chat.

Important logic:

- Persists `currentChatId` in `localStorage`.
- Aborts previous request when starting a new one.
- Adds user message immediately.
- Adds temporary assistant “researching” message.
- Replaces temporary message with final answer.
- Handles 429 by setting cooldown.

## 4. Complete User-To-Answer Execution Flow

```text
User opens website
  |
  v
app/layout.tsx
  |
  +-- loads globals.css
  +-- wraps app in Providers
  |
  v
Providers
  |
  +-- AuthProvider creates Supabase browser client
  +-- Toaster is mounted
  |
  v
AuthProvider
  |
  +-- supabase.auth.getUser()
  +-- subscribes to auth state changes
  |
  v
app/page.tsx
  |
  +-- if no user: render PremiumLandingPage + AuthModal when opened
  +-- if user: render chat application
```

When authenticated user sends a question:

```text
ChatInput.handleSubmit()
  |
  +-- builds options: codeYear or compareYears
  +-- calls Home.handleSendMessage()
  |
  v
Home.handleSendMessage()
  |
  +-- blocks if no user
  +-- blocks if beta usage exhausted
  +-- calls useChat.sendMessage(question, options)
  |
  v
useChat.sendMessage()
  |
  +-- verifies currentChatId if present
  +-- creates AbortController with 60s timeout
  +-- appends user message
  +-- appends temporary assistant message
  +-- fetch POST /api/chat with cookies
```

Backend:

```text
/api/chat POST
  |
  +-- rateLimit.check(10, clientIP)
  +-- createServerClient({ req, res })
  +-- supabase.auth.getUser()
  +-- checkUsageLimit(user.id)
  +-- zod parse request
  +-- create/verify chat row
  +-- getRelevantSectionsWithQuality()
  +-- generateAnswer()
  +-- insert user message
  +-- insert assistant message
  +-- maybe incrementUsage()
  +-- return JSON response
```

Retrieval:

```text
getRelevantSectionsWithQuality()
  |
  +-- normalize jurisdiction
  +-- build date filter
  +-- cache lookup
  +-- expandQuery()
  +-- generateEmbedding() using OpenAI
  +-- validate embedding
  +-- Supabase RPC match_code_sections()
  +-- rerankSections()
  +-- validateRelevance()
  +-- fallback if needed
```

Generation:

```text
generateAnswer()
  |
  +-- sanitize and validate question
  +-- answer cache lookup
  +-- generateAIAnswer()
        |
        +-- source type detection
        +-- prepare context from retrieved sections
        +-- fetch Anthropic Messages API
        +-- parse JSON
        +-- return GeneratedAnswer
```

Frontend receives response:

```text
useChat.sendMessage()
  |
  +-- parse JSON
  +-- update cooldown if 429
  +-- set currentChatId if new
  +-- replace temporary assistant message
  +-- toast success/error
  |
  v
ChatMessage
  |
  +-- AnswerDisplay
        |
        +-- sanitize answer HTML
        +-- render action items
        +-- render inspector tips
        +-- render expandable citations
```

## 5. Authentication Flow

### Signup

```text
AuthModal signup
  |
  +-- requires email/password
  +-- requires terms checkbox
  +-- supabase.auth.signUp({ email, password, emailRedirectTo: /auth/callback })
  |
  +-- if no session:
        user must check email
  |
  +-- if session:
        syncSessionWithServer() -> /api/auth/me
```

### Login

```text
AuthModal login
  |
  +-- supabase.auth.signInWithPassword({ email, password })
  +-- syncSessionWithServer()
  +-- onSuccess()
```

### Logout

```text
Sidebar.handleLogout()
  |
  +-- supabase.auth.signOut()
  +-- clear local chat list
  +-- AuthProvider sees SIGNED_OUT
  +-- redirects to /
```

### Session

Implemented with Supabase Auth and `@supabase/ssr` cookie handling.

Client:

- `AuthProvider` calls `supabase.auth.getUser()`.
- Auth modal uses Supabase auth methods.

Server:

- API routes call `supabase.auth.getUser()` using `createServerClient`.

### Cookies

`lib/supabase.ts` defines cookie handlers for SSR:

- Reads from `NextRequest.cookies` or raw cookie header.
- Writes cookies to `NextResponse`.
- Deletes cookies through response cookies.

### JWT

Supabase Auth internally uses JWT/session tokens, but the app code does not manually decode JWTs. JWT structure and refresh-token behavior are managed by Supabase libraries. Exact token lifetime cannot be determined from the current codebase.

### Middleware

Middleware protects configured UI paths:

- `/dashboard`
- `/chat`
- `/profile`

These pages are not present in the current `app/` directory. The actual main chat UI is `/`, which is public and client-gated by auth.

### API Protection

API routes protect themselves:

- `/api/chat`: auth required.
- `/api/chats`: auth required.
- `/api/chats/[id]`: auth required.
- `/api/usage`: auth required.
- `/api/auth/me`: returns user/null.

## 6. Complete RAG Pipeline

RAG means Retrieval-Augmented Generation. In this project, it means:

1. Retrieve relevant stored electrical code sections.
2. Give only those sections to the AI model.
3. Ask the model to answer using those sections.

### Simple Pipeline

```text
User question
  |
  v
OpenAI embedding
  |
  v
Supabase RPC match_code_sections
  |
  v
Relevant code sections
  |
  v
Anthropic Claude prompt with context
  |
  v
JSON answer with citations/action items/tips
```

### What Is an Embedding?

In this codebase, an embedding is a `number[]` created by OpenAI in `lib/embedding.ts`. It represents text meaning as a 3072-dimensional vector when using `text-embedding-3-large`.

Why embeddings are needed:

- The user may ask “garage outlets”.
- The code may say “receptacles installed in garages”.
- Vector search can match meaning even when words differ.

### How Embeddings Are Generated

File: `lib/embedding.ts`

Function:

- `generateEmbedding(text: string): Promise<number[]>`

Process:

- Validates text.
- Applies rate limiting.
- Calls `openai.embeddings.create`.
- Validates dimension and magnitude.
- Returns vector.

### How Vectors Are Stored

The ingestion script inserts rows into `code_sections` with an `embedding` field. TypeScript says `embedding: number[]`.

The actual Postgres column type is not defined in this repo. Because the app calls `match_code_sections`, it likely expects a vector-compatible database function, but the SQL definition cannot be determined from the current codebase.

### How pgvector Works

The repo does not include a migration enabling pgvector or defining vector indexes. Therefore:

- pgvector usage is implied by vector search/RPC naming and embedding storage.
- Exact pgvector extension setup is Not Implemented Yet in this repo.
- Exact IVFFlat/HNSW/vector index definition cannot be determined from code.

### Why Cosine Similarity

The user request mentions cosine similarity, but the current codebase does not include the SQL body of `match_code_sections`. Therefore the exact similarity operator cannot be determined from the current codebase.

The TypeScript expects the RPC to return a `similarity` number. The app uses that number for ranking and confidence.

### How `match_code_sections()` Works

What can be determined:

- It is a Supabase RPC called from `lib/vector-search.ts`.
- It accepts:
  - `query_embedding`
  - `match_threshold`
  - `match_count`
  - `p_jurisdiction`
  - `p_as_of_date`
- It returns rows with:
  - code section fields
  - `similarity`

What cannot be determined:

- Exact SQL query.
- Exact vector operator.
- Exact indexes used.
- Exact RLS behavior for the function.

### How Context Is Prepared

File: `lib/ai-generate.ts`

Function:

- `generateAIAnswer`

Context format:

- Takes top sections.
- Limits to `MAX_SECTIONS_PER_CONTEXT = 12`.
- For each section, includes section number, source label, year, and first 500 characters.
- Adds field intelligence blocks if metadata exists.

### How Citations Are Generated

Claude is prompted to cite sections in the answer text. Separately, the app returns `citedSections` from retrieved sections.

Important nuance:

- Fresh response returns `aiResponse.citedSections`, which usually contains full `CodeSection` objects.
- Saved message metadata stores reduced fields: `id`, `section_number`, `code_book`, `code_year`.

### How Hallucination Is Reduced

Implemented controls:

- Retrieval gives only selected code sections to Claude.
- System prompt says to answer only from provided sections.
- If information is not found, prompt requires an invalid/not-found JSON response.
- Input validation blocks some prompt injection patterns.
- Temperature is `0.0`.
- Enhanced guides are labeled as practical references, not official law.
- UI disclaimer tells users to verify with official books.

Limitations:

- The AI can still return invalid JSON or imperfect content.
- The app handles invalid JSON with a fallback, but it cannot guarantee legal correctness.

### RAG vs Fine-Tuning

In this implementation:

- RAG is implemented: retrieve sections from Supabase and pass them into Claude at question time.
- Fine-tuning is Not Implemented Yet. There is no training job, no fine-tuned model ID, and no code that updates model weights.

### Vector Search vs Keyword Search

Implemented vector search:

- Uses OpenAI embeddings.
- Calls `match_code_sections`.
- Uses similarity scores.

Implemented keyword/text fallback:

- Extracts key terms.
- Queries `code_sections`.
- Scores matches in application code.

### Pipeline Explained Like You Are 10

The app turns your question into a math fingerprint. It compares that fingerprint with fingerprints of code-book chunks. It picks the closest chunks, gives them to the AI, and says: “Only answer from these pages.”

### Pipeline Explained Like a College Student

The app implements retrieval-augmented generation. It embeds the query, searches embedded code sections through a Supabase RPC, reranks the results with semantic and lexical signals, then sends retrieved context to Claude for structured answer generation.

### Pipeline Explained to an Interviewer

The core design separates retrieval from generation. Retrieval is handled in `lib/vector-search.ts` using OpenAI embeddings and Supabase RPC search. Generation is handled in `lib/ai-generate.ts` with a strict Anthropic prompt, JSON contract, source-type labeling, caching, timeout, and retry behavior.

### Pipeline Explained to a Software Engineer

The `/api/chat` route constructs `SearchOptions`, calls `getRelevantSectionsWithQuality`, then passes the returned `CodeSection[]` to `generateAnswer`. Retrieval handles normalization, cache lookup, query expansion, embedding, RPC, reranking, relevance validation, and fallbacks. Generation sanitizes input, builds bounded context, calls Anthropic, parses JSON, and returns a `GeneratedAnswer`.

## 7. Database

The repo contains TypeScript database types but no SQL migration files. Therefore exact physical schema, indexes, RLS policies, and foreign keys cannot be fully verified from current codebase.

### `profiles`

Columns from types:

- `id: string`
- `email: string`
- `full_name: string | null`

Usage in current code:

- Not directly queried by current source files.

Status:

- Type exists.
- Runtime usage Not Implemented Yet in current app code.

### `code_sections`

Columns from types:

- `id`
- `content`
- `section_number`
- `code_book`
- `embedding`
- `jurisdiction`
- `effective_date`
- `expires_date`
- `is_amendment`
- `code_year`
- `enhanced_metadata`
- `source_type`
- `embedding_version`

Why it exists:

- Stores source material and embeddings for retrieval.

Called by:

- `scripts/setup-vector-db.ts`
- `lib/vector-search.ts`
- `lib/supabase-admin.ts` test helper

Indexes:

- Only `idx_embedding_version` appears in a warning message as suggested SQL if schema is missing.
- Actual indexes cannot be determined.

RLS:

- Cannot be determined from current codebase.

### `chats`

Columns from types:

- `id`
- `user_id`
- `title`
- `created_at`
- `inserted_at`

Why it exists:

- Stores one conversation per user chat thread.

Called by:

- `/api/chat`
- `/api/chats`
- `/api/chats/[id]`
- `components/sidebar.tsx` realtime subscription

Relationships:

- Code implies `messages.chat_id` belongs to `chats.id`.
- DELETE route comments say messages cascade through foreign key, but the actual foreign-key SQL is not in repo. Cannot be fully determined.

### `messages`

Columns from types:

- `id`
- `user_id`
- `chat_id`
- `role`
- `content`
- `sources`
- `feedback`
- `created_at`
- `inserted_at`

Why it exists:

- Stores user and assistant messages.

Called by:

- `/api/chat` inserts.
- `/api/chats/[id]` reads.

### `user_usage`

Columns from types:

- `user_id`
- `query_count`
- `last_query_at`

Why it exists:

- Enforces beta query limit.

Called by:

- `lib/usage-limits.ts`
- `/api/usage`
- `/api/chat`

### Functions

#### `match_code_sections`

Purpose: Vector retrieval RPC.

SQL body: cannot be determined from current codebase.

#### `increment_user_usage`

Purpose: Increment a user's `query_count`.

Called by:

- `incrementUsage()` in `lib/usage-limits.ts`

SQL body: cannot be determined from current codebase.

### `ingestion_runs`

Used in:

- `scripts/setup-vector-db.ts`

Status:

- Not present in `types/index.ts`.
- Exact table schema cannot be determined.

## 8. API Routes

### `GET /api/auth/me`

Purpose: Return current authenticated user or null.

Auth:

- Uses Supabase `getUser()`.

Output:

- If authenticated: `{ user: { id, email, created_at }, authenticated: true }`
- If anonymous: `{ user: null }`
- If error: 401 or 500.

### `POST /api/chat`

Purpose: Ask a question and receive AI answer.

Auth:

- Required.

Input:

- `question`
- `chatId`
- `jurisdiction`
- `codeYear`
- `compareYears`

Output:

- `answer`
- `citedSections`
- `actionItems`
- `inspectorTips`
- `confidence`
- `chatId`
- `isNewChat`
- `jurisdiction`
- `sectionsFound`
- `messageSaved`
- `usageCounted`
- `searchQuality`

### `GET /api/chats`

Purpose: List chats for authenticated user.

Auth:

- Required.

Database:

- Selects `id`, `title`, `created_at`, `inserted_at` from `chats`.

Rate limit:

- 30/min/IP.

### `GET /api/chats/[id]`

Purpose: Load messages for one chat.

Auth:

- Required.

Validation:

- `id` must be UUID.

Database:

- Selects chat.
- Selects messages ordered by `inserted_at`, `created_at`, `id`.

### `PATCH /api/chats/[id]`

Purpose: Update chat title.

Input:

- `title`: 1 to 100 chars, trimmed.

Auth:

- Required.

Validation:

- UUID param.
- Zod body validation.

### `DELETE /api/chats/[id]`

Purpose: Delete chat.

Auth:

- Required.

Database:

- Deletes `chats` where `id` and `user_id` match.

Cascade:

- Comment says messages cascade through foreign key, but actual FK SQL cannot be determined.

### `GET /api/usage`

Purpose: Return current user's usage count and allowed state.

Auth:

- Required.

Uses:

- `checkUsageLimit(user.id)`

## 9. Components

### `AnswerDisplay`

Props:

- `response: GeneratedAnswer`

State:

- `expandedSource`
- `copiedStates`

Hooks:

- `useState`
- `useCallback`

Purpose:

- Render answer, enhanced metadata, action items, inspector tips, citations.

Security:

- DOMPurify sanitizes formatted HTML.

### `AuthModal`

Props:

- `onClose`
- `onSuccess`

State:

- login/signup mode, email, password, terms, loading, error, cooldown.

Purpose:

- Authenticate user through Supabase email/password.

### `ChatInput`

Props:

- `onSend`
- `isLoading`
- `disabled`
- `cooldownRemaining`
- `jurisdictionValue`
- `onJurisdictionChange`

State:

- `message`
- `selectedYear`
- `compareMode`
- `showYearDropdown`

Purpose:

- Collect question, selected jurisdiction, year, compare mode.

### `ChatMessage`

Props:

- `message`

Purpose:

- Render user text or assistant answer.

### `ExampleQuestions`

Props:

- `onQuestionClick`
- `disabled`

Purpose:

- Shows four static starter questions.

### `Header`

Props:

- `onLoginClick`
- `onMenuClick`
- `onNewChat`

Purpose:

- Mobile header only.

### `JurisdictionSelector`

Props:

- `value`
- `onChange`
- `disabled`

State:

- `isOpen`

Purpose:

- Select jurisdiction from constants in `types`.

### `Sidebar`

Props:

- `onLoginClick`
- `onNewChat`
- `onChatSelect`
- `isOpen`
- `onClose`

Purpose:

- Shows chat history, new chat button, auth status, sign out.

### `SupabaseAuthSync`

Purpose:

- Listens to auth changes and calls `/api/auth/me`.

Status:

- Not Implemented Yet as active runtime behavior because `Providers` does not render it.

### `UsageMeter`

Props:

- `used`
- `remaining`

Purpose:

- Shows beta quota progress using `BETA_QUERY_LIMIT`.

## 10. Lib Folder

### `auth.ts`

Purpose: `getCurrentUser` and `requireAuth` helpers.

Status: Present, but current API routes use direct `createServerClient().auth.getUser()` instead.

### `env-loader.ts`

Purpose: Script-only `.env.local` loader.

Why separated: Next.js automatically loads env for app runtime, but standalone `tsx` scripts need manual loading.

### `logger.ts`

Purpose: Safe structured logging.

Security:

- Masks API keys, JWTs, emails, file paths, and non-whitelisted URLs.

### `rate-limit.ts`

Purpose: In-memory rate limiter.

Important limitation:

- In-memory rate limiting may reset across serverless instances/restarts. This is acceptable for simple protection but not a globally consistent distributed limiter.

### `usage-limits.ts`

Purpose: Beta quota logic.

Constant:

- `BETA_QUERY_LIMIT = 25`

Uses:

- Admin Supabase client.
- `user_usage` table.
- `increment_user_usage` RPC.

## 11. Security

Implemented:

- Supabase Auth.
- API route authentication.
- Cookie-based SSR auth.
- Service role isolated in `supabase-admin.ts`.
- Browser uses anon key only.
- Zod request validation.
- API rate limits.
- Basic middleware payload limit.
- Basic same-origin check for mutating API requests.
- DOMPurify answer sanitization.
- SecureLogger secret masking.
- Prompt-injection pattern rejection in `ai-generate.ts`.

Cannot be determined:

- Exact Supabase RLS policies.
- Exact RLS enablement SQL.
- Exact table grants.
- Exact RPC security definer/invoker behavior.

Not Implemented Yet:

- CSRF token mechanism; middleware only checks Origin/Host.
- Centralized distributed rate limiter.
- Admin panel.
- Self-serve account deletion.

## 12. Performance

Implemented:

- Search cache in `lib/vector-search.ts`.
- Answer cache in `lib/ai-generate.ts`.
- OpenAI embedding rate limiter.
- Query expansion capped to 3 variations.
- Result count limits.
- Reranking only over fetched results.
- SWR hook exists for chat history.
- Memoized UI subcomponents in answer display.

Cannot be determined:

- Actual vector index type.
- IVFFlat/HNSW index parameters.
- GIN indexes.
- Postgres query plans.

## 13. Deployment

What code proves:

- Next.js app can be built with `npm run build`.
- Production server script is `npm run start`.
- Dev server script is `npm run dev`.
- Environment variables needed include:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - ingestion tuning variables

What cannot be determined:

- Actual hosting provider configuration.
- Vercel project settings.
- Supabase project SQL migrations.
- CI/CD pipeline.
- Production domain config.

## 14. Known Limitations

Implemented:

- Email/password auth.
- Supabase session tracking.
- Chat UI.
- Chat persistence.
- Usage quota.
- OpenAI embeddings.
- Supabase RPC-based retrieval.
- Anthropic answer generation.
- Citation rendering.
- Ingestion script.
- Basic test-question script.

Partially implemented:

- OAuth callback route exists, but UI provider buttons are absent.
- Code-year comparison UI exists, but generation prompt does not contain explicit comparison logic beyond passing `compareYears` and retrieving more/all-year sections.
- `SupabaseAuthSync` exists but is not mounted.
- `useChatHistory` exists but `Sidebar` uses its own fetch/realtime logic.
- `ingestion_runs` logging exists in script, but type/schema is not defined.

Not Implemented Yet:

- SQL migrations in repo.
- Exact RLS policy definitions in repo.
- Vector index definitions in repo.
- Self-serve delete account.
- Billing.
- Admin dashboard.
- Automated unit/integration tests.
- Deployment guide.

## 15. Startup Review

### Technical Strengths

- Good separation between UI, API routes, retrieval, embedding, and generation.
- Strong runtime validation in `/api/chat` and chat update route.
- Secure handling of service role by isolating admin client.
- Clear beta quota mechanism.
- Practical fallbacks when vector search or AI generation fails.
- DOMPurify protects generated answer rendering.

### Weaknesses

- No migrations means database truth is outside repo.
- Some comments claim production-grade features that cannot be verified.
- In-memory rate limits and caches are not distributed.
- Current main chat route is `/`, so middleware protected pages are not the actual app route.
- Citation data saved to history is reduced compared with live response objects.
- Some files are unused or partially wired.

### Scalability

Good enough for beta:

- API routes are stateless except in-memory cache/rate limits.
- Supabase handles persistence.
- Search limits bound result sizes.

Needs work for scale:

- Distributed rate limiting.
- Persistent cache if needed.
- Verified vector indexes.
- Background jobs for ingestion.
- Observability dashboards.

### Production Readiness

The app is a functional beta. It is not fully production-auditable from this repo because database migrations, RLS SQL, and deployment configuration are missing.

## 16. Final Summary

TheRuleKit is a Next.js + Supabase + AI code-question assistant. Users authenticate, ask California electrical code questions, and receive answers generated from retrieved code sections. The retrieval layer uses OpenAI embeddings and a Supabase RPC called `match_code_sections`. The answer layer uses Anthropic Claude with a strict JSON prompt. Supabase stores chats, messages, usage, and code-section data. The project is strongest as a beta RAG product with clear separation of concerns, but the database schema/policies/indexes need to be checked into the repo before calling it fully production-documentable.

