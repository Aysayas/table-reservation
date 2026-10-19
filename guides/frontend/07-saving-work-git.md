# 7. Pag-save at pag-share ng work (Git, simple version)

Yung Git ay parang **save points sa video game**. Yung GitHub naman yung **shared cloud** kung saan naka-store yung save points ng buong team.

| Word | Isipin mo na… |
|---|---|
| **Repository (repo)** | Yung buong project folder, kasama lahat ng history |
| **Commit** | Isang save point na may maikling note ("Built screen 07") |
| **Branch** | Sarili mong kopya na pwede mong galawin nang hindi naaapektuhan yung gawa ng iba |
| **`main`** | Yung official version. Ang lead lang ang nagdadagdag dito |
| **Push** | I-upload yung save points mo sa GitHub |
| **Pull** | I-download yung pinakabagong changes ng team |
| **Pull request (PR)** | Pakiusap sa lead: "Paki-check yung gawa ko at idagdag sa `main`" |

## Ganito ang flow sa bawat screen

```
kunin yung latest ng team → gumawa ng branch → gawin yung screen → commit → push → pull request → review ng lead → merged ✅
```

Hindi mo kailangang mag-type ng Git commands. **Si Claude na ang gagawa**, sabihin mo lang kung ano gusto mo:

| Gusto mong… | Sabihin kay Claude |
|---|---|
| Magsimula ng bagong screen | `/build-screen 07` (si Claude na gagawa ng branch) |
| I-save yung progress | `Save my work` |
| I-send sa lead | `Open a pull request for this screen` |
| Kunin yung latest changes ng team | `Get the latest changes from main` |
| Malaman kung nasaan ka | `Which branch am I on, and is my work saved?` |

## Rules

- **Never mag-work sa `main`.** Chine-check 'to ni Claude para sa'yo.
- Sa pull request lang pwedeng makapasok yung work mo sa `main`. Sinadya 'yan, at pinoprotektahan din nito yung gawa mo.
- **Isang screen = isang branch = isang pull request.**
- Kung may red ❌ yung pull request mo, may check na bumagsak. I-paste mo kay Claude yung link: `My pull request has a red X. What's wrong?`
- Kung sinabi ni Claude na may **conflict** (dalawang tao ang nag-edit ng parehong part), chill lang. Hayaan mong i-explain ni Claude, at magtanong ka sa lead kung hindi sa files mo yung conflict.
- Pwedeng mag-iwan ng **comments** ang lead sa pull request mo para sa mga dapat baguhin. I-paste mo kay Claude yung link at sabihin: `The lead left comments on this pull request. Help me fix them.`

---

[← 6. Checks at preview](06-checks-and-preview.md) · **Next:** [8. Rules at terms →](08-rules-and-terms.md)
