// JOBLIST — List open job postings
// Multi-user: all open jobs are public (a candidate should see every
// posting regardless of who posted it). This program returns every
// open listing; frontend can filter to "my postings" by calling
// MYJOBS.CS instead.

OPEN PRIMARY "listings"

QUERY listings INTO open_jobs WHERE status EQ "open" ORDER BY posted_at DESC

LET rec = 1

100 READ open_jobs rec
    IF EOF END
    PRINT open_jobs.job_id + "|" + open_jobs.title + "|" + open_jobs.company + "|" + open_jobs.location + "|" + open_jobs.remote_ok + "|" + open_jobs.salary_min + "|" + open_jobs.salary_max + "|" + open_jobs.experience_years + "|" + open_jobs.skills + "|" + open_jobs.posted_at
    LET rec = rec + 1
    GOTO 100
