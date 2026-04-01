# Task: Rework Jobs App to Use Server-Side Mercury Scoring

**Source:** Vogel eval_jobs_2026-03-30_v1.md
**Priority:** Critical (app fails its showcase mission — Mercury scoring is client-side JavaScript, not Chaprola API)
**Status:** Rework required

## Problem

The Jobs app was built to showcase Chaprola's Mercury scoring (weighted multi-criteria ranking via /query endpoint), but the entire scoring implementation runs client-side in JavaScript operating on static JSON files. No /query calls, no .CS programs, no Chaprola API calls for matching.

**Root cause (per git history):** Original build used server-side /query with Mercury parameters, but CORS blocked API calls. Commit 2b152a8 switched to client-side as workaround. Remo has since fixed CORS for poll app — same fix may apply here.

## Required Changes

### 1. Switch scoring back to server-side Mercury

- Remove client-side `mercuryScore()` function from api.js
- Implement /query calls with `mercury: { fields: [...] }` parameter
- Verify CORS allows cross-origin /query from chaprola.org/apps subdomain
- If CORS still blocks, coordinate with Remo (reference: poll app CORS fix 2026-03-30)

### 2. Add skills matching to scoring criteria

Current scoring (client-side) only considers:
- Experience years (weight 3)
- Salary (weight 2)  
- Remote preference (weight 1)
- **Skills: NOT SCORED** ← This is the most important criterion

**Example failure:** Warehouse Supervisor (JOB-132) shows 100% match for software engineers because skills are ignored.

**Fix:** Add skills overlap scoring: `matchedSkills / totalRequiredSkills` with high weight (e.g., 5).

### 3. Fix nav link bugs (quick wins)

- "Chaprola Jobs" and "Jobs" links use `href="/"` → change to `href="./"` for relative navigation within app subpath
- Candidate "View & Match" link doesn't navigate → verify `candidate.html?id=` works in real browser

### 4. Add pagination or lazy loading

128 listings on one page creates 65,000+ px scroll on mobile. Add pagination (20 jobs per page) or infinite scroll.

## MCP Doc Updates Needed

Per Vogel:
- Document CORS configuration for app hosting
- Add complete Mercury scoring example to API docs showing request body format with `mercury: { fields: [...] }` inside /query
- Use the original (pre-CORS-workaround) code in git history as the example

## Verification

After fixes:
1. Job matching calls /query with Mercury parameters (check Network tab)
2. Skills matching works (warehouse supervisor ≠ 100% match for React developers)
3. Nav links stay within app subdirectory
4. Match scores reflect all criteria: experience, salary, remote, **skills**
5. "Why this match?" explainability shows factor breakdown

**Expected duration:** 2-3 hours (architectural change + skills scoring + nav fixes + pagination)

## Vogel's Final Note

"This app is 80% of a great demo. The UI, data, and structure are all there. The two critical fixes: (1) switch scoring back to server-side Mercury now that CORS is fixed, and (2) add skills matching. With those changes, this becomes the strongest Chaprola showcase app."
