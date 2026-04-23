// Chaprola Jobs — data layer
// Primary path: /report JOBLIST + CANDLIST (server-side scoring via
// SCOREJOBS + SCORECANDS). Static JSON (data-listings.json,
// candidates.json) is the fallback for when the Chaprola data files
// haven't been deployed under this project yet; remove the fallback
// once chaprola-jobs/jobs/listings.DA + candidates.DA are live.

const CHAPROLA_API_BASE = 'https://api.chaprola.org';
const CHAPROLA_USERID = 'chaprola-jobs';
const CHAPROLA_PROJECT = 'jobs';
const DEMO_USER_ID = 'demo-user';
// Origin-locked site key: allowed_origins=[https://chaprola.org],
// allowed_endpoints=[/query, /insert-record, /update-record, /report,
// /run, /run-each]. Safe to embed — the backend denies off-origin use.
const SITE_KEY = 'site_db67127f9d6c9f66f8643fad18314598fa0a2ac6b50ab851e4c209205dc2017a';

function currentUserId() {
    const u = window.chaprolaAuth && window.chaprolaAuth.getUser();
    return (u && u.sub) || DEMO_USER_ID;
}

function isLoggedIn() {
    return !!(window.chaprolaAuth && window.chaprolaAuth.getUser());
}

async function runReport(name, extraParams) {
    const params = Object.assign({
        userid: CHAPROLA_USERID,
        project: CHAPROLA_PROJECT,
        name: name,
        user_id: currentUserId()
    }, extraParams || {});
    const qs = new URLSearchParams(params).toString();
    const response = await fetch(CHAPROLA_API_BASE + '/report?' + qs);
    if (!response.ok) {
        throw new Error('Report ' + name + ' failed: ' + response.status);
    }
    return response.text();
}

// Parse a pipe-delimited /report line with a leading header line of
// column names. Returns an array of row objects keyed by column.
// The last column is greedy-absorbed: its value is the join of all
// trailing parts. This lets the last field carry internal pipes
// (e.g. the skills list), which is how JOBLIST/CANDLIST/SCORECANDS
// output skills.
function parsePipeTable(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    const columns = lines[0].split('|').map(c => c.trim().toLowerCase());
    const lastIdx = columns.length - 1;
    return lines.slice(1).map(line => {
        const parts = line.split('|');
        const row = {};
        columns.forEach((c, i) => {
            row[c] = (i === lastIdx ? parts.slice(i).join('|') : (parts[i] || '')).trim();
        });
        return row;
    });
}

let _listings = null;
let _candidates = null;

async function loadListings() {
    if (_listings) return _listings;
    try {
        const text = await runReport('JOBLIST');
        const parsed = parsePipeTable(text).map(r => ({
            job_id: r.job_id,
            title: r.title,
            company: r.company,
            location: r.location,
            remote_ok: r.remote,
            salary_min: r.salary_min,
            salary_max: r.salary_max,
            experience_years: r.exp,
            job_desc: r.job_desc,
            skills: r.skills,
            posted_at: r.posted_at,
            status: 'open'
        }));
        // Defense-in-depth: a silent header-missing /report response would
        // yield rows with r.job_id === undefined (parsePipeTable treats the
        // first data row as column names). Detect + fall back. This is the
        // "blank cards rendered without ever erroring" case Tawni's QC
        // flagged — it was real, the header fix prevents it from recurring,
        // and this guard prevents any future regression from resurfacing
        // silently.
        if (parsed.length > 0 && !parsed[0].job_id) {
            throw new Error('JOBLIST missing header row — falling back to static JSON');
        }
        _listings = parsed;
    } catch (err) {
        console.warn('JOBLIST report failed, falling back to static JSON:', err.message);
        const res = await fetch('data-listings.json');
        if (!res.ok) throw new Error(`Failed to load listings: ${res.status}`);
        _listings = await res.json();
    }
    console.log(`Loaded ${_listings.length} listings`);
    return _listings;
}

async function loadCandidates() {
    if (_candidates) return _candidates;
    try {
        const text = await runReport('CANDLIST');
        const parsed = parsePipeTable(text).map(r => ({
            cand_id: r.cand_id,
            name: r.name,
            headline: r.title,
            title: r.title,
            location: r.location,
            desired_salary: r.desired_salary,
            remote_only: r.remote_only,
            experience_years: r.exp,
            skills: r.skills,
            created_at: r.created_at,
            available: 'true'
        }));
        // Same defense-in-depth as loadListings: detect header-missing
        // corruption and fall back to static JSON rather than render
        // blank cards.
        if (parsed.length > 0 && !parsed[0].cand_id) {
            throw new Error('CANDLIST missing header row — falling back to static JSON');
        }
        _candidates = parsed;
    } catch (err) {
        console.warn('CANDLIST report failed, falling back to static JSON:', err.message);
        const res = await fetch('candidates.json');
        _candidates = await res.json();
    }
    return _candidates;
}

// Fetch all open job listings with pagination support
async function getJobs(offset = 0, limit = 1000) {
    const all = await loadListings();
    const open = all.filter(j => j.status === 'open').sort((a, b) => b.posted_at.localeCompare(a.posted_at));
    return open.slice(offset, offset + limit);
}

// Count total jobs for pagination
async function countJobs() {
    const all = await loadListings();
    return all.filter(j => j.status === 'open').length;
}

// Fetch all available candidates
async function getCandidates() {
    const all = await loadCandidates();
    return all.filter(c => c.available === 'true').sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

// Get single job by ID
async function getJob(jobId) {
    const all = await loadListings();
    return all.find(j => j.job_id === jobId) || null;
}

// Get single candidate by ID
async function getCandidate(candId) {
    const all = await loadCandidates();
    return all.find(c => c.cand_id === candId) || null;
}

// Calculate skills match score between job and candidate
// Returns a value 0-1 representing how many required skills the candidate has
function calculateSkillsMatch(jobSkills, candidateSkills) {
    if (!jobSkills || !candidateSkills) return 0;
    const jobSkillsArray = parseSkills(jobSkills);
    const candidateSkillsArray = parseSkills(candidateSkills);
    if (jobSkillsArray.length === 0) return 1; // No skills required = perfect match

    const jobSkillsSet = new Set(jobSkillsArray.map(s => s.toLowerCase().trim()));
    const candidateSkillsSet = new Set(candidateSkillsArray.map(s => s.toLowerCase().trim()));

    let matchCount = 0;
    for (const skill of jobSkillsSet) {
        if (candidateSkillsSet.has(skill)) {
            matchCount++;
        }
    }

    return matchCount / jobSkillsSet.size;
}

// Mercury scoring — client-side implementation with skills matching
// Scores each record against target fields with weights
// Returns records sorted by score descending, with _mercury_score attached
function mercuryScore(records, fields, skillsField, skillsTarget, skillsWeight) {
    return records.map(rec => {
        let totalScore = 0;
        let totalWeight = 0;

        // Score standard fields (numeric and string matching)
        for (const f of fields) {
            const val = rec[f.field];
            const target = f.target;
            const weight = f.weight || 1;
            totalWeight += weight;

            // Numeric fields: score based on proximity
            const numVal = parseFloat(val);
            const numTarget = parseFloat(target);
            if (!isNaN(numVal) && !isNaN(numTarget)) {
                const maxDiff = Math.max(Math.abs(numTarget), 1);
                const diff = Math.abs(numVal - numTarget);
                const score = Math.max(0, 1 - diff / maxDiff);
                totalScore += score * weight;
            }
            // String fields: exact match = 1, no match = 0
            else if (typeof val === 'string' && typeof target === 'string') {
                totalScore += (val.toLowerCase() === target.toLowerCase() ? 1 : 0) * weight;
            }
        }

        // Add skills matching if specified
        if (skillsField && skillsTarget && skillsWeight) {
            const skillsScore = calculateSkillsMatch(skillsTarget, rec[skillsField]);
            totalScore += skillsScore * skillsWeight;
            totalWeight += skillsWeight;
            rec._skills_score = skillsScore;
        }

        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        return { ...rec, _mercury_score: finalScore };
    }).sort((a, b) => b._mercury_score - a._mercury_score);
}

// Mercury: find matching candidates for a job — server-side SCORECANDS.CS
// Falls back to client-side mercuryScore() if /report is unreachable.
async function findMatchingCandidates(job) {
    const salaryMid = (parseInt(job.salary_min) + parseInt(job.salary_max)) / 2;
    try {
        const text = await runReport('SCORECANDS', {
            salary_mid: String(salaryMid),
            exp_target: String(job.experience_years),
            remote_pref: job.remote_ok === 'true' ? 'true' : 'false'
        });
        const scored = parsePipeTable(text).map(r => ({
            cand_id: r.cand_id,
            name: r.name,
            title: r.title,
            location: r.location,
            desired_salary: r.desired_salary,
            remote_only: r.remote_only,
            experience_years: r.exp,
            skills: r.skills,
            _mercury_score: parseFloat(r.score) || 0
        })).sort((a, b) => b._mercury_score - a._mercury_score);
        // Layer on client-side skills matching for presentation (the
        // server program does proximity + exact-string match but leaves
        // skills-matching overlay to the frontend until SCORECANDS
        // supports it structurally).
        scored.forEach(c => { c._skills_score = calculateSkillsMatch(job.skills, c.skills); });
        return scored.slice(0, 20);
    } catch (err) {
        console.warn('SCORECANDS report failed, falling back to client-side scoring:', err.message);
        const all = await loadCandidates();
        const available = all.filter(c => c.available === 'true');
        return mercuryScore(
            available,
            [
                { field: 'experience_years', target: parseInt(job.experience_years), weight: 3 },
                { field: 'desired_salary', target: salaryMid, weight: 2 },
                { field: 'remote_only', target: job.remote_ok === 'true' ? 'true' : 'false', weight: 1 }
            ],
            'skills',
            job.skills,
            5
        ).slice(0, 20);
    }
}

// Mercury: find matching jobs for a candidate (with skills matching!)
async function findMatchingJobs(candidate) {
    try {
        const text = await runReport('SCOREJOBS', {
            salary_target: String(candidate.desired_salary),
            exp_target: String(candidate.experience_years),
            remote_pref: candidate.remote_only === 'true' ? 'true' : 'false'
        });
        const scored = parsePipeTable(text).map(r => ({
            job_id: r.job_id,
            title: r.title,
            company: r.company,
            location: r.location,
            salary_min: r.salary_min,
            salary_max: r.salary_max,
            remote_ok: r.remote,
            experience_years: r.exp,
            _mercury_score: parseFloat(r.score) || 0
        })).sort((a, b) => b._mercury_score - a._mercury_score);
        return scored.slice(0, 20);
    } catch (err) {
        console.warn('SCOREJOBS report failed, falling back to client-side scoring:', err.message);
        const all = await loadListings();
        const open = all.filter(j => j.status === 'open');
        return mercuryScore(
            open,
            [
                { field: 'salary_max', target: parseInt(candidate.desired_salary), weight: 3 },
                { field: 'experience_years', target: parseInt(candidate.experience_years), weight: 2 },
                { field: 'remote_ok', target: candidate.remote_only, weight: 2 }
            ],
            'skills',
            candidate.skills,
            5
        ).slice(0, 20);
    }
}

// Authenticated write call using the origin-locked site key. The body
// passed in carries the per-call fields (file, record, where, set); we
// inject userid + project here so every call is consistently scoped.
async function apiCall(endpoint, body) {
    const fullBody = Object.assign({ userid: CHAPROLA_USERID, project: CHAPROLA_PROJECT }, body);
    const res = await fetch(CHAPROLA_API_BASE + endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + SITE_KEY
        },
        body: JSON.stringify(fullBody)
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { /* plaintext */ }
    if (!res.ok) {
        const msg = (data && (data.error || data.message)) || text || ('HTTP ' + res.status);
        throw new Error(msg);
    }
    return data;
}

// Utility: format salary
function formatSalary(min, max) {
    const fmtMin = parseInt(min).toLocaleString();
    const fmtMax = parseInt(max).toLocaleString();
    return `$${fmtMin} – $${fmtMax}`;
}

// Utility: parse skills string
function parseSkills(skills) {
    return skills ? skills.split('|').map(s => s.trim()).filter(s => s) : [];
}

// Utility: get URL params
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}
