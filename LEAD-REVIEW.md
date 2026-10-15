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

### 2026-10-15: Set up the backend from the LavaLust template
- Level: 🔴 not allowed
- Asked for: "set up the backend, this is the template https://github.com/Aysayas/Lavalust-Template"
- Rule it bumps into: Writing backend code (PHP, LavaLust, SQL) is the backend teammate's part, and `backend/` is lead-owned in CODEOWNERS
- What Claude did instead: Nothing in `backend/` was changed. Offered to list the data each screen needs so the backend side can be agreed
- Status: Approved
- Lead note:
