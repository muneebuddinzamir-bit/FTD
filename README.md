# FusionTECH Dynamics — Company Website

A fast, responsive, multi-page marketing website for **FusionTECH Dynamics**, an aerospace and embedded-systems engineering company (UAV, avionics, simulation, AI, and real-time embedded systems).

The site is a **pure static front-end** (HTML + CSS + JavaScript) with a working contact form powered by [Formspree](https://formspree.io). It is hosted for free on Cloudflare.

🌐 **Live:** https://snowy-rice-83ef.muneebuddin-zamir.workers.dev

---

## Tech stack

- **HTML** — static pages (no backend, no build step)
- **CSS** — custom styling, fully responsive (desktop + mobile)
- **JavaScript** — navigation, scroll animations, typewriter, live telemetry demo, and contact-form handling
- **Formspree** — contact-form email delivery (no server required)
- **Cloudflare** — static hosting with free HTTPS/SSL

> The site was originally built with Flask + PHP/PHPMailer, then converted to a static export so it can run on free static hosting. The old backend remains in the Git history.

## Project structure

```
public/                 # the deployable website (this folder is uploaded to Cloudflare)
├─ index.html           # Home
├─ about.html           # About
├─ services.html        # Services
├─ projects.html        # Projects
├─ blog.html            # Insights
├─ contact.html         # Contact (Formspree form)
├─ 404.html             # Not-found page
└─ static/
   ├─ css/style.css
   ├─ js/main.js
   └─ img/              # logo + hero image
```

All asset and page links are **relative**, so the site works both from a local server and from any host.

## Run locally

The site is static — just serve the `public/` folder with any static server. For example, with the VS Code **Live Server** extension, open `public/index.html` → *Open with Live Server*.

Or with Python:

```bash
cd public
python -m http.server 5500
# then open http://127.0.0.1:5500
```

## Contact form

The contact form (`public/contact.html`) submits to Formspree via the form's `data-endpoint`. Inquiries are delivered to the company email shown on the site. To point it at a different Formspree form, replace the `data-endpoint` URL.

## Deploy (Cloudflare)

Direct upload — no build step:

1. Cloudflare dashboard → **Workers & Pages** → **Create**
2. Choose **Upload your static files** (or **Pages → Upload assets**)
3. Upload the contents of the **`public/`** folder (so `index.html` is at the root)
4. (Optional) Attach a custom domain in the project settings

CLI alternative: `npx wrangler pages deploy public`
