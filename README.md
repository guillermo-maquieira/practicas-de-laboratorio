# Lab Progress Tracker

Build a single-page app called "PDL – Prácticas de Laboratorio". Students register via a form with three fields: name, last name, and GitHub repo ("username/repo"), validated against GET https://api.github.com/repos/{username}/{repo} (inline error if it fails). Entries are saved in localStorage.

Table with six columns: # (row number, starting at 1), Student (name + last name), Repository (link to https://github.com/{repo}), Date (a dropdown with exactly two options: November 26 and December 17, chosen at registration), Progress % (progress bar), and Review (one-line summary). Sorted always from highest to lowest %.

Progress % per repo, computed from GET /repos/{repo} (size, description) and the file tree (GET /repos/{repo}/git/trees/HEAD?recursive=1):

- Code, 40 pts: size >= 500 KB = full points

- Docs, 40 pts: README (15), docs/ folder or any PDF/PPTX (15), any image (10)

- Professionalism, 20 pts: description set (10), LICENSE (10)

Show "—" and ⚠️ if the repo fails. Cache each repo's result for 30 minutes in localStorage.

A lock icon in the header asks for PIN 8954; with it, the teacher gets an extra Approved checkbox per row (unchecked by default) and can also override %, Review, and the Date by hand. Everything saved in localStorage, overrides take precedence.

Minimal design, purple accent.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/286f6ef4-e0cb-4dd3-9f9f-1929d39b8273).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
