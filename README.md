# Vibe Coding Log

**Live site: [mauriceeggel.github.io/vibe-coding-test](https://mauriceeggel.github.io/vibe-coding-test/)**

- [2026-10-14 · Lantern](https://mauriceeggel.github.io/vibe-coding-test/26-10-14-lantern/) ([code](26-10-14-lantern/))
- [2026-10-08 · Shared Listening Room](https://mauriceeggel.github.io/vibe-coding-test/26-10-08-soundroom/) ([code](26-10-08-soundroom/))

Small web experiments built by vibe coding, for the course *Creative Coding: Future of Web* (2026–2027).

The site is published with GitHub Pages. The home page (`index.html`) lists every project; each project lives in its own folder.

## Projects

| Date | Project | Folder |
| --- | --- | --- |
| 2026-10-14 | Lantern | [`26-10-14-lantern/`](26-10-14-lantern/) |
| 2026-10-08 | Shared Listening Room | [`26-10-08-soundroom/`](26-10-08-soundroom/) |

## Structure

```
.
├── index.html              home page: the list of projects
├── 26-10-14-lantern/
│   └── index.html          Lantern
├── 26-10-08-soundroom/
│   └── index.html          Shared Listening Room
├── README.md
└── .github/workflows/
    └── pages.yml           publishes the whole folder to GitHub Pages
```

## Adding a project

1. Create a folder named `YY-MM-DD-name` with an `index.html` inside.
2. In the home page `index.html`, copy one `<li>` of the list, put it at the top and change the date, link, title and note.
3. Add a line to the list at the top and a row to the table above.

## Notes

- Shared Listening Room is also published on claude.ai, where visitors who have the page open at the same time hear each other. On GitHub Pages there is no shared room: each visitor is alone, with the simulated presences.
- Lantern needs the microphone, which browsers only allow over HTTPS or on `localhost` (GitHub Pages is HTTPS). Without a microphone, holding Space makes light too.
