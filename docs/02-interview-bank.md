# 150 Interview Questions

Use these to defend only what the current codebase implements.

## Easy

1. What is the project name?
   Strong answer: The package is `ecai-ai`; the UI brand is TheRuleKit.
   Follow-up: Why are there multiple names?

2. What does the project do?
   Strong answer: It lets authenticated users ask California electrical code questions and receive AI answers with citations.
   Follow-up: Who is the target user?

3. What framework is used?
   Strong answer: Next.js 14 App Router with React 18 and TypeScript.
   Follow-up: Where is the root layout?

4. Where is the main page?
   Strong answer: `app/page.tsx`.
   Follow-up: What does it render for anonymous users?

5. Where is the root layout?
   Strong answer: `app/layout.tsx`.
   Follow-up: What provider wraps the app?

6. What is Supabase used for?
   Strong answer: Auth, database access, chat persistence, usage tracking, and realtime sidebar updates.
   Follow-up: Which file creates Supabase clients?

7. What is OpenAI used for?
   Strong answer: Embeddings in `lib/embedding.ts`.
   Follow-up: Does OpenAI generate final answers?

8. What generates final answers?
   Strong answer: Anthropic Claude through `lib/ai-generate.ts`.
   Follow-up: Which endpoint is called?

9. What is the main chat API route?
   Strong answer: `POST /api/chat`.
   Follow-up: What are its main steps?

10. Where are database types defined?
    Strong answer: `types/index.ts`.
    Follow-up: Are SQL migrations present?

11. What is the beta usage limit?
    Strong answer: `25`, from `BETA_QUERY_LIMIT` in `lib/usage-limits.ts`.
    Follow-up: When is usage incremented?

12. Where is the auth modal?
    Strong answer: `components/auth-modal.tsx`.
    Follow-up: What auth methods are used?

13. Where is chat state managed?
    Strong answer: `hooks/use-chat.ts`.
    Follow-up: Why use an abort controller?

14. Where is auth state managed?
    Strong answer: `hooks/use-auth.tsx`.
    Follow-up: Why use `getUser()`?

15. Where is the sidebar?
    Strong answer: `components/sidebar.tsx`.
    Follow-up: How does it update in realtime?

16. Where are answers rendered?
    Strong answer: `components/answer-display.tsx`.
    Follow-up: How is XSS reduced?

17. What does `middleware.ts` do?
    Strong answer: Handles payload limit, basic origin check, protected page auth, and cookie preservation.
    Follow-up: Does it protect `/api/chat` directly?

18. What is RAG in this app?
    Strong answer: Retrieve relevant `code_sections`, then generate an answer from those sections.
    Follow-up: Why not only ask the model?

19. What table stores chat sessions?
    Strong answer: `chats`.
    Follow-up: What stores messages?

20. What table stores code chunks?
    Strong answer: `code_sections`.
    Follow-up: What important fields does it contain?

21. What table stores beta quota?
    Strong answer: `user_usage`.
    Follow-up: Which RPC increments it?

22. What RPC is used for vector search?
    Strong answer: `match_code_sections`.
    Follow-up: Is its SQL body in the repo?

23. What RPC increments usage?
    Strong answer: `increment_user_usage`.
    Follow-up: Is its SQL body in the repo?

24. What is the default jurisdiction?
    Strong answer: `Los Angeles County, CA`.
    Follow-up: Where is it defined?

25. What is the default code year?
    Strong answer: `2023`.
    Follow-up: What selectable year is defined?

26. What is the supported selectable code year?
    Strong answer: `2026`, in `SUPPORTED_CODE_YEARS`.
    Follow-up: How does the UI show current year?

27. What is `data/code-sections`?
    Strong answer: Local text source files used by the ingestion script.
    Follow-up: How many files are currently there?

28. What does `setup-vector-db.ts` do?
    Strong answer: It ingests local text files, chunks them, creates embeddings, and inserts rows into `code_sections`.
    Follow-up: Why does it use admin client?

29. What does `test-questions.ts` do?
    Strong answer: Runs sample questions through retrieval and generation for quality checks.
    Follow-up: Is it an automated test suite?

30. What dependency validates API input?
    Strong answer: Zod.
    Follow-up: Where is it used?

31. What dependency shows toasts?
    Strong answer: Sonner.
    Follow-up: Where is Toaster mounted?

32. What dependency sanitizes rendered answers?
    Strong answer: `isomorphic-dompurify`.
    Follow-up: Why is it needed?

33. What dependency handles chat history caching in a hook?
    Strong answer: SWR.
    Follow-up: Is `useChatHistory` used by the sidebar?

34. What is Not Implemented Yet in auth UI?
    Strong answer: OAuth provider buttons are not present.
    Follow-up: Is callback route present?

35. What is the service role key used for?
    Strong answer: Admin database operations in scripts/backend-only code.
    Follow-up: Why must it never run in browser?

36. What happens when unauthenticated user asks a question?
    Strong answer: `app/page.tsx` opens auth modal and shows a toast.
    Follow-up: Does server also protect?

37. What happens when quota is exhausted?
    Strong answer: The UI blocks sending; `/api/chat` also checks usage.
    Follow-up: Which file checks usage?

38. Where is the jurisdiction dropdown?
    Strong answer: `components/jurisdiction-selector.tsx`.
    Follow-up: Where are options defined?

39. Where is the code-year dropdown?
    Strong answer: `components/chat-input.tsx`.
    Follow-up: How does compare mode affect it?

40. Where is logout implemented?
    Strong answer: `components/sidebar.tsx`.
    Follow-up: What happens after sign out?

## Medium

41. Walk through the full question flow.
    Strong answer: ChatInput -> Home -> useChat -> `/api/chat` -> vector search -> answer generation -> DB save -> UI render.
    Follow-up: Where is the temporary assistant message replaced?

42. Why does `/api/chat` create or validate a chat?
    Strong answer: It either starts a new thread or ensures the existing thread belongs to the authenticated user.
    Follow-up: What query protects ownership?

43. How is input validated in `/api/chat`?
    Strong answer: Zod schema validates question length, UUID chatId, jurisdiction enum, code year, and compare flag.
    Follow-up: What status on invalid input?

44. How does IP rate limiting work?
    Strong answer: `lib/rate-limit.ts` stores counters in a Map by token/IP.
    Follow-up: What is the serverless limitation?

45. How does `getClientIP` work?
    Strong answer: Checks Cloudflare header, `x-forwarded-for`, `x-real-ip`, then returns `unknown`.
    Follow-up: Why trust proxy by default?

46. How is usage limit checked?
    Strong answer: `checkUsageLimit` uses admin client, reads `user_usage`, creates missing row, compares to 25.
    Follow-up: Why use admin client?

47. How is usage incremented?
    Strong answer: `incrementUsage` calls `increment_user_usage` RPC.
    Follow-up: What happens on RPC error?

48. Why increment usage only for high-quality answers?
    Strong answer: `/api/chat` only counts if sections exist and search confidence is not low.
    Follow-up: What about AI failure?

49. How are messages saved?
    Strong answer: `insertMessagesSequentially` inserts user message, waits 10ms, inserts assistant message.
    Follow-up: Why wait 10ms?

50. How does chat history load?
    Strong answer: `useChat.loadChat` calls `/api/chats/:id`, maps rows back to `Message[]`.
    Follow-up: What metadata can be lost?

51. How does the sidebar fetch chats?
    Strong answer: It calls `/api/chats` and stores the result in local state.
    Follow-up: How does it handle realtime?

52. What does Supabase realtime listen to?
    Strong answer: `postgres_changes` on `public.chats`, filtered by `user_id`.
    Follow-up: What events are handled?

53. How does `currentChatId` persist?
    Strong answer: `useChat` stores it in `localStorage`.
    Follow-up: How are stale IDs handled?

54. How are requests cancelled?
    Strong answer: `useChat` uses `AbortController`, aborts previous/current requests, and has a 60s timeout.
    Follow-up: What does cancelRequest do?

55. How is cooldown handled?
    Strong answer: 429 responses set `cooldownUntil`; a timer updates remaining seconds.
    Follow-up: Which header is read?

56. What is query expansion?
    Strong answer: `expandQuery` adds electrical synonyms to improve retrieval recall.
    Follow-up: How many variations are used?

57. How are key terms extracted?
    Strong answer: `extractKeyTerms` captures code section numbers and filters question words against stop words/electrical terms.
    Follow-up: Why keep section numbers?

58. How does reranking work?
    Strong answer: Combines normalized semantic score, lexical score, and metadata bonuses.
    Follow-up: What weights are used?

59. How does metadata scoring work?
    Strong answer: It adds bonuses for inspector focus, field tips, failures, and amendments.
    Follow-up: What is the max metadata boost?

60. What are vector search fallbacks?
    Strong answer: Lower threshold, California State search, then smart text search.
    Follow-up: Why fallback to California State?

61. What does smart text search do?
    Strong answer: Queries `code_sections`, scores rows by key-term matches, returns top matches.
    Follow-up: Why is confidence low?

62. How is search confidence determined?
    Strong answer: `determineConfidenceLevel` uses valid section count, similarity, and data source.
    Follow-up: Why consider both quality and quantity?

63. How is search cache keyed?
    Strong answer: Question, jurisdiction, date, and include-all-years flag.
    Follow-up: What are TTLs?

64. How is answer cache keyed?
    Strong answer: Sanitized question plus options including codeYear and section count.
    Follow-up: What weakness does section count-only key have?

65. How does `generateAnswer` validate input?
    Strong answer: Sanitizes text, checks length, and rejects basic prompt-injection patterns.
    Follow-up: Is this complete prompt-injection protection?

66. What does the Anthropic system prompt require?
    Strong answer: Exact JSON, answer only from provided sections, citations, confidence, action items, inspector tips.
    Follow-up: What if info is not found?

67. How are enhanced guides treated?
    Strong answer: Prompt labels them practical references, uses estimate language, and requires verification.
    Follow-up: Can they be legal authority?

68. How is field intelligence extracted?
    Strong answer: From `enhanced_metadata` arrays on retrieved sections.
    Follow-up: Which fields are extracted?

69. How does `AnswerDisplay` format answers?
    Strong answer: Converts simple markdown-like patterns to HTML and sanitizes with DOMPurify.
    Follow-up: Why use allowed tags?

70. How are citations rendered?
    Strong answer: Expandable `CitationItem` blocks show source info and content when available.
    Follow-up: Why might historical citations show less content?

71. How is signup protected against accidental terms bypass?
    Strong answer: The checkbox is required in component logic before signUp.
    Follow-up: Is it server-enforced?

72. How does auth sync after login?
    Strong answer: `AuthModal` calls `/api/auth/me` up to 3 times after Supabase login/session.
    Follow-up: Why is `SupabaseAuthSync` still unused?

73. What does `/auth/callback` do?
    Strong answer: Validates OAuth code/error, blocks cross-origin redirect, exchanges code for session, returns same response with cookies.
    Follow-up: Is OAuth exposed in UI?

74. How are cookies preserved in redirects?
    Strong answer: Middleware and auth callback create response first and pass it to Supabase client, then return that response.
    Follow-up: Why is this important?

75. What does `headersWithSupabaseCookies` do?
    Strong answer: Merges cookies/headers from a response into outgoing `NextResponse.json`.
    Follow-up: Where is it used?

76. What is the role of `supabase-admin.ts`?
    Strong answer: Create service-role client for scripts/backend-only operations.
    Follow-up: How does it prevent browser use?

77. What is `env-loader.ts` for?
    Strong answer: Standalone scripts need `.env.local` loaded manually.
    Follow-up: Why should app runtime not import it?

78. How does `SecureLogger` protect secrets?
    Strong answer: Masks API keys, JWTs, emails, paths, and most URLs.
    Follow-up: What URLs are whitelisted?

79. What happens if OpenAI key is missing?
    Strong answer: `lib/embedding.ts` throws at import time.
    Follow-up: How might that affect scripts/routes?

80. How are OpenAI embedding errors mapped?
    Strong answer: Rate limit, quota, invalid key, invalid request, and generic production/dev messages.
    Follow-up: Why avoid raw errors in production?

81. What is chunking in ingestion?
    Strong answer: Long sections are split into target 600-char chunks with 100-char overlap.
    Follow-up: Why keep overlap?

82. How does ingestion extract metadata?
    Strong answer: It parses filename patterns and section content markers for jurisdiction/year/enhanced fields.
    Follow-up: What metadata goes into `enhanced_metadata`?

83. How does ingestion avoid dangerous deletes?
    Strong answer: Deletion requires `ALLOW_DELETE_ALL=true`; backup is optional with `ENABLE_BACKUP`.
    Follow-up: What is dry run?

84. What is the ingestion log?
    Strong answer: Optional writes to `ingestion_runs`.
    Follow-up: Is `ingestion_runs` typed?

85. What are the environment variables?
    Strong answer: Supabase URL/anon/service key, Anthropic key, OpenAI key, and ingestion tuning vars.
    Follow-up: Which ones are public?

86. What is the anon key?
    Strong answer: Browser-safe Supabase public key used with RLS/auth.
    Follow-up: Why is service role different?

87. What RLS policies exist?
    Strong answer: Cannot be determined; no SQL migrations are in the repo.
    Follow-up: How does code still scope user queries?

88. What indexes exist?
    Strong answer: Cannot be determined; only a suggested `idx_embedding_version` warning appears.
    Follow-up: Why should migrations be added?

89. What vector index exists?
    Strong answer: Cannot be determined from current codebase.
    Follow-up: What file implies vector search?

90. What is compare mode?
    Strong answer: UI sends `compareYears: true`; `/api/chat` increases match count and includes all years.
    Follow-up: Does generation have explicit compare logic?

## Hard

91. Explain ownership enforcement for chat operations.
    Strong answer: `/api/chat` validates existing chat with `.eq('id', chatId).eq('user_id', userId)`. DELETE/PATCH also include `user_id`.
    Follow-up: What about GET `/api/chats/[id]`?

92. Is GET `/api/chats/[id]` ownership check explicit?
    Strong answer: It selects by `id` only after auth and relies on RLS according to comments; exact RLS cannot be verified.
    Follow-up: How would you harden it?

93. What is a security issue with relying on comments for cascade/RLS?
    Strong answer: Comments do not prove database behavior; migrations should define and review it.
    Follow-up: What would you check in Supabase?

94. Does middleware protect the actual chat UI?
    Strong answer: The actual chat UI is `/` and is public; client renders chat only after auth. Middleware protects `/dashboard`, `/chat`, `/profile`, which are absent.
    Follow-up: Is that acceptable?

95. How would you protect `/` server-side?
    Strong answer: Split landing and app routes or do server auth in a server component/route and redirect.
    Follow-up: What tradeoff exists?

96. What is the risk of in-memory rate limiting?
    Strong answer: It resets on cold starts and is per process/instance, so distributed abuse can bypass it.
    Follow-up: What replacement would you use?

97. What is the risk of in-memory answer/search cache?
    Strong answer: It is not shared across instances and can serve stale data until TTL.
    Follow-up: Is stale acceptable here?

98. What is the risk in answer cache key using section count?
    Strong answer: Two different retrieval sets with same count may hit the same cached answer for the same question/options.
    Follow-up: How would you include section IDs?

99. Why does `embedding.ts` importing `readEnv` matter?
    Strong answer: It helps scripts, but importing file in app runtime can manually read `.env.local`; comment says env-loader should not be used by app files.
    Follow-up: Is this a code smell?

100. What provider mismatch should you explain honestly?
     Strong answer: Package description says OpenAI platform, but code uses Anthropic for answers and OpenAI for embeddings.
     Follow-up: How would you rename docs?

101. What is the most important missing artifact?
     Strong answer: SQL migrations for tables, RLS, RPCs, indexes, and extensions.
     Follow-up: Why does this matter for production?

102. How would you define `match_code_sections`?
     Strong answer: Current repo cannot prove it; expected behavior is vector similarity filtered by jurisdiction/date threshold/count returning similarity and section fields.
     Follow-up: Would you use security definer?

103. Why is cosine similarity not provable here?
     Strong answer: The SQL body is absent, so operator/distance cannot be confirmed.
     Follow-up: How do OpenAI normalized embeddings affect distance choices?

104. What is the embedding dimension and why?
     Strong answer: 3072 by default for `text-embedding-3-large`.
     Follow-up: What breaks if DB vector dimension differs?

105. How does vector validation work?
     Strong answer: Checks array existence, exact dimension, magnitude, finite values, and not all zero.
     Follow-up: Why check magnitude?

106. Why return zero vector for empty input in embedding but validate may reject zero?
     Strong answer: Empty text path returns zero, but downstream validation rejects all-zero as invalid.
     Follow-up: Is that inconsistent?

107. What is the circuit breaker in search?
     Strong answer: `SEARCH_RUNTIME` tracks embedding failures and stops after 3 within reset window.
     Follow-up: Why protect AI costs?

108. How does `normalizeJurisdictionBeforeQuery` work?
     Strong answer: Direct map, case-insensitive map, fuzzy Levenshtein within distance 2, otherwise error.
     Follow-up: What about `All California`?

109. Is `All California` handled perfectly?
     Strong answer: It is supported in UI constants, but normalization map shown does not list `All California`; behavior should be tested.
     Follow-up: What likely happens?

110. How are specific years applied?
     Strong answer: If `codeYear` and not compare, `/api/chat` sets `as_of_date` to `${codeYear}-06-01`.
     Follow-up: Why date instead of exact year filter?

111. How does include-all-years work?
     Strong answer: `include_all_years` removes date filter and increases match count.
     Follow-up: Does it guarantee side-by-side comparison?

112. How does AI not-found handling work?
     Strong answer: Prompt asks Claude to return `confidence: invalid`; parser maps invalid/not found to low-confidence fallback.
     Follow-up: What if model ignores schema?

113. What happens on invalid AI JSON?
     Strong answer: The app returns a fallback answer with section excerpts and low confidence.
     Follow-up: Is that saved?

114. What happens if search service fails?
     Strong answer: `/api/chat` saves user message plus fallback assistant text and returns 200 with `usageCounted: false`.
     Follow-up: Why return 200?

115. What happens if message save fails?
     Strong answer: `/api/chat` throws and returns database error 500.
     Follow-up: Could this leave partial state?

116. Can user message save succeed and assistant save fail?
     Strong answer: Yes, inserts are sequential without a transaction in app code.
     Follow-up: How would you fix?

117. How would you improve message persistence?
     Strong answer: Use a database transaction/RPC to insert both messages atomically.
     Follow-up: Why not client-side only?

118. How does the app prevent duplicate auth submits?
     Strong answer: Lock ref, loading state, requestInFlight, debounce, cooldown parsing.
     Follow-up: Is server-side rate limiting on auth implemented?

119. How are terms enforced?
     Strong answer: Client-side checkbox before signup.
     Follow-up: What if someone calls Supabase directly?

120. Why use DOMPurify even if model returns text?
     Strong answer: AnswerDisplay converts text to HTML and uses `dangerouslySetInnerHTML`, so sanitization is necessary.
     Follow-up: What tags are allowed?

121. What is a saved citation mismatch?
     Strong answer: Live `citedSections` may include content, but saved `sources.citedSections` only include id/section/code_book/code_year.
     Follow-up: How does that affect UX?

122. How does `useChatHistory` differ from `Sidebar`?
     Strong answer: `useChatHistory` uses SWR, but Sidebar uses manual fetch plus realtime local state.
     Follow-up: What would you refactor?

123. What unused files exist?
     Strong answer: `components/supabase-listener.tsx`, `hooks/use-chat-history.ts` in current sidebar path, and `lib/auth.ts` are not used by current API/page flow.
     Follow-up: Should unused code be removed?

124. How would you test `/api/chat`?
     Strong answer: Mock Supabase, vector search, answer generation, usage, and assert auth/validation/error paths.
     Follow-up: What integration test matters most?

125. How would you test RAG quality?
     Strong answer: Expand `scripts/test-questions.ts` into repeatable tests with expected sections and confidence thresholds.
     Follow-up: Why not assert exact answer text?

126. How would you secure service role usage?
     Strong answer: Keep server-only, never import in components, add lint rule/import boundary, rotate key if exposed.
     Follow-up: Does current file check browser?

127. What is the biggest legal risk?
     Strong answer: Users may treat AI output as official advice; app mitigates with citations/disclaimers but must be verified.
     Follow-up: How does prompt distinguish enhanced guides?

128. What does `SecureLogger.logQuery` do in production?
     Strong answer: Logs `[REDACTED]` instead of raw query.
     Follow-up: Why redact user questions?

129. What is the middleware CSRF strategy?
     Strong answer: Basic origin-host match for mutating API requests.
     Follow-up: Is that a full CSRF solution?

130. How are large request bodies blocked?
     Strong answer: Middleware checks content-length for POST `/api/*` over 900KB.
     Follow-up: Can content-length be missing?

## Very Hard

131. Design the missing SQL migrations.
     Strong answer: Include pgvector extension, typed tables, FKs, indexes, RLS policies, RPCs, grants, and seed/migration order.
     Follow-up: Which policies for `messages`?

132. How would you implement `match_code_sections` safely?
     Strong answer: Filter active rows by jurisdiction/date, compute vector similarity, threshold/order/limit, return typed fields, ensure correct privileges.
     Follow-up: How would you handle `All California`?

133. What vector index would you choose?
     Strong answer: Cannot claim current one. For scale, evaluate pgvector HNSW or IVFFlat based on data size, recall, latency, maintenance.
     Follow-up: How would you measure recall?

134. How would you avoid hallucination beyond prompting?
     Strong answer: Post-validate citations, require cited section IDs, compare answer citations to retrieved set, and reject unsupported claims.
     Follow-up: How to detect unsupported claims?

135. How would you make usage increment atomic with answer save?
     Strong answer: Create a transaction/RPC that inserts both messages and increments usage under conditions.
     Follow-up: What if usage limit changes mid-request?

136. How would you make rate limiting production-grade?
     Strong answer: Use Redis/Upstash/Supabase table with atomic increments and token by user+IP.
     Follow-up: How prevent shared IP issues?

137. How would you support multiple jurisdictions correctly?
     Strong answer: Normalize inputs, ingest jurisdiction-specific data, define fallback rules, handle `All California`, and show provenance.
     Follow-up: What if LA and California conflict?

138. How would you implement real code-year comparison?
     Strong answer: Retrieve by year groups, preserve year metadata, prompt Claude with explicit comparison instructions, and return structured diffs.
     Follow-up: How validate missing year data?

139. How would you improve answer cache correctness?
     Strong answer: Include question hash, jurisdiction, code year/compare, retrieved section IDs, embedding version, and prompt version.
     Follow-up: When invalidate?

140. How would you build observability?
     Strong answer: Log request IDs, timings, provider latency, search quality, errors, usage count, and trace IDs without secrets.
     Follow-up: What metrics alert?

141. How would you protect against prompt injection in retrieved documents?
     Strong answer: Treat retrieved sections as data, delimit context, instruct model to ignore instructions inside sources, and post-validate JSON.
     Follow-up: Is current prompt enough?

142. How would you handle provider outages?
     Strong answer: Return saved fallback, retry with backoff, expose status, avoid incrementing usage, and optionally queue retry.
     Follow-up: What is already implemented?

143. How would you make ingestion idempotent?
     Strong answer: Hash source chunks, unique constraints on source/version/section/chunk, skip unchanged rows, and track ingestion runs.
     Follow-up: Does current script dedupe?

144. How would you avoid partial ingestion failure?
     Strong answer: Use staging tables, transaction-like swap, backups, validation, and versioned embedding rows.
     Follow-up: What current safety flags exist?

145. How would you design delete-account?
     Strong answer: Authenticated endpoint deletes/anonymizes chats, messages, usage, profile, and Supabase auth user; confirm and audit.
     Follow-up: Why is it Not Implemented Yet?

146. How would you make chat deletion reliable?
     Strong answer: Verify FK cascade in migrations or explicitly delete messages in a transaction.
     Follow-up: Why are comments insufficient?

147. How would you scale code_sections search?
     Strong answer: Proper vector index, metadata indexes on jurisdiction/date/year/source_type, batching, cache, and offline evaluation.
     Follow-up: What indexes are currently provable?

148. How would you handle private user data sent to AI?
     Strong answer: Minimize payload, avoid identifiers, redact if needed, update privacy policy, and add data processing controls.
     Follow-up: Does current generation send user ID?

149. How would you convert this beta to paid SaaS?
     Strong answer: Add billing, plans, user/team quotas, admin dashboard, audit logs, stronger deployment docs, migrations, tests, and support flow.
     Follow-up: What existing code helps?

150. Give a brutally honest production-readiness score.
     Strong answer: Functional beta with strong architecture, but not fully production-auditable because migrations/RLS/index definitions and tests are missing.
     Follow-up: What are the first three fixes?

