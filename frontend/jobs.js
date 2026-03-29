// Jobs listing page logic
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('jobs-list');
    const searchInput = document.getElementById('search');
    const remoteFilter = document.getElementById('remote-filter');
    const expFilter = document.getElementById('exp-filter');

    let allJobs = [];

    try {
        allJobs = await getJobs();
        renderJobs(allJobs);
    } catch (e) {
        container.innerHTML = '<div class="error">Failed to load jobs. Please try again.</div>';
    }

    function renderJobs(jobs) {
        if (!jobs.length) {
            container.innerHTML = '<div class="loading">No jobs found.</div>';
            return;
        }
        container.innerHTML = jobs.map(job => `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${job.title}</div>
                        <div class="card-company">${job.company}</div>
                    </div>
                    ${job.remote_ok === 'true' ? '<span class="card-badge remote">Remote OK</span>' : ''}
                </div>
                <div class="card-meta">
                    <span>📍 ${job.location}</span>
                    <span>💰 ${formatSalary(job.salary_min, job.salary_max)}</span>
                    <span>📅 ${job.experience_years}+ yrs</span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem;">${job.job_desc || ''}</p>
                <div class="card-skills">
                    ${parseSkills(job.skills).map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
                <div class="card-actions">
                    <a href="job.html?id=${job.job_id}" class="btn btn-primary btn-sm">View & Match</a>
                </div>
            </div>
        `).join('');
    }

    function applyFilters() {
        const q = searchInput.value.toLowerCase();
        const remote = remoteFilter.value;
        const exp = expFilter.value;
        let filtered = allJobs;
        if (q) filtered = filtered.filter(j =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.skills.toLowerCase().includes(q) ||
            j.location.toLowerCase().includes(q)
        );
        if (remote) filtered = filtered.filter(j => j.remote_ok === remote);
        if (exp) {
            const [lo, hi] = exp === '5+' ? [5, 999] : exp.split('-').map(Number);
            filtered = filtered.filter(j => {
                const y = parseInt(j.experience_years);
                return y >= lo && y <= (hi || 999);
            });
        }
        renderJobs(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    remoteFilter.addEventListener('change', applyFilters);
    expFilter.addEventListener('change', applyFilters);
});
