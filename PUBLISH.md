# Publishing this repository to GitHub

Using the GitHub CLI (`gh`):

```bash
cd keepalive
git init -b main
git add .
git commit -m "Keepalive v0.1: Dependence and Decay Index, charter and docs"
gh auth login                      # once
gh repo create keepalive --public --source=. --push \
  --description "A maintenance fund and open method for keeping community-critical open-source software alive"
gh repo edit --add-topic open-source --add-topic maintenance --add-topic mozilla-fellowship
```

Without the CLI: create an empty public repository named `keepalive` on github.com, then

```bash
git init -b main && git add . && git commit -m "Keepalive v0.1"
git remote add origin https://github.com/<your-username>/keepalive.git
git push -u origin main
```

Then replace `<your-username>` in README.md and put the repository link in your Letter of Intent.
