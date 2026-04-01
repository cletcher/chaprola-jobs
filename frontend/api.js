// Chaprola Jobs — data layer
// Hybrid approach: loads from static JSON for listings/candidates
// Mercury scoring enhanced with skills matching

let _listings = null;
let _candidates = null;

async function loadListings() {
    if (_listings) return _listings;
    const res = await fetch('data-listings.json');
    if (!res.ok) throw new Error(`Failed to load listings: ${res.status}`);
    _listings = await res.json();
    console.log(`Loaded ${_listings.length} listings`);
    return _listings;
}

async function loadCandidates() {
    if (_candidates) return _candidates;
    const res = await fetch('candidates.json');
    _candidates = await res.json();
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

// Mercury: find matching candidates for a job (with skills matching!)
async function findMatchingCandidates(job) {
    const all = await loadCandidates();
    const available = all.filter(c => c.available === 'true');
    const salaryMid = (parseInt(job.salary_min) + parseInt(job.salary_max)) / 2;

    return mercuryScore(
        available,
        [
            { field: 'experience_years', target: parseInt(job.experience_years), weight: 3 },
            { field: 'desired_salary', target: salaryMid, weight: 2 },
            { field: 'remote_only', target: job.remote_ok === 'true' ? 'true' : 'false', weight: 1 }
        ],
        'skills',        // Skills field in candidate records
        job.skills,      // Target skills from job
        5                // Skills weight (highest priority!)
    ).slice(0, 20);
}

// Mercury: find matching jobs for a candidate (with skills matching!)
async function findMatchingJobs(candidate) {
    const all = await loadListings();
    const open = all.filter(j => j.status === 'open');

    return mercuryScore(
        open,
        [
            { field: 'salary_max', target: parseInt(candidate.desired_salary), weight: 3 },
            { field: 'experience_years', target: parseInt(candidate.experience_years), weight: 2 },
            { field: 'remote_ok', target: candidate.remote_only, weight: 2 }
        ],
        'skills',           // Skills field in job records
        candidate.skills,   // Target skills from candidate
        5                   // Skills weight (highest priority!)
    ).slice(0, 20);
}

// Proxy call for authenticated operations (insert-record, etc.)
async function apiCall(endpoint, body) {
    // For writes, we need authentication - this would normally go through a server proxy
    throw new Error('Write operations require backend proxy - not yet implemented');
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
