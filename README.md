# HIMERA — motyw Shopify + podgląd na Vercel

To repozytorium to gotowy motyw Shopify (Online Store 2.0). Ten sam kod buduje też statyczny podgląd na Vercel z przykładowymi produktami, żeby klient mógł zobaczyć stronę przed wgraniem do sklepu.

```
layout/      theme.liquid, password.liquid
sections/    intro HIMERA, „Stań się częścią HIMERY” (auto + 3 CTA), ostatni odcinek, FAQ, showroom kolekcji, produkt, koszyk…
snippets/    karta produktu, cena, ikona
templates/   *.json (strona główna, kolekcja, produkt, koszyk, 404, strona, szukaj, blog, hasło)
assets/      theme.css, theme.js, zdjęcia (auto, koła, portret, logo)
config/      ustawienia motywu (logo, kolory, linki IG/YT, smaczki)
locales/     teksty PL
preview/     przykładowe dane i zdjęcia produktów TYLKO do podglądu (nie trafiają do Shopify)
scripts/     budowanie podglądu i paczki ZIP
```

## Podgląd na Vercel

Add New → Project → `kub8vs/himera-store` → Deploy. Nic nie trzeba ustawiać: `vercel.json` sam uruchamia `npm run build` i publikuje folder `dist`.

Lokalnie: `npm install`, potem `npm run dev` (http://localhost:4321).

## Wgranie do Shopify

Opcja A, bez narzędzi: `npm run theme:zip`, potem w Shopify **Sklep online → Motywy → Dodaj motyw → Prześlij plik ZIP** i wybierz `himera-theme.zip`.

Opcja B, z GitHuba: **Sklep online → Motywy → Dodaj motyw → Połącz z GitHub** → repo `kub8vs/himera-store`, gałąź `main`. Plik `.shopifyignore` pomija podgląd i skrypty.

Motyw najpierw wgrywamy jako nieopublikowany i sprawdzamy w „Podglądzie”. Publikacja dopiero po akceptacji klienta.

### Po wgraniu (raz)

1. **Ustawienia → Dane niestandardowe → Produkty**, dodaj pola:
   - `custom.showcase_image` (Plik, obraz): zdjęcie produktu na przezroczystym tle do showroomu z pierścieniem. Bez niego używane jest zdjęcie główne.
   - `custom.code` (Tekst jednowierszowy): kod produktu, np. `HMR-01`.
   - `custom.short_title` (Tekst jednowierszowy): krótka nazwa do dużego napisu w showroomie, np. `Kominiarka`.
2. **Sklep online → Strony**: dodaj stronę „O Himerze” (szablon `page.o-himerze`, adres `o-himerze`) i „FAQ” (szablon `page.faq`, adres `faq`). Odpowiedzi w FAQ (dostawa, zwroty) potwierdza Bruno i edytuje w „Dostosuj”.
3. **Nawigacja**: menu `main-menu` (Strona główna, Produkty), menu `main-menu-right` (O Himerze, FAQ) i `footer`. Logo w nagłówku jest pośrodku, lewe menu po lewej, prawe po prawej.
4. **Ustawienia → Konta klientów**: włącz konta, żeby w prawym górnym rogu działało logowanie (ikonka obok koszyka).
5. **Dostosuj motyw → Ustawienia motywu**: linki Instagram i YouTube, logo (opcjonalnie), kolory.
6. Strona główna, sekcja „Ostatni odcinek”: wklej link do najnowszego filmu z YouTube (bez linku przycisk prowadzi na kanał). Teksty trzech kart CTA zmienia się w sekcji „Stań się częścią HIMERY”.

## Strona główna

1. Intro: wielki napis HIMERA na cały ekran i zdjęcie Himery w kominiarce pojawiają się razem. Cały napis podąża za kursorem (na telefonie za palcem albo powoli dryfuje).
2. Po zjechaniu w dół wysuwa się menu, a obok napisu „Stań się częścią HIMERY” wjeżdża BMW. Pod spodem trzy karty CTA (czym jest Himera, drop, dołącz).
3. Ostatni odcinek z YouTube: film ładuje się dopiero po kliknięciu, więc strona nie zwalnia.
4. Stopka.

## Smaczki (ukryte detale)

- Gdy kursor zbliży się do oczu Himery w intro, łapią czerwony błysk.
- Zostaw myszkę w spokoju na 6 s, a neon HIMERA raz zamruga.
- Zegar w rogu intro; po 22:00 dopisuje „NOC” i czerwona poświata robi się mocniejsza.
- W odtwarzaczu odcinka biegnie licznik REC jak w kamerze.
- Karty CTA przechylają się za kursorem.
- Ściana za autem ma ledwo widoczny napis „JESTEŚMY RUCHEM A TY JEGO CZĘŚCIĄ”.
- Tylne światło auta co ~25 s mruga alfabetem Morse'a „HMR”.
- Oczy w logo w nagłówku co ~40 s łapią czerwony błysk; po najechaniu kursorem świecą.
- Wpisanie na klawiaturze „himera” wywołuje czerwony błysk „RUCH” na cały ekran.
- Po przełączeniu karty tytuł zmienia się na „Wróć do ruchu.”.
- Gdy patrzysz na logo w sekcji z zapisem na listę przez 3 s, budzi się i świeci na czerwono.
- W konsoli przeglądarki: logo HMR i zaproszenie dla ciekawskich.
- W stopce podpis „.... -- .-.” to „HMR” Morse'em.
- Kod produktu odbija się w świetle na podłodze showroomu.
- Zaznaczony tekst świeci na czerwono, po pierścieniu nad produktem krąży punkt skanera.

Wszystko można wyłączyć w Ustawieniach motywu → Smaczki.

Motyw: The Domain.
