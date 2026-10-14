# 1. Setup (isang beses lang 'to)

## Mga kailangan i-install

I-install mo lahat with the default options lang:

1. **Node.js**: yung "engine" na nagpapatakbo ng project. I-download yung **LTS** version sa [nodejs.org](https://nodejs.org).
2. **Git**: tool na nagse-save ng versions ng project. Sa [git-scm.com](https://git-scm.com).
3. **GitHub CLI**: para makausap ni Claude ang GitHub para sa'yo. Sa [cli.github.com](https://cli.github.com).
4. **GitHub account**: dito naka-store yung code ng team. Gawa ka ng free account sa [github.com](https://github.com), i-send mo sa lead yung username mo, tapos i-accept mo yung invite na ma-e-email sa'yo.
5. **Claude desktop app**, yung may **Code** tab. Mag-sign in gamit yung account na binigay ng team.

## Mag-sign in sa GitHub (isang beses lang)

Buksan mo yung **PowerShell** (pindutin yung Windows key, i-type `PowerShell`, tapos Enter), then i-type:

```
gh auth login
```

Piliin mo: **GitHub.com** → **HTTPS** → **Yes** → **Login with a web browser**. May lalabas na code. I-copy mo, pindutin Enter, tapos i-paste sa browser page na magbubukas.

> 🔒 **Ikaw** ang magta-type ng password mo sa browser. Never mo itong i-type o i-paste sa chat ni Claude.

## Kunin yung project

1. Gumawa ka ng folder na `dev` diretso sa `C:` drive, para may `C:\dev` ka.
   > ⚠️ Huwag sa loob ng OneDrive, Google Drive o Dropbox. Pwedeng masira yung project dahil sa syncing nila.
2. Buksan yung Claude desktop app → **Code** tab → mag-start ng session sa `C:\dev`, tapos i-type:

   ```
   Please download the GitHub repository https://github.com/Aysayas/table-reservation into this folder. Explain each step simply.
   ```

Pag tapos na, may folder ka nang `C:\dev\table-reservation`. Yan na yung project.

## Buksan yung project kay Claude

1. Sa Claude app, punta sa **Code** tab.
2. Mag-start ng **bagong session** at piliin yung **`table-reservation`** folder.
   > ⚠️ Yung `table-reservation` mismo ang piliin, hindi yung `frontend` sa loob niya. Nandun kasi yung rules ni Claude.
3. I-type:

   ```
   Hi! I'm the frontend developer. Please set up the project for me on this computer and tell me when it's ready.
   ```

Si Claude na ang mag-i-install ng kailangan. Medyo matagal 'to sa unang beses, mga ilang minuto.

---

[← Back](README.md) · **Next:** [2. Claude basics →](02-claude-basics.md)
