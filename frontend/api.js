// Chaprola Jobs API layer
const API_BASE = 'https://api.chaprola.org';
const USERID = 'chaprola-jobs';
const PROJECT = 'jobs';

// Public report calls (no auth needed)
async function fetchReport(name, params = {}) {
    const qs = new URLSearchParams({ userid: USERID, project: PROJECT, name, ...params });
    const res = await fetch(`${API_BASE}/report?${qs}`);
    return res.text();
}

// Proxy call for authenticated operations
async function apiCall(endpoint, body) {
    const res = await fetch('api/proxy.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, ...body })
    });
    return res.json();
}

// Direct query (for reading — uses published report ACL or proxy)
async function queryData(file, options = {}) {
    const body = { userid: USERID, project: PROJECT, file, ...options };
    const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

// Fetch all open job listings
async function getJobs() {
    // Use published report endpoint (public, no auth)
    const data = await queryData('listings', {
        where: [{ field: 'status', op: 'eq', value: 'open' }],
        order_by: 'posted_at',
        order: 'desc'
    });
    return data.records || [];
}

// Fetch all available candidates
async function getCandidates() {
    const data = await queryData('candidates', {
        where: [{ field: 'available', op: 'eq', value: 'true' }],
        order_by: 'created_at',
        order: 'desc'
    });
    return data.records || [];
}

// Get single job by ID
async function getJob(jobId) {
    const data = await queryData('listings', {
        where: [{ field: 'job_id', op: 'eq', value: jobId }],
        limit: 1
    });
    return (data.records && data.records[0]) || null;
}

// Get single candidate by ID
async function getCandidate(candId) {
    const data = await queryData('candidates', {
        where: [{ field: 'cand_id', op: 'eq', value: candId }],
        limit: 1
    });
    return (data.records && data.records[0]) || null;
}

// Mercury: find matching candidates for a job
async function findMatchingCandidates(job) {
    const salaryMid = (parseInt(job.salary_min) + parseInt(job.salary_max)) / 2;
    const data = await queryData('candidates', {
        where: [{ field: 'available', op: 'eq', value: 'true' }],
        mercury: {
            fields: [
                { field: 'experience_years', target: parseInt(job.experience_years), weight: 3 },
                { field: 'desired_salary', target: salaryMid, weight: 2 },
                { field: 'remote_only', target: job.remote_ok === 'true' ? 'true' : 'false', weight: 1 }
            ]
        },
        limit: 20
    });
    return data.records || [];
}

// Mercury: find matching jobs for a candidate
async function findMatchingJobs(candidate) {
    const data = await queryData('listings', {
        where: [{ field: 'status', op: 'eq', value: 'open' }],
        mercury: {
            fields: [
                { field: 'salary_max', target: parseInt(candidate.desired_salary), weight: 3 },
                { field: 'experience_years', target: parseInt(candidate.experience_years), weight: 2 },
                { field: 'remote_ok', target: candidate.remote_only, weight: 2 }
            ]
        },
        limit: 20
    });
    return data.records || [];
}

// Utility: format salary
function formatSalary(min, max) {
    const fmtMin = parseInt(min).toLocaleString();
    const fmtMax = parseInt(max).toLocaleString();
    return `$${fmtMin} – $${fmtMax}`;
}

// Utility: parse skills string
function parseSkills(skills) {
    return skills ? skills.split('|').filter(s => s.trim()) : [];
}

// Utility: get URL params
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}
