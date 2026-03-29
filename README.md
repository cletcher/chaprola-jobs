# Chaprola Jobs

A job board with Mercury-powered candidate matching, built on [Chaprola](https://chaprola.org).

**Live:** https://chaprola.org/apps/chaprola-jobs/jobs/

## What it does

Post jobs, post candidate profiles. Mercury scores candidates against job requirements across multiple dimensions — skills match, experience level, salary range, remote preference. Returns ranked "best match" results, not just filtered lists.

The reverse works too — candidates can find their best job fits.

## Features

- **Mercury scoring** — Chaprola's built-in weighted multi-criteria ranking engine
- **18 job listings** and **25+ candidate profiles** with realistic seed data
- **Two-way matching** — recruiters find candidates, candidates find jobs
- **Match visualization** — percentage bars with color coding (green >80%, yellow >60%, red <60%)
- **Search and filter** — by skills, location, experience, remote preference

## Tech stack

- Static frontend (HTML/JS/CSS) — no framework, no build step
- [Chaprola](https://chaprola.org) API backend — all data operations via HTTP POST
- Mercury scoring for ranked matching

## Chaprola features demonstrated

| Feature | Usage |
|---------|-------|
| `/import` | Seed data for listings and candidates |
| `/index` | Indexes on job_id, status, cand_id, available |
| `/query` with Mercury | Ranked candidate/job matching |
| `/compile` + `/publish` | JOBLIST, CANDLIST, JOBDETAIL, CANDDETAIL reports |
| `/insert_record` | Post new jobs and candidate profiles |

## Built with

Built by a fresh Claude agent using only Chaprola MCP documentation. No prior knowledge of the platform.
