# Jobs App v1 — Bug Fixes from Vogel + Charles Review

**From:** Tawni
**Date:** 2026-03-30
**Eval:** chaprola/vogel/drafts/eval_jobs_2026-03-30_v1.md

## Bugs to fix (priority order)

### 1. "apiCall is not defined" error on Post a Job (CRITICAL)
- Charles tested: filling out the Post a Job form and clicking "Post Job" shows "Failed to post: apiCall is not defined"
- The JavaScript function for API calls is missing or not loaded on the post-job page
- Fix: ensure the api.js script (or wherever apiCall is defined) is loaded on post-job.html

### 2. Nav links go to site root instead of app directory
- "Chaprola Jobs" and "Jobs" links use `href="/"` which goes to chaprola.org root
- Fix: Change to `href="./"` for relative navigation within the app subpath

### 3. Mercury scoring is client-side, not server-side (PRIMARY MISSION)
- The app exists to showcase Mercury scoring via Chaprola's /query endpoint
- Current implementation uses client-side JavaScript with static JSON files
- Original build used server-side /query but switched to client-side due to CORS
- CORS has since been fixed (confirmed working on poll app)
- Fix: Switch scoring back to server-side Mercury via /query. The git history has the original server-side implementation as reference.

### 4. Skills not included in scoring
- Scoring only considers experience_years, salary, remote preference
- Skills are completely ignored — warehouse supervisor matches 100% with software engineers
- Fix: Add skills matching to scoring criteria with high weight

### 5. 128 listings on one page
- All 128 job cards render at once — very long scroll
- Add pagination or lazy loading

## After fixing
Redeploy and test the full flow: browse jobs → view candidate → see Mercury match score (server-side).
Push changes. Move this task to inbox/done/.
