# 6. Checks at preview

## Yung 4 na checks

Bago ituring na tapos ang isang screen, may apat na checks na ira-run ni Claude. Isipin mo silang parang spell-check pero para sa code:

| Check | Ano chine-check | Parang… |
|---|---|---|
| `format` | Inaayos yung itsura ng code para malinis | Auto-correct ng spacing |
| `build` | Sinisigurong walang mali sa code | Spell-check |
| `lint` | Hinahanap yung mga bad habits sa code | Grammar check |
| `test:e2e` | May "robot" na magbubukas ng site at magki-click-click | Kaibigang nagte-test ng gawa mo |

Dapat pumasa ✅ lahat. Kung may bumagsak, aayusin 'yon ni Claude kasama mo. **Huwag mong ipa-skip o ipa-delete kay Claude yung check.** Hindi rin naman siya papayag 😄

Ganito rin yung checks na tumatakbo sa GitHub pag nag-pull request ka. Kung may red ❌, i-paste mo kay Claude yung link ng pull request at sabihin: `My pull request has a red X. What's wrong?`

## Makita yung gawa mo sa browser

- Nagpapakita si Claude ng screenshots sa panel sa tabi ng chat.
- Pwede mo rin buksan mismo. Sabihin mo kay Claude *"Start the app"*, tapos punta ka sa **http://localhost:5173** sa browser mo.
- Mga address na magagamit mo:

  | Address | Ano 'to |
  |---|---|
  | `http://localhost:5173/` | Customer home |
  | `http://localhost:5173/table/1` | QR ordering para sa table 1 |
  | `http://localhost:5173/staff` | Staff |
  | `http://localhost:5173/admin` | Admin |

- Phone-sized yung customer screens. Para makita mo sila na parang nasa phone sa Chrome: pindutin **F12**, tapos i-click yung 📱 phone icon sa taas.

---

[← 5. Quick checks](05-quick-checks.md) · **Next:** [7. Pag-save ng work →](07-saving-work-git.md)
