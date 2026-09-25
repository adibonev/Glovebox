Fonts embedded in the Vehicle passport PDF (`app/p/[token]/pdf`). The site itself loads the same
families through `next/font`; a PDF has to carry its own.

- Sofia Sans, Sofia Sans Condensed: Lettersoup, SIL Open Font License 1.1
- JetBrains Mono: JetBrains, SIL Open Font License 1.1

Static TTF instances downloaded from Google Fonts. Every file covers Cyrillic.

The two JetBrains Mono files have their code ligatures (`calt`, `liga`, `dlig`, `clig`) removed:
fontkit, which @react-pdf/renderer lays text out with, crashes on those glyphs ("Offset is outside
the bounds of the DataView") the moment a URL's `//` or a `..` appears. Made with:

    python -m fontTools.subset JetBrainsMono-Regular.ttf --unicodes='*' --layout-features='*' \
      --layout-features-='calt,liga,dlig,clig' --glyph-names --notdef-outline --name-IDs='*'
