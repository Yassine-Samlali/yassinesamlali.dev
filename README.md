
# yassinesamlali.dev Template

Astro portfolio and blog template for developers and digital creators.

![Template preview](https://github.com/user-attachments/assets/ae539704-2292-492f-882c-c90595b34717)

## Maintainer

- Name: Yassine Samlali
- GitHub: https://github.com/Yassine-Samlali
- Email: samlaliyassine6@gmail.com

## Overview

This repository contains a clean and modern personal website template with:

- Portfolio pages and project showcases
- Blog posts, tags, and technology filters
- RSS feed and sitemap support
- SEO-friendly static output
- Reusable Astro components and icon-based tech capsules

## Tech Stack

- Astro
- Preact
- Tailwind CSS v4
- astro-icon
- PrismJS
- @vercel/speed-insights

## Quick Start

### Use as an Astro Template

```bash
npm create astro@latest -- --template Yassine-Samlali/yassinesamlali.dev
```

### Manual Setup

```bash
git clone https://github.com/Yassine-Samlali/yassinesamlali.dev.git
cd yassinesamlali.dev
npm install
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:4321 in your browser.

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## Project Structure

```text
.
|-- public/
|   `-- images/
|       |-- posts/
|       `-- projects/
|-- src/
|   |-- components/
|   |   |-- blog/
|   |   |-- layout/
|   |   |-- portfolio/
|   |   `-- ui/
|   |-- content/
|   |   |-- config.ts
|   |   `-- staticData/allStaticData.json
|   |-- icons/
|   |-- layouts/
|   |-- pages/
|   |-- scripts/
|   |-- styles/
|   `-- utils/
|-- astro.config.mjs
|-- package.json
`-- tsconfig.json
```

## Customization Guide

### 1) Update Personal Information

Edit profile and metadata values in:

- `src/content/staticData/allStaticData.json`

### 2) Add or Edit Blog Posts

Create or update Markdown files in:

- `src/pages/blog/posts/`

### 3) Add or Edit Portfolio Projects

Create or update Markdown files in:

- `src/pages/portfolio/projects/`

### 4) Add New Languages/Tools Capsules

1. Add the icon SVG to `src/icons/`.
2. Register the item in `src/utils/languages.ts`.

Example entry:

```ts
html: {
  name: "HTML 5",
  iconName: "html",
}
```

### 5) Replace Images and Favicons

- Replace project/post images in `public/images/`
- Replace favicon and PWA assets in `public/`
- Update `public/site.webmanifest` with your app metadata

## Deployment

This is a static Astro project and can be deployed to any static host, including:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages (with an appropriate build/deploy workflow)

## Contributing

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Open a pull request.

## License

Distributed under the MIT License. See `LICENSE` for details.

