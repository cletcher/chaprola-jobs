// SCORECANDS — Server-side Mercury scoring: best candidates for one job
// Params:
//   PARAM.salary_mid   — (salary_min+salary_max)/2 of the target job
//   PARAM.exp_target   — job's experience_years
//   PARAM.remote_pref  — "true" or "false" from the job's remote_ok
//
// Output column order: skills LAST (internally pipe-delimited).

OPEN PRIMARY "candidates"

QUERY candidates INTO avail WHERE available EQ "true" ORDER BY created_at DESC

LET salary_mid = 0
LET exp_target = 0
LET des_sal = 0
LET exp_years = 0
LET diff = 0
LET prox_salary = 0
LET prox_exp = 0
LET match_remote = 0
LET score = 0
LET one = 1
LET rec = 1

LET salary_mid = PARAM.salary_mid
LET exp_target = PARAM.exp_target
MOVE PARAM.remote_pref U.400 5

PRINT "score|cand_id|name|title|location|desired_salary|remote_only|exp|skills"

100 READ avail rec
    IF EOF END
    GET des_sal FROM avail.desired_salary
    GET exp_years FROM avail.experience_years

    LET diff = des_sal - salary_mid
    IF diff LT 0 LET diff = salary_mid - des_sal ;
    LET prox_salary = diff / 10000
    LET prox_salary = prox_salary + 1
    LET prox_salary = one / prox_salary

    LET diff = exp_years - exp_target
    IF diff LT 0 LET diff = exp_target - exp_years ;
    LET prox_exp = diff + 1
    LET prox_exp = one / prox_exp

    LET match_remote = 0
    IF EQUAL avail.remote_only U.400 5 LET match_remote = 1 ;

    LET score = prox_salary * 3
    LET prox_exp = prox_exp * 2
    LET score = score + prox_exp
    LET prox_salary = match_remote * 2
    LET score = score + prox_salary
    LET score = score / 7

    PRINT score + "|" + avail.cand_id + "|" + avail.cand_label + "|" + avail.headline + "|" + avail.location + "|" + avail.desired_salary + "|" + avail.remote_only + "|" + avail.experience_years + "|" + avail.skills
    LET rec = rec + 1
    GOTO 100
