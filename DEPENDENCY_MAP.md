# Dependency Map

This map shows the important files and their execution paths in the current codebase.

Legend:

```text
A
v
B
```

Means `A` depends on, calls, imports, renders, or triggers `B`.

## Main App Startup

```text
app/layout.tsx
v
components/providers.tsx
v
hooks/use-auth.tsx
v
lib/supabase.ts
v
Supabase Auth
```

```text
app/layout.tsx
v
app/globals.css
v
Tailwind/global browser styles
```

```text
app/layout.tsx
v
components/providers.tsx
v
sonner Toaster
v
Toast notifications used across UI
```

## Home Page Flow

```text
app/page.tsx
v
hooks/use-auth.tsx
v
lib/supabase.ts:getBrowserClient()
v
Supabase browser client
v
Supabase Auth user/session state
```

```text
app/page.tsx
v
hooks/use-chat.ts
v
POST /api/chat
v
app/api/chat/route.ts
```

```text
app/page.tsx
v
GET /api/usage
v
app/api/usage/route.ts
v
lib/usage-limits.ts
v
lib/supabase-admin.ts
v
Supabase user_usage table
```

```text
app/page.tsx
v
components/sidebar.tsx
v
GET /api/chats
v
app/api/chats/route.ts
v
Supabase chats table
```

```text
app/page.tsx
v
components/header.tsx
v
hooks/use-auth.tsx
v
Supabase Auth user state
```

```text
app/page.tsx
v
components/chat-input.tsx
v
components/jurisdiction-selector.tsx
v
types/index.ts
v
SUPPORTED_JURISDICTIONS
```

```text
app/page.tsx
v
components/chat-message.tsx
v
components/answer-display.tsx
v
types/index.ts
v
GeneratedAnswer / CodeSection shape
```

```text
app/page.tsx
v
components/example-questions.tsx
v
Home.handleSendMessage()
v
hooks/use-chat.ts:sendMessage()
v
POST /api/chat
```

```text
app/page.tsx
v
components/auth-modal.tsx
v
hooks/use-auth.tsx
v
Supabase Auth sign in/sign up
```

```text
app/page.tsx
v
components/usage-meter.tsx
v
lib/usage-limits.ts
v
BETA_QUERY_LIMIT
```

## Auth Modal Flow

### Sign In

```text
components/auth-modal.tsx
v
hooks/use-auth.tsx
v
lib/supabase.ts:getBrowserClient()
v
supabase.auth.signInWithPassword()
v
Supabase Auth
v
GET /api/auth/me
v
app/api/auth/me/route.ts
v
lib/supabase.ts:createServerClient()
v
supabase.auth.getUser()
v
Supabase Auth cookie/session validation
```

### Sign Up

```text
components/auth-modal.tsx
v
hooks/use-auth.tsx
v
lib/supabase.ts:getBrowserClient()
v
supabase.auth.signUp()
v
Supabase Auth
v
optional email redirect to /auth/callback
v
app/auth/callback/route.ts
v
lib/supabase.ts:createServerClient()
v
supabase.auth.exchangeCodeForSession()
v
Supabase Auth cookies
```

### Server Auth Check

```text
components/auth-modal.tsx
v
GET /api/auth/me
v
app/api/auth/me/route.ts
v
lib/supabase.ts:createServerClient()
v
headersWithSupabaseCookies()
v
Supabase Auth
```

## Auth Provider Flow

```text
hooks/use-auth.tsx
v
lib/supabase.ts:getBrowserClient()
v
@supabase/ssr createBrowserClient()
v
Supabase browser cookie session
```

```text
hooks/use-auth.tsx
v
supabase.auth.getUser()
v
Supabase Auth
v
setUser()
v
app/page.tsx render branch
```

```text
hooks/use-auth.tsx
v
supabase.auth.onAuthStateChange()
v
SIGNED_OUT event
v
window.location.replace('/')
```

## Chat Input To Full AI Answer

```text
components/chat-input.tsx
v
Home.handleSendMessage()
v
hooks/use-chat.ts:sendMessage()
v
POST /api/chat
v
app/api/chat/route.ts
v
lib/rate-limit.ts
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
lib/usage-limits.ts:checkUsageLimit()
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase user_usage table
v
Supabase chats table
v
lib/vector-search.ts:getRelevantSectionsWithQuality()
v
lib/embedding.ts:generateEmbedding()
v
OpenAI embeddings API
v
Supabase RPC match_code_sections
v
Supabase code_sections table
v
lib/ai-generate.ts:generateAnswer()
v
Anthropic Messages API
v
Supabase messages table
v
lib/usage-limits.ts:incrementUsage()
v
Supabase RPC increment_user_usage
v
hooks/use-chat.ts replaces thinking message
v
components/chat-message.tsx
v
components/answer-display.tsx
```

## `useChat` Dependencies

```text
hooks/use-chat.ts
v
types/index.ts
v
Message / GeneratedAnswer / Jurisdiction / CodeYear
```

```text
hooks/use-chat.ts
v
swr mutate()
v
refresh /api/chats cache key
```

```text
hooks/use-chat.ts:startNewChat()
v
local state cleared
v
localStorage currentChatId removed
v
mutate('/api/chats')
```

```text
hooks/use-chat.ts:verifyChatExists()
v
GET /api/chats/:id
v
app/api/chats/[id]/route.ts
v
Supabase chats table
```

```text
hooks/use-chat.ts:loadChat()
v
GET /api/chats/:id
v
app/api/chats/[id]/route.ts
v
Supabase chats table
v
Supabase messages table
v
map DB message rows to frontend Message[]
```

```text
hooks/use-chat.ts:sendMessage()
v
POST /api/chat
v
app/api/chat/route.ts
v
AI/search/database flow
```

## Sidebar / Chat History Flow

```text
components/sidebar.tsx
v
hooks/use-auth.tsx
v
Supabase user + client
```

```text
components/sidebar.tsx
v
fetchChats()
v
GET /api/chats
v
app/api/chats/route.ts
v
lib/rate-limit.ts
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
Supabase chats table
```

```text
components/sidebar.tsx
v
supabase.channel(`realtime-chats-${user.id}`)
v
postgres_changes subscription
v
Supabase Realtime
v
public.chats table
v
Sidebar local chats state
```

```text
components/sidebar.tsx
v
handleLogout()
v
supabase.auth.signOut()
v
Supabase Auth
v
hooks/use-auth.tsx onAuthStateChange()
v
user cleared / redirect if needed
```

## Chat Message Rendering Flow

```text
components/chat-message.tsx
v
User message
v
plain paragraph render
```

```text
components/chat-message.tsx
v
Assistant message
v
components/answer-display.tsx
v
formatAnswer()
v
DOMPurify.sanitize()
v
dangerouslySetInnerHTML
```

```text
components/answer-display.tsx
v
GeneratedAnswer.citedSections
v
CitationItem
v
CopyButton
v
navigator.clipboard.writeText()
```

## API: `/api/chat`

```text
app/api/chat/route.ts
v
lib/rate-limit.ts:rateLimit()
v
IP-based request limiting
```

```text
app/api/chat/route.ts
v
lib/supabase.ts:createServerClient()
v
Supabase SSR client
v
supabase.auth.getUser()
v
authenticated user
```

```text
app/api/chat/route.ts
v
lib/usage-limits.ts:checkUsageLimit()
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase user_usage table
```

```text
app/api/chat/route.ts
v
Zod schema validation
v
types/index.ts
v
SUPPORTED_JURISDICTIONS / SUPPORTED_CODE_YEARS
```

```text
app/api/chat/route.ts
v
new chat path
v
Supabase chats insert
```

```text
app/api/chat/route.ts
v
existing chat path
v
Supabase chats select
v
id + user_id validation
```

```text
app/api/chat/route.ts
v
lib/vector-search.ts:getRelevantSectionsWithQuality()
v
retrieved CodeSection[]
```

```text
app/api/chat/route.ts
v
lib/ai-generate.ts:generateAnswer()
v
GeneratedAnswer
```

```text
app/api/chat/route.ts
v
insertMessagesSequentially()
v
Supabase messages insert user message
v
10ms delay
v
Supabase messages insert assistant message
```

```text
app/api/chat/route.ts
v
lib/usage-limits.ts:incrementUsage()
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase RPC increment_user_usage
```

## API: `/api/usage`

```text
app/api/usage/route.ts
v
lib/rate-limit.ts
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
lib/usage-limits.ts:checkUsageLimit()
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase user_usage table
```

## API: `/api/chats`

```text
app/api/chats/route.ts
v
lib/rate-limit.ts
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
Supabase chats table
v
ordered chat list
v
components/sidebar.tsx
```

## API: `/api/chats/[id]`

### Load Messages

```text
app/api/chats/[id]/route.ts GET
v
lib/rate-limit.ts
v
Zod UUID validation
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
Supabase chats table
v
verify chat exists / RLS access
v
Supabase messages table
v
formatted messages
v
hooks/use-chat.ts:loadChat()
```

### Delete Chat

```text
app/api/chats/[id]/route.ts DELETE
v
lib/rate-limit.ts
v
Zod UUID validation
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
Supabase chats delete
v
id + user_id filter
```

Current UI note: no visible component calls this route.

### Rename Chat

```text
app/api/chats/[id]/route.ts PATCH
v
lib/rate-limit.ts
v
Zod UUID validation
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
Zod title validation
v
Supabase chats update
v
id + user_id filter
```

Current UI note: no visible component calls this route.

## API: `/api/auth/me`

```text
app/api/auth/me/route.ts
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
headersWithSupabaseCookies()
v
components/auth-modal.tsx or components/supabase-listener.tsx
```

Current wiring note:

```text
components/supabase-listener.tsx
v
GET /api/auth/me
```

But:

```text
components/providers.tsx
v
does not render SupabaseAuthSync
```

So `components/supabase-listener.tsx` exists but is not active in the current app.

## Auth Callback Route

```text
app/auth/callback/route.ts
v
lib/logger.ts:SecureLogger
v
lib/supabase.ts:createServerClient()
v
Supabase Auth exchangeCodeForSession()
v
redirect response with cookies
```

Error path:

```text
app/auth/callback/route.ts
v
redirect /auth/error
```

Current implementation note: there is no `app/auth/error/page.tsx` in the current codebase.

## Middleware Dependency Path

```text
middleware.ts
v
lib/supabase.ts:createServerClient()
v
Supabase Auth getUser()
v
protected page redirect or request pass-through
```

Middleware also performs:

```text
middleware.ts
v
content-length check
v
413 Payload too large
```

```text
middleware.ts
v
origin/host check for POST/PUT/PATCH/DELETE API calls
v
403 Invalid request origin
```

Protected page path:

```text
request to /dashboard, /chat, or /profile
v
middleware.ts
v
Supabase getUser()
v
no user
v
redirect /
```

Current implementation note: `/dashboard`, `/chat`, and `/profile` pages are not present.

## Vector Search Dependencies

```text
lib/vector-search.ts
v
lib/embedding.ts
v
OpenAI embeddings API
```

```text
lib/vector-search.ts
v
lib/supabase.ts:createServerClient()
v
Supabase RPC match_code_sections
v
Supabase code_sections table
```

```text
lib/vector-search.ts
v
types/index.ts
v
CodeSection / SearchResultWithQuality / HybridSearchResult
```

```text
lib/vector-search.ts
v
lib/logger.ts:SecureLogger
v
safe logs
```

Full vector search path:

```text
lib/vector-search.ts:getRelevantSectionsWithQuality()
v
normalizeJurisdictionBeforeQuery()
v
formatDateForDatabase()
v
getFromCache()
v
expandQuery()
v
lib/embedding.ts:generateEmbedding()
v
OpenAI embeddings API
v
validateEmbedding()
v
vectorSearchWithQuality()
v
Supabase RPC match_code_sections
v
convertToCodeSection()
v
rerankSections()
v
calculateLexicalScore()
v
extractKeyTerms()
v
calculateMetadataScore()
v
validateRelevance()
v
determineConfidenceLevel()
v
SearchResultWithQuality
```

Fallback dependency path:

```text
primary vector search fails
v
lower threshold vector search
v
California State vector search
v
smartTextSearch()
v
Supabase code_sections select
v
text-score fallback result
```

Hybrid search path:

```text
lib/vector-search.ts:getHybridRelevantSections()
v
getRelevantSectionsWithQuality()
v
filter technicalSections
v
filter enhancedSections
v
extractFieldIntelligence()
v
HybridSearchResult
```

## Embedding Dependencies

```text
lib/embedding.ts
v
lib/env-loader.ts:readEnv()
v
.env.local
```

```text
lib/embedding.ts
v
openai package
v
OpenAI embeddings.create()
v
embedding vector
```

```text
lib/embedding.ts
v
lib/logger.ts:SecureLogger
v
embedding logs/errors
```

Full embedding path:

```text
lib/embedding.ts:generateEmbedding(text)
v
clean text
v
RateLimiter.waitIfNeeded()
v
openai.embeddings.create()
v
validateEmbedding()
v
return number[]
```

## AI Generation Dependencies

```text
lib/ai-generate.ts
v
types/index.ts
v
CodeSection / GeneratedAnswer / EnhancedMetadata
```

```text
lib/ai-generate.ts
v
lib/logger.ts:SecureLogger
v
safe logs
```

```text
lib/ai-generate.ts
v
crypto
v
cache key hashing
```

```text
lib/ai-generate.ts
v
fetch('https://api.anthropic.com/v1/messages')
v
Anthropic Messages API
v
JSON answer
```

Full answer generation path:

```text
lib/ai-generate.ts:generateAnswer()
v
sanitizeInput()
v
validateInput()
v
SafeCache.get()
v
generateAIAnswer()
v
detectPrimarySourceType()
v
extractFieldIntelligence()
v
build system prompt + user prompt
v
withRetry()
v
withTimeout()
v
Anthropic Messages API
v
safeJsonParse()
v
GeneratedAnswer
```

Fallback answer path:

```text
Anthropic unavailable or invalid response
v
lib/ai-generate.ts fallback response
v
citedSections from retrieved sections
v
low confidence
```

## Supabase Client Dependencies

### Browser Client

```text
lib/supabase.ts:getBrowserClient()
v
@supabase/ssr:createBrowserClient()
v
NEXT_PUBLIC_SUPABASE_URL
v
NEXT_PUBLIC_SUPABASE_ANON_KEY
v
browser cookie auth
```

Used by:

```text
hooks/use-auth.tsx
v
components/auth-modal.tsx
v
components/sidebar.tsx
```

### Server Client

```text
lib/supabase.ts:createServerClient()
v
@supabase/ssr:createServerClient()
v
NEXT_PUBLIC_SUPABASE_URL
v
NEXT_PUBLIC_SUPABASE_ANON_KEY
v
request cookies
v
response cookie setters
```

Used by:

```text
middleware.ts
app/api/auth/me/route.ts
app/api/chat/route.ts
app/api/chats/route.ts
app/api/chats/[id]/route.ts
app/api/usage/route.ts
app/auth/callback/route.ts
lib/vector-search.ts
lib/auth.ts
```

### Admin Client

```text
lib/supabase-admin.ts:getAdminClient()
v
@supabase/supabase-js:createClient()
v
SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
v
SUPABASE_SERVICE_ROLE_KEY
v
Supabase service role
v
bypasses RLS
```

Used by:

```text
lib/usage-limits.ts
v
user_usage table
v
increment_user_usage RPC
```

```text
scripts/setup-vector-db.ts
v
code_sections table
v
optional ingestion_runs table
```

## Usage Limit Dependencies

```text
lib/usage-limits.ts:checkUsageLimit()
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase user_usage select maybeSingle()
v
if missing, insert user_usage row
v
return allowed/queryCount
```

```text
lib/usage-limits.ts:incrementUsage()
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase RPC increment_user_usage
v
return new count
```

Used by:

```text
app/api/chat/route.ts
app/api/usage/route.ts
components/usage-meter.tsx
app/page.tsx
```

## Rate Limit Dependencies

```text
lib/rate-limit.ts
v
in-memory Map
v
RateLimiter.check()
v
RateLimitError with retryAfter
```

Used by:

```text
app/api/chat/route.ts
app/api/usage/route.ts
app/api/chats/route.ts
app/api/chats/[id]/route.ts
```

IP extraction path:

```text
Request headers
v
cf-connecting-ip
v
x-forwarded-for
v
x-real-ip
v
unknown fallback
```

## Logger Dependencies

```text
lib/logger.ts
v
SecureLogger
v
sanitizeString()
v
mask API keys / JWTs / emails / paths / URLs
v
console log/warn/error/debug
```

Used by:

```text
app/api/usage/route.ts
app/auth/callback/route.ts
lib/usage-limits.ts
lib/embedding.ts
lib/ai-generate.ts
lib/vector-search.ts
scripts/setup-vector-db.ts
```

## Types Dependency Hub

```text
types/index.ts
v
Database interface
v
CodeSection
v
GeneratedAnswer
v
Message
v
Jurisdiction / CodeYear
v
constants and type guards
```

Used by:

```text
app/page.tsx
app/api/chat/route.ts
app/api/chats/[id]/route.ts
components/answer-display.tsx
components/chat-input.tsx
components/chat-message.tsx
components/jurisdiction-selector.tsx
hooks/use-chat.ts
hooks/use-chat-history.ts
lib/supabase.ts
lib/supabase-admin.ts
lib/usage-limits.ts
lib/vector-search.ts
lib/ai-generate.ts
scripts/setup-vector-db.ts
scripts/test-questions.ts
```

## Static Pages

```text
app/privacy/page.tsx
v
static JSX
v
browser render
```

```text
app/terms/page.tsx
v
static JSX
v
browser render
```

Both are linked from:

```text
app/page.tsx landing footer
components/auth-modal.tsx signup checkbox text
```

## Ingestion Script Dependency Path

```text
scripts/setup-vector-db.ts
v
lib/env-loader.ts:readEnv()
v
.env.local
v
lib/supabase-admin.ts:getAdminClient()
v
Supabase service role
v
data/code-sections/*.txt
v
parse sections
v
semantic chunking
v
metadata extraction
v
lib/embedding.ts:generateEmbedding()
v
OpenAI embeddings API
v
Supabase code_sections insert
v
optional ingestion_runs logging
```

Optional destructive path:

```text
scripts/setup-vector-db.ts
v
ALLOW_DELETE_ALL=true
v
optional backup if ENABLE_BACKUP=true
v
Supabase code_sections delete
```

## Test Script Dependency Path

```text
scripts/test-questions.ts
v
lib/env-loader.ts:readEnv()
v
lib/vector-search.ts:getRelevantSections()
v
lib/vector-search.ts:getHybridRelevantSections()
v
lib/ai-generate.ts:generateAnswer()
v
OpenAI embeddings + Supabase + Anthropic
v
console quality report
```

## Unused Or Not Wired Important Files

```text
components/supabase-listener.tsx
v
GET /api/auth/me
```

But:

```text
components/providers.tsx
v
does not render SupabaseAuthSync
```

So it is not active.

```text
hooks/use-chat-history.ts
v
GET /api/chats
v
SWR chat history cache
```

But current `Sidebar` does its own `fetch('/api/chats')`, so this hook is not used by the active UI.

```text
lib/auth.ts
v
lib/supabase.ts:createServerClient()
v
supabase.auth.getSession()
```

But current API routes do not import this helper; they directly call `supabase.auth.getUser()`.

## Complete Runtime Dependency Summary

```text
User browser
v
app/layout.tsx
v
components/providers.tsx
v
hooks/use-auth.tsx
v
app/page.tsx
v
components/chat-input.tsx
v
hooks/use-chat.ts
v
app/api/chat/route.ts
v
lib/rate-limit.ts
v
lib/supabase.ts
v
Supabase Auth
v
lib/usage-limits.ts
v
lib/supabase-admin.ts
v
Supabase user_usage
v
Supabase chats
v
lib/vector-search.ts
v
lib/embedding.ts
v
OpenAI embeddings
v
Supabase RPC match_code_sections
v
Supabase code_sections
v
lib/ai-generate.ts
v
Anthropic Messages API
v
Supabase messages
v
Supabase RPC increment_user_usage
v
hooks/use-chat.ts
v
components/chat-message.tsx
v
components/answer-display.tsx
v
User sees answer with citations
```

