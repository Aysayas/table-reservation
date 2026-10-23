# Lead review

Claude adds an entry here when the frontend developer asks for something outside the project plan and still wants it after Claude explains the rule. The project lead reads this file and decides.

**For the lead:** change `Status` to `Approved` or `Declined` and add a note. Claude will act on `Approved` entries.

## Template

```
### YYYY-MM-DD: short title
- Level: 🟡 off plan / 🔴 not allowed
- Asked for: what she wanted, in her words
- Rule it bumps into: which rule from CLAUDE.md
- What Claude did instead: the on-plan alternative, if any
- Status: Waiting for lead
- Lead note:
```

## Entries

### 2026-10-22: Real contact details on screen 07 About Us
- Level: 🟡 off plan
- Asked for: use Vencio's Garden's real contact details from the official menu: address `#08 Nautical Highway, Tawiran, Calapan City, Oriental Mindoro`, phone `0918 957 2855`, email `venciosgarden@yahoo.com`, Facebook `https://www.facebook.com/venciosgardenhotel`
- Rule it bumps into: CLAUDE.md, only the restaurant's name, logo, menu and prices are real; phone numbers, emails and contacts stay placeholders
- What Claude did instead: built screen 07 with the placeholders from `seed.sql`. If approved, only `sampleSettings` in `frontend/src/services/sampleData.ts` changes (and `seed.sql` on the backend side). Opening hours were set to the menu's 7:00 AM – 9:00 PM every day, which `seed.sql` still has as 10:00–22:00
- Status: Approved
- Lead note: Approved (2026-10-23): use the restaurant's real business contacts (address, phone, email, Facebook) in `sampleSettings`; the rule and `seed.sql` are updated. People's names and contacts stay placeholders. Opening hours stay 10:00 AM – 10:00 PM every day to match the backend, so set `sampleOpeningHours` back to `10:00:00`–`22:00:00` and update `e2e/customer-07-about.spec.ts` for the new contacts and hours.

### 2026-10-23: Luxury black, red and white restyle with new fonts and motion
- Level: 🟡 off plan
- Asked for: a luxurious, editorial look based on a design prompt (Bellagio and "eatery" template inspo): replace the brand colours with black, red (`#C1272D`) and white; new fonts Cormorant Garamond (titles), Jost (body) and Caveat (handwritten notes); scroll and page animations; a new navbar style; template food photos
- Rule it bumps into: CLAUDE.md and `docs/design/brand.md`, colours and fonts come from the restaurant's menu; new font packages change `package.json`; animations are not in the approved design; `CustomerLayout` is shared; food photos stay placeholders. Parts of the prompt also asked for PHP views and code comments, which Claude declined (🔴 / school rule)
- What Claude did instead: restyled screen 07 only, with the existing brand colours and fonts: small uppercase eyebrow labels with a gold dash, larger section titles instead of green bars, hairline dividers, 8-point spacing, 6px corners, round back button
- Status: Approved
- Lead note: Approved (2026-10-23). The look of the app is yours to design: colours, fonts, layout, shared layouts, motion and logo use. Keep the 29 screens, their URLs, their buttons and links, and the data each screen shows, so everything still fits the backend endpoints in `docs/api.md`. A motion library (`motion`) and `@fontsource/*` fonts are allowed. Template food photos only from free-licence sites (Unsplash, Pexels), with the source noted in `docs/design/brand.md`; nothing copied from other restaurants' or hotels' sites. Keep `docs/design/brand.md` up to date with the look you choose.

### 2026-10-23: Real restaurant interior photo on screen 07 About Us
- Level: 🟡 off plan
- Asked for: replace the "Restaurant photo" placeholder on screen 07 with a real photo of Vencio's Garden's dining area (wooden screens, red floral sofas, curved ceiling). Source not given yet
- Rule it bumps into: CLAUDE.md, only the restaurant's name, logo, menu, prices and business contacts are real; photos stay placeholders. The photo also shows identifiable customers, and its source and permission to use it are unknown
- What Claude did instead: kept the grey placeholder box. If approved, the image goes in `frontend/public/` and the placeholder in `About.tsx` becomes an `<img>` with alt text
- Status: Approved
- Lead note: Approved with conditions (2026-10-23): only a photo the restaurant itself provides, with permission to use it, and with no recognisable guests (crop or blur them). Note the source in `docs/design/brand.md`. Until all three are true, keep the placeholder.
