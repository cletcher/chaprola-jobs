// MYJOBS — Listings posted by the caller
// Multi-user: scoped to PARAM.user_id matching listings.poster_sub.
// Used by the "My Postings" tab for a logged-in employer.

OPEN PRIMARY "listings"

QUERY listings INTO mine WHERE poster_sub EQ PARAM.user_id ORDER BY posted_at DESC

LET rec = 1

100 READ mine rec
    IF EOF END
    PRINT mine.job_id + "|" + mine.title + "|" + mine.company + "|" + mine.location + "|" + mine.status + "|" + mine.posted_at
    LET rec = rec + 1
    GOTO 100
