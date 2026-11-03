# Trivia Maker

Type a topic, get 10 multiple-choice trivia questions. A static PWA: host it on GitHub Pages and add it to your phone's home screen.

## Publish
1. Push these files to your repo's `main` branch.
2. GitHub: Settings > Pages > Deploy from branch > `main` / root.
3. Open `https://YOURNAME.github.io/REPO/` on your phone, then Share > Add to Home Screen (iPhone) or menu > Install app (Android).

## Use
Tap **Settings**, choose Claude or DeepSeek, paste your API key, and save. The key is stored only in your browser (never in the repo). Then enter a topic and tap **Generate**.

## Notes
- Anyone with the page can use their own key; do not hard-code a key in the code.
- If DeepSeek requests are blocked by the browser (CORS), use Claude, or add a small proxy server.
- After editing files, bump `V` in `sw.js` (e.g. `trivia-v2`) so phones pick up the update.
- AI can get facts wrong; spot-check answers.
