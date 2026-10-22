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
