# HIMERA — motyw Shopify

Motyw sklepu Shopify (Liquid) dla HIMERA — mroczny, czarno-biało-szary design,
animowane wejście (drift + logo w dymie), asymetryczna siatka produktów,
pełna responsywność (menu mobilne w 3 paski).

## Struktura

```
layout/     — theme.liquid (główny szkielet strony), password.liquid
templates/  — strony: index, product, collection, cart, page, 404, search, blog, article, list-collections
sections/   — wszystkie sekcje (header, hero, manifest, galeria, produkty, footer, itd.)
snippets/   — puste na razie, zarezerwowane pod przyszłe fragmenty
assets/     — theme.css, theme.js oraz zdjęcia/logo
config/     — ustawienia motywu (kolory, social media, animacje)
locales/    — teksty systemowe (koszyk, wyszukiwarka itd.) po polsku
```

## Wgrywanie na Shopify

1. Ściągnij to repo jako zip (Code → Download ZIP) albo sklonuj lokalnie.
2. W Shopify Admin: **Sklep internetowy → Motywy → Dodaj motyw → Prześlij plik zip**.
3. Spakuj zawartość repo do zip tak, żeby foldery (`layout/`, `templates/` itd.)
   były bezpośrednio w środku zipa — bez dodatkowego folderu-rodzica.
4. Podejrzyj motyw, a potem opublikuj.

Szczegółowa instrukcja (w tym jedyny ręczny krok — podłączenie prawdziwej
kolekcji produktów do siatki na stronie głównej) jest w osobnym README
dołączonym do paczki motywu przekazanej w rozmowie.

## Aktualizacje

Każda kolejna wersja motywu (poprawki designu, nowe sekcje itd.) trafia tu
jako nowy commit — historia zmian w Git = historia wersji motywu.
