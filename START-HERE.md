# 👋 Start here: building the frontend with Claude

Hi! This guide is for you, the frontend developer. You don't need to know much about coding to start. Claude will write most of the code with you, and this page shows you how to work with it step by step.

Read it once from top to bottom. After that, use the **cheat sheet** at the end.

---

## 1. What are we building?

Think of a restaurant website with three doors:

| Door | Who uses it | What they do |
|---|---|---|
| 🍽️ **Customer** (on a phone) | Diners | See the menu, reserve a table, order by scanning a QR code on the table |
| 🧑‍🍳 **Staff** (on a computer) | Cashier and kitchen | See reservations, orders and which tables are free |
| 🗂️ **Admin** (on a computer) | Owner | Edit the menu, tables, staff accounts, see reports |

There are **29 screens** in total. Someone already drew every one of them. Those drawings are called **wireframes**, and they're in `docs/wireframes/`. Your job is to turn each drawing into a real web page.

The **frontend** is the part people see and click. The **backend** is the hidden part that saves data. A teammate is doing the backend, so you only do the frontend.

---

## 2. Things you need (one time only)

1. **Node.js**: the engine that runs the project. Download the "LTS" version from [nodejs.org](https://nodejs.org) and install it with the default options.
2. **Git**: the tool that saves versions of the project. Download it from [git-scm.com](https://git-scm.com) and install it with the default options.
3. **GitHub CLI**: lets Claude talk to GitHub for you. Download it from [cli.github.com](https://cli.github.com) and install it with the default options.
4. **A GitHub account**: GitHub is the website where the team's code lives. Make a free account at [github.com](https://github.com), send your username to the lead, then accept the invite email.
5. **The Claude desktop app**, with the **Code** tab. Sign in with the account the team gave you.

### Signing in to GitHub (once)

Open **PowerShell** (press the Windows key, type `PowerShell`, press Enter) and type:

```
gh auth login
```

Pick **GitHub.com** → **HTTPS** → **Yes** → **Login with a web browser**. It shows a code; copy it, press Enter, and paste it in the browser page that opens. **You** type your password in the browser, never in the chat.

### Getting the project onto your computer

You get your **own copy** of the team project, called a **fork**. You can change your copy freely; the team's copy only changes when the lead accepts your work. This keeps everyone's work safe, including yours.

1. Make a folder called `dev` directly in your `C:` drive, so you have `C:\dev`.
   > ⚠️ Not inside OneDrive, Google Drive or Dropbox. They can break the project.
2. Open the Claude desktop app → **Code** tab → start a session in `C:\dev`, and type:

   ```
   Please fork the GitHub repository aysayas-school/table-reservation and download my fork into this folder. Explain each step simply.
   ```

You now have a folder `C:\dev\table-reservation`. That's the project.

---

## 3. Opening the project in Claude

1. Open the Claude desktop app.
2. Click the **Code** tab.
3. Start a new session and pick the **`table-reservation`** folder as the project folder.
   > ⚠️ Pick `table-reservation` itself, not `frontend` inside it. That's where Claude finds its rules.
4. In the message box, type:

   ```
   Hi! I'm the frontend developer. Please set up the project for me on this computer and tell me when it's ready.
   ```

Claude will install what's needed. This takes a few minutes the first time.

---

## 4. What is Claude, and how does it work here?

Claude is like a very fast helper who can read the files, write code, and run commands, but **only when you ask**.

A few things to know:

- **Claude already knows the project rules.** There's a file called `CLAUDE.md` that it reads at the start of every session. It tells Claude the design, the colours, the order of work, and what not to touch. You don't need to explain the project each time.
- **Claude will ask permission** before running some commands or changing files. You'll see a box with buttons:
  - If it's about this project (building, testing, editing files in `frontend/`), click **Allow**.
  - If you don't understand what it's asking, **don't click yet**. Type: *"What does this do? Explain simply."*
- **Claude can make mistakes.** Always look at the result in the browser. You are the one who decides if it's right.
- **You can ask anything.** "What is a component?", "Why did you do that?", "Explain this error like I'm new". There are no silly questions.

---

## 5. Your first screen (do this together with Claude)

We start with an easy one: **07 About Us**.

**Step 1.** Type:

```
/build-screen 07
```

`/build-screen` is a shortcut the team made. It tells Claude to follow the full building steps.

**Step 2.** Claude will describe what's on the screen in a list and ask if it matches. Open `docs/wireframes/07 About Us.svg` (double-click it, it opens in your browser) and compare. Reply something like:

```
Yes, that matches. Go ahead.
```

**Step 3.** Claude builds the page and shows you a picture of it in the browser panel. Look carefully. Is everything there? Is it in the right order? If not, tell it:

```
The opening hours should be above the location, like in the wireframe.
```

**Step 4.** Claude runs the checks (we'll explain those below). When everything passes, it marks the screen **🟦 Ready for review** in `docs/progress.md`.

🎉 That's one screen done. Do the next one the same way.

---

## 6. Talking to Claude: good and not-so-good messages

Claude works best when you're **specific**. Say *which screen*, *what part*, and *what you want*.

| 😕 Not so clear | 😊 Clear |
|---|---|
| "fix it" | "On screen 03, the Reserve button is too small. Make it full width like the wireframe." |
| "it's broken" | "I get this error when I run the app: (paste the error)" |
| "make it look better" | "On screen 01, add more space between the title and the buttons." |
| "do the admin pages" | "/build-screen 19" (one screen at a time) |

### Handy messages to copy

**Starting your day**
```
Good morning! What's my progress, and which screen should I do next?
```

**Learning**
```
Explain what you just did like I'm a beginner.
```
```
What is a "component"? Show me one from our project.
```

**Something looks wrong**
```
Screen 08 looks different from the wireframe. Compare them and tell me what's different.
```

**You see an error**
```
I see this error, what does it mean and how do we fix it?
(paste the error here, or drag in a screenshot)
```

**Undo**
```
Undo the last change you made. I liked it better before.
```

**Checking your work**
```
/check-my-work
```

**Ending your day**
```
Summarise what I did today in 3 bullets for my team.
```

---

## 7. "Quick check before I do this 🟡": what that means

Sometimes Claude will **stop and check** before doing what you asked. That's normal and it's on purpose. The project has rules (from school and from the team), and Claude helps everyone follow them.

Examples:

| You ask | Claude will say something like |
|---|---|
| "Make the button blue" | "Quick check 🟡: the project must be black and white only. I can make it black with white text instead?" |
| "Add a dark mode" | "Quick check 🟡: dark mode isn't in the wireframes. Want to finish the planned screens first?" |
| "Install Bootstrap" | "Quick check 🟡: we already use Tailwind for styling. Here's how to do it with Tailwind." |
| "Write the PHP for login" | "That's the backend teammate's part 🔴. I can help you plan what the login screen sends to them." |

**What to do when this happens:**
1. Read why. Usually the on-plan way is easier anyway.
2. If you agree, say *"Okay, do it your way."*
3. If you really think it's needed, say *"Please note it for the lead."* Claude writes it in `LEAD-REVIEW.md`, and the lead decides. Once they approve, Claude will do it.

This isn't you being in trouble! It just keeps the whole team on the same page. The lead reads `LEAD-REVIEW.md` and `docs/progress.md`, so you never have to explain things twice.

---

## 8. The checks (why Claude runs 4 commands)

Before a screen counts as done, Claude runs four checks. Think of them like spell-check for code:

| Check | What it checks | Like… |
|---|---|---|
| `format` | Makes the code neat and tidy | Auto-correcting spacing |
| `build` | Makes sure the code has no mistakes | Spell-check |
| `lint` | Looks for bad habits | Grammar check |
| `test:e2e` | A robot opens the site and clicks through it | A friend testing your work |

All four must pass ✅. If one fails, Claude fixes it with you. **Never ask Claude to skip or delete a check.** It will say no anyway 😄

---

## 9. Seeing your work in the browser

- Claude shows screenshots in the panel beside the chat.
- You can open it yourself too. Ask Claude *"Start the app"*, then go to **http://localhost:5173** in your browser.
- Useful addresses:
  - `http://localhost:5173/` (customer home)
  - `http://localhost:5173/table/1` (QR ordering for table 1)
  - `http://localhost:5173/staff` (staff)
  - `http://localhost:5173/admin` (admin)
- Customer screens are phone-sized. To see them like a phone in Chrome: press **F12**, then click the 📱 phone icon at the top.

---

## 10. Golden rules

✅ **Do**
- One screen at a time
- Compare with the wireframe every time
- Ask "why?" whenever you're curious
- Run `/check-my-work` before you tell the team you're done
- Tell the team which screen you're working on

❌ **Don't**
- Add colours (black, white and grey only)
- Use the real restaurant name, real prices or real photos (use `Restaurant Name`, `₱000.00`, grey boxes)
- Add pages or features that aren't in the wireframes
- Touch the backend or settings files
- Paste passwords or secret keys into the chat or the code
- Click "Allow" on something you don't understand: ask first

---

## 11. Little dictionary

| Word | Meaning |
|---|---|
| **Screen / page** | One of the 29 drawings, turned into a web page |
| **Wireframe** | The black and white drawing of a screen |
| **Component** | A reusable building block, like a LEGO piece (a button, a menu card) |
| **Route / URL** | The web address of a page, like `/menu` |
| **Placeholder** | A temporary "Screen 07 · About Us" page until the real one is built |
| **Sample data** | Fake menu items or reservations so the page has something to show |
| **Tailwind** | The way we style things, using short words like `p-4` (padding) or `font-bold` |
| **Frontend / backend** | The part you see / the hidden part that saves data |
| **Error** | A message saying something went wrong. Not scary, just paste it to Claude |
| **Terminal** | The black text window where commands run. Claude uses it for you |

---

## 12. Saving and sharing your work (Git, the simple version)

Git is like **save points in a video game**. GitHub is the **shared cloud** where the team's save points live.

| Word | Think of it as |
|---|---|
| **Repository (repo)** | The whole project folder, with its full history |
| **Fork** | Your own copy of the team repo on GitHub. You push here |
| **Commit** | A save point with a short note ("Built screen 07") |
| **Branch** | Your own copy to work on, so you don't mess up anyone else's work |
| **`main`** | The official version in the team repo. Only the lead adds to it |
| **Push** | Upload your save points to your fork on GitHub |
| **Pull** | Download the team's newest changes |
| **Pull request (PR)** | Asking the lead: "Please copy my work from my fork into the team's `main`" |

### How it works for each screen

```
get team's newest → make a branch → build the screen → commit → push to your fork → pull request → lead reviews → merged ✅
```

You don't need to type Git commands. **Claude does it for you**; just say what you want:

| You want to… | Tell Claude |
|---|---|
| Start a new screen | `/build-screen 07` (Claude makes the branch for you) |
| Save your progress | `Save my work` |
| Send it to the lead | `Open a pull request for this screen` |
| Get the team's newest changes | `Get the latest changes from main` |
| See where you are | `Which branch am I on, and is my work saved?` |

### Rules

- Never work on `main`. Claude checks this for you.
- You can't change the team repo directly, only through pull requests. That's on purpose, and it protects your work too.
- If your pull request shows a red ❌, a check failed. Paste the link to Claude and say: `My pull request has a red X. What's wrong?`
- One screen = one branch = one pull request.
- If Claude says there's a **conflict** (two people changed the same thing), don't panic. Let Claude explain, and ask the lead if it's not in your files.
- The lead might leave **comments** on your pull request asking for changes. Paste the link to Claude and say: `The lead left comments on this pull request. Help me fix them.`

---

## 📋 Cheat sheet

| I want to… | Type this |
|---|---|
| Start a screen | `/build-screen 07` |
| Check everything | `/check-my-work` |
| Know what's next | `What should I do next?` |
| Understand something | `Explain ___ like I'm a beginner` |
| Fix something | `On screen NN, the ___ should ___` |
| Undo | `Undo the last change` |
| Report an error | `I got this error: (paste)` |
| Ask the lead for an exception | `Please note it for the lead` |
| Save progress | `Save my work` |
| Send a finished screen | `Open a pull request for this screen` |
| Get teammates' changes | `Get the latest changes from main` |

You've got this! 💪
