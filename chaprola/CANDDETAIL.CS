// CANDDETAIL — full candidate record by PARAM.cand_id (public view)
// Candidate profiles are public in this demo — employers browse every
// available profile. No user_id scoping on read.

OPEN PRIMARY "candidates"

QUERY candidates INTO cand WHERE cand_id EQ PARAM.cand_id

LET rec = 1
READ cand rec
IF EOF END

PRINT "cand_id|" + cand.cand_id
PRINT "name|" + cand.cand_label
PRINT "email|" + cand.cand_inbox
PRINT "location|" + cand.location
PRINT "salary|" + cand.desired_salary
PRINT "experience|" + cand.experience_years
PRINT "skills|" + cand.skills
PRINT "remote_only|" + cand.remote_only
PRINT "headline|" + cand.headline
PRINT "available|" + cand.available
