// JOBDETAIL — full job record by PARAM.job_id (public view)
// Jobs are public — candidates browse every open listing by URL. No
// user_id scoping.

OPEN PRIMARY "listings"

QUERY listings INTO job WHERE job_id EQ PARAM.job_id

LET rec = 1
READ job rec
IF EOF END

PRINT "job_id|" + job.job_id
PRINT "title|" + job.title
PRINT "company|" + job.company
PRINT "location|" + job.location
PRINT "salary_min|" + job.salary_min
PRINT "salary_max|" + job.salary_max
PRINT "experience|" + job.experience_years
PRINT "skills|" + job.skills
PRINT "remote|" + job.remote_ok
PRINT "status|" + job.status
PRINT "description|" + job.job_desc
PRINT "posted|" + job.posted_at
