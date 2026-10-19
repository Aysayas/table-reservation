# 3. Ang unang screen mo

Magsisimula tayo sa madali: **07 About Us**. Gawin mo 'to kasama si Claude.

## Step 1: Simulan

I-type:

```
/build-screen 07
```

Yung `/build-screen` ay shortcut na ginawa ng team. Sinasabi nito kay Claude na sundin yung buong steps sa paggawa ng screen, pati na yung paggawa ng branch para sa'yo.

## Step 2: I-compare sa wireframe

Ililista ni Claude kung ano yung laman ng screen, tapos tatanungin ka niya kung tama. Buksan mo yung `docs/wireframes/07 About Us.svg` (i-double-click mo lang, bubukas siya sa browser) at i-compare. Kung tugma, sagot ka ng ganito:

```
Yes, that matches. Go ahead.
```

## Step 3: Tingnan yung gawa

Gagawin ni Claude yung page tapos ipapakita niya yung picture nito sa browser panel. Tingnan mong mabuti: kumpleto ba? Tama ba yung pagkakasunod-sunod? Kung may mali, sabihin mo:

```
The opening hours should be above the location, like in the wireframe.
```

O kaya:

```
Dapat nasa taas ng location yung opening hours, gaya sa wireframe.
```

## Step 4: Checks

Ira-run ni Claude yung checks (explained sa [page 6](06-checks-and-preview.md)). Pag pumasa lahat, mamarkahan niya yung screen na **🟦 Ready for review** sa `docs/progress.md`, tapos gagawa siya ng pull request para ma-review ng lead.

🎉 Tapos na yung isang screen! Ganun din gagawin mo sa susunod.

---

[← 2. Claude basics](02-claude-basics.md) · **Next:** [4. Paano kausapin si Claude →](04-talking-to-claude.md)
