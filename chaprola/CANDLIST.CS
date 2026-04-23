// CANDLIST — List available candidates (public)
// Open marketplace of people seeking roles. Public so any employer
// can browse. Each candidate record carries an `owner_sub` so
// candidates can edit their own profile via MYCANDIDATE.CS.

OPEN PRIMARY "candidates"

QUERY candidates INTO avail WHERE available EQ "true" ORDER BY created_at DESC

LET rec = 1

100 READ avail rec
    IF EOF END
    PRINT avail.cand_id + "|" + avail.name + "|" + avail.title + "|" + avail.desired_salary + "|" + avail.remote_only + "|" + avail.experience_years + "|" + avail.skills + "|" + avail.created_at
    LET rec = rec + 1
    GOTO 100
