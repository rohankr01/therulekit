# Architecture Document

This document describes the current project architecture based on the codebase.

## High-Level System

```text
Browser
  |
  | React UI, Supabase browser client, fetch()
  v
Next.js App Router
  |
  | API routes, middleware, Supabase SSR client
  v
Supabase
  |
  | Auth, Postgres, Realtime, RPC vector search
  v
OpenAI + Anthropic
  |
  | OpenAI embeddings, Anthropic final answer
  v
User sees answer with citations
```

Main runtime areas:

- Frontend: `app/page.tsx`, `components/`, `hooks/`
- Backend API: `app/api/**/route.ts`
- Auth/session helpers: `hooks/use-auth.tsx`, `lib/supabase.ts`, `middleware.ts`
- RAG/search: `lib/vector-search.ts`, `lib/embedding.ts`, `lib/ai-generate.ts`
- Database/admin utilities: `lib/supabase-admin.ts`, `lib/usage-limits.ts`
- Data ingestion: `scripts/setup-vector-db.ts`

## Frontend Flow

```text
app/layout.tsx
  |
  v
Providers
  |
  v
AuthProvider
  |
  v
app/page.tsx
  |
  +-- no user --> PremiumLandingPage --> AuthModal
  |
  +-- user ----> Chat App
                 |
                 +-- Sidebar
                 +-- Header
                 +-- ChatMessage list
                 +-- ExampleQuestions
                 +-- ChatInput
                 +-- UsageMeter
```

Detailed frontend flow:

1. `app/layout.tsx` wraps all pages in `Providers`.
2. `Providers` renders `AuthProvider` and Sonner `Toaster`.
3. `AuthProvider` creates the Supabase browser client and tracks `user`.
4. `app/page.tsx` checks `user`.
5. If no user exists, it renders the landing page and auth modal.
6. If a user exists, it renders the chat application.
7. `ChatInput` collects the question, jurisdiction, code year, and compare-mode state.
8. `useChat` handles local message state and API calls.
9. `ChatMessage` renders user messages directly and assistant messages through `AnswerDisplay`.
10. `AnswerDisplay` sanitizes answer HTML and renders citations, action items, tips, and enhanced metadata.

Frontend API calls:

```text
app/page.tsx
  -> GET /api/usage

components/auth-modal.tsx
  -> GET /api/auth/me
  -> supabase.auth.signInWithPassword()
  -> supabase.auth.signUp()

components/sidebar.tsx
  -> GET /api/chats
  -> supabase realtime channel: public.chats
  -> supabase.auth.signOut()

hooks/use-chat.ts
  -> GET /api/chats/:id
  -> POST /api/chat
```

## Backend Flow

```text
Request
  |
  v
middleware.ts
  |
  +-- OPTIONS preflight allowed
  +-- large API POST rejected
  +-- mutating API origin checked
  +-- configured protected pages checked
  |
  v
API Route
  |
  +-- create Supabase SSR client
  +-- authenticate with getUser()
  +-- validate request
  +-- perform route-specific work
  +-- return JSON with Supabase cookies preserved
```

Backend routes:

```text
GET  /api/auth/me
POST /api/chat
GET  /api/usage
GET  /api/chats
GET  /api/chats/:id
PATCH /api/chats/:id
DELETE /api/chats/:id
GET/POST /auth/callback
```

Backend client separation:

```text
Browser components/hooks
  -> lib/supabase.ts:getBrowserClient()
  -> anon key + browser cookies

API routes/middleware
  -> lib/supabase.ts:createServerClient()
  -> anon key + request cookies

Scripts/admin operations
  -> lib/supabase-admin.ts:getAdminClient()
  -> service role key, bypasses RLS
```

## Authentication Flow

### Initial Auth Check

```text
Page load
  |
  v
AuthProvider mounts
  |
  v
getBrowserClient()
  |
  v
supabase.auth.getUser()
  |
  +-- user found ----> set user, show chat app
  |
  +-- no user/error -> set user null, show landing page
```

### Email/Password Login

```text
User opens AuthModal
  |
  v
Enter email/password
  |
  v
supabase.auth.signInWithPassword()
  |
  +-- failure --> show toast/error/cooldown
  |
  +-- success
       |
       v
     GET /api/auth/me
       |
       v
     server validates cookies with getUser()
       |
       v
     onSuccess() closes modal
```

### Signup

```text
User opens AuthModal
  |
  v
Enter email/password + accept terms
  |
  v
supabase.auth.signUp()
  |
  +-- no immediate session --> tell user to check email
  |
  +-- session exists
       |
       v
     GET /api/auth/me
       |
       v
     onSuccess()
```

### OAuth Callback Route

```text
Provider redirects to /auth/callback?code=...
  |
  v
app/auth/callback/route.ts
  |
  +-- validate code
  +-- validate same-origin redirect_to
  +-- create redirect response first
  +-- create Supabase SSR client with response
  +-- exchangeCodeForSession(code)
  |
  v
return same redirect response with cookies
```

Note: The callback route exists, but the current auth modal does not render OAuth provider buttons.

## Chat Flow

```text
User types question
  |
  v
ChatInput.handleSubmit()
  |
  v
Home.handleSendMessage()
  |
  +-- no user --> open AuthModal
  +-- no quota -> show toast
  |
  v
useChat.sendMessage()
  |
  +-- append user message locally
  +-- append temporary assistant message locally
  +-- POST /api/chat
  |
  v
/api/chat
  |
  +-- authenticate
  +-- check usage
  +-- create/validate chat
  +-- run vector search
  +-- generate AI answer
  +-- save messages
  +-- maybe increment usage
  |
  v
useChat replaces temporary message with answer
```

### Chat State

```text
useChat state
  |
  +-- messages
  +-- isLoading
  +-- cooldownUntil
  +-- currentChatId
  +-- abortControllerRef
```

### Chat History

```text
Sidebar mounts with user
  |
  v
GET /api/chats
  |
  v
render recent chats
  |
  v
subscribe to Supabase realtime public.chats
  |
  +-- INSERT --> prepend chat
  +-- UPDATE --> update title/data
  +-- DELETE --> remove chat
```

### Loading Existing Chat

```text
User selects chat in Sidebar
  |
  v
Home.handleChatSelect(chatId)
  |
  v
useChat.loadChat(chatId)
  |
  v
GET /api/chats/:id
  |
  v
API verifies user + chat access
  |
  v
returns messages
  |
  v
useChat maps DB rows to frontend Message objects
```

## AI Flow

```text
Question
  |
  v
/api/chat
  |
  v
getRelevantSectionsWithQuality()
  |
  v
generateAnswer()
  |
  v
Anthropic Messages API
  |
  v
JSON response parsed into GeneratedAnswer
  |
  v
Answer saved + returned
```

Detailed AI answer flow:

1. `/api/chat` receives a validated question.
2. `/api/chat` retrieves relevant code sections using `lib/vector-search.ts`.
3. `/api/chat` passes the question and sections to `generateAnswer`.
4. `generateAnswer` sanitizes input.
5. `generateAnswer` rejects empty, too-long, or prompt-injection-like input.
6. It checks an in-memory cache.
7. It detects whether sources are raw code, enhanced guides, or mixed.
8. It builds a prompt with source-type labels.
9. It calls Anthropic with model `claude-3-haiku-20240307`.
10. It expects a JSON object containing answer, confidence, action items, and inspector tips.
11. It parses and normalizes the result.
12. It returns a `GeneratedAnswer`.

AI generation diagram:

```text
generateAnswer()
  |
  +-- sanitizeInput()
  +-- validateInput()
  +-- cache lookup
  |
  v
generateAIAnswer()
  |
  +-- detectPrimarySourceType()
  +-- extractFieldIntelligence()
  +-- build technical context
  +-- build enhanced context
  |
  v
fetch Anthropic API
  |
  v
safeJsonParse()
  |
  +-- invalid JSON -> fallback answer with sections
  +-- not found ----> low-confidence not-covered answer
  +-- valid --------> GeneratedAnswer
```

## Database Flow

### Runtime Database Use

```text
API routes
  |
  v
Supabase SSR client
  |
  +-- chats
  +-- messages
  +-- user_usage indirectly through admin helper
  +-- code_sections indirectly through vector search
```

### Tables

```text
auth.users
  |
  +-- chats.user_id
  |     |
  |     +-- messages.chat_id
  |
  +-- user_usage.user_id

code_sections
  |
  +-- used by vector search
  +-- populated by setup-vector-db.ts
```

Current typed tables:

- `profiles`
- `code_sections`
- `chats`
- `messages`
- `user_usage`

Current typed RPC functions:

- `match_code_sections`
- `increment_user_usage`

### `/api/chat` Database Flow

```text
/api/chat
  |
  +-- user_usage
  |     |
  |     +-- checkUsageLimit()
  |
  +-- chats
  |     |
  |     +-- insert new chat
  |     +-- or validate existing chat owner
  |
  +-- code_sections
  |     |
  |     +-- RPC match_code_sections
  |     +-- fallback text search
  |
  +-- messages
  |     |
  |     +-- insert user message
  |     +-- insert assistant message
  |
  +-- user_usage
        |
        +-- increment_user_usage()
```

### Data Ingestion Flow

```text
data/code-sections/*.txt
  |
  v
scripts/setup-vector-db.ts
  |
  +-- read files
  +-- extract metadata
  +-- split into sections
  +-- semantic chunking
  +-- contextual headers / keyword enrichment
  +-- OpenAI embeddings
  +-- insert into code_sections
```

Ingestion uses the admin client:

```text
setup-vector-db.ts
  |
  v
getAdminClient()
  |
  v
Supabase service role
  |
  v
code_sections insert/delete/select
```

## OpenAI Flow

OpenAI is used for embeddings, not final answer generation.

```text
Question or chunk text
  |
  v
generateEmbedding()
  |
  +-- readEnv()
  +-- validate input
  +-- rateLimiter.waitIfNeeded()
  |
  v
OpenAI embeddings.create()
  |
  model: text-embedding-3-large by default
  dimensions: 3072 by default
  |
  v
validateEmbedding()
  |
  +-- dimension check
  +-- magnitude check
  +-- NaN/Infinity check
  +-- all-zero check
  |
  v
embedding vector
```

OpenAI is used in two places:

```text
Runtime search:
  /api/chat
    -> vector-search.ts
    -> embedding.ts
    -> OpenAI embedding

Data ingestion:
  setup-vector-db.ts
    -> embedding.ts
    -> OpenAI embedding
    -> code_sections.embedding
```

Important configuration:

- `OPENAI_API_KEY`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- `OPENAI_RATE_LIMIT`

## Vector Search Flow

```text
getRelevantSectionsWithQuality(question, options)
  |
  +-- validate question
  +-- normalize jurisdiction
  +-- compute date/year filter
  +-- check search cache
  +-- expand query
  |
  v
for each query variation
  |
  +-- generate OpenAI embedding
  +-- validate embedding
  +-- call vectorSearchWithQuality()
  |
  v
Supabase RPC match_code_sections
  |
  v
convert rows to CodeSection
  |
  v
rerankSections()
  |
  +-- semantic score
  +-- lexical score
  +-- metadata boost
  |
  v
validateRelevance()
  |
  v
determineConfidenceLevel()
  |
  v
SearchResultWithQuality
```

Fallback flow:

```text
Primary vector search
  |
  +-- good result --> return
  |
  +-- no result
       |
       v
     Fallback 1: lower vector threshold
       |
       +-- good result --> return
       |
       +-- no result
            |
            v
          Fallback 2: California State search
            |
            +-- good result --> return
            |
            +-- no result
                 |
                 v
               Fallback 3: smart text search
                 |
                 +-- result --> return low-confidence text result
                 |
                 +-- no result --> return empty low-confidence result
```

Vector search components:

```text
Query preparation
  |
  +-- normalizeJurisdictionBeforeQuery()
  +-- expandQuery()
  +-- extractKeyTerms()

Vector retrieval
  |
  +-- generateEmbedding()
  +-- match_code_sections RPC

Post-processing
  |
  +-- convertToCodeSection()
  +-- calculateLexicalScore()
  +-- calculateMetadataScore()
  +-- rerankSections()
  +-- validateRelevance()
  +-- determineConfidenceLevel()

Fallback
  |
  +-- lower threshold
  +-- California State
  +-- smartTextSearch()
```

## End-To-End Chat Request Diagram

```text
User
 |
 v
ChatInput
 |
 v
Home.handleSendMessage
 |
 v
useChat.sendMessage
 |
 v
POST /api/chat
 |
 +--> rateLimit()
 |
 +--> createServerClient()
 |
 +--> supabase.auth.getUser()
 |
 +--> checkUsageLimit()
 |
 +--> Zod validate body
 |
 +--> chats insert/validate
 |
 +--> getRelevantSectionsWithQuality()
 |      |
 |      +--> generateEmbedding()
 |      |      |
 |      |      +--> OpenAI embeddings
 |      |
 |      +--> match_code_sections RPC
 |      |
 |      +--> rerank + validate + quality
 |
 +--> generateAnswer()
 |      |
 |      +--> Anthropic Messages API
 |      |
 |      +--> parse JSON
 |
 +--> messages insert user
 |
 +--> messages insert assistant
 |
 +--> incrementUsage()
 |
 v
JSON response
 |
 v
useChat replaces thinking message
 |
 v
AnswerDisplay renders answer + citations
```

## Important Boundaries

```text
Client boundary
  |
  +-- can use NEXT_PUBLIC_* variables
  +-- uses anon Supabase browser client
  +-- never imports service-role admin client

Server/API boundary
  |
  +-- validates cookies with Supabase getUser()
  +-- uses anon Supabase SSR client
  +-- preserves Supabase cookie headers

Admin/script boundary
  |
  +-- uses SUPABASE_SERVICE_ROLE_KEY
  +-- bypasses RLS
  +-- should never run in browser

AI boundary
  |
  +-- OpenAI receives text for embeddings
  +-- Anthropic receives question + retrieved code sections
```

## Notable Current Gaps

- OAuth callback exists, but no OAuth buttons are rendered in `AuthModal`.
- `SupabaseAuthSync` exists but is not mounted.
- Chat delete/update API routes exist, but there is no UI for deleting or renaming chats.
- Middleware lists `/dashboard`, `/chat`, and `/profile` as protected pages, but those pages are not present.
- `/auth/error` is used as a redirect target, but no matching page exists.
- Compare mode is sent through the request and affects search result count/all-years search, but there is no dedicated comparison renderer.

