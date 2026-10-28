# 🐾 PsiApsi — System Rezerwacji Spacerów i Treningów

Nowoczesny, responsywny i minimalistyczny system rezerwacji dla psiej szkoły w Warszawie Wawrze: spacery socjalizacyjne, zajęcia w salce treningowej i konsultacje behawioralne. Inspirowany przejrzystym procesem rezerwacyjnym w stylu Wod Guru.

**Model działania:** to szkoła dla opiekunów i ich psów — na każdych zajęciach opiekun pracuje ze swoim psem, trener podpowiada i koryguje. Nie ma wyprowadzania psów bez opiekuna.


Projekt łączy lekki frontend HTML/CSS/JS z bezserwerowym backendem opartym na **Google Apps Script**, **Google Sheets (Arkusz Google)** oraz **Google Calendar (Kalendarz Google)**.

---

## ✨ Główne Możliwości

- **Oferta szkoły w jednym miejscu**:
  - Spacer socjalizacyjny na trasach leśnych, grupowe zajęcia posłuszeństwa i socjalizacja szczeniąt w salce, trening indywidualny 1-1, zajęcia dla psów lękliwych i reaktywnych oraz konsultacje z dojazdem.
- **Prosty, 3-krokowy proces zapisu**:
  1. Wybór rodzaju zajęć (kafle z ikonami i opisem).
  2. Wybór terminu w kalendarzu tygodniowym (widok siatki na desktopie, responsywny selektor dni na telefonach).
- **Dopracowany kalendarz tygodniowy**:
  - **Zbite kolumny dni** — żadnych pustych wierszy rozciągających siatkę, gdy godziny są od siebie odległe; przy wspólnym grafiku tygodnia godziny i tak leżą w jednej linii.
  - **Godzina zakończenia** liczona z kolumny `Czas trwania` oraz licznik wolnych miejsc (`3/4`) na slotach grupowych.
  - **„Najbliższy wolny termin”** — jednym kliknięciem przeskakuje do najwcześniejszego wolnego okna (szuka do 60 dni w przód).
  - **Nawigacja klawiaturą** — Tab wchodzi do siatki raz, dalej poruszamy się strzałkami (pion zostaje w wybranym dniu).
  - Jedno źródło prawdy dla dostępności (`getSlotState`), więc kropka pod dniem zawsze zgadza się z siatką i uwzględnia wybrane zajęcia.
  - **Dzień z innymi zajęciami** — gdy wybrane zajęcia nie mają w danym dniu terminów, a inne mają, w kolumnie pojawia się np. „tylko 20:00 · Posłuszeństwo” z klikalną nazwą (a nie myląca kreska), więc klient widzi, że coś się tego dnia dzieje i może przeskoczyć na te zajęcia jednym kliknięciem. Podpowiedź pokazuje się tylko w dniach, które różnią się od reszty tygodnia, żeby nie zagracać siatki.
  3. Formularz danych opiekuna i psa oraz automatycznie dopasowane lokalizacje.
- **Bezobsługowe zarządzanie z telefonu / Arkusza Google**:
  - Zarządzanie **nazwami zajęć, ikonami, opisami i limitami psów** bez edycji plików HTML.
  - Elastyczny **grafik pracy** (godziny domyślne, indywidualne dla dni tygodnia lub konkretnych dat, obsługa dni wolnych / urlopów).
  - **Lokalizacje przypisane do konkretnego treningu** (np. trasy leśne dla spacerów, dojazd do klienta dla konsultacji).
- **Automatyzacja Google Workspace**:
  - Rezerwacja natychmiast zapisuje się w Arkuszu Google.
  - Automatycznie tworzy wydarzenie w **Kalendarzu Google** wraz z zaproszeniem wysyłanym na e-mail klienta.
  - Wysyła e-mail potwierdzający do opiekuna.
  - Blokuje zajęte terminy (zabezpieczenie przed podwójną rezerwacją i konfliktami 1-1 vs grupy).
- **Błyskawiczne ładowanie bez migotania**:
  - Zastosowanie lokalnej pamięci podręcznej (`localStorage`), eliminujące efekt przeskakiwania przycisków podczas pobierania danych.
- **Cennik sterowany tym samym arkuszem**:
  - Cena, czas trwania i lista „co w cenie” pochodzą z zakładki `Uslugi` — widoczne zarówno na kaflach wyboru zajęć, jak i w sekcji Cennik.
- **Opinie opiekunów z arkusza**:
  - Zakładka `Opinie` zasila sekcję na stronie. Sekcja pojawia się tylko wtedy, gdy są w niej widoczne wpisy.
- **Dostępność i dokumenty**:
  - Formularz zbiera telefon opiekuna, krótką charakterystykę psa oraz wymagane zgody (zdrowie/szczepienia i RODO).
  - W stopce dostępna jest informacja RODO i regulamin usług.
- **Panel administratora na telefonie**:
  - Grafik, oferta i zapisy bez ręcznego pisania w arkuszu — panel otwiera się pod adresem `…/exec?page=admin` i działa dobrze na telefonie.
  - Szczegóły w sekcji [Panel administratora](#-panel-administratora).
- **Analityka lejka bez cookies**:
  - Zdarzenia (wybór usługi, wybór terminu, wysłanie formularza, konflikt, przyjęta rezerwacja, dodanie do kalendarza) trafiają do zakładki `Statystyki`. Bez firm trzecich i bez danych osobowych.

---

## 📁 Struktura Projektu

```text
psiapsi/
├── index.html                        # Jedyna strona serwisu: kalendarz rezerwacji + sekcje treściowe (landing)
├── app_script                        # Kod źródłowy Google Apps Script (backend do wklejenia w arkuszu)
├── admin-panel.html                  # Panel administratora (do wklejenia jako plik „Admin” w Apps Script)
├── psiapsi_rezerwacje_kalendarz.xlsx # Szablon arkusza rezerwacji (do importu do Google Sheets)
├── styles/
│   └── spotkania.css                 # Minimalistyczny arkusz stylów: kalendarz, formularz, landing
├── scripts/
│   └── spotkania.js                  # Logika rezerwacji, pobieranie danych z arkusza, obsługa kalendarza
├── images/
│   └── Niko_Natka.jpg                # Zdjęcie w sekcji „O mnie”
└── data/
    └── events.json                   # Nieużywane — dane przykładowych kursów z wcześniejszej wersji serwisu
```

> Serwis jest jednostronicowy (`index.html`). Wszystkie sekcje treściowe („Dlaczego my”, „O mnie”, FAQ)
są na tej samej stronie i kotwiczone z nagłówka — nie ma osobnych podstron.

---

## ⚙️ Konfiguracja Arkusza Google (Google Sheets)

Całość opiera się na jednym Arkuszu Google połączonym ze skryptem z pliku `app_script`. W arkuszu definiujemy 3 zakładki:

### 1. Zakładka `Uslugi`
Zarządzanie ofertą zajęć, ich ceną, czasem trwania i dopasowanymi lokalizacjami.

| A: Nazwa | B: Ikona | C: Opis | D: Maks psów | E: Indywidualne | F: Lokalizacje (rozdzielone `;`) | G: Cena | H: Czas trwania | I: Co w cenie (rozdzielone `;`) |
| :--- | :---: | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| **Spacer socjalizacyjny** | 🐕‍🦺 | Grupa do 3 psów, leśna trasa | 3 | NIE | Warszawa Wawer — trasy leśne | | | |
| **Grupowe zajęcia posłuszeństwa** | 🎯 | Salka, grupa do 4 psów | 4 | NIE | Salka treningowa — Warszawa Wawer | | | |
| **Socjalizacja szczeniąt** | 🐶 | Salka, grupa do 4 szczeniąt | 4 | NIE | Salka treningowa — Warszawa Wawer | | | |
| **Trening indywidualny 1-1** | 🎓 | Salka, Ty i Twój pies | 1 | TAK | Salka treningowa — Warszawa Wawer | | | |
| **Psy lękliwe i reaktywne** | 🧘 | Mała grupa do 2 psów | 2 | NIE | Salka treningowa — Warszawa Wawer; Warszawa Wawer — trasy leśne | | | |
| **Konsultacja behawioralna** | 📋 | Diagnoza i plan pracy | 1 | TAK | Dojazd do klienta | | | |

Powyższe wiersze to **domyślna oferta zapasowa** — używana tylko wtedy, gdy zakładka `Uslugi` nie istnieje. Jeśli zakładka jest, to ona decyduje o zawartości strony.

> **Wskazówki:**
> - Dodanie nowego wiersza automatycznie tworzy nowy kafelek na stronie WWW oraz nową kartę w sekcji Cennik.
> - W kolumnie `F` można wpisać kilka miejsc rozdzielonych średnikiem `;`. Po wybraniu tych zajęć formularz zaoferuje tylko te lokalizacje.
> - Kolumny `G`, `H` i `I` są opcjonalne. Przykładowe wartości: `90 zł`, `90 min`, `Praca na trasie; Notatka po zajęciach`. Jeśli `Cena` jest pusta, w cenniku pojawi się napis **„Wycena po zapytaniu”**, a na kaflu usługi nie pokaże się wiersz z ceną i czasem.
> - Kolumna `E` (`Indywidualne`) decyduje o tym, czy zajęcia blokują cały slot. Wartość `TAK` ustawia się automatycznie także wtedy, gdy `Maks psów` wynosi 1.
> - Pamiętaj, żeby nagłówki w wierszu 1 odpowiadały powyższej kolejności kolumn.

---

### 2. Zakładka `Grafik`
Zarządzanie godzinami pracy, dniami wolnymi i tym, jakie zajęcia odbywają się w danych godzinach.

| Kolumna A: Dzien / Data | Kolumna B: Godziny (rozdzielone przecinkiem `,`) | Kolumna C: Zajęcia (opcjonalnie) |
| :--- | :--- | :--- |
| **Domyślne** | 18:00, 19:00, 20:00 | Spacer 1-1, Spacer grupowy |
| **Sobota** | 10:00, 11:30, 13:00 | Spacer grupowy |
| **Niedziela** | *(pozostaw puste = dzień wolny)* | |
| **2026-10-25** | 12:00, 14:00, 16:00 | |
| **2026-11-05** | 17:00, 18:30 | Posłuszeństwo |

> **Zasady działania grafiku:**
> - `Domyślne` — godziny obowiązujące standardowo od poniedziałku do piątku.
> - Dni tygodnia (np. `Sobota`, `Wtorek`) — nadpisują godziny dla danego dnia tygodnia.
> - Konkretna data w formacie `YYYY-MM-DD` (np. `2026-10-25`) — ma najwyższy priorytet (pozwala ustalić wyjątkowy grafik na dany dzień lub zaplanować urlop).
> - Pusta komórka w kolumnie B oznacza dzień wolny (*„Brak terminów”*).

> **Kolumna C — jakie zajęcia w tych godzinach:**
> - Pusta komórka = w tych godzinach można zapisać się na **wszystkie** zajęcia z zakładki `Uslugi` (tak działa grafik bez tej kolumny).
> - Wpisane nazwy (rozdzielone przecinkiem, dokładnie jak w `Uslugi`) = w tych godzinach przyjmujemy **tylko te zajęcia**. Pozostałe zajęcia nie pokażą na stronie tych godzin.
> - Dzięki temu salka może być dostępna tylko w wybranych terminach: w wierszu `Domyślne` wpisz same spacery, a sale dopisuj wierszem z konkretną datą — np. `2026-11-05 | 17:00, 18:30 | Posłuszeństwo`.
> - Jeden wiersz = jeden zestaw godzin z jednymi zajęciami. Chcesz w tym samym dniu spacery rano i salkę wieczorem? Dodaj dwa wiersze z tą samą datą — godziny się połączą, a zajęcia zostaną przy swoich godzinach.
> - Godziny i zajęcia z wiersza na datę zastępują cały dzień tygodnia, więc w wyjątku wypisz wszystkie godziny, które wtedy obowiązują.
> - Kontrola działa też po stronie serwera: jeśli ktoś ma otwartą stronę z nieaktualnym grafikiem, zapis na zajęcia poza tą listą zostanie odrzucony z komunikatem.

---

### 3. Zakładka `Rezerwacje`
Tutaj automatycznie dopisywane są nowe zgłoszenia klientów.

Kolumny w arkuszu:
1. `Data (YYYY-MM-DD)`
2. `Data słownie`
3. `Godzina`
4. `Rodzaj zajęć`
5. `Lokalizacja`
6. `Imię opiekuna`
7. `Nazwisko opiekuna`
8. `E-mail`
9. `Telefon opiekuna`
10. `Imię psa`
11. `Wiek psa`
12. `Płeć psa`
13. `Reakcja na inne psy`
14. `Uwagi o psie`
15. `Zdrowie i szczepienia (TAK/NIE)`
16. `Zgoda RODO (TAK/NIE)`
17. `Data utworzenia wpisu`

> **Uwaga przy aktualizacji starszej wersji:** kolumny `Telefon`, `Reakcja na inne psy`, `Uwagi o psie`, `Zdrowie` i `RODO` zostały dodane później.
> W istniejącym arkuszu wstaw je dokładnie w powyższych miejscach (9, 13–16) i popraw nagłówki — w przeciwnym razie stare wiersze będą przesunięte względem nowych.

---

### 4. Zakładka `Opinie`
Zasila sekcję opinii na stronie głównej. Jeśli zakładka nie istnieje lub nie ma w niej widocznych wpisów, sekcja w ogóle się nie pojawia.

| A: Imię | B: Pies | C: Treść | D: Ocena (1–5) | E: Widoczna (TAK/NIE) |
| :--- | :--- | :--- | :---: | :---: |
| Anna K. | Luna | Spokój na trasie i świetny kontakt z psem. | 5 | TAK |
| Marek W. | Bury | Widać doświadczenie i cierpliwość. | 4 | TAK |
| Kowalscy | Foks | Wpis roboczy, jeszcze niepublikowany. | 5 | NIE |

> **Wskazówki:**
> - Wiersze z wartością `NIE` w kolumnie `E` są pomijane — możesz przygotować opinię „na zapas” i opublikować ją później.
> - Pusta ocena oznacza 5 gwiazdek.
> - Wiersze bez imienia lub bez treści są ignorowane.
> - **Dodawaj wyłącznie prawdziwe opinie** — publikowanie wymyślonych recenzji jest nieuczciwą praktyką rynkową.

---

### 5. Zakładka `Statystyki`
Tworzona automatycznie przy pierwszym zdarzeniu. Zapisuje anonimowy lejek rezerwacji (bez cookies i bez danych osobowych).

| A: Data | B: Zdarzenie | C: Szczegóły |
| :--- | :--- | :--- |
| 2026-10-26 18:12:04 | `usluga_wybrana` | Spacer socjalizacyjny |
| 2026-10-26 18:12:31 | `termin_wybrany` | 2026-10-28 18:00 · Spacer socjalizacyjny |
| 2026-10-26 18:13:02 | `formularz_wyslany` | Spacer socjalizacyjny · 2026-10-28 18:00 |
| 2026-10-26 18:13:03 | `rezerwacja_przyjeta` | Spacer socjalizacyjny · 2026-10-28 18:00 |

Zdarzenia: `usluga_wybrana`, `termin_wybrany`, `formularz_wyslany`, `rezerwacja_przyjeta`, `rezerwacja_konflikt`, `rezerwacja_blad`, `dodaj_do_kalendarza`.

---

## 🚀 Wdrożenie Backend (Google Apps Script)

1. Otwórz swój Arkusz Google.
2. W menu wybierz: **Rozszerzenia (Extensions) ➔ Apps Script**.
3. Wklej zawartość pliku [`app_script`](./app_script) do edytora `Kod.gs`.
4. Kliknij **Wdróż (Deploy) ➔ Nowe wdrożenie (New deployment)**:
   - Wybierz typ: **Aplikacja internetowa (Web app)**.
   - **Opis**: np. *PsiApsi API v2*.
   - **Wykonaj jako (Execute as)**: *Ja (Twój adres e-mail)*.
   - **Kto ma dostęp (Who has access)**: *Każdy (Anyone)*.
5. Skopiuj wygenerowany **Adres URL aplikacji internetowej**.
6. Upewnij się, że w pliku [`scripts/spotkania.js`](./scripts/spotkania.js) zmienna `APPS_SCRIPT_URL` wskazuje na ten URL:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
   ```

---

## 📋 Formularz rezerwacji — co zbiera

| Pole | Wymagane | Trafia do arkusza |
| :--- | :---: | :--- |
| Imię i nazwisko opiekuna | tak | kolumny 6–7 |
| E-mail | tak | kolumna 8 |
| Telefon kontaktowy | tak | kolumna 9 |
| Imię i wiek psa | tak | kolumny 10–11 |
| Płeć psa (przełącznik) | tak | kolumna 12 |
| Reakcja na inne psy (lista) | tak | kolumna 13 |
| Ważne informacje o psie | nie | kolumna 14 |
| Potwierdzenie zdrowia i szczepień | tak | kolumna 15 |
| Zgoda RODO | tak | kolumna 16 |

---

## ⚠️ Do uzupełnienia przed publikacją

W kodzie pozostawiono świadomie oznaczone miejsca, których nie da się wypełnić bez właściciela serwisu:

1. **Numer telefonu** — w `index.html` występuje w dwóch miejscach: przycisk w nagłówku (linia z `tel:+48500000000`) oraz stopka (link i widoczny numer `+48 500 000 000`).
2. **Dane administratora danych** — w sekcji RODO (`#rodo`) widnieje placeholder z prośbą o pełną nazwę, adres i NIP.
3. **Treść RODO i regulaminu** — to wstępne wzory oparte na tym, co i tak jest na stronie. Przed publikacją warto je sprawdzić prawnie.
4. **Adres profilu na Instagramie** — użyto `https://instagram.com/niko.w.podrozy`.
5. **Treści w arkuszu** — ceny, czas trwania, „co w cenie” oraz opinie są danymi przykładowymi; realne wartości wpisujesz w arkuszu.

---

## 🖥️ Panel administratora

Zaplecze szkoły: grafik, oferta i lista zapisów bez klikania po komórkach arkusza. Panel jest
częścią tego samego wdrożenia Apps Script co API, więc nie wymaga osobnego hostingu.

### Adres

```text
https://script.google.com/macros/s/…/exec?page=admin
```

Ten sam adres co `APPS_SCRIPT_URL` z `scripts/spotkania.js`, tylko z parametrem `page=admin`.
Linku nie ma nigdzie na stronie — panel jest prywatny. Możesz zapisać go w telefonie jako
zakładkę lub dodać do ekranu głównego („Dodaj do ekranu głównego” w przeglądarce).

### Wdrożenie (jednorazowo)

1. W projekcie Apps Script obok pliku `Code.gs` dodaj **plik HTML** i nazwij go dokładnie `Admin`.
2. Wklej do niego **całą** zawartość [`admin-panel.html`](./admin-panel.html).
3. Ustaw PIN, wybierając jedną z dróg:
   - **Ustawienia projektu → Właściwości skryptu → Dodaj właściwość**: klucz `ADMIN_PIN`, wartość to Twój kod (np. `2468`), albo
   - w edytorze Apps Script wybierz z listy funkcję `ustawPinAdmina` i uruchom ją — zapyta o PIN i zapisze go.
4. (Opcjonalnie) Dodaj właściwość `ADMIN_EMAIL` ze swoim adresem Gmail, żeby panel był dostępny
   tylko dla Ciebie. Na zwykłym koncie Gmail Apps Script nie widzi adresu osoby otwierającej panel,
   więc to zabezpieczenie działa tylko w Google Workspace — w innym wypadku zostaje sam PIN.
5. **Wdróż → Zarządzaj wdrożeniami → (ołówek) → Wersja: Nowa wersja → Wdróż.**
   Bez tego kroku stary adres nadal będzie obsługiwany przez poprzednią wersję kodu.
6. Otwórz `…/exec?page=admin` i podaj PIN.

> PIN-u nie da się odczytać z arkusza ani ze strony. Sesja trwa 6 godzin, a panel trzyma
> w przeglądarce tylko tymczasowy token — nie sam PIN. Wygaśnięcie sesji kończy się powrotem
> do ekranu logowania.

### Co można zrobić w panelu

**Grafik** — dokładnie ta zakładka, którą czyta strona (kolumny A–B):

| Ustawienie | Znaczenie |
| :--- | :--- |
| **Domyślne** | Godziny wspólne dla każdego dnia bez własnego wpisu. |
| **Własne** | Dzień ma własną listę godzin — tapnij godziny, które przyjmujesz. |
| **Wolne** | Dzień bez terminów; strona pokaże wtedy przygaszony dzień bez slotów. |
| **Wyjątek na datę** | Najwyższy priorytet: urlop, święto albo jednorazowe zajęcia w innej godzinie. |
| **Zajęcia w tych godzinach** | Pod każdą listą godzin wybierasz, co się w nich odbywa. Brak zaznaczenia = wszystkie zajęcia; chip **„wszystkie zajęcia”** czyści wybór. |

Godzinę spoza listy (np. `11:30`) dodasz chipem **„+ inna”**. Panel zapisuje całą zakładkę
`Grafik` od nowa (kolumny A–C), ale wiersze, których nie rozumie, przepisuje bez zmian.
Panel nie pozwoli zapisać nazwy zajęć, której nie ma w zakładce `Zajęcia` — pokaże wtedy
komunikat z tą nazwą, bo po nazwach strona rozpoznaje, kto na co się zapisuje.

**Zajęcia** — zakładka `Uslugi` (kolumny A–I): nazwa, ikona, opis, limit psów w grupie, flaga
zajęć indywidualnych, miejsca spotkania, cena, czas trwania i „co w cenie”. Nazwy muszą być
unikalne, bo po nich system rozpoznaje, kto jest zapisany na te same zajęcia. Gdy zakładki
`Uslugi` nie ma, panel pokaże ofertę zapasową, a pierwszy zapis ją utworzy.

**Zapisy** — lista zgłoszeń z wybranego zakresu dat (domyślnie dwa tygodnie): opiekun, pies,
telefon (klikalny), e-mail i uwagi. Przycisk **Odwołaj zapis** usuwa wiersz z arkusza, próbuje
usunąć pasujące wydarzenie z Kalendarza Google i zostawia wpis `rezerwacja_odwolana`
w zakładce `Statystyki`.

### Czego panel nie robi

- Nie wysyła automatycznie wiadomości do opiekuna po odwołaniu — to jedna rozmowa telefoniczna.
- Nie kasuje wydarzenia z Kalendarza Google, jeśli nie da się go jednoznacznie dopasować
  (imię psa + data + godzina); wtedy panel pokazuje komunikat i wpis znika tylko z arkusza.
- Nie zarządza zakładkami `Opinie` i `Statystyki` — one nadal żyją w arkuszu.

---

## 🛠️ Uruchomienie Lokalne / Testowanie

Strona nie wymaga żadnego środowiska Node.js ani kompilacji – składa się z czystych plików statycznych.

Możesz uruchomić ją za pomocą dowolnego lokalnego serwera HTTP, np.:

```bash
# Python 3
python -m http.server 8000

# lub rozszerzenie Live Server w VS Code
```

Następnie otwórz w przeglądarce: `http://localhost:8000/index.html`.

---

## 🔒 Bezpieczeństwo i Niezawodność
- **Blokada wyścigów (LockService)**: Apps Script zapobiega równoległym zapisom na ten sam slot czasowy.
- **Odporność na brak sieci / błędy API**: Frontend posiada zintegrowany mechanizm fallback, dzięki czemu w przypadku problemów z połączeniem strona zachowuje ciągłość działania.
- **Panel administratora za PIN-em**: każda operacja panelu wymaga tokenu sesji wydanego po podaniu PIN-u (`ADMIN_PIN`), opcjonalnie dodatkowo sprawdzany jest adres konta (`ADMIN_EMAIL`). Zapis do arkusza jest blokowany `LockService`, żeby dwie osoby nie nadpisały zmian w połowie.
