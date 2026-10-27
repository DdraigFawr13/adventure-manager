# Font sources (SAFE-05)

All four faces are under the SIL Open Font License 1.1; each licence file sits beside the fonts. Downloaded 2026-10-26 from `google/fonts` at commit `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0` (`ofl/<family>/`).

- `IMFeENsc28P.ttf`: IM Fell English SC (titles, seals), Igino Marini. Licence `imfellenglishsc-OFL.txt`.
- `IMFePIrm28P.ttf`: IM Fell DW Pica (letters), Igino Marini. Licence `imfelldwpica-OFL.txt`.
- `SortsMillGoudy-Regular.ttf`: Sorts Mill Goudy (ledgers, numbers), Barry Schwartz. Licence `sortsmillgoudy-OFL.txt`.
- `SourceSerif4-Variable.ttf`: Source Serif 4, variable weight and optical size (clear print, D-077), Adobe. Licence `sourceserif4-OFL.txt`.

The three `.woff2` files are the same fonts, converted from the `.ttf` files beside them with fontTools 4.68.0 (`TTFont(path).flavor = 'woff2'`, then saved); no glyph, table or name changed, and the faces have no Reserved Font Name. The step 4 page loads the WOFF2 files (`styles/step4.css`); the engine test still loads the `.ttf` files.
