// CANDLIST — List available candidates (public)
// Open marketplace of people seeking roles. Public so any employer
// can browse. Each candidate record carries an `owner_sub` so
// candidates can edit their own profile via MYCANDIDATE.CS.
//
// Output column order: skills LAST because skill values are
// internally pipe-delimited. Frontend parsePipeTable greedy-absorbs
// the last column to handle this.

OPEN PRIMARY "candidates"

QUERY candidates INTO avail WHERE available EQ "true" ORDER BY created_at DESC

LET rec = 1

PRINT "cand_id|name|title|location|desired_salary|remote_only|exp|created_at|skills"

100 READ avail rec
    IF EOF END
    PRINT avail.cand_id + "|" + avail.cand_label + "|" + avail.headline + "|" + avail.location + "|" + avail.desired_salary + "|" + avail.remote_only + "|" + avail.experience_years + "|" + avail.created_at + "|" + avail.skills
    LET rec = rec + 1
    GOTO 100
