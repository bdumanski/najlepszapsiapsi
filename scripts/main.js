const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3JNKKwOicbrz1LZm92jrqPS47xdXWRbJE8lOv8xDdkOOPQXRrvXi1_Y6zeNopKOAtKA/exec';

const dayNames = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
const availableHours = ['18:00', '19:00', '20:00'];

// Stan aplikacji
let currentMonday = getMonday(new Date());
let bookedData = [];
let isFetchingBookings = false;

// Elementy DOM kalendarza
const weekRangeLabel = document.getElementById('weekRangeLabel');
const weekGrid = document.getElementById('weekGrid');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');

// Elementy mobilnego wyboru dnia
const mobileDayPicker = document.getElementById('mobileDayPicker');
const mobileDayNav = document.getElementById('mobileDayNav');
const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const mobileDayTitle = document.getElementById('mobileDayTitle');

let selectedMobileDayIndex = getInitialMobileDayIndex();

function getInitialMobileDayIndex() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(currentMonday);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - start) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    return diffDays;
  }
  return 0;
}

// Elementy DOM formularza
const bookingForm = document.getElementById('bookingForm');
const bookingDateInput = document.getElementById('bookingDateInput');
const timeSlotSelect = document.getElementById('timeSlot');
const serviceTypeSelect = document.getElementById('serviceType');
const locationSelect = document.getElementById('locationSelect');
const otherLocationLabel = document.getElementById('otherLocationLabel');
const otherLocationInput = document.getElementById('otherLocation');
const selectedDateLabel = document.getElementById('selectedDate');
const selectedInfo = document.getElementById('selectedInfo');
const bookingButton = document.getElementById('bookingButton');

// --------------------------------------------------------------------------
// Funkcje pomocnicze dat i normalizacji
// --------------------------------------------------------------------------

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDatePL(d) {
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

function formatDateFullPL(d) {
  return d.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Normalizuje datę pochodzącą z Google Sheets (Date object string lub YYYY-MM-DD)
function normalizeDate(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatDateISO(parsed);
  }
  return str;
}

// Normalizuje godzinę pochodzącą z Google Sheets (np. "Sat Dec 30 1899 18:00:00..." -> "18:00")
function normalizeTime(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    return str.padStart(5, '0');
  }
  const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return str;
}

// Sprawdza czy dany slot czasowy już minął
function isSlotInPast(dayDate, hourStr) {
  const [h, m] = hourStr.split(':').map(Number);
  const slotDate = new Date(dayDate);
  slotDate.setHours(h, m, 0, 0);
  return slotDate < new Date();
}

// Sprawdza czy data przypada na dzisiaj
function isToday(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

// --------------------------------------------------------------------------
// Pobieranie danych z Google Apps Script
// --------------------------------------------------------------------------

async function fetchBookings(showLoadingIndicator = true) {
  if (showLoadingIndicator && weekGrid && bookedData.length === 0) {
    weekGrid.innerHTML = '<div style="grid-column: 1/-1; padding: 3rem 1rem; text-align: center; color: #475569;">Ładowanie aktualnego grafiku...</div>';
  }

  isFetchingBookings = true;
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    const json = await res.json();

    if (json.status === 'success' && Array.isArray(json.bookedSlots)) {
      bookedData = json.bookedSlots.map(b => ({
        date: normalizeDate(b.date),
        timeSlot: normalizeTime(b.timeSlot),
        serviceType: String(b.serviceType || '').trim()
      }));
    }
  } catch (err) {
    console.error("Błąd podczas pobierania rezerwacji:", err);
  } finally {
    isFetchingBookings = false;
  }

  if (weekGrid) renderWeekGrid();
}

// --------------------------------------------------------------------------
// Renderowanie siatki kalendarza tygodniowego
// --------------------------------------------------------------------------

function renderWeekGrid() {
  if (!weekGrid) return;

  const sunday = new Date(currentMonday);
  sunday.setDate(sunday.getDate() + 6);

  // Etykieta zakresu tygodnia
  if (weekRangeLabel) {
    const startPL = formatDatePL(currentMonday);
    const endPL = formatDatePL(sunday);
    const yearStr = currentMonday.getFullYear() === sunday.getFullYear() 
      ? sunday.getFullYear() 
      : `${currentMonday.getFullYear()} / ${sunday.getFullYear()}`;
    weekRangeLabel.textContent = `Tydzień: ${startPL} – ${endPL} ${yearStr}`;
  }

  // Blokada przycisku "Poprzedni tydzień" dla tygodni w przeszłości
  if (prevWeekBtn) {
    const todayMonday = getMonday(new Date());
    prevWeekBtn.disabled = currentMonday <= todayMonday;
  }

  weekGrid.innerHTML = '';

  const selectedDateVal = bookingDateInput ? bookingDateInput.value : '';
  const selectedTimeVal = timeSlotSelect ? timeSlotSelect.value : '';

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = formatDateISO(dayDate);
    const todayFlag = isToday(dayDate);

    const isMobileActive = (i === selectedMobileDayIndex);
    const dayCol = document.createElement('div');
    dayCol.className = 'week-day-col' + 
      (todayFlag ? ' is-today' : '') + 
      (isMobileActive ? ' is-mobile-active' : '');
    dayCol.dataset.dayIndex = i;

    const dayHeader = document.createElement('div');
    dayHeader.className = 'week-day-header';
    dayHeader.innerHTML = `<strong>${dayNames[i]}</strong><span>${formatDatePL(dayDate)}</span>`;
    dayCol.appendChild(dayHeader);

    availableHours.forEach(hour => {
      const slotBtn = document.createElement('button');
      slotBtn.type = 'button';
      slotBtn.className = 'slot-card';

      const inPast = isSlotInPast(dayDate, hour);
      const matches = bookedData.filter(b => b.date === dateStr && b.timeSlot === hour);

      const has1on1 = matches.some(m => {
        const s = (m.serviceType || '').toLowerCase();
        return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja');
      });
      const groupCount = matches.filter(m => (m.serviceType || '').toLowerCase().includes('grupow')).length;

      let statusText = '';
      let isFull = false;

      if (inPast) {
        slotBtn.classList.add('past');
        statusText = 'Minął';
        slotBtn.disabled = true;
      } else if (has1on1) {
        isFull = true;
        slotBtn.classList.add('full');
        statusText = 'Zajęty (1-1)';
        slotBtn.disabled = true;
      } else if (groupCount >= 3) {
        isFull = true;
        slotBtn.classList.add('full');
        statusText = 'Brak miejsc (Grupowy)';
        slotBtn.disabled = true;
      } else if (groupCount > 0) {
        slotBtn.classList.add('partial');
        const remaining = 3 - groupCount;
        statusText = `Grupowy (${groupCount}/3) – wolne: ${remaining}`;
      } else {
        slotBtn.classList.add('available');
        statusText = 'Wolny termin';
      }

      // Podświetlenie, jeśli ten slot jest aktualnie zaznaczony w formularzu
      if (dateStr === selectedDateVal && hour === selectedTimeVal) {
        slotBtn.classList.add('selected');
      }

      slotBtn.innerHTML = `
        <span class="slot-time">${hour}</span>
        <span class="slot-status">${statusText}</span>
      `;

      if (!inPast && !isFull) {
        slotBtn.addEventListener('click', () => {
          selectSlot(dateStr, hour, dayDate, i, groupCount);
        });
      }

      dayCol.appendChild(slotBtn);
    });

    weekGrid.appendChild(dayCol);
  }

  renderMobileDayPicker();
  updateMobileActiveDay();
}

// --------------------------------------------------------------------------
// Obsługa paska wyboru dnia na telefonie
// --------------------------------------------------------------------------

function renderMobileDayPicker() {
  if (!mobileDayPicker) return;
  mobileDayPicker.innerHTML = '';
  const shortNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = formatDateISO(dayDate);
    const todayFlag = isToday(dayDate);

    // Sprawdzamy dostępność slotów w danym dniu
    let hasAvailable = false;
    let hasPartial = false;

    availableHours.forEach(hour => {
      const inPast = isSlotInPast(dayDate, hour);
      const matches = bookedData.filter(b => b.date === dateStr && b.timeSlot === hour);
      const has1on1 = matches.some(m => {
        const s = (m.serviceType || '').toLowerCase();
        return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja');
      });
      const groupCount = matches.filter(m => (m.serviceType || '').toLowerCase().includes('grupow')).length;

      if (!inPast && !has1on1 && groupCount < 3) {
        if (groupCount > 0) hasPartial = true;
        else hasAvailable = true;
      }
    });

    let dotColor = '#cbd5e1'; // szary: brak wolnych lub minione
    if (hasAvailable) dotColor = '#22c55e'; // zielony
    else if (hasPartial) dotColor = '#eab308'; // żółty

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'mobile-day-pill' + 
      (i === selectedMobileDayIndex ? ' active' : '') + 
      (todayFlag ? ' is-today' : '');

    pill.innerHTML = `
      <span class="pill-name">${shortNames[i]}</span>
      <span class="pill-num">${dayDate.getDate()}</span>
      <span class="pill-dot" style="background-color: ${dotColor};"></span>
    `;

    pill.addEventListener('click', () => {
      selectedMobileDayIndex = i;
      updateMobileActiveDay();
    });

    mobileDayPicker.appendChild(pill);
  }
}

function updateMobileActiveDay() {
  if (mobileDayPicker) {
    const pills = mobileDayPicker.querySelectorAll('.mobile-day-pill');
    pills.forEach((p, idx) => {
      if (idx === selectedMobileDayIndex) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  if (weekGrid) {
    const cols = weekGrid.querySelectorAll('.week-day-col');
    cols.forEach((col, idx) => {
      if (idx === selectedMobileDayIndex) {
        col.classList.add('is-mobile-active');
      } else {
        col.classList.remove('is-mobile-active');
      }
    });
  }

  if (mobileDayTitle) {
    const activeDate = new Date(currentMonday);
    activeDate.setDate(activeDate.getDate() + selectedMobileDayIndex);
    mobileDayTitle.textContent = `${dayNames[selectedMobileDayIndex]}, ${formatDatePL(activeDate)}`;
  }
}

// --------------------------------------------------------------------------
// Wybór slotu z kalendarza
// --------------------------------------------------------------------------

function selectSlot(dateStr, hour, dayDate, dayIndex, groupCount) {
  selectedMobileDayIndex = dayIndex;
  // Podświetlenie karty
  document.querySelectorAll('.slot-card').forEach(s => s.classList.remove('selected'));
  
  if (bookingDateInput) {
    bookingDateInput.value = dateStr;
  }
  if (timeSlotSelect) {
    timeSlotSelect.value = hour;
  }

  // Wyróżnienie tekstu podsumowania
  if (selectedDateLabel) {
    selectedDateLabel.textContent = `${dayNames[dayIndex]}, ${formatDatePL(dayDate)} o godz. ${hour}`;
  }

  // Ograniczenie wyboru usługi, jeśli w slocie trwa już spacer grupowy
  if (serviceTypeSelect) {
    const optGroup = serviceTypeSelect.querySelector('option[value="Spacer grupowy"]');
    const opt1on1 = serviceTypeSelect.querySelector('option[value="Spacer 1-1"]');
    const optConsult = serviceTypeSelect.querySelector('option[value="Konsultacja"]');

    if (groupCount > 0) {
      serviceTypeSelect.value = 'Spacer grupowy';
      if (opt1on1) opt1on1.disabled = true;
      if (optConsult) optConsult.disabled = true;
      if (selectedInfo) {
        selectedInfo.textContent = `W tym slocie trwa spacer grupowy (${groupCount}/3 psy). Zapisujesz się na dołączenie do grupy.`;
        selectedInfo.style.color = '#854d0e';
      }
    } else {
      if (opt1on1) opt1on1.disabled = false;
      if (optConsult) optConsult.disabled = false;
      if (selectedInfo) {
        selectedInfo.textContent = 'Wybrano wolny termin. Wybierz rodzaj zajęć i uzupełnij formularz poniżej.';
        selectedInfo.style.color = '#166534';
      }
    }
  }

  // Re-render, aby dodać klasę .selected
  renderWeekGrid();

  // Płynne przewinięcie do formularza
  const bookingSummary = document.getElementById('bookingSummary');
  if (bookingSummary) {
    bookingSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  updateFormState();
}

// --------------------------------------------------------------------------
// Walidacja i synchronizacja wyboru ręcznego z pól formularza
// --------------------------------------------------------------------------

function handleManualDateOrTimeChange() {
  const dateVal = bookingDateInput ? bookingDateInput.value : '';
  const timeVal = timeSlotSelect ? timeSlotSelect.value : '';

  if (!dateVal || !timeVal) {
    return;
  }

  const [year, month, day] = dateVal.split('-').map(Number);
  const chosenDate = new Date(year, month - 1, day);

  if (isSlotInPast(chosenDate, timeVal)) {
    if (selectedInfo) {
      selectedInfo.textContent = '⚠️ Wybrany termin już minął. Wybierz datę i godzinę z przyszłości.';
      selectedInfo.style.color = '#991b1b';
    }
    if (bookingButton) bookingButton.disabled = true;
    return;
  }

  // Sprawdzamy stan rezerwacji dla tej daty i godziny
  const matches = bookedData.filter(b => b.date === dateVal && b.timeSlot === timeVal);
  const has1on1 = matches.some(m => {
    const s = (m.serviceType || '').toLowerCase();
    return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja');
  });
  const groupCount = matches.filter(m => (m.serviceType || '').toLowerCase().includes('grupow')).length;

  if (has1on1 || groupCount >= 3) {
    if (selectedInfo) {
      selectedInfo.textContent = '⚠️ Ten termin jest w pełni zajęty. Wybierz inną godzinę lub dzień.';
      selectedInfo.style.color = '#991b1b';
    }
    if (bookingButton) bookingButton.disabled = true;
    return;
  }

  if (bookingButton) bookingButton.disabled = false;

  if (selectedDateLabel) {
    selectedDateLabel.textContent = `${formatDateFullPL(chosenDate)} o godz. ${timeVal}`;
  }

  if (groupCount > 0) {
    if (serviceTypeSelect) {
      serviceTypeSelect.value = 'Spacer grupowy';
      const opt1on1 = serviceTypeSelect.querySelector('option[value="Spacer 1-1"]');
      const optConsult = serviceTypeSelect.querySelector('option[value="Konsultacja"]');
      if (opt1on1) opt1on1.disabled = true;
      if (optConsult) optConsult.disabled = true;
    }
    if (selectedInfo) {
      selectedInfo.textContent = `Dołączasz do spaceru grupowego (${groupCount}/3 psy).`;
      selectedInfo.style.color = '#854d0e';
    }
  } else {
    if (serviceTypeSelect) {
      const opt1on1 = serviceTypeSelect.querySelector('option[value="Spacer 1-1"]');
      const optConsult = serviceTypeSelect.querySelector('option[value="Konsultacja"]');
      if (opt1on1) opt1on1.disabled = false;
      if (optConsult) optConsult.disabled = false;
    }
    if (selectedInfo) {
      selectedInfo.textContent = 'Wybrany termin jest wolny. Uzupełnij dane formularza.';
      selectedInfo.style.color = '#166534';
    }
  }

  // Jeśli wybrana data leży w widocznym tygodniu, aktualizujemy wybrany dzień mobilny
  const start = new Date(currentMonday);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.round((chosenDate - start) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays < 7) {
    selectedMobileDayIndex = diffDays;
  }

  // Odświeżamy widok kalendarza
  renderWeekGrid();
}

function updateFormState() {
  if (locationSelect && locationSelect.value === 'Inna') {
    if (otherLocationLabel) otherLocationLabel.classList.remove('hidden');
    if (otherLocationInput) otherLocationInput.required = true;
  } else {
    if (otherLocationLabel) otherLocationLabel.classList.add('hidden');
    if (otherLocationInput) {
      otherLocationInput.required = false;
      otherLocationInput.value = '';
    }
  }
}

// --------------------------------------------------------------------------
// Obsługa wysyłki formularza
// --------------------------------------------------------------------------

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const formData = new FormData(bookingForm);
    const rawDate = formData.get('rawDate');
    const timeSlot = formData.get('timeSlot');
    const serviceType = formData.get('serviceType');

    if (!rawDate || !timeSlot) {
      alert("⚠️ Proszę wybrać termin (datę oraz godzinę) z grafiku lub formularza.");
      return;
    }

    const [year, month, day] = rawDate.split('-').map(Number);
    const dObj = new Date(year, month - 1, day);

    // Walidacja terminu przeszłego
    if (isSlotInPast(dObj, timeSlot)) {
      alert("⚠️ Wybrany termin już minął. Prosimy wybrać przyszłą datę i godzinę.");
      return;
    }

    // Wstępna walidacja dostępności w lokalnym buforze
    const matches = bookedData.filter(b => b.date === rawDate && b.timeSlot === timeSlot);
    const has1on1 = matches.some(m => {
      const s = (m.serviceType || '').toLowerCase();
      return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja');
    });
    const groupCount = matches.filter(m => (m.serviceType || '').toLowerCase().includes('grupow')).length;
    const is1on1Req = (serviceType || '').includes('1-1') || (serviceType || '').toLowerCase().includes('konsultacj');

    if (has1on1) {
      alert("⚠️ Wybrany termin jest już zajęty (zajęcia indywidualne). Wybierz inny termin.");
      return;
    }
    if (is1on1Req && groupCount > 0) {
      alert("⚠️ W wybranym terminie trwają już zajęcia grupowe. Nie można zarezerwować zajęć 1-1 w tym slocie.");
      return;
    }
    if (!is1on1Req && groupCount >= 3) {
      alert("⚠️ Brak wolnych miejsc na spacer grupowy w tym terminie (limit 3 psów osiągnięty).");
      return;
    }

    bookingButton.disabled = true;
    const originalButtonText = bookingButton.textContent;
    bookingButton.textContent = 'Weryfikacja i zapisywanie...';

    const dateDisplay = formatDateFullPL(dObj);
    const selectedLocation = formData.get('location') === 'Inna' ? formData.get('otherLocation') : formData.get('location');

    const payload = {
      rawDate: rawDate,
      dateDisplay: dateDisplay,
      timeSlot: timeSlot,
      serviceType: serviceType,
      location: selectedLocation,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      clientEmail: formData.get('clientEmail'),
      dogName: formData.get('dogName'),
      dogAge: formData.get('dogAge'),
      dogGender: formData.get('dogGender')
    };

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.status === 'success') {
        alert(`🎉 Sukces! Twoja rezerwacja na dzień ${dateDisplay} o godz. ${timeSlot} (${serviceType}) została przyjęta.`);
        
        // Dodajemy rezerwację do lokalnego bufora od razu
        bookedData.push({
          date: rawDate,
          timeSlot: timeSlot,
          serviceType: serviceType
        });

        bookingForm.reset();
        if (selectedDateLabel) selectedDateLabel.textContent = 'Kliknij wolny slot na grafice powyżej';
        if (selectedInfo) {
          selectedInfo.textContent = 'Możesz też wybrać dane z rozwijanych list poniżej.';
          selectedInfo.style.color = '';
        }

        renderWeekGrid();
        // W tle odświeżamy z serwera
        fetchBookings(false);
      } else if (data.status === 'conflict') {
        alert("⚠️ " + (data.message || "Ten termin został właśnie zajęty."));
        fetchBookings(false);
      } else {
        alert("Błąd: " + (data.message || "Wystąpił nieoczekiwany problem podczas rezerwacji."));
      }
    } catch (err) {
      console.error("Błąd sieciowy:", err);
      alert("Wystąpił błąd sieciowy podczas wysyłania. Upewnij się, że masz połączenie z Internetem i spróbuj ponownie.");
    } finally {
      bookingButton.disabled = false;
      bookingButton.textContent = originalButtonText;
    }
  });
}

// --------------------------------------------------------------------------
// Nawigacja tygodniami
// --------------------------------------------------------------------------

if (prevWeekBtn) {
  prevWeekBtn.addEventListener('click', () => {
    const todayMonday = getMonday(new Date());
    if (currentMonday > todayMonday) {
      const prev = new Date(currentMonday);
      prev.setDate(prev.getDate() - 7);
      currentMonday = getMonday(prev);
      selectedMobileDayIndex = getInitialMobileDayIndex();
      renderWeekGrid();
    }
  });
}

if (nextWeekBtn) {
  nextWeekBtn.addEventListener('click', () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    currentMonday = getMonday(next);
    selectedMobileDayIndex = 0;
    renderWeekGrid();
  });
}

// --------------------------------------------------------------------------
// Nawigacja dniami na urządzeniach mobilnych
// --------------------------------------------------------------------------

if (prevDayBtn) {
  prevDayBtn.addEventListener('click', () => {
    if (selectedMobileDayIndex > 0) {
      selectedMobileDayIndex--;
      updateMobileActiveDay();
    } else {
      const todayMonday = getMonday(new Date());
      if (currentMonday > todayMonday) {
        const prev = new Date(currentMonday);
        prev.setDate(prev.getDate() - 7);
        currentMonday = getMonday(prev);
        selectedMobileDayIndex = 6;
        renderWeekGrid();
      }
    }
  });
}

if (nextDayBtn) {
  nextDayBtn.addEventListener('click', () => {
    if (selectedMobileDayIndex < 6) {
      selectedMobileDayIndex++;
      updateMobileActiveDay();
    } else {
      const next = new Date(currentMonday);
      next.setDate(next.getDate() + 7);
      currentMonday = getMonday(next);
      selectedMobileDayIndex = 0;
      renderWeekGrid();
    }
  });
}

// --------------------------------------------------------------------------
// Podpięcie zdarzeń formularza
// --------------------------------------------------------------------------

if (locationSelect) {
  locationSelect.addEventListener('change', updateFormState);
}

if (bookingDateInput) {
  bookingDateInput.addEventListener('change', handleManualDateOrTimeChange);
}

if (timeSlotSelect) {
  timeSlotSelect.addEventListener('change', handleManualDateOrTimeChange);
}

if (serviceTypeSelect) {
  serviceTypeSelect.addEventListener('change', handleManualDateOrTimeChange);
}

// --------------------------------------------------------------------------
// Inicjalizacja
// --------------------------------------------------------------------------

if (weekGrid) {
  // Ustawiamy minimalną datę w polu wyboru daty na dzisiaj
  if (bookingDateInput) {
    bookingDateInput.min = formatDateISO(new Date());
  }
  fetchBookings(true);
}