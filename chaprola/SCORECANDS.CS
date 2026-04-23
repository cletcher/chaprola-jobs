// SCORECANDS — Server-side Mercury scoring: best candidates for one job
// Params:
//   PARAM.salary_mid   — (salary_min+salary_max)/2 of the target job
//   PARAM.exp_target   — job's experience_years
//   PARAM.remote_pref  — "true" or "false" from the job's remote_ok
//
// Mercury-style proximity scoring, done server-side over all available
// candidates. Weights:
//   desired_salary vs salary_mid      weight 3
//   experience_years vs exp_target    weight 2
//   remote_only == remote_pref        weight 2
// Output: top matches pipe-delimited with score first.

OPEN PRIMARY "candidates"

QUERY candidates INTO avail WHERE available EQ "true" ORDER BY created_at DESC

LET salary_mid = 0
LET exp_target = 0
LET desired_salary = 0
LET exp_years = 0
LET diff = 0
LET prox_salary = 0
LET prox_exp = 0
LET match_remote = 0
LET score = 0
LET rec = 1

LET salary_mid = PARAM.salary_mid
LET exp_target = PARAM.exp_target

PRINT "SCORE|CAND_ID|NAME|TITLE|DESIRED_SALARY|REMOTE_ONLY|EXP|SKILLS"

100 READ avail rec
    IF EOF END
    GET desired_salary FROM avail.desired_salary
    GET exp_years FROM avail.experience_years

    LET diff = desired_salary - salary_mid
    IF diff LT 0 LET diff = 0 - diff ;
    LET prox_salary = diff / 10000
    LET prox_salary = prox_salary + 1
    LET prox_salary = 1 / prox_salary

    LET diff = exp_years - exp_target
    IF diff LT 0 LET diff = 0 - diff ;
    LET prox_exp = diff + 1
    LET prox_exp = 1 / prox_exp

    LET match_remote = 0
    IF EQUAL avail.remote_only PARAM.remote_pref 5 LET match_remote = 1 ;

    LET score = prox_salary * 3
    LET prox_exp = prox_exp * 2
    LET score = score + prox_exp
    LET prox_salary = match_remote * 2
    LET score = score + prox_salary
    LET score = score / 7

    PRINT score + "|" + avail.cand_id + "|" + avail.name + "|" + avail.title + "|" + avail.desired_salary + "|" + avail.remote_only + "|" + avail.experience_years + "|" + avail.skills
    LET rec = rec + 1
    GOTO 100
