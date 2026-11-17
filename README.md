# Keepalive

**A maintenance fund and open method for keeping community-critical open-source software alive.**

Clinics, schools and farmer cooperatives run on open-source tools that were often built by a grant-funded team that has since moved on. The code still runs in thousands of places, but nobody is patching it. Funders pay for launches, almost never for upkeep. Keepalive treats maintenance as a public good.

> **Status: v0.1 prototype.** The scanner and scoring method work and are tested. The maintainer programme described below is the plan for the Mozilla Foundation Fellowship year and has not started. Nothing here claims any tool is abandoned.

## What Keepalive does

1. **Finds at-risk tools.** An open *Dependence and Decay Index* screens public repositories in health, agriculture and education for signs of neglect, weighted by how many people plausibly rely on them.
2. **Pays local maintainers.** Each selected tool gets a part-time maintainer who lives in a region that uses it, paid a transparent stipend ([docs/STIPENDS.md](docs/STIPENDS.md)).
3. **Plans the handoff.** Every maintainer works under a public [maintenance charter](docs/CHARTER.md), and every tool leaves the programme with a sustainability path: a host institution, a user-funded pool, or a successor team.

## Quick start

Requires Python 3.10+ and no third-party packages.

```bash
git clone https://github.com/<your-username>/keepalive.git
cd keepalive
export GITHUB_TOKEN=<a personal access token, no scopes needed>   # avoids rate limits
PYTHONPATH=src python3 -m keepalive.cli scan data/watchlist.csv --md report.md --csv report.csv
```

Add your own candidates to `data/watchlist.csv`:

| column | meaning |
|---|---|
| `repo` | `owner/name` on GitHub |
| `domain` | health, agriculture, education |
| `known_deployments` | verified live installations, from interviews with users (optional) |
| `notes` | free text |

The seed rows in `data/watchlist.csv` are healthy, well-known projects included only to test the pipeline.

Run the tests:

```bash
pip install pytest && pytest
```

## How scoring works

Short version: **priority = geometric mean of decay and dependence**, so a tool ranks high only when it is both widely relied on and decaying. Full details, limits and known biases are in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

## Measuring success

Before and after, in public: vulnerabilities fixed and median time to patch, median time to answer a support issue, live deployments kept on supported versions, local maintainers trained and still active at month 12, and tools handed to a lasting steward.

## Contributing

Nominate a tool, interview a user, or help build the index. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, see [LICENSE](LICENSE).
