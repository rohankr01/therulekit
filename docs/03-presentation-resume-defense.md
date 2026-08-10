# Presentation And Resume Defense

All explanations below are based only on the current codebase.

## 2-Minute Explanation

My project is `ecai-ai`, branded in the UI as TheRuleKit. It is a Next.js application for asking California electrical code questions. Authenticated users can ask a question, choose a jurisdiction, and receive an AI-generated answer with cited code sections.

The frontend is built with React client components and Tailwind. Supabase handles authentication, session cookies, chat history, realtime chat updates in the sidebar, and usage tracking. The main backend route is `/api/chat`. It validates the request with Zod, authenticates the user, checks the beta usage limit, creates or validates a chat, retrieves relevant code sections, generates an answer, stores both messages, and increments usage only when a useful answer was produced.

The AI flow is retrieval-augmented generation. OpenAI is used for embeddings through `lib/embedding.ts`. Supabase RPC `match_code_sections` retrieves matching rows from `code_sections`. Then `lib/ai-generate.ts` sends the retrieved sections to Anthropic Claude and asks for structured JSON. The UI renders the answer, action items, inspector tips, and citations.

The project is a beta. It has real auth, persistence, retrieval, generation, and quota control, but SQL migrations, exact RLS policies, and vector index definitions are not present in the repo.

## 5-Minute Explanation

TheRuleKit is an AI assistant for California electrical code questions. The repository name is `ecai-ai`, and the product name shown to users is TheRuleKit.

The app uses Next.js App Router. `app/layout.tsx` sets metadata and wraps the app in `Providers`. `Providers` mounts `AuthProvider` and Sonner toasts. `AuthProvider` creates a Supabase browser client and tracks the current user through `supabase.auth.getUser()` and `onAuthStateChange`.

The main page is `app/page.tsx`. If there is no user, it shows a landing page and auth modal. If there is a user, it shows the chat app: sidebar, mobile header, message list, examples, input, and usage meter. The user can choose jurisdiction, select current 2023 or 2026 code year, and toggle compare mode.

The main user action goes through `useChat.sendMessage`. That hook adds a user message, adds a temporary assistant “researching” message, and calls `POST /api/chat`. The API route rate-limits the IP, authenticates with Supabase cookie-based SSR client, checks the beta quota from `user_usage`, validates the body with Zod, and creates or validates a chat row.

Then RAG starts. `lib/vector-search.ts` normalizes jurisdiction, expands the query with electrical synonyms, generates OpenAI embeddings, calls Supabase RPC `match_code_sections`, reranks results using semantic score, lexical score, and metadata bonuses, and falls back to lower threshold, California State search, or text search if needed.

After retrieval, `lib/ai-generate.ts` builds a prompt for Anthropic Claude. It labels sources as official code or enhanced guides, asks for JSON only, and requires the model to answer only from provided sections. The backend saves both user and assistant messages in Supabase and increments usage only if sections were found and confidence was not low.

The biggest honest limitation is that the repo has TypeScript database types but no SQL migrations. So table shapes are visible, but exact RLS policies, vector indexes, foreign keys, and RPC SQL bodies cannot be verified from the current codebase.

## 10-Minute Explanation

Start with the problem: electrical code lookup is slow because users often know the practical question but not the exact section number. This project gives a chat interface over stored electrical code data.

Frontend architecture:

- `app/page.tsx` coordinates the user experience.
- `hooks/use-auth.tsx` manages Supabase auth state.
- `hooks/use-chat.ts` manages conversation state, request cancellation, localStorage chat ID restoration, cooldowns, and API calls.
- `components/sidebar.tsx` shows chat history and listens to Supabase realtime changes.
- `components/answer-display.tsx` renders answers and sanitizes generated HTML with DOMPurify.

Backend/API architecture:

- `/api/chat` is the main orchestration route.
- `/api/chats` lists chat sessions.
- `/api/chats/[id]` loads, renames, and deletes chats.
- `/api/usage` returns quota state.
- `/api/auth/me` validates the current session.
- `/auth/callback` handles Supabase OAuth callback, although the UI does not currently expose OAuth buttons.

Auth flow:

- Browser uses Supabase client from `getBrowserClient`.
- API routes use `createServerClient({ req, res })`, which reads and writes Supabase auth cookies.
- Login/signup happens through `AuthModal`.
- Logout happens in `Sidebar`.
- Server routes still authenticate even though the UI also gates access.

RAG flow:

```text
Question
  -> /api/chat
  -> getRelevantSectionsWithQuality
  -> OpenAI embedding
  -> Supabase RPC match_code_sections
  -> rerank and validate
  -> generateAnswer
  -> Anthropic Claude
  -> JSON response
  -> save messages
  -> render answer
```

Data model from types:

- `code_sections`: source chunks, embeddings, jurisdiction, code year, metadata.
- `chats`: user chat sessions.
- `messages`: user/assistant messages and source metadata.
- `user_usage`: beta query count.
- `profiles`: typed but not actively used in current app code.

Security:

- Zod validation.
- Supabase auth checks.
- Service-role key isolated to `supabase-admin.ts`.
- DOMPurify for rendered answer.
- Middleware payload limit and origin check.
- Rate limiting.
- SecureLogger masks secrets.

Performance:

- Search cache.
- Answer cache.
- Embedding rate limiter.
- Bounded context sections.
- Reranking only over limited result sets.

Limitations:

- No SQL migrations in repo.
- RLS policies cannot be inspected.
- Vector index definition cannot be inspected.
- In-memory rate limits/caches are not distributed.
- Some code exists but is unused: `SupabaseAuthSync`, `useChatHistory`, `lib/auth.ts`.

## 15-Minute Explanation

For a 15-minute explanation, use this structure:

1. Problem and users:
   The app helps beta users ask California electrical code questions and receive cited answers faster than manually searching documents.

2. Product:
   Anonymous users see a landing page. Authenticated users see a chat app with history, jurisdiction selection, year selection, examples, and usage quota.

3. Frontend:
   `app/page.tsx` is the coordinator. `useAuth` supplies user state. `useChat` handles message sending, loading, localStorage restoration, request cancellation, and cooldowns. Components render the sidebar, input, messages, answer blocks, citations, and auth modal.

4. Auth:
   Supabase Auth is used. Email/password signup and login are implemented. Signup requires terms agreement. Auth cookies are handled through `@supabase/ssr`. API routes call `getUser()`.

5. Backend:
   `/api/chat` is the main route. It applies IP rate limiting, auth, usage limit, validation, chat creation/verification, retrieval, generation, persistence, usage increment, and response formatting.

6. Retrieval:
   `lib/vector-search.ts` handles query expansion, embedding, vector RPC, reranking, relevance validation, caching, and fallbacks. It uses OpenAI embeddings through `lib/embedding.ts`.

7. Generation:
   `lib/ai-generate.ts` sends retrieved sections to Anthropic Claude. It requires JSON and distinguishes official code from enhanced guides.

8. Database:
   The code references `profiles`, `code_sections`, `chats`, `messages`, and `user_usage`. It also references RPC functions `match_code_sections` and `increment_user_usage`. Exact SQL is not in the repo.

9. Ingestion:
   `scripts/setup-vector-db.ts` reads local text files, chunks content, extracts metadata, creates embeddings, and inserts chunks into `code_sections` using the service role client.

10. Security/performance:
   Mention auth checks, Zod, DOMPurify, rate limiting, payload limit, service-role isolation, caches, bounded result sizes, and embedding rate limiting.

11. Honest limitations:
   No SQL migrations, no verified RLS/index definitions, no billing, no admin dashboard, no self-serve deletion, partial compare-year behavior, and unused helper files.

12. Close:
   This is a serious beta RAG app with implemented auth, persistence, retrieval, answer generation, and quota control. The next engineering step is to make database infrastructure reproducible and add tests.

## HR-Friendly Project Pitch

I built a full-stack AI assistant that answers California electrical code questions with citations. It uses Next.js and React on the frontend, Supabase for authentication and persistence, OpenAI embeddings for retrieval, and Anthropic Claude for final answer generation. I focused on practical production concerns like request validation, auth checks, rate limiting, usage quotas, secure logging, and safe rendering of AI output.

## Resume Defense Questions And Strong Answer Direction

### Q1. What exactly did you build?

Strong answer: A Next.js/Supabase RAG chat app for California electrical code questions. It authenticates users, stores chats, retrieves relevant code sections using OpenAI embeddings and Supabase RPC, generates answers with Anthropic, and displays citations.

Follow-up: What is not implemented?

Strong follow-up: Billing, admin dashboard, SQL migrations in repo, self-serve account deletion, and verified RLS/index definitions.

### Q2. Why did you use RAG?

Strong answer: Because the source material changes and must be cited. RAG lets the system retrieve relevant code sections at query time and pass them to the model instead of expecting the model to know the code.

Follow-up: Why not fine-tuning?

Strong follow-up: Fine-tuning is not implemented and would not solve citation freshness by itself. The app needs retrieval over current stored code sections.

### Q3. Where is OpenAI used?

Strong answer: OpenAI is used only for embeddings in `lib/embedding.ts`. Final answer generation uses Anthropic Claude in `lib/ai-generate.ts`.

Follow-up: Why is this distinction important?

Strong follow-up: It prevents overstating the architecture. Embeddings and answer generation are separate concerns and separate provider calls.

### Q4. Walk me through `/api/chat`.

Strong answer: It rate-limits, authenticates, checks usage, validates request body, creates or validates chat, retrieves sections, generates answer, saves messages, increments usage if useful, and returns answer plus quality metadata.

Follow-up: When does usage increment?

Strong follow-up: Only when retrieved sections length is greater than zero and search confidence is not low.

### Q5. How do you prevent hallucination?

Strong answer: The prompt tells Claude to use only provided sections and return JSON. Retrieval supplies relevant context. Temperature is zero. Enhanced guide sources are labeled separately. The UI warns users to verify official sources.

Follow-up: Can hallucination still happen?

Strong follow-up: Yes. The app reduces risk but cannot guarantee legal accuracy. That is why citations and verification disclaimers exist.

### Q6. Explain your database.

Strong answer: The typed tables are `profiles`, `code_sections`, `chats`, `messages`, and `user_usage`. `code_sections` stores content and embeddings. `chats` and `messages` store conversation history. `user_usage` tracks the beta limit.

Follow-up: What are the RLS policies?

Strong follow-up: The exact policy SQL is not in the repo, so I cannot claim the exact policies. The app code does use user-scoped queries and Supabase auth, but the actual RLS definitions need to be checked into migrations.

### Q7. What is your biggest production gap?

Strong answer: Missing database migrations. Without them, another engineer cannot recreate RLS policies, indexes, foreign keys, or RPC definitions from the repo alone.

### Q8. How does auth work?

Strong answer: Client auth uses Supabase browser client in `AuthProvider`. Email/password login/signup are in `AuthModal`. API routes create SSR Supabase clients and call `getUser()`. Cookies are handled by `lib/supabase.ts`.

### Q9. What did you do for security?

Strong answer: Auth on server routes, Zod validation, rate limiting, service-role isolation, DOMPurify for AI-rendered HTML, secure logger masking, payload limit, and origin check for mutating API requests.

### Q10. What would you improve first?

Strong answer: Add SQL migrations and tests. Then fix unused/partial files, improve citation persistence, and replace in-memory rate limiting with distributed storage for production.

