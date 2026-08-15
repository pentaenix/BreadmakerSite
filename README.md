# Breadmaker website preview

Static preview site for Breadmaker. It is ready to deploy with GitHub Pages.

## Publish

1. Create a GitHub repository and put these files at the repository root.
2. Push the repository to the `main` branch.
3. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. The `Deploy GitHub Pages` workflow will publish the site.

After that, every push to `main` deploys automatically.

The site uses relative URLs, so it works both as a user/organization Pages site and under a project path such as `https://username.github.io/repository-name/`.

## Preview status

The Breadmaker application download is intentionally disabled. No application ZIP is included in this repository. The download controls remain in the design so they can be enabled when the application is ready.

## Local preview

You can double-click `index.html`, or serve the directory locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Validate

```bash
python3 scripts/check_site.py
```

The validator checks local HTML asset/link paths and fails if a ZIP archive is accidentally added to the public preview.


## Local preview

Run `./run` from the repository root. It serves the site at `http://127.0.0.1:8775/` and opens it in your default browser. Set `PORT` to use a different port.
