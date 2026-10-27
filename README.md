# HIMERA — motyw Shopify + podgląd na Vercel

To repozytorium to gotowy motyw Shopify (Online Store 2.0). Ten sam kod buduje też statyczny podgląd na Vercel z przykładowymi produktami, żeby klient mógł zobaczyć stronę przed wgraniem do sklepu.

```
layout/      theme.liquid, password.liquid
sections/    intro HIMERA, wejście do sklepu, „Stań się częścią HIMERY” (auto + 3 CTA), ostatni odcinek, FAQ, showroom produktów, produkt, koszyk…
snippets/    karta produktu, cena, ikona
templates/   *.json (strona główna, kolekcja, produkt, koszyk, 404, strona, szukaj, blog, hasło)
assets/      theme.css, theme.js, zdjęcia (auto, koła, portret, logo)
config/      ustawienia motywu (logo, kolory, linki IG/YT, smaczki)
locales/     teksty PL
preview/     przykładowe dane i zdjęcia produktów TYLKO do podglądu (nie trafiają do Shopify)
scripts/     budowanie podglądu i paczki ZIP
```

## Podgląd na Vercel

Jedyny adres podglądu: **https://himera-store.vercel.app**. Projekt Vercel jest połączony z tym repo, gałąź `main`: każdy push na `main` sam się wdraża. Inne projekty Vercel podpięte pod to repo (np. `himera-store-obo8`) należy usunąć.

Ustawień nie trzeba zmieniać: `vercel.json` sam uruchamia `npm run build` i publikuje folder `dist`. Pliki CSS i JS mają w adresie wersję (`?v=…`), więc po każdym wdrożeniu przeglądarka pobiera aktualny wygląd.

Repo ma jedną gałąź: `main`.

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
   - `custom.material` i `custom.size` (Tekst jednowierszowy): „Materiał” i „Rozmiar” w szczegółach produktu.
   Każdy produkt (kominiarka, flaga, naklejka) ma opcję **Kolor** z wariantami **Czarna** i **Biała**, a każdy wariant własne zdjęcie (najlepiej na przezroczystym tle). Pierwszy wariant (Czarna) jest wybrany na start.
2. **Sklep online → Strony**: dodaj stronę „O Himerze” (szablon `page.o-himerze`, adres `o-himerze`) i „FAQ” (szablon `page.faq`, adres `faq`). Odpowiedzi w FAQ (dostawa, zwroty) potwierdza Bruno i edytuje w „Dostosuj”.
3. **Nawigacja**: menu `main-menu` (Strona główna, Produkty), menu `main-menu-right` (O Himerze, FAQ) i `footer`. Logo w nagłówku jest pośrodku, lewe menu po lewej, prawe po prawej.
4. **Ustawienia → Konta klientów**: włącz konta, żeby w prawym górnym rogu działało logowanie (ikonka obok koszyka).
5. **Dostosuj motyw → Ustawienia motywu**: linki Instagram i YouTube, logo (opcjonalnie), kolory.
6. Strona główna, sekcja „Wejście do sklepu”: wybierz trzy produkty, które wachlarzem stoją za przyciskiem. Strona „Produkty” (kolekcja): w sekcji showroomu wybierz kominiarkę, naklejkę i flagę oraz duże napisy (np. „Naklejki na auto”). Sekcja „Ostatni odcinek” (film https://www.youtube.com/watch?v=BZEsjGBhaOE) jest w motywie, ale nie ma jej teraz na głównej. Teksty trzech kart CTA zmienia się w sekcji „Stań się częścią HIMERY”.

## Strona główna

1. Intro: wielki napis HIMERA na cały ekran, zdjęcie Himery w kominiarce, latające produkty i dym. „Przewiń” prowadzi do produktów.
2. Produkty: „Wejdź do showroomu”, jeden duży czerwony przycisk z obracającym się napisem, który lekko podąża za kursorem; za nim wachlarz trzech produktów, który rozchodzi się po najechaniu. Prowadzi na stronę Produkty.
3. Znak rozpoznawczy: duże logo z czerwoną poświatą i gdzie je widać (auto, flaga, kominiarka).
4. Jesteś w Himerze: wjeżdżające BMW i trzy karty (O Himerze, Produkty, Instagram).
5. Dołącz do Himery: zapis na listę, stopka.

Sekcje „Przewijany napis”, „Ostatni odcinek” i „Top produkty” zostały w motywie i można je dodać z powrotem w „Dostosuj”.

## Strona Produkty (showroom)

Odwzorowanie filmu referencyjnego (0–10 s): ciemnoczerwony pokój z narożnikami, u góry chromowany pierścień z czerwonymi LED-ami i snopem światła, szklane panele z produktami w łuku (środkowy na wprost, boczne obrócone i dalej), duży chromowany napis, który przy zmianie produktu zapada się w podest, a nowy z niego wyjeżdża. Zakładki z kropką, licznik `HMR-01 01 / 03`, strzałki, przeciąganie i swipe. Przewinięcie w dół: pierścień i napis odjeżdżają, wybrany panel przesuwa się w lewo, a z prawej wchodzą szczegóły (cena, przekreślona stara cena, opis, kolor, materiał, rozmiar, „Dodaj do koszyka”, „Kup teraz”). Wybór „Biała” zalewa scenę jasnym tłem od miejsca kliknięcia, „Czarna” wraca do ciemnego.

## Telefony

Intro zawsze zajmuje dokładnie wysokość i szerokość ekranu: napis HIMERA i zdjęcie układają się pod wysokość telefonu (od iPhone SE po Pro Max), w poziomie układ jak na komputerze. Showroom produktów wypełnia cały ekran. Zdjęcia produktów w kartach są dopasowane w całości, bez przycinania.

## Smaczki (ukryte detale)

- Wejście: napis HIMERA zaczyna jako zgaszone neonowe rurki, litery zapalają się po kolei, a na koniec całość raz glitchuje.
- Co kilka sekund napis HIMERA na ułamek sekundy „glitchuje” na czerwony i biały kanał.
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
