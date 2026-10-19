# Getting started

## 1. Install the tools

| Tool | Version | Check with |
|---|---|---|
| [Node.js](https://nodejs.org) | 20.19 or newer, or 22.12 or newer | `node -v` |
| npm | comes with Node.js | `npm -v` |
| [Git](https://git-scm.com) | any recent version | `git --version` |
| A code editor | VS Code is recommended | |

Recommended VS Code extensions:
- **Tailwind CSS IntelliSense**: autocompletes class names
- **ES7+ React snippets** (optional)

## 2. Get the code

Ask the lead to add you to the GitHub repository, accept the email invite, sign in with the [GitHub CLI](https://cli.github.com), then clone:

```bash
gh auth login
git clone https://github.com/Aysayas/table-reservation.git
```

Keep it **outside OneDrive, Google Drive or Dropbox** (for example `C:\dev\table-reservation`). Syncing tools can corrupt Git folders.

## 2b. Install dependencies

```bash
cd table-reservation/frontend
npm install
npx playwright install chromium
```

The second command downloads the browser used for tests. You only need it once per computer.

## 3. Set up your environment file

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Leave the default value until the backend exists. See [Calling the API](api.md).

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:5173. The page reloads by itself when you save a file.

Try these URLs to see each area:
- http://localhost:5173/ (customer)
- http://localhost:5173/table/1 (QR ordering)
- http://localhost:5173/staff (staff)
- http://localhost:5173/kitchen (kitchen display)
- http://localhost:5173/admin (admin)

## 5. Before you share your work

```bash
npm run format
npm run build
npm run lint
npm run test:e2e
```

Fix anything they report before handing your changes over. See [Testing](testing.md).

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` is not recognized | Install Node.js, then close and reopen the terminal |
| Port 5173 is already in use | Stop the other dev server, or Vite will offer the next free port |
| Errors after pulling someone's changes | Run `npm install` again |
| Files locked or slow installs inside OneDrive | Pause OneDrive syncing while installing, or keep the code outside OneDrive |
