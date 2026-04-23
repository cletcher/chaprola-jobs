// SCOREJOBS — Server-side Mercury scoring: best jobs for one candidate
// Params:
//   PARAM.salary_target — candidate's desired salary (numeric)
//   PARAM.exp_target    — candidate's experience_years (numeric)
//   PARAM.remote_pref   — "true" or "false"

OPEN PRIMARY "listings"

QUERY listings INTO open_jobs WHERE status EQ "open" ORDER BY posted_at DESC

LET salary_target = 0
LET exp_target = 0
LET sal_max = 0
LET exp_years = 0
LET diff = 0
LET prox_salary = 0
LET prox_exp = 0
LET match_remote = 0
LET score = 0
LET one = 1
LET rec = 1

LET salary_target = PARAM.salary_target
LET exp_target = PARAM.exp_target
MOVE PARAM.remote_pref U.400 5

PRINT "SCORE|JOB_ID|TITLE|COMPANY|LOCATION|SALARY_MIN|SALARY_MAX|REMOTE|EXP"

100 READ open_jobs rec
    IF EOF END
    GET sal_max FROM open_jobs.salary_max
    GET exp_years FROM open_jobs.experience_years

    LET diff = sal_max - salary_target
    IF diff LT 0 LET diff = salary_target - sal_max ;
    LET prox_salary = diff / 10000
    LET prox_salary = prox_salary + 1
    LET prox_salary = one / prox_salary

    LET diff = exp_years - exp_target
    IF diff LT 0 LET diff = exp_target - exp_years ;
    LET prox_exp = diff + 1
    LET prox_exp = one / prox_exp

    LET match_remote = 0
    IF EQUAL open_jobs.remote_ok U.400 5 LET match_remote = 1 ;

    LET score = prox_salary * 3
    LET prox_exp = prox_exp * 2
    LET score = score + prox_exp
    LET prox_salary = match_remote * 2
    LET score = score + prox_salary
    LET score = score / 7

    PRINT score + "|" + open_jobs.job_id + "|" + open_jobs.title + "|" + open_jobs.company + "|" + open_jobs.location + "|" + open_jobs.salary_min + "|" + open_jobs.salary_max + "|" + open_jobs.remote_ok + "|" + open_jobs.experience_years
    LET rec = rec + 1
    GOTO 100
