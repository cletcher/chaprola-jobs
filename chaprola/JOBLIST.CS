// JOBLIST — List open job postings
// Multi-user: all open jobs are public (a candidate should see every
// posting regardless of who posted it). This program returns every
// open listing; frontend can filter to "my postings" by calling
// MYJOBS.CS instead.
//
// Output column order: skills LAST because skill values are
// internally pipe-delimited. Frontend parsePipeTable greedy-absorbs
// the last column to handle this. Other fields (including job_desc)
// must not contain pipes.

OPEN PRIMARY "listings"

QUERY listings INTO open_jobs WHERE status EQ "open" ORDER BY posted_at DESC

LET rec = 1

PRINT "job_id|title|company|location|remote|salary_min|salary_max|exp|posted_at|job_desc|skills"

100 READ open_jobs rec
    IF EOF END
    PRINT open_jobs.job_id + "|" + open_jobs.title + "|" + open_jobs.company + "|" + open_jobs.location + "|" + open_jobs.remote_ok + "|" + open_jobs.salary_min + "|" + open_jobs.salary_max + "|" + open_jobs.experience_years + "|" + open_jobs.posted_at + "|" + open_jobs.job_desc + "|" + open_jobs.skills
    LET rec = rec + 1
    GOTO 100
