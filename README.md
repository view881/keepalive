# Keepalive dashboard

A static dashboard (HTML, CSS, JavaScript, no build step) for the Keepalive Dependence and Decay Index.

## Run locally
Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.

## Use your own data
1. Run the scanner: `keepalive scan data/watchlist.csv --csv report.csv`
2. In the dashboard, choose **Load report.csv**. The file is read in your browser and never uploaded.

The built-in sample data (`sample-data.js`) is fictional.

## Deploy
Upload this folder to any static host: GitHub Pages (put the files in `/docs` or a `gh-pages` branch), Netlify (drag and drop the folder), Cloudflare Pages, or any web server.
