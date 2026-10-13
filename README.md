# 🐾 PsiApsi — System Rezerwacji Spacerów i Treningów

Nowoczesny, responsywny i minimalistyczny system rezerwacji spotkań dla psów (Warszawa Wawer / okolice), inspirowany przejrzystym procesem rezerwacyjnym w stylu Wod Guru. 

Projekt łączy lekki frontend HTML/CSS/JS z bezserwerowym backendem opartym na **Google Apps Script**, **Google Sheets (Arkusz Google)** oraz **Google Calendar (Kalendarz Google)**.

---

## ✨ Główne Możliwości

- **Prosty, 3-krokowy proces zapisu**:
  1. Wybór rodzaju zajęć (kafle z ikonami i opisem).
  2. Wybór terminu w kalendarzu tygodniowym (widok siatki na desktopie, responsywny selektor dni na telefonach).
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

---

## 📁 Struktura Projektu

```text
psiapsi/
├── index.html                # Główna strona z nowoczesnym kalendarzem rezerwacji (Wod Guru UX)
├── index2.html               # Alternatywny / zapasowy widok kalendarza
├── walks.html                # Podstrona z ofertą spacerów
├── courses.html              # Podstrona z ofertą kursów
├── about.html                # O nas
├── contact.html              # Kontakt
├── app_script                # Kod źródłowy Google Apps Script (backend do wklejenia w arkuszu)
├── styles/
│   ├── spotkania.css         # Nowoczesny, minimalistyczny arkusz stylów kalendarza i formularza
│   └── style.css             # Style ogólne serwisu
└── scripts/
    ├── spotkania.js          # Główna logika rezerwacji, pobieranie danych i obsługa kalendarza
    └── main.js               # Pomocnicza logika strony
```

---

## ⚙️ Konfiguracja Arkusza Google (Google Sheets)

Całość opiera się na jednym Arkuszu Google połączonym ze skryptem z pliku `app_script`. W arkuszu definiujemy 3 zakładki:

### 1. Zakładka `Uslugi`
Zarządzanie ofertą zajęć i dopasowanymi do nich lokalizacjami.

| Kolumna A: Nazwa | Kolumna B: Ikona | Kolumna C: Opis | Kolumna D: Maks psow | Kolumna E: Indywidualne | Kolumna F: Lokalizacje (rozdzielone `;`) |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **Spacer 1-1** | 🦮 | Indywidualny, 1 pies | 1 | TAK | Warszawa Wawer (trasy leśne MPK) |
| **Spacer grupowy** | 🐕‍🦺 | Do 3 psów, socjalizacja | 3 | NIE | Warszawa Wawer (trasy leśne MPK); Park Skaryszewski |
| **Konsultacja** | 🎓 | Behawioralna, diagnoza | 1 | TAK | Warszawa Wawer (trasy leśne MPK); Dojazd do klienta |

> **Wskazówki:**
> - Dodanie nowego wiersza automatycznie tworzy nowy kafelek na stronie WWW.
> - W kolumnie `F` można wpisać kilka miejsc rozdzielonych średnikiem `;`. Po wybraniu tych zajęć formularz zaoferuje tylko te lokalizacje.

---

### 2. Zakładka `Grafik`
Zarządzanie godzinami pracy i dniami wolnymi.

| Kolumna A: Dzien / Data | Kolumna B: Godziny (rozdzielone przecinkiem `,`) |
| :--- | :--- |
| **Domyślne** | 18:00, 19:00, 20:00 |
| **Sobota** | 10:00, 11:30, 13:00 |
| **Niedziela** | *(pozostaw puste = dzień wolny)* |
| **2026-10-25** | 12:00, 14:00, 16:00 |

> **Zasady działania grafiku:**
> - `Domyślne` — godziny obowiązujące standardowo od poniedziałku do piątku.
> - Dni tygodnia (np. `Sobota`, `Wtorek`) — nadpisują godziny dla danego dnia tygodnia.
> - Konkretna data w formacie `YYYY-MM-DD` (np. `2026-10-25`) — ma najwyższy priorytet (pozwala ustalić wyjątkowy grafik na dany dzień lub zaplanować urlop).
> - Pusta komórka w kolumnie B oznacza dzień wolny (*„Brak terminów”*).

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
9. `Imię psa`
10. `Wiek psa`
11. `Płeć psa`
12. `Data utworzenia wpisu`

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
