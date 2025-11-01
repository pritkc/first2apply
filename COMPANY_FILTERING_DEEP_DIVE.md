# Company Blacklisting & Whitelisting - Deep Dive Analysis

## Executive Summary

The company filtering system uses **code-based exact matching** for blacklisting/whitelisting, with **AI-assisted filtering** as an additional layer for custom criteria. The filtering happens **after job discovery** but **during job description scanning**, not during initial job parsing.

---

## 1. Architecture Overview

### 1.1 Database Schema

**Table: `advanced_matching`**
- `blacklisted_companies`: `text[]` - Array of blacklisted company names
- `favorite_companies`: `text[]` - Array of whitelisted/favorite company names
- `chatgpt_prompt`: `text` - Custom AI prompt for advanced filtering
- `user_id`: UUID - Links to user

**Table: `jobs`**
- `status`: Enum including `'excluded_by_advanced_matching'`
- `exclude_reason`: Text explaining why job was excluded
- `companyName`: Text - Company name used for matching

### 1.2 Job Status Flow

```
Job Discovery (scan-urls/create-link)
    ↓
Status: "processing" (saved to DB)
    ↓
Job Description Scanning (scan-job-description)
    ↓
applyAdvancedMatchingFilters() called
    ↓
┌─────────────────────────────────────┐
│ 1. Code-based Blacklist Check       │ ← EXACT MATCH
│ 2. AI-based Custom Filter Check     │ ← IF PROMPT EXISTS
└─────────────────────────────────────┘
    ↓
Status: "excluded_by_advanced_matching" OR "new"
```

---

## 2. Blacklisting Implementation

### 2.1 Code-Based Filtering (Direct Implementation)

**Location:** `supabase/functions/_shared/advancedMatching.ts`

```typescript
// Line 59-66: Direct code-based exclusion
if (isExcludedCompany({ companyName: job.companyName, advancedMatching })) {
  logger.info(`job excluded due to company name: ${job.companyName}`);
  return {
    newStatus: "excluded_by_advanced_matching",
    excludeReason: `${job.companyName} is blacklisted.`,
  };
}

// Line 132-144: Exact match implementation
export function isExcludedCompany({
  companyName,
  advancedMatching,
}: {
  companyName: string;
  advancedMatching: AdvancedMatchingConfig;
}): boolean {
  const excludedCompanies = advancedMatching.blacklisted_companies.map((c) =>
    c.toLowerCase()
  );
  const lowerCaseCompanyName = companyName.toLowerCase();
  return excludedCompanies.some((c) => lowerCaseCompanyName === c);
}
```

**Key Points:**
- ✅ **Pure code-based**: No AI parsing involved
- ✅ **Exact match**: Case-insensitive string comparison
- ✅ **Fast**: Direct array lookup
- ✅ **Deterministic**: Same result every time

**Matching Logic:**
- Company names are converted to lowercase
- Full string match required (not partial/substring)
- Example: "Luxoft" matches "luxoft" but not "Luxoft Inc"

### 2.2 When Blacklisting is Applied

**Trigger Point:** During job description scanning

**File:** `supabase/functions/scan-job-description/index.ts` (Line 146-153)

```typescript
const { newStatus, excludeReason } = await applyAdvancedMatchingFilters({
  logger,
  job: updatedJob,
  supabaseClient: serviceClient,
  openAiApiKey,
  geminiApiKey,
  llmProvider,
});
```

**Execution Flow:**
1. Job is discovered and saved with status `"processing"`
2. Job description HTML is fetched
3. Job description is parsed/extracted
4. **`applyAdvancedMatchingFilters` is called**
5. Blacklist check happens (code-based)
6. Job status is updated in database

### 2.3 UI Implementation for Blacklisting

**File:** `desktopProbe/src/components/home/jobTabsContent.tsx` (Line 322-343)

```typescript
const onBlacklistCompany = async (job: Job) => {
  const company = job.companyName?.trim();
  if (!company) return;

  const next = Array.from(new Set([...(blacklistedCompanies || []), company]));
  setBlacklistedCompanies(next);
  toast({ title: 'Blacklisted company', description: `${company} added to blacklist.`, variant: 'success' });
  try {
    await updateAdvancedMatchingConfig({
      chatgpt_prompt: (await getAdvancedMatchingConfig())?.chatgpt_prompt || '',
      blacklisted_companies: next,
      favorite_companies: favoriteCompanies,
    });

    // Move current job to filtered immediately
    await updateListedJobStatus(job.id, 'excluded_by_advanced_matching');
    selectNextJob(job.id);
  } catch (error) {
    setBlacklistedCompanies(blacklistedCompanies);
    handleError({ error, title: 'Failed to blacklist company' });
  }
};
```

**Features:**
- Immediate UI feedback (job moved to filtered tab)
- Persisted to database via `updateAdvancedMatchingConfig`
- Duplicate prevention using `Set`
- Optimistic UI updates with rollback on error

**Settings Page:** `desktopProbe/src/pages/filters.tsx` (Line 333-419)
- Users can manually add/remove blacklisted companies
- Max 100 characters per company name
- Shows warning about exact matching requirement

---

## 3. Whitelisting (Favorite Companies) Implementation

### 3.1 Purpose

Whitelisting is **NOT used for exclusion** but for **inclusion filtering** in queries.

### 3.2 Database Query Filtering

**File:** `supabase/seed.sql` (Line 237-245)

```sql
and (
  coalesce(jobs_favorites_only, false) = false
  or exists (
    select 1
    from public.advanced_matching am, unnest(am.favorite_companies) fc
    where am.user_id = auth.uid()
      and lower(fc) = lower(jobs."companyName")
  )
)
```

**How it Works:**
- When `favoritesOnly` filter is enabled in UI
- Only jobs from favorite companies are shown
- Case-insensitive exact match (same as blacklisting)
- Applied at query time, not during scanning

### 3.3 UI Implementation

**File:** `desktopProbe/src/components/home/jobTabsContent.tsx` (Line 122-127)

```typescript
// Mark favorites for UI display
const favSet = new Set(favoriteCompanies.map((c) => c?.toLowerCase?.()));
const jobsWithFav = result.jobs.map((j) => ({
  ...j,
  __isFavorite: favSet.has(j.companyName?.toLowerCase?.()),
})) as FavoriteAwareJob[];
```

**Visual Indicators:**
- Favorite companies are marked with `__isFavorite` flag
- Used for sorting/grouping in date-grouped job lists
- Displayed in filter menu with count

---

## 4. AI-Based Filtering (Additional Layer)

### 4.1 When AI is Used

**Location:** `supabase/functions/_shared/advancedMatching.ts` (Line 68-118)

AI filtering is **optional** and only runs if:
1. User has advanced matching subscription enabled
2. Job has a description (`job.description` exists)
3. User has configured a custom prompt (`advancedMatching.chatgpt_prompt`)

```typescript
// prompt LLM to determine if the job should be excluded
if (job.description && advancedMatching.chatgpt_prompt) {
  logger.info(`prompting ${llmProvider.toUpperCase()} to determine if the job should be excluded ...`);
  
  const result = await promptLLM({
    prompt: advancedMatching.chatgpt_prompt,
    job,
    provider: llmProvider,
    openAiApiKey,
    geminiApiKey,
    logger,
    supabaseAdminClient,
  });
  
  if (exclusionDecision.excluded) {
    return {
      newStatus: "excluded_by_advanced_matching",
      excludeReason: exclusionDecision.reason ?? undefined,
    };
  }
}
```

### 4.2 AI Providers Supported

1. **OpenAI** (`o3-mini` model)
   - Structured JSON response
   - Cost tracking enabled
   - Token usage logged

2. **Google Gemini** (`gemini-2.5-flash-lite` default)
   - JSON response format
   - Cost tracking (estimated)
   - Fallback parsing for non-JSON responses

3. **Llama** (Coming soon)
   - Not yet implemented

### 4.3 AI Prompt Structure

**System Prompt:** Pre-defined rules for job filtering (Line 351-372)
- Technology/skill exclusions
- Salary requirements
- Location/remote work preferences
- Job level matching
- Contract type considerations

**User Prompt:** Custom user requirements + job details (Line 331-349)
```
Here are my requirements for job filtering:
{user's custom prompt}

Job Title: {job.title}
Location: {job.location}
Tags: {job.tags}
Job Description:
{job.description}

Based on my requirements, should this job be excluded from my feed?
```

### 4.4 Important: AI is NOT Used for Company Blacklisting

**Critical Distinction:**
- ❌ AI does **NOT** parse company names for blacklisting
- ✅ Blacklisting uses **code-based exact matching**
- ✅ AI is only used for **custom criteria** in the user's prompt (e.g., "exclude jobs requiring Python", "only remote UK jobs")

---

## 5. Complete Filtering Flow

### 5.1 Job Discovery Phase

**Files:**
- `supabase/functions/scan-urls/index.ts`
- `supabase/functions/create-link/index.ts`

**What Happens:**
1. HTML pages are scraped
2. Jobs are parsed from HTML
3. Jobs are saved with status `"processing"`
4. **NO filtering applied at this stage**

### 5.2 Job Description Scanning Phase

**File:** `supabase/functions/scan-job-description/index.ts`

**What Happens:**
1. Job description HTML is fetched
2. Description is parsed/extracted
3. **`applyAdvancedMatchingFilters` is called** ← **FILTERING HAPPENS HERE**

### 5.3 Filtering Decision Tree

```
applyAdvancedMatchingFilters()
    │
    ├─→ User has advanced matching? → NO → Return status "new"
    │
    ├─→ Advanced matching config exists? → NO → Return status "new"
    │
    ├─→ isExcludedCompany() check ← CODE-BASED
    │   │
    │   └─→ Exact match? → YES → Status "excluded_by_advanced_matching"
    │
    └─→ Has description + custom prompt? → YES
        │
        ├─→ Call LLM (OpenAI/Gemini) ← AI-BASED
        │   │
        │   └─→ LLM says exclude? → YES → Status "excluded_by_advanced_matching"
        │
        └─→ All checks passed → Status "new"
```

---

## 6. Query-Time Filtering

### 6.1 Blacklisted Jobs

**Status-Based Exclusion:**
- Blacklisted jobs have status `"excluded_by_advanced_matching"`
- They appear in the "Filtered" tab in UI
- Excluded by default from "New" tab queries

**File:** `supabase/seed.sql` (Line 229-249)

```sql
select *
from jobs
where status = jobs_status  -- Filters by status
  and ... -- other filters
```

### 6.2 Whitelisted Jobs

**Optional Filter:**
- Jobs from favorite companies can be filtered in queries
- When `favoritesOnly=true`, only favorite companies shown
- Applied via SQL EXISTS subquery (Line 237-245)

---

## 7. Key Findings

### 7.1 Blacklisting
- ✅ **Handled by code**: Direct string matching, no AI parsing
- ✅ **Exact match required**: Case-insensitive, full company name
- ✅ **Applied during scanning**: After job discovery, during description parsing
- ✅ **Immediate effect**: Jobs move to "Filtered" tab when blacklisted

### 7.2 Whitelisting
- ✅ **Query-time filtering**: Applied when listing jobs, not during scanning
- ✅ **Inclusion only**: Used to show only favorite companies, not to exclude others
- ✅ **Same matching logic**: Case-insensitive exact match (like blacklisting)

### 7.3 AI Usage
- ✅ **Optional layer**: Only used if user configures custom prompt
- ✅ **For custom criteria**: Technology, salary, location, etc.
- ✅ **NOT for company names**: Company blacklisting is purely code-based
- ✅ **Cost tracked**: API usage and costs are logged per user

### 7.4 Job Scanning
- ✅ **Two-phase process**: Discovery → Scanning
- ✅ **Filtering during scan**: Advanced matching happens when description is fetched
- ✅ **Status tracking**: Jobs move from "processing" → "new" or "excluded_by_advanced_matching"

---

## 8. Limitations & Considerations

### 8.1 Exact Match Requirement
- **Issue**: Company name must match exactly (e.g., "Luxoft" vs "Luxoft Inc.")
- **Workaround**: Users must add all variations manually
- **UI Warning**: Filters page warns users about exact matching

### 8.2 No Fuzzy Matching
- Company name variations are not automatically detected
- "Google" vs "Google LLC" vs "Alphabet Inc." would need separate entries

### 8.3 Timing
- Blacklisting takes effect immediately for future scans
- Existing jobs in "processing" status may still get through
- Manual blacklisting from UI updates existing job immediately

### 8.4 AI Costs
- Each job with a description and prompt triggers an API call
- Costs are tracked per user
- Default provider is Gemini (most cost-effective)

---

## 9. Code Locations Summary

### Core Filtering Logic
- `supabase/functions/_shared/advancedMatching.ts` - Main filtering logic
  - `applyAdvancedMatchingFilters()` - Entry point
  - `isExcludedCompany()` - Blacklist check
  - `promptLLM()` - AI filtering

### Job Scanning
- `supabase/functions/scan-job-description/index.ts` - Calls filtering
- `supabase/functions/scan-urls/index.ts` - Job discovery
- `desktopProbe/src/server/jobScanner.ts` - Desktop scanner orchestration

### UI Components
- `desktopProbe/src/components/home/jobTabsContent.tsx` - Blacklist/favorite actions
- `desktopProbe/src/components/home/jobSummary.tsx` - Blacklist button
- `desktopProbe/src/pages/filters.tsx` - Settings page for managing lists

### Database
- `supabase/seed.sql` - Schema and query functions
- `advanced_matching` table - Stores blacklist/whitelist/prompts

---

## 10. Conclusion

**Blacklisting/Whitelisting:**
- ✅ **Code-based**: Direct implementation, no AI parsing
- ✅ **Deterministic**: Exact string matching
- ✅ **Fast**: No API calls for company filtering

**AI Filtering:**
- ✅ **Optional**: Additional layer for custom criteria
- ✅ **Cost-aware**: Usage tracked per user
- ✅ **Not for companies**: Company filtering is separate

**Scanning Process:**
- ✅ **Two-phase**: Discovery → Description Scanning (filtering happens here)
- ✅ **Status-driven**: Jobs tracked through processing pipeline

