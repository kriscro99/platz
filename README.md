# Platz Food & Drink — web stranica

Jednostranična prezentacija restorana **Platz Food & Drink**, Zvornička ulica 3, Zagreb (Trešnjevka).

Live: https://kriscro99.github.io/platz/

## Struktura
- `index.html` — sav sadržaj (hero, priča, filozofija, ponuda, jelovnik bez cijena, dnevna ponuda, galerija, proslave, recenzije, kontakt)
- `css/style.css`, `css/fonts.css` — stilovi; fontovi (Cormorant Garamond, Jost) su lokalno u `fonts/`, bez Google Fonts poziva
- `js/main.js` — animacije i interakcije; radno vrijeme za live oznaku „Otvoreno / Zatvoreno” je u konstanti `HOURS`
- `img/` — fotografije (WebP), `logo.svg` (vektoriziran logotip), `blueprint-detalji.webp` (detalji crteža čaše/vilice/noža)

## Izvori sadržaja
- Facebook stranica PlatzFoodAndDrink (kontakt, opis, jelovnik s objava — **bez cijena**, fotografije jela)
- Arhivirana stara stranica platz.hr (Wayback Machine): tekstovi „O nama”, filozofija, fotografije interijera, citati, recenzije
- Google karte: radno vrijeme (pon–sub 11–18) i ocjena 4,7 (464 recenzije)

## Indeksiranje
Stranica je trenutno označena s `<meta name="robots" content="noindex, follow">` (verzija za prezentaciju klijentu).
Kad klijent odobri stranicu kao službenu, u `index.html` promijeniti u `index, follow`.
