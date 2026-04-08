# Privacy Site

Static privacy-policy site for the Birdsong ID MVP.

## Files

- `index.html` — mobile-friendly publishable webpage
- `styles.css` — page styling
- `privacy-policy.md` — editable source text / plain-text policy reference

## Preview locally

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080`

## Publish options

This folder is static HTML/CSS, so it can be deployed to:

- GitHub Pages
- Netlify
- Vercel static hosting
- S3/Cloudflare Pages/any simple web host

## Before publishing

Replace the placeholder contact email in `index.html` and `privacy-policy.md`.

Also confirm the real backend hosting/log retention details before making stronger retention or deletion promises.
