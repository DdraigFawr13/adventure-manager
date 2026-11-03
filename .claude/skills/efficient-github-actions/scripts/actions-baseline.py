#!/usr/bin/env python3
"""Billed GitHub Actions job-minutes for one repository since a date.

Usage: actions-baseline.py OWNER REPO YYYY-MM-DD [--runs]
Needs an authenticated `gh`. Each job is rounded up to a whole minute, as GitHub bills.
Pages manually (&page=N) because some proxies reject --paginate's numeric-ID links.
Read-only.
"""
import collections, datetime as dt, json, math, subprocess, sys

def get(path):
    out = subprocess.run(["gh", "api", path], capture_output=True, text=True)
    if out.returncode:
        sys.exit(f"gh api {path} failed: {out.stderr.strip()[:300]}")
    return json.loads(out.stdout)

def pages(path, key):
    items, page = [], 1
    while True:
        batch = get(f"{path}&per_page=100&page={page}")[key]
        items += batch
        if len(batch) < 100:
            return items
        page += 1

def ts(t):
    return dt.datetime.fromisoformat(t.replace("Z", "+00:00"))

def main():
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    owner, repo, since = sys.argv[1:4]
    base = f"repos/{owner}/{repo}"
    vis = get(base)["visibility"]
    runs = pages(f"{base}/actions/runs?created=>={since}", "workflow_runs")
    agg = collections.defaultdict(lambda: [0, 0, 0, 0, 0])  # runs jobs minutes failed cancelled
    rows = []
    for r in runs:
        jobs = pages(f"{base}/actions/runs/{r['id']}/jobs?filter=all", "jobs")
        mins = sum(math.ceil((ts(j["completed_at"]) - ts(j["started_at"])).total_seconds() / 60)
                   for j in jobs if j.get("started_at") and j.get("completed_at")
                   and ts(j["completed_at"]) > ts(j["started_at"]))
        a = agg[(r["name"], r["event"], "default" if r["head_branch"] == r["repository"].get("default_branch", "main") else "other")]
        a[0] += 1; a[1] += len(jobs); a[2] += mins
        a[3] += r["conclusion"] in ("failure", "startup_failure")
        a[4] += r["conclusion"] == "cancelled"
        rows.append((r["id"], r["name"], r["event"], r["head_branch"], r["conclusion"], len(jobs), mins))
    print(f"## {owner}/{repo} ({vis}) since {since}: {len(runs)} runs")
    print("workflow | event | branch | runs | jobs | billed min | failed | cancelled")
    total = 0
    for (n, e, b), (c, j, m, f, x) in sorted(agg.items(), key=lambda kv: -kv[1][2]):
        print(f"{n} | {e} | {b} | {c} | {j} | {m} | {f} | {x}")
        total += m
    print(f"TOTAL billed job-minutes: {total}" + ("  (public repo: standard runners are free)" if vis == "public" else ""))
    zero = [r for r in rows if r[5] == 0 and r[4] == "failure"]
    if zero:
        print(f"{len(zero)} failed runs had zero jobs (often an invalid workflow file on that ref; run actionlint). e.g. run {zero[0][0]}")
    if "--runs" in sys.argv:
        for row in rows:
            print(*row, sep="\t")

main()
