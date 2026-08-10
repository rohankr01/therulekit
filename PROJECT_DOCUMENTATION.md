# Project Documentation

This document is based only on the current codebase in this repository. If a feature is mentioned as not implemented, that means the code either references it without a working UI/route, or describes it as future/planned text.

## Project Overview

The project is a Next.js application named `ecai-ai` in `package.json`. The user-facing brand in the UI is `TheRuleKit`.

It is an AI assistant for California electrical code questions. Authenticated users can ask electrical code questions, select a jurisdiction, optionally select a code year or comparison mode, receive an AI-generated answer, and view citations from stored code sections. The app also stores chat history and tracks beta usage limits.

### What Problem Does The Project Solve?

The app helps electricians or code users ask natural-language questions about electrical code and receive:

- An answer generated from retrieved code sections.
- Citations to the stored code sections.
- Action items and inspector tips when returned by the AI flow.
- A saved chat history for authenticated users.
- A beta quota counter.

The app does not replace official code books. The UI, terms, and answer generation prompts all indicate that users should verify with official sources or local inspectors.

### Technologies Used

- Next.js 14 App Router.
- React 18 client components and hooks.
- TypeScript.
- Tailwind CSS with `@tailwindcss/typography`.
- Supabase Auth, Database, Realtime, and SSR helpers.
- OpenAI SDK for embeddings.
- Anthropic Messages API for answer generation.
- Zod for request validation.
- SWR for cache invalidation/history hook support.
- Sonner for toast notifications.
- `isomorphic-dompurify` for sanitizing rendered answer HTML.
- `tsx` for scripts.

### Overall Architecture

The architecture is a client/server RAG application:

1. Client UI renders landing/authenticated chat screens from `app/page.tsx`.
2. `AuthProvider` in `hooks/use-auth.tsx` creates a browser Supabase client and tracks the authenticated user.
3. `useChat` in `hooks/use-chat.ts` manages current chat state and calls backend API routes.
4. API routes authenticate with a cookie-based Supabase SSR client from `lib/supabase.ts`.
5. `/api/chat` validates the request, checks usage, creates or validates a chat, retrieves relevant code sections, generates an answer, saves messages, and increments usage when appropriate.
6. Retrieval uses `lib/vector-search.ts`, which embeds the question with `lib/embedding.ts`, calls the Supabase RPC `match_code_sections`, reranks results, and falls back to lower thresholds, California State search, or text search.
7. Answer generation uses `lib/ai-generate.ts`, which sends the question plus retrieved sections to Anthropic and expects structured JSON back.
8. Data ingestion is handled by scripts, mainly `scripts/setup-vector-db.ts`, which reads local text files, chunks them, creates embeddings, and inserts rows into `code_sections` using the Supabase service role client.

## Folder Structure

### `app/`

Next.js App Router files.

- `app/layout.tsx`: Root layout. Imports `globals.css`, loads the Inter font, defines metadata and viewport, and wraps all pages in `Providers`.
- `app/page.tsx`: Main client page. Renders either the landing page for anonymous users or the full chat application for authenticated users.
- `app/globals.css`: Global Tailwind/CSS styles.
- `app/privacy/page.tsx`: Static privacy policy page.
- `app/terms/page.tsx`: Static terms of service page.
- `app/auth/callback/route.ts`: OAuth callback route for Supabase auth.
- `app/api/auth/me/route.ts`: Auth status API route.
- `app/api/chat/route.ts`: Main AI chat API route.
- `app/api/chats/route.ts`: Chat list API route.
- `app/api/chats/[id]/route.ts`: Chat detail, delete, and update API route.
- `app/api/usage/route.ts`: Usage/quota API route.

### `components/`

Reusable React UI components.

- `answer-display.tsx`: Formats and renders AI answers, action items, tips, and citations.
- `auth-modal.tsx`: Email/password sign-in and sign-up modal.
- `chat-input.tsx`: Question input, jurisdiction selector, code-year selector, and compare toggle.
- `chat-message.tsx`: Renders one user or assistant message.
- `example-questions.tsx`: Shows suggested starter questions.
- `header.tsx`: Mobile top header.
- `jurisdiction-selector.tsx`: Dropdown for supported jurisdictions.
- `providers.tsx`: Wraps the app with `AuthProvider` and `Toaster`.
- `sidebar.tsx`: Desktop/mobile sidebar with recent chats, realtime chat updates, and sign out.
- `supabase-listener.tsx`: Auth sync listener component. It exists, but `Providers` does not currently render it.
- `usage-meter.tsx`: Beta usage progress meter.

### `hooks/`

Client-side React hooks.

- `use-auth.tsx`: Provides Supabase client, user state, loading state, and auth-state subscription.
- `use-chat.ts`: Manages chat messages, current chat ID, request cancellation, cooldowns, sending messages, and loading chat history.
- `use-chat-history.ts`: SWR-based chat history hook. It exists but is not used by the current `Sidebar`, which implements its own chat fetch/realtime logic.

### `lib/`

Shared utilities and server-side logic.

- `ai-generate.ts`: Anthropic answer generation, prompt construction, response parsing, caching, validation, and fallback answers.
- `auth.ts`: Helper functions for `getCurrentUser` and `requireAuth`. Current API routes do not import this file.
- `embedding.ts`: OpenAI embedding generation, embedding validation, and embedding rate limiter.
- `env-loader.ts`: Script-only `.env.local` loader.
- `logger.ts`: Secure logging utility that masks secrets, emails, URLs, and paths.
- `rate-limit.ts`: In-memory rate limiter and IP extraction helpers.
- `supabase.ts`: Browser and SSR Supabase clients using anon key and cookies.
- `supabase-admin.ts`: Service-role Supabase admin client for scripts/backend-only operations.
- `usage-limits.ts`: Beta query quota check/increment using the admin client and `user_usage`.
- `vector-search.ts`: RAG retrieval, query expansion, vector search, reranking, fallbacks, search cache, and hybrid result extraction.

### `types/`

- `types/index.ts`: Single source of TypeScript types for database tables, generated answers, code sections, search quality, jurisdictions, code years, and helper type guards.

### `scripts/`

Standalone scripts.

- `setup-vector-db.ts`: Ingestion pipeline for local code-section text files. Uses admin Supabase client, OpenAI embeddings, chunking, metadata extraction, optional backups, and optional ingestion logging.
- `test-questions.ts`: Quality-control script that runs sample questions through search and answer generation.

### `data/code-sections/`

Local `.txt` source data used by the ingestion script. Files include raw/verified LA code material and cross-reference guides, such as:

- `LA_CA_2023_article-80-general-provisions-VERIFIED.txt`
- `LA_CA_2023_article-82-permits-inspection-VERIFIED.txt`
- `LA_CA_2023_fees-schedule-complete-VERIFIED.txt`
- `practical-permit-process-LA-VERIFIED.txt`
- Multiple `cross-reference-*.txt` files for GFCI, kitchens, bathrooms, garages, EV charging, solar, pools, service upgrades, permits, and related topics.

### Root Files

- `middleware.ts`: Edge middleware for body-size checks, CSRF checks, auth checks for configured protected pages, and Supabase cookie preservation.
- `package.json`: Project metadata, dependencies, and scripts.
- `package-lock.json`: Locked npm dependency tree.
- `tailwind.config.js`: Tailwind content paths, theme extensions, typography plugin.
- `postcss.config.js`: Tailwind and Autoprefixer PostCSS config.
- `next.config.js`: Next config with `serverComponentsExternalPackages`.
- `tsconfig.json`: TypeScript configuration and `@/*` path alias.
- `next-env.d.ts`: Next.js TypeScript declarations.
- `LICENSE.txt`: Proprietary license text.

## File Call Map

- `app/layout.tsx` imports `components/providers.tsx`.
- `components/providers.tsx` imports `hooks/use-auth.tsx` and `sonner`.
- `app/page.tsx` imports `useAuth`, `useChat`, `Sidebar`, `ChatInput`, `ChatMessage`, `ExampleQuestions`, `AuthModal`, `Header`, `UsageMeter`, `BETA_QUERY_LIMIT`, and jurisdiction types.
- `app/page.tsx` calls `/api/usage` through `fetchUsage`.
- `app/page.tsx` calls `sendMessage` and `loadChat` from `useChat`.
- `hooks/use-auth.tsx` imports `getBrowserClient` from `lib/supabase.ts`.
- `hooks/use-chat.ts` calls `/api/chats/:id` to verify/load chats and `/api/chat` to ask questions.
- `hooks/use-chat.ts` calls SWR `mutate('/api/chats')` after new-chat activity.
- `components/sidebar.tsx` calls `/api/chats`, uses Supabase realtime channel on `public.chats`, and calls `supabase.auth.signOut()`.
- `components/auth-modal.tsx` calls `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, and `/api/auth/me`.
- `components/supabase-listener.tsx` calls `/api/auth/me`, but the component is not mounted anywhere in current code.
- `components/chat-message.tsx` renders `AnswerDisplay`.
- `components/chat-input.tsx` renders `JurisdictionSelector`.
- `app/api/chat/route.ts` imports `usage-limits`, `vector-search`, `ai-generate`, `supabase`, `rate-limit`, `zod`, and `types`.
- `app/api/chats/route.ts`, `app/api/chats/[id]/route.ts`, `app/api/usage/route.ts`, and `app/api/auth/me/route.ts` use `createServerClient` from `lib/supabase.ts`.
- `app/api/usage/route.ts` calls `checkUsageLimit`.
- `lib/usage-limits.ts` imports `getAdminClient` from `supabase-admin.ts` and calls `user_usage` plus RPC `increment_user_usage`.
- `lib/vector-search.ts` imports `createServerClient`, `generateEmbedding`, `SecureLogger`, and types. It calls RPC `match_code_sections` and sometimes queries `code_sections` directly for fallback text search.
- `lib/embedding.ts` imports `readEnv`, OpenAI SDK, and `SecureLogger`.
- `lib/ai-generate.ts` imports types and `SecureLogger`, then calls Anthropic via `fetch`.
- `scripts/setup-vector-db.ts` imports `readEnv`, `getAdminClient`, `generateEmbedding`, `SecureLogger`, and types.
- `scripts/test-questions.ts` imports `getRelevantSections`, `getHybridRelevantSections`, and `generateAnswer`.

## Components

### `Home` (`app/page.tsx`)

Purpose: Main application page. Shows a landing page when unauthenticated and the chat interface when authenticated.

Props: None.

State:

- `showAuthModal`
- `showMobileSidebar`
- `usageData`
- `selectedJurisdiction`

Refs:

- `messagesEndRef`
- `usageFetchedRef`
- `lastMessageCountRef`

Important functions:

- `fetchUsage`: Calls `/api/usage` and updates beta usage.
- `handleSendMessage`: Requires auth and quota, then calls `sendMessage`.
- `handleChatSelect`: Loads a chat by ID through `useChat`.
- `handleNewChat`: Starts a new chat.
- `handleAuthSuccess`: Closes modal and refreshes usage.

APIs called: `/api/usage` directly. `/api/chat` and `/api/chats/:id` indirectly through `useChat`.

Interview explanation: This component coordinates auth state, chat state, layout state, quota display, and user actions. It intentionally gates chat usage behind Supabase auth and the beta usage limit.

### `PremiumLandingPage` (`app/page.tsx`)

Purpose: Anonymous-user landing page.

Props:

- `onStartFreeClick`: Opens auth modal.

State:

- `isVisible`

Important functions: A `useEffect` sets visible animation state.

APIs called: None.

Interview explanation: This is only a marketing/entry screen. It does not perform auth itself; it delegates to `AuthModal`.

### `CheckIcon`, `SparkleIcon` (`app/page.tsx`)

Purpose: Small inline SVG helpers used by the landing page.

Props/state/APIs: None.

### `AuthModal` (`components/auth-modal.tsx`)

Purpose: Email/password sign-in and sign-up modal.

Props:

- `onClose`
- `onSuccess`

State:

- `isLogin`
- `email`
- `password`
- `agreedToTerms`
- `loading`
- `error`
- `cooldownUntil`
- `now`
- `requestInFlight`

Refs:

- `submitLockRef`
- `lastSubmitAtRef`
- `requestIdRef`

Important functions:

- `getCooldownSeconds`: Parses cooldown seconds from Supabase auth errors.
- `maskEmail`: Masks emails for debug logging.
- `logAuthDebug`: Writes auth debug logs.
- `syncSessionWithServer`: Calls `/api/auth/me` up to 3 times after client auth.
- `handleSubmit`: Runs login or signup through Supabase.

APIs called:

- Supabase client `auth.signInWithPassword`.
- Supabase client `auth.signUp`.
- `/api/auth/me`.

Interview explanation: Auth is client-initiated through Supabase, then the app verifies/syncs server recognition by calling `/api/auth/me`. Signup requires accepting terms.

### `ChatInput` (`components/chat-input.tsx`)

Purpose: Input area for asking questions, selecting jurisdiction/year, and toggling compare mode.

Props:

- `onSend(message, options?)`
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

Refs:

- `textareaRef`

Important functions:

- `handleSubmit`: Builds `codeYear` or `compareYears` options and calls `onSend`.
- `handleKeyDown`: Sends on Enter without Shift.
- `getPlaceholder`: Derives placeholder from jurisdiction/year/compare mode.
- Auto-resize `useEffect` updates textarea height.

APIs called: None directly. Parent sends through `useChat`.

Interview explanation: This component is pure UI/input state. It does not know about backend details except the options shape expected by `useChat`.

### `JurisdictionSelector` (`components/jurisdiction-selector.tsx`)

Purpose: Dropdown for selecting one of the supported jurisdictions.

Props:

- `value`
- `onChange`
- `disabled`

State:

- `isOpen`

Important functions/effects:

- Escape key closes dropdown.
- Body scroll is disabled while open.
- Clicking a jurisdiction calls `onChange`.

APIs called: None.

Interview explanation: Supported jurisdictions come from `types/index.ts`, so UI and backend validation share the same source list.

### `ChatMessage` (`components/chat-message.tsx`)

Purpose: Renders a single user or assistant message.

Props:

- `message`

State: None.

Important functions:

- Calculates `isUserMessage`.
- Calculates `isThinking` when assistant answer is `"..."`.

APIs called: None.

Interview explanation: User messages are rendered as plain text. Assistant messages are passed into `AnswerDisplay` as structured generated answers.

### `AnswerDisplay` (`components/answer-display.tsx`)

Purpose: Displays a generated answer, field intelligence, action items, inspector tips, and expandable citations.

Props:

- `response: GeneratedAnswer`

State:

- `expandedSource`
- `copiedStates`

Important functions:

- `formatAnswer`: Converts limited markdown-like syntax to HTML and sanitizes with DOMPurify.
- `handleCopy`: Copies citation content to clipboard and temporarily marks it copied.
- `handleToggle`: Expands/collapses citation details.

APIs called: Browser `navigator.clipboard`.

Interview explanation: This component protects rendering with DOMPurify before using `dangerouslySetInnerHTML`. It also distinguishes enhanced guide sources from raw code sources in citation display.

Subcomponents/helpers:

- `ClipboardIcon`
- `CheckIcon`
- `FieldBlock`
- `CopyButton`
- `CitationItem`

### `ExampleQuestions` (`components/example-questions.tsx`)

Purpose: Renders four predefined starter questions.

Props:

- `onQuestionClick`
- `disabled`

State: None.

Important functions: Clicking a question calls `onQuestionClick(q)`.

APIs called: None.

Interview explanation: This improves empty-chat onboarding and reuses the same send path as typed questions.

### `Header` (`components/header.tsx`)

Purpose: Mobile-only top header.

Props:

- `onLoginClick`
- `onMenuClick`
- `onNewChat`

State: None.

Important functions: Button clicks invoke parent callbacks.

APIs called: None.

Interview explanation: It reads auth state through `useAuth` and changes displayed actions: menu/new chat for authenticated users, sign in for anonymous users.

Helper components:

- `MenuIcon`
- `PlusIcon`

### `Sidebar` (`components/sidebar.tsx`)

Purpose: Desktop/mobile sidebar with chat list, new chat action, user info, and sign out.

Props:

- `onLoginClick`
- `onNewChat`
- `onChatSelect`
- `isOpen`
- `onClose`

State:

- `chats`
- `loadingChats`
- `error`

Important functions/effects:

- `fetchChats`: Calls `/api/chats` and stores chat list.
- Auth `useEffect`: Fetches chats after login.
- Realtime `useEffect`: Subscribes to Supabase `postgres_changes` for `public.chats` filtered by `user_id`.
- `handleLogout`: Calls `supabase.auth.signOut()`.
- `handleChatSelect`: Calls parent and closes mobile sidebar.
- `handleNewChat`: Calls parent and closes mobile sidebar.

APIs called:

- `/api/chats`.
- Supabase Realtime channel.
- Supabase `auth.signOut`.

Interview explanation: Chat list is loaded from the secure API route and then kept fresh with Supabase realtime updates.

Helper components:

- `NewChatIcon`
- `MessageIcon`
- `UserIcon`
- `LogoutIcon`
- `CloseIcon`

### `Providers` (`components/providers.tsx`)

Purpose: Global client providers.

Props:

- `children`

State: None.

Important functions: None.

APIs called: None.

Interview explanation: It wraps the app in `AuthProvider` and renders Sonner `Toaster`. It does not currently render `SupabaseAuthSync`.

### `SupabaseAuthSync` (`components/supabase-listener.tsx`)

Purpose: Intended listener to sync auth state with `/api/auth/me`.

Props/state: None.

Important functions/effects:

- Registers `supabase.auth.onAuthStateChange`.
- Calls `/api/auth/me` on auth state changes.

APIs called:

- `/api/auth/me`.

Interview explanation: The component exists, but the current provider tree does not mount it. Therefore, it is not active in the running app unless added somewhere.

### `UsageMeter` (`components/usage-meter.tsx`)

Purpose: Shows beta query usage progress.

Props:

- `used`
- `remaining`

State: None.

Important logic:

- Uses `BETA_QUERY_LIMIT` from `lib/usage-limits.ts`.
- Color changes based on percentage used.

APIs called: None.

Interview explanation: The meter is display-only. The actual usage count comes from `/api/usage`.

### `PrivacyPage` (`app/privacy/page.tsx`)

Purpose: Static privacy policy page.

Props/state/APIs: None.

### `TermsPage` (`app/terms/page.tsx`)

Purpose: Static terms of service page.

Props/state/APIs: None.

### `RootLayout` (`app/layout.tsx`)

Purpose: App-wide HTML/body wrapper, metadata, viewport, font, and providers.

Props:

- `children`

State/APIs: None.

## API Routes

### `GET /api/auth/me`

File: `app/api/auth/me/route.ts`

Purpose: Return the current Supabase-authenticated user, or `user: null`.

Request: No body. Uses request cookies.

Response:

- Authenticated: `{ user: { id, email, created_at }, authenticated: true }`
- Anonymous: `{ user: null }`
- Auth error: `{ user: null, error }` with 401
- Server error: `{ user: null, error: 'Internal server error' }` with 500

Internal flow:

1. Create a response object for cookie preservation.
2. Create SSR Supabase client with request/response.
3. Call `supabase.auth.getUser()`.
4. Return user fields or null.
5. Preserve Supabase cookie headers via `headersWithSupabaseCookies`.

Files used:

- `lib/supabase.ts`

Tables used: None directly.

Authentication: Uses Supabase cookies and `getUser`.

### `GET/POST /auth/callback`

File: `app/auth/callback/route.ts`

Purpose: Handle Supabase OAuth callback by exchanging `code` for a session and redirecting.

Request:

- Query parameter `code` for successful OAuth.
- Optional `error` and `error_description`.
- Optional `redirect_to`, allowed only if same-origin.

Response:

- Redirect to `/` or safe `redirect_to` with auth cookies set.
- Redirect to `/auth/error?message=...` on errors.

Internal flow:

1. Validate OAuth error/code parameters.
2. Validate same-origin redirect target.
3. Create redirect response first.
4. Create Supabase SSR client using that response.
5. Call `exchangeCodeForSession(code)`.
6. Return the same response so cookies are preserved.

Files used:

- `lib/supabase.ts`
- `lib/logger.ts`

Tables used: None directly.

Authentication: This route completes auth by setting Supabase session cookies.

Important not implemented note: It redirects to `/auth/error`, but there is no `app/auth/error/page.tsx` in the current codebase.

### `POST /api/chat`

File: `app/api/chat/route.ts`

Purpose: Main chat/RAG endpoint.

Request JSON:

```json
{
  "question": "string, 1-500 chars",
  "chatId": "optional UUID or null",
  "jurisdiction": "optional supported jurisdiction",
  "codeYear": "optional supported code year",
  "compareYears": "optional boolean"
}
```

Response success:

```json
{
  "answer": "string",
  "citedSections": [],
  "actionItems": [],
  "inspectorTips": [],
  "confidence": "low|medium|high",
  "chatId": "uuid",
  "isNewChat": true,
  "jurisdiction": "string",
  "sectionsFound": 0,
  "codeYear": null,
  "compareYears": false,
  "messageSaved": true,
  "usageCounted": true,
  "searchQuality": {
    "confidenceLevel": "low|medium|high",
    "dataSource": "vector|fallback_threshold|california_state|text_search|none",
    "avgSimilarity": 0,
    "warnings": []
  }
}
```

Error responses:

- 400 for Zod validation errors.
- 401 for auth errors.
- 403 for invalid origin via middleware or chat access denied in route error handling.
- 429 for IP rate limit or beta usage limit.
- 500 for database or processing failures.

Internal flow:

1. Rate limit by client IP: 10 requests per minute.
2. Create Supabase SSR client with cookies.
3. Authenticate with `supabase.auth.getUser()`.
4. Check beta usage with `checkUsageLimit`.
5. Parse and validate body with Zod.
6. Create a new chat if `chatId` is absent, or validate ownership if present.
7. Build search options from jurisdiction, year, and compare mode.
8. Call `getRelevantSectionsWithQuality`.
9. Call `generateAnswer`.
10. Build `MessageSources`.
11. Insert user message, delay 10 ms, insert assistant message.
12. Increment usage only when sections were found and search confidence is not low.
13. Return answer, citations, metadata, and search quality.

Files used:

- `lib/usage-limits.ts`
- `lib/vector-search.ts`
- `lib/ai-generate.ts`
- `lib/supabase.ts`
- `lib/rate-limit.ts`
- `types/index.ts`

Tables/RPC used:

- `chats`
- `messages`
- `user_usage` indirectly through `usage-limits`
- `code_sections` indirectly through `vector-search`
- RPC `match_code_sections` indirectly through `vector-search`
- RPC `increment_user_usage` indirectly through `usage-limits`

### `GET /api/usage`

File: `app/api/usage/route.ts`

Purpose: Return the authenticated user's beta usage status.

Request: No body. Uses cookies.

Response:

```json
{
  "queryCount": 0,
  "allowed": true,
  "reason": "optional string"
}
```

Internal flow:

1. Rate limit by IP: 30 requests per minute.
2. Create Supabase SSR client.
3. Authenticate with `getUser`.
4. Call `checkUsageLimit(user.id)`.
5. Return query count and allowed flag with no-store cache headers.

Files used:

- `lib/supabase.ts`
- `lib/usage-limits.ts`
- `lib/logger.ts`
- `lib/rate-limit.ts`

Tables used:

- `user_usage` indirectly through `checkUsageLimit`.

### `GET /api/chats`

File: `app/api/chats/route.ts`

Purpose: List all chats for the authenticated user.

Request: No body. Uses cookies.

Response:

```json
{
  "chats": [
    {
      "id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "inserted_at": "timestamp"
    }
  ]
}
```

Internal flow:

1. Rate limit by IP: 30 requests per minute.
2. Create Supabase SSR client.
3. Authenticate with `getUser`.
4. Query `chats`.
5. Order by `inserted_at`, `created_at`, and `id`.
6. Return chats with no-store cache headers.

Files used:

- `lib/supabase.ts`
- `lib/rate-limit.ts`

Tables used:

- `chats`

### `GET /api/chats/[id]`

File: `app/api/chats/[id]/route.ts`

Purpose: Load all messages for one chat.

Request: URL param `id`, must be UUID.

Response:

```json
{
  "messages": [],
  "chatTitle": "string",
  "totalMessages": 0,
  "chatId": "uuid"
}
```

Internal flow:

1. Rate limit by IP: 60 requests per minute.
2. Validate UUID with Zod.
3. Authenticate with `getUser`.
4. Query `chats` by ID to verify access through RLS.
5. Query `messages` by `chat_id`.
6. Order by `inserted_at`, `created_at`, and `id`.
7. Format message rows and return.

Files used:

- `lib/supabase.ts`
- `lib/rate-limit.ts`
- `types/index.ts`

Tables used:

- `chats`
- `messages`

### `DELETE /api/chats/[id]`

File: `app/api/chats/[id]/route.ts`

Purpose: Delete a chat.

Request: URL param `id`, must be UUID.

Response:

```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

Internal flow:

1. Rate limit by IP: 10 requests per minute.
2. Validate UUID.
3. Authenticate with `getUser`.
4. Delete from `chats` where `id` and `user_id` match.

Files used:

- `lib/supabase.ts`
- `lib/rate-limit.ts`

Tables used:

- `chats`

UI note: There is no current UI button that calls this route.

### `PATCH /api/chats/[id]`

File: `app/api/chats/[id]/route.ts`

Purpose: Update a chat title.

Request:

```json
{
  "title": "1-100 character string"
}
```

Response:

```json
{
  "success": true,
  "chat": {
    "id": "uuid",
    "title": "string"
  }
}
```

Internal flow:

1. Rate limit by IP: 20 requests per minute.
2. Validate UUID.
3. Authenticate with `getUser`.
4. Validate body with Zod.
5. Update `chats.title` where `id` and `user_id` match.

Files used:

- `lib/supabase.ts`
- `lib/rate-limit.ts`
- `types/index.ts`

Tables used:

- `chats`

UI note: There is no current UI control that calls this route.

## Authentication

### Implemented Flow

1. `app/layout.tsx` wraps the app in `Providers`.
2. `Providers` renders `AuthProvider`.
3. `AuthProvider` creates a singleton browser Supabase client via `getBrowserClient`.
4. `AuthProvider` calls `supabase.auth.getUser()` on mount to determine initial user state.
5. `AuthProvider` subscribes to `supabase.auth.onAuthStateChange`.
6. Anonymous users see `PremiumLandingPage`.
7. Clicking sign up/sign in opens `AuthModal`.
8. Login calls `supabase.auth.signInWithPassword({ email, password })`.
9. Signup calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo: origin + '/auth/callback' } })`.
10. After successful client auth, `AuthModal` calls `/api/auth/me` to check server-side auth recognition.
11. API routes authenticate independently by creating `createServerClient({ req, res })` and calling `supabase.auth.getUser()`.
12. Logout is triggered in `Sidebar` through `supabase.auth.signOut()`.
13. On `SIGNED_OUT`, `AuthProvider` clears user state and redirects to `/` if not already home.

### OAuth Callback Flow

`app/auth/callback/route.ts` supports a Supabase OAuth callback:

1. Provider redirects back with `?code=...`.
2. The route validates `code`.
3. The route validates `redirect_to` as same-origin only.
4. The route creates a redirect response before creating Supabase client.
5. It calls `exchangeCodeForSession(code)`.
6. It returns the same response so Supabase cookies reach the browser.

Implemented but not exposed in current UI: `AuthModal` has only email/password fields. There are no Google/GitHub OAuth buttons in the current component.

### Middleware Auth

`middleware.ts` checks auth only for configured protected UI paths: `/dashboard`, `/chat`, and `/profile`. Those pages do not currently exist in `app/`.

API routes mostly perform their own auth checks. Middleware adds CSRF checks for mutating API methods and payload-size checks.

## AI Flow

This is the exact current flow from user question to answer:

1. User types a question in `ChatInput`.
2. `ChatInput.handleSubmit` passes the trimmed message and options to `Home.handleSendMessage`.
3. `Home.handleSendMessage` verifies a user is logged in and usage remains.
4. `Home.handleSendMessage` calls `sendMessage` from `useChat`.
5. `useChat.sendMessage` optionally verifies the existing `currentChatId` by calling `GET /api/chats/:id`.
6. `useChat.sendMessage` appends a local user message and a temporary assistant thinking message.
7. `useChat.sendMessage` sends `POST /api/chat` with `question`, `chatId`, `jurisdiction`, `codeYear`, and `compareYears`.
8. `/api/chat` rate limits by IP.
9. `/api/chat` authenticates the user with Supabase `getUser`.
10. `/api/chat` calls `checkUsageLimit`.
11. `/api/chat` validates the request body with Zod.
12. `/api/chat` creates a new row in `chats` or verifies the existing chat belongs to the user.
13. `/api/chat` builds search options.
14. `/api/chat` calls `getRelevantSectionsWithQuality(question, searchOptions)`.
15. `vector-search` expands the query with electrical synonyms.
16. `vector-search` calls `generateEmbedding` for one or more query variations.
17. `embedding.ts` calls OpenAI embeddings using `EMBEDDING_MODEL` or default `text-embedding-3-large`.
18. `vector-search` calls Supabase RPC `match_code_sections`.
19. Search results are converted to `CodeSection`, reranked, validated, and assigned quality metadata.
20. If vector search fails or returns no useful results, fallback paths try lower threshold, California State, then text search over `code_sections`.
21. `/api/chat` calls `generateAnswer(question, relevantSections, options)`.
22. `ai-generate.ts` sanitizes/validates the question.
23. `ai-generate.ts` checks a short in-memory answer cache.
24. It builds context from retrieved sections, including source type labels.
25. It calls Anthropic `https://api.anthropic.com/v1/messages` using model `claude-3-haiku-20240307`, temperature `0.0`.
26. It parses the expected JSON answer.
27. It returns `GeneratedAnswer` with answer, citations, confidence, action items, tips, and enhanced metadata when available.
28. `/api/chat` saves user and assistant messages into `messages`.
29. `/api/chat` increments usage only if retrieved sections exist and search confidence is not low.
30. Client receives the response, replaces the temporary thinking message, updates `currentChatId`, and refreshes `/api/chats` if a new chat was created.
31. `Home` observes a new assistant message and refreshes `/api/usage`.

## Database Usage

Database tables are defined in `types/index.ts`. The actual database schema/migrations are not present as SQL files in this repo, but the TypeScript database type and Supabase calls show expected tables and functions.

### `profiles`

Typed in `types/index.ts`.

Used by APIs: Not used by current API routes.

Fields:

- `id`
- `email`
- `full_name`

### `code_sections`

Used by:

- `lib/vector-search.ts`: RPC results and text-search fallback.
- `scripts/setup-vector-db.ts`: Inserts embedded chunks and may delete/select existing rows.
- `lib/supabase-admin.ts`: Connection test selects from it.

Purpose: Stores electrical code chunks with embeddings, jurisdiction, effective dates, source type, metadata, and embedding version.

### `chats`

Used by:

- `POST /api/chat`: Create chat or validate existing chat.
- `GET /api/chats`: List chats.
- `GET /api/chats/[id]`: Verify chat access.
- `DELETE /api/chats/[id]`: Delete chat.
- `PATCH /api/chats/[id]`: Update title.
- `components/sidebar.tsx`: Realtime subscription to chat changes.

Purpose: Stores chat sessions per user.

### `messages`

Used by:

- `POST /api/chat`: Saves user and assistant messages.
- `GET /api/chats/[id]`: Loads messages.

Purpose: Stores message content, role, sources metadata, feedback field, and timestamps.

### `user_usage`

Used by:

- `lib/usage-limits.ts`: Reads and creates usage rows.
- `GET /api/usage`: Indirectly through `checkUsageLimit`.
- `POST /api/chat`: Indirectly through `checkUsageLimit` and `incrementUsage`.

Purpose: Tracks beta query count per user.

### `ingestion_runs`

Used by:

- `scripts/setup-vector-db.ts`: Optionally logs ingestion status, metrics, duration, and errors.

Typed in `types/index.ts`: No. The script casts Supabase to `any` for this table.

### RPC: `match_code_sections`

Used by:

- `lib/vector-search.ts`

Purpose: Vector similarity search over `code_sections`.

Args:

- `query_embedding`
- `match_threshold`
- `match_count`
- `p_jurisdiction`
- `p_as_of_date`

### RPC: `increment_user_usage`

Used by:

- `lib/usage-limits.ts`

Purpose: Increment a user's query count and return the new count.

## Utility Files

### `lib/supabase.ts`

Purpose: Supabase clients for browser, API routes, and middleware.

Exports:

- `getBrowserClient`
- `createServerClient`
- `headersWithSupabaseCookies`
- client types

Important details:

- Browser client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server client uses request cookies and writes cookie updates into a provided response.
- Cookie `secure` is true only in production.
- Intended for browser/API/middleware, not standalone scripts.

### `lib/supabase-admin.ts`

Purpose: Service-role Supabase client for scripts/backend-only operations.

Exports:

- `getAdminClient`
- `createAdminClient`
- `testAdminConnection`
- admin client type

Important details:

- Uses `SUPABASE_URL` or fallback `NEXT_PUBLIC_SUPABASE_URL`.
- Requires `SUPABASE_SERVICE_ROLE_KEY`.
- Throws if called in browser.
- Bypasses RLS.

### `lib/usage-limits.ts`

Purpose: Beta usage quota.

Exports:

- `BETA_QUERY_LIMIT = 25`
- `checkUsageLimit`
- `incrementUsage`
- `formatUsageDisplay`

Important details:

- Uses admin client to read/create `user_usage`.
- `incrementUsage` calls RPC `increment_user_usage`.
- API route increments usage only for useful answers, not search/AI outage fallbacks.

### `lib/rate-limit.ts`

Purpose: In-memory rate limiter and IP utilities.

Exports:

- default `rateLimit`
- `RateLimitError`
- `getClientIP`
- `createRateLimitToken`
- `setRateLimitHeaders`

Important details:

- Tracks token counts in a `Map`.
- Cleans expired entries every minute.
- Supports optional burst limits, although current API route instantiations do not pass `burstLimit`.

### `lib/logger.ts`

Purpose: Secure structured logging.

Exports:

- `SecureLogger`

Important details:

- Masks OpenAI keys, Anthropic keys, JWT/service role patterns, emails, most URLs, and paths.
- Keeps some debugging URLs whitelisted.
- Produces shorter sanitized logs in production.

### `lib/env-loader.ts`

Purpose: Script-only loader for `.env.local`.

Exports:

- `readEnv`

Important details:

- Reads `.env.local` with Node `fs`.
- Should not be imported by app routes, hooks, or components.
- `lib/embedding.ts` imports it, so any server/script path importing embeddings runs it.

### `lib/embedding.ts`

Purpose: OpenAI embedding generation.

Exports:

- `generateEmbedding`
- `getEmbeddingStatus`
- `resetRateLimiter`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- magnitude constants

Important details:

- Requires `OPENAI_API_KEY`.
- Default model is `text-embedding-3-large`.
- Default dimensions are `3072`.
- Validates embedding length, magnitude, finite values, and all-zero output.
- Has an internal request-per-minute limiter.

### `lib/vector-search.ts`

Purpose: Retrieve relevant code sections.

Exports:

- `getRelevantSections`
- `getRelevantSectionsWithQuality`
- `getHybridRelevantSections`
- `clearSearchCache`
- `getSearchCacheStats`

Important functions:

- Jurisdiction normalization before DB queries.
- Query expansion with electrical synonyms.
- Section/key-term extraction.
- Lexical score and metadata score calculation.
- Reranking with semantic and lexical scores.
- Relevance validation.
- Confidence-level calculation.
- Vector search through RPC `match_code_sections`.
- Smart text-search fallback over `code_sections`.

Important details:

- Uses OpenAI embeddings.
- Uses Supabase SSR client for database queries/RPC.
- Has a no-throw style fallback policy for search failures.
- Supports `include_all_years` for compare mode.

### `lib/ai-generate.ts`

Purpose: Generate final answer from retrieved sections.

Exports:

- `generateAnswer`
- `SafeCache`
- `clearCaches`
- `getCacheStats`

Important functions:

- `sanitizeInput`
- `validateInput`
- `safeJsonParse`
- `withTimeout`
- `withRetry`
- `extractFieldIntelligence`
- `detectPrimarySourceType`
- `generateAIAnswer`

Important details:

- Uses Anthropic API directly with `fetch`.
- Model is hardcoded as `claude-3-haiku-20240307`.
- Temperature is `0.0`.
- Requires JSON response.
- Distinguishes raw code vs enhanced guide sources in the system prompt.
- Enhanced guide sources cap confidence behavior through prompt rules and add verification tips in code.
- Uses a 5-minute in-memory answer cache.

### `lib/auth.ts`

Purpose: Simple auth helper.

Exports:

- `getCurrentUser`
- `requireAuth`

Important details:

- Uses `createServerClient`.
- Calls `supabase.auth.getSession()`, not `getUser`.
- Current API routes do not import this file; they implement auth checks directly with `getUser`.

## Middleware

File: `middleware.ts`

Runtime: `experimental-edge`.

Purpose:

- Preserve Supabase cookies during middleware processing.
- Allow OPTIONS preflight.
- Reject oversized API POST bodies.
- Redirect unauthenticated users away from configured protected UI pages.
- Add basic CSRF protection for mutating API requests.

Important constants:

- `PUBLIC_API = ['/api/auth', '/api/public', '/api/health']`
- `PUBLIC_PAGES = ['/', '/terms', '/privacy', '/error']`
- `PROTECTED_PAGES = ['/dashboard', '/chat', '/profile']`
- `MAX_PAYLOAD = 900000`

Internal flow:

1. Logs auth-debug info for `/api/auth` and `/auth/callback`.
2. Allows `OPTIONS` requests.
3. Rejects API POST bodies over 900 KB using `content-length`.
4. Creates `NextResponse.next()` before the Supabase client.
5. Creates Supabase SSR client with both request and response.
6. For protected UI pages only, calls `supabase.auth.getUser()`.
7. Redirects unauthenticated protected-page users to `/`, preserving cookies.
8. For API routes:
   - Public API prefixes return immediately.
   - Mutating methods require an `origin` header that includes the current `host`.
   - Returns the same response to preserve cookies.
9. Allows public pages.
10. Returns the response for all remaining matched paths.

Matcher:

- API routes.
- `/dashboard`, `/chat`, `/profile`.
- Most non-static assets.

Important not implemented note: The protected page paths configured in middleware do not exist in `app/` in the current codebase.

## Security

### RLS

The code expects Supabase RLS to protect user data:

- API routes use anon-key SSR clients with user cookies.
- `GET /api/chats` comments state RLS is enforced automatically.
- `GET /api/chats/[id]` verifies chat access through a `chats` query before loading messages.
- `POST /api/chat` explicitly filters existing chat validation by both `id` and `user_id`.
- Delete/update routes filter by `id` and `user_id`.

Actual RLS policy SQL is not present in this repository, so the exact policy definitions cannot be documented from code.

### Auth Checks

Implemented auth checks:

- Client gates asking questions in `Home.handleSendMessage`.
- `/api/chat`, `/api/chats`, `/api/chats/[id]`, and `/api/usage` authenticate with `supabase.auth.getUser()`.
- Middleware checks protected UI pages.
- `/api/auth/me` reports auth state.

### Admin Client

`lib/supabase-admin.ts` uses a service-role key and bypasses RLS. It is used by:

- `lib/usage-limits.ts`
- `scripts/setup-vector-db.ts`
- `lib/supabase-admin.ts` self-test utilities

Security boundary:

- It throws if used in browser.
- Comments warn not to use it in public API routes unless necessary.
- Current usage API indirectly uses admin client for `user_usage`, but after the route has authenticated with regular Supabase cookies.

### Server/Client Separation

Client-side:

- Components and hooks use `getBrowserClient`.
- UI calls API routes using cookies.
- No service-role key is imported by components/hooks.

Server-side:

- API routes use `createServerClient` with anon key and cookies.
- Scripts use admin client.
- AI calls and embedding calls are server/script-side code.

### Input Validation

- `/api/chat` validates question length, chat ID, jurisdiction, code year, and compare mode with Zod.
- `/api/chats/[id]` validates UUID route params with Zod.
- `PATCH /api/chats/[id]` validates title length.
- `middleware.ts` rejects large API POST bodies.
- `ai-generate.ts` sanitizes questions and rejects prompt-injection-like patterns.

### Rate Limiting

- `/api/chat`: 10 requests/minute/IP.
- `/api/usage`: 30 requests/minute/IP.
- `/api/chats`: 30 requests/minute/IP.
- `/api/chats/[id]`:
  - GET: 60 requests/minute/IP.
  - PATCH: 20 requests/minute/IP.
  - DELETE: 10 requests/minute/IP.
- `embedding.ts` has OpenAI request rate limiting for embeddings.

### XSS Protection

- `AnswerDisplay` uses `DOMPurify.sanitize` before rendering formatted answer HTML.

### CSRF Check

Middleware checks mutating API methods (`POST`, `PUT`, `DELETE`, `PATCH`) and requires `origin` to include the current `host`.

## Environment Variables

Variables found in code and `.env.local` names. Values are intentionally not included.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for browser and SSR clients.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key for browser and SSR clients.
- `SUPABASE_URL`: Preferred server-only Supabase URL for admin client; code can fall back to `NEXT_PUBLIC_SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: Service-role key for admin client, scripts, and usage-limit admin operations.
- `ANTHROPIC_API_KEY`: Key used by `lib/ai-generate.ts` for Anthropic Messages API.
- `OPENAI_API_KEY`: Key used by `lib/embedding.ts` for OpenAI embeddings.
- `EMBEDDING_MODEL`: Optional embedding model override.
- `EMBEDDING_DIMENSIONS`: Optional embedding dimension override.
- `OPENAI_RATE_LIMIT`: Optional embedding request-per-minute limit.
- `NODE_ENV`: Controls production/development behavior, logging, cookie security, and error detail.
- `CODE_SECTIONS_DIR`: Optional source directory for ingestion text files.
- `PARALLEL_EMBEDDINGS`: Script setting for embedding concurrency.
- `PARALLEL_FILES`: Script setting for file processing concurrency.
- `INSERT_CHUNK_SIZE`: Script setting for database insert batching.
- `MAX_RETRIES`: Script retry limit.
- `ENABLE_CHUNKING`: Script flag to enable/disable semantic chunking.
- `TARGET_CHUNK_SIZE`: Script target chunk size.
- `CHUNK_OVERLAP`: Script chunk overlap size.
- `MIN_CHUNK_SIZE`: Script minimum chunk size.
- `ENABLE_CONTEXTUAL_HEADERS`: Script flag for contextual heading injection.
- `ENABLE_KEYWORD_ENRICHMENT`: Script flag for keyword enrichment.
- `EMBEDDING_VERSION`: Script value stored in `code_sections.embedding_version`.
- `MAX_EMBEDDING_CHARS`: Script max characters sent for embeddings.
- `MAX_EMBEDDING_TOKENS`: Script token estimate limit.
- `ALLOW_DELETE_ALL`: Script safety flag allowing deletion of existing `code_sections`.
- `BATCH_DELAY_MS`: Script delay between batches.
- `DRY_RUN`: Script flag to avoid database writes.
- `ENABLE_BACKUP`: Script flag to back up existing `code_sections`.
- `ENABLE_INGESTION_LOG`: Script flag to write optional `ingestion_runs`.
- `RATE_LIMIT_PER_MINUTE`: Script configuration value.
- `NEXTAUTH_SECRET`: Present in `.env.local` names, but no current code references it.
- `NEXTAUTH_URL`: Present in `.env.local` names, but no current code references it.

## Feature List

Implemented features in current code:

- Anonymous landing page.
- Email/password sign in.
- Email/password sign up with terms/privacy checkbox.
- Supabase session tracking.
- Authenticated chat UI.
- Mobile header and mobile sidebar.
- Desktop sidebar.
- Recent chat list.
- Supabase realtime chat list updates.
- Start new chat.
- Persist current chat ID in `localStorage`.
- Auto-restore saved current chat on mount.
- Load chat messages from history.
- Ask a code question.
- Abort in-flight chat request on new request/new chat/unmount.
- 60-second client-side chat request timeout.
- IP rate limiting on API routes.
- Beta usage limit of 25 counted questions per user.
- Usage meter.
- Usage refresh after assistant answer.
- Jurisdiction selection.
- Supported jurisdictions:
  - California State
  - Los Angeles County, CA
  - San Francisco, CA
  - San Diego County, CA
  - Orange County, CA
  - All California
- Code year selector with explicit supported year `2026` and current label `2023`.
- Compare mode request flag.
- Zod validation for chat request, chat ID, and title update.
- Vector search over code sections.
- Query expansion with electrical synonyms.
- Section-number/key-term extraction.
- Reranking using semantic, lexical, and metadata scores.
- Fallback retrieval paths.
- Search quality metadata in `/api/chat` response.
- Anthropic answer generation.
- OpenAI embedding generation.
- AI answer caching.
- Search result caching.
- Source citations display.
- Expandable citation details.
- Copy citation content to clipboard.
- Action items display.
- Inspector tips display.
- Enhanced metadata display for amendments, field tips, costs, common failures, and inspector focus.
- DOMPurify sanitization for answer HTML.
- Static terms page.
- Static privacy page.
- OAuth callback route support.
- Chat list API.
- Chat detail API.
- Chat delete API.
- Chat title update API.
- Usage API.
- Auth status API.
- Middleware payload-size check.
- Middleware CSRF check for mutating API methods.
- Middleware protected-page redirects for configured paths.
- Vector database ingestion script.
- RAG quality-control test script.

## Not Implemented Yet

Code-backed or text-backed items that are not fully implemented/wired:

- No `app/auth/error/page.tsx`, even though auth callback redirects to `/auth/error`.
- No `/dashboard`, `/chat`, or `/profile` pages, even though middleware lists them as protected pages.
- `components/supabase-listener.tsx` exists but is not mounted by `Providers`.
- `hooks/use-chat-history.ts` exists but is not used by the current sidebar/page.
- `lib/auth.ts` exists but is not used by current API routes.
- OAuth callback route exists, but `AuthModal` does not show OAuth provider buttons.
- `DELETE /api/chats/[id]` exists, but there is no visible delete-chat UI.
- `PATCH /api/chats/[id]` exists, but there is no visible rename-chat UI.
- `messages.feedback` exists in the database type, but there is no feedback UI/API route implemented.
- `profiles` table is typed, but current code does not read or write profiles.
- `ingestion_runs` is used optionally by the script, but it is not included in `types/index.ts`.
- Self-serve account deletion is mentioned as a future promise in `app/privacy/page.tsx`, but no delete-account UI or API exists.
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are present in `.env.local` names, but no current code references NextAuth.
- The privacy page mentions Anthropic/Claude and OpenAI roles in prose. Code currently uses OpenAI for embeddings and Anthropic for final answers.
- Multi-year compare mode is sent to the backend and search can include all years, but `generateAnswer` does not implement a separate comparison algorithm and the client does not display `searchQuality`. Also, `yearsCompared` is not populated by `/api/chat` response construction.

## Interview Questions

Likely interview questions based on this codebase:

1. Walk me through what happens when a user submits a question.
2. How does `/api/chat` authenticate the user?
3. Why do API routes use `supabase.auth.getUser()` instead of trusting client state?
4. How are chat sessions and messages stored?
5. How does the app prevent one user from reading another user's chats?
6. What does RLS do here, and where is it assumed?
7. Why is the service-role admin client dangerous?
8. Where is the admin client used, and why?
9. How does the usage limit work?
10. When does the app increment usage, and when does it not?
11. How does the vector search work?
12. What is the role of OpenAI in this project?
13. What is the role of Anthropic in this project?
14. What does `match_code_sections` do?
15. What fallbacks exist if vector search fails?
16. How does query expansion improve search?
17. How does reranking work?
18. What is stored in `messages.sources`?
19. How are citations displayed on the frontend?
20. How does the app protect against XSS in AI output?
21. How does middleware handle Supabase cookies?
22. What CSRF protection exists?
23. What rate limits exist?
24. How does signup differ from login?
25. Why does `AuthModal` call `/api/auth/me` after Supabase auth?
26. What is not implemented even though the code references it?
27. What is the difference between `getBrowserClient`, `createServerClient`, and `getAdminClient`?
28. How does the ingestion script populate the vector database?
29. What are raw code sections versus enhanced guides?
30. Why does the AI prompt distinguish official code from enhanced guides?
31. How does the project handle jurisdiction selection?
32. What does compare mode currently do?
33. Which parts of the system are client-only?
34. Which parts must run on the server?
35. How would you add chat deletion to the UI using the existing API?
36. How would you add feedback support using the existing `messages.feedback` field?
37. What are the biggest security risks in this codebase?
38. What would you test before production deployment?
39. How would you verify RLS policies if SQL migrations are missing from the repo?
40. What are the main failure modes for `/api/chat`?

