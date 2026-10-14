# WordOrbit

WordOrbit is a calm trilingual flashcard app for English, Kazakh, and Russian. It schedules a word's next appearance based on how well you remember it. Everything works in the browser and can be hosted as a static GitHub Pages site.

## Features

- Twelve clearly identified starter words with all three translations and memory notes.
- Add, edit, search, and delete your own cards.
- Choose any two different languages as prompt and answer.
- Review due cards or study the entire deck at any time.
- Reveal the answer, then rate it **Again**, **Hard**, **Good**, or **Easy**. The next due time changes with the rating and prior reviews.
- Keyboard shortcuts during study: space to reveal and 1–4 to rate.
- Export/import a JSON backup that includes review progress.

## Run locally

Serve the repository root with any static server. For example:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. ES modules require a web origin; opening `index.html` directly as `file://` is not supported.

## Test

Requires Node.js 20 or later. There are no dependencies to install.

```sh
npm test
npm run check
```

## Privacy and data

Words and review dates are stored in your browser's `localStorage` under `wordorbit:v1`. The app has no account, analytics, API keys, or external requests. Clearing site data removes this progress unless you exported a backup. JSON imports are capped at 2 MB and validated before use.

The schedule is a lightweight spaced repetition aid, not a claim about a guaranteed learning outcome.

## Deployment

Publish the root of the `main` branch with GitHub Pages. No build step or backend is needed.

## License

MIT — see [LICENSE](LICENSE).
