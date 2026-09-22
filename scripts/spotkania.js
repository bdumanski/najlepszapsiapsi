/* ==========================================================================
   PsiApsi — spotkania.js
   Minimalna, krokowa rezerwacja (Wod Guru-inspired)
   ========================================================================== */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3JNKKwOicbrz1LZm92jrqPS47xdXWRbJE8lOv8xDdkOOPQXRrvXi1_Y6zeNopKOAtKA/exec';

const dayNames      = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];
const shortDayNames = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];
const availableHours = ['18:00','19:00','20:00'];

// ── Stan aplikacji ──────────────────────────────────────────
let currentMonday        = getMonday(new Date());
let bookedData           = [];
let selectedService      = 'Spacer 1-1';
let selectedGender       = 'pies';
let selectedDateStr      = '';
let selectedHour         = '';
let selectedDayDate      = null;
let selectedMobileDayIndex = getInitialMobileDayIndex();

// ── DOM refs ────────────────────────────────────────────────
const weekRangeLabel     = document.getElementById('weekRangeLabel');
const studioGrid         = document.getElementById('studioGrid');
const prevWeekBtn        = document.getElementById('prevWeekBtn');
const nextWeekBtn        = document.getElementById('nextWeekBtn');
const todayJumpBtn       = document.getElementById('todayJumpBtn');
const mobileDaysStrip    = document.getElementById('mobileDaysStrip');
const mobileDayBannerTitle = document.getElementById('mobileDayBannerTitle');
const mobilePrevDayBtn   = document.getElementById('mobilePrevDayBtn');
const mobileNextDayBtn   = document.getElementById('mobileNextDayBtn');
const step3Section       = document.getElementById('step3');
const successSection     = document.getElementById('successSection');
const spotkaniaForm      = document.getElementById('spotkaniaForm');
const bookingDateInput   = document.getElementById('bookingDateInput');
const timeSlotHidden     = document.getElementById('timeSlot');
const serviceTypeHidden  = document.getElementById('serviceType');
const locationSelect     = document.getElementById('locationSelect');
const otherLocationGroup = document.getElementById('otherLocationGroup');
const otherLocationInput = document.getElementById('otherLocation');
const submitBtn          = document.getElementById('submitBtn');
const submitBtnText      = document.getElementById('submitBtnText');
const selectedSummaryText = document.getElementById('selectedSummaryText');
const changeSelectionBtn = document.getElementById('changeSelectionBtn');
const modalSummaryDetails = document.getElementById('modalSummaryDetails');
const closeModalBtn      = document.getElementById('closeModalBtn');

// ── Pomocnicze funkcje dat ──────────────────────────────────

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDateISO(d) {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDatePL(d) {
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

function formatDateFullPL(d) {
  return d.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function normalizeDate(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatDateISO(parsed);
  return str;
}

function normalizeTime(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) return str.padStart(5, '0');
  const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match) return `${match[1].padStart(2,'0')}:${match[2]}`;
  return str;
}

function isSlotInPast(dayDate, hourStr) {
  const [h, m] = hourStr.split(':').map(Number);
  const slotDate = new Date(dayDate);
  slotDate.setHours(h, m, 0, 0);
  return slotDate < new Date();
}

function isToday(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
      && d.getMonth()    === now.getMonth()
      && d.getDate()     === now.getDate();
}

function getInitialMobileDayIndex() {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(currentMonday); start.setHours(0,0,0,0);
  const diff = Math.round((today - start) / 864e5);
  return (diff >= 0 && diff < 7) ? diff : 0;
}

// ── Pobieranie danych ───────────────────────────────────────

async function fetchBookings() {
  if (studioGrid && bookedData.length === 0) {
    studioGrid.innerHTML = '<div style="grid-column:1/-1;padding:3rem 1rem;text-align:center;color:#9CA3AF;font-size:.9rem;">🐾 Ładowanie grafiku...</div>';
  }
  try {
    const res  = await fetch(APPS_SCRIPT_URL);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.bookedSlots)) {
      bookedData = json.bookedSlots.map(b => ({
        date:        normalizeDate(b.date),
        timeSlot:    normalizeTime(b.timeSlot),
        serviceType: String(b.serviceType || '').trim()
      }));
    }
  } catch (err) {
    console.error('Błąd pobierania rezerwacji:', err);
  }
  renderCalendar();
}

// ── Renderowanie kalendarza ─────────────────────────────────

function renderCalendar() {
  if (!studioGrid) return;

  const sunday = new Date(currentMonday);
  sunday.setDate(sunday.getDate() + 6);

  // Etykieta tygodnia
  if (weekRangeLabel) {
    weekRangeLabel.textContent = `${formatDatePL(currentMonday)} – ${formatDatePL(sunday)} ${sunday.getFullYear()}`;
  }

  // Blokada cofania przed bieżący tydzień
  if (prevWeekBtn) {
    prevWeekBtn.disabled = currentMonday <= getMonday(new Date());
  }

  studioGrid.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const dayDate    = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr    = formatDateISO(dayDate);
    const todayFlag  = isToday(dayDate);
    const isMobActive = (i === selectedMobileDayIndex);

    const col = document.createElement('div');
    col.className = 's-day-col'
      + (todayFlag   ? ' is-today'         : '')
      + (isMobActive ? ' is-mobile-active'  : '');
    col.dataset.dayIndex = i;

    // Nagłówek kolumny
    const hdr = document.createElement('div');
    hdr.className = 's-day-col-header';
    hdr.innerHTML = `
      <span class="s-day-col-name">${shortDayNames[i]}</span>
      <span class="s-day-col-num">${dayDate.getDate()}</span>
    `;
    col.appendChild(hdr);

    // Sloty godzinowe
    availableHours.forEach(hour => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 's-slot-btn';

      const inPast    = isSlotInPast(dayDate, hour);
      const matches   = bookedData.filter(b => b.date === dateStr && b.timeSlot === hour);
      const has1on1   = matches.some(m => {
        const s = (m.serviceType || '').toLowerCase();
        return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja');
      });
      const groupCount = matches.filter(m => (m.serviceType || '').toLowerCase().includes('grupow')).length;

      let statusText = '';
      let isFull     = false;

      if (inPast) {
        btn.classList.add('is-past');
        statusText = 'Minął';
        btn.disabled = true;
      } else if (has1on1) {
        isFull = true;
        btn.classList.add('is-full');
        statusText = 'Zajęty';
        btn.disabled = true;
      } else if (groupCount >= 3) {
        isFull = true;
        btn.classList.add('is-full');
        statusText = 'Brak miejsc';
        btn.disabled = true;
      } else if (groupCount > 0) {
        btn.classList.add('is-partial');
        statusText = `Grupowy ${groupCount}/3`;
      } else {
        btn.classList.add('is-available');
        statusText = 'Wolny';
      }

      if (dateStr === selectedDateStr && hour === selectedHour) {
        btn.classList.add('is-selected');
      }

      btn.innerHTML = `
        <span class="s-slot-time">${hour}</span>
        <span class="s-slot-status">${statusText}</span>
      `;

      if (!inPast && !isFull) {
        btn.addEventListener('click', () => selectSlot(dateStr, hour, dayDate, i, groupCount));
      }

      col.appendChild(btn);
    });

    studioGrid.appendChild(col);
  }

  renderDaysStrip();
  updateMobileView();
}

// ── Wybór slotu ─────────────────────────────────────────────

function selectSlot(dateStr, hour, dayDate, dayIndex, groupCount) {
  selectedDateStr        = dateStr;
  selectedHour           = hour;
  selectedDayDate        = dayDate;
  selectedMobileDayIndex = dayIndex;

  // Synchronizacja ukrytych pól
  if (bookingDateInput) bookingDateInput.value = dateStr;
  if (timeSlotHidden)   timeSlotHidden.value   = hour;
  if (serviceTypeHidden) serviceTypeHidden.value = selectedService;

  // Przy slotach grupowych wymuś usługę grupową
  if (groupCount > 0) {
    selectedService = 'Spacer grupowy';
    if (serviceTypeHidden) serviceTypeHidden.value = 'Spacer grupowy';
    document.querySelectorAll('.s-service-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.service === 'Spacer grupowy');
    });
  }

  // Aktualizuj pasek podsumowania w kroku 3
  if (selectedSummaryText) {
    const dayLabel = dayNames[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];
    selectedSummaryText.textContent = `${dayLabel}, ${formatDatePL(dayDate)} · godz. ${hour} · ${selectedService}`;
  }

  // Pokaż krok 3 (formularz)
  showStep3();

  renderCalendar();

  // Płynne przewinięcie do formularza
  if (step3Section) {
    setTimeout(() => step3Section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
}

function showStep3() {
  if (step3Section) {
    step3Section.classList.remove('s-step--hidden');
    step3Section.removeAttribute('aria-hidden');
  }
}

function hideStep3() {
  if (step3Section) {
    step3Section.classList.add('s-step--hidden');
    step3Section.setAttribute('aria-hidden', 'true');
  }
}

// ── Pasek dni (desktop + mobile scroll) ────────────────────

function renderDaysStrip() {
  if (!mobileDaysStrip) return;
  mobileDaysStrip.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const dayDate  = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr  = formatDateISO(dayDate);
    const todayFlag = isToday(dayDate);

    let hasAvailable = false, hasPartial = false;
    availableHours.forEach(hour => {
      const inPast  = isSlotInPast(dayDate, hour);
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

    let dotColor = '#D1D5DB';
    if (hasAvailable) dotColor = '#1B6B50';
    else if (hasPartial) dotColor = '#D97706';

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 's-day-pill'
      + (i === selectedMobileDayIndex ? ' active' : '')
      + (todayFlag ? ' is-today' : '');
    pill.innerHTML = `
      <span class="s-day-name">${shortDayNames[i]}</span>
      <span class="s-day-num">${dayDate.getDate()}</span>
      <span class="s-day-dot" style="background:${dotColor}"></span>
    `;
    pill.addEventListener('click', () => {
      selectedMobileDayIndex = i;
      updateMobileView();
    });
    mobileDaysStrip.appendChild(pill);
  }
}

function updateMobileView() {
  // Pigułki
  if (mobileDaysStrip) {
    mobileDaysStrip.querySelectorAll('.s-day-pill').forEach((p, idx) => {
      p.classList.toggle('active', idx === selectedMobileDayIndex);
    });
  }
  // Kolumny siatki
  if (studioGrid) {
    studioGrid.querySelectorAll('.s-day-col').forEach((col, idx) => {
      col.classList.toggle('is-mobile-active', idx === selectedMobileDayIndex);
    });
  }
  // Tytuł banera mobilnego
  if (mobileDayBannerTitle) {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + selectedMobileDayIndex);
    mobileDayBannerTitle.textContent = `${dayNames[selectedMobileDayIndex]}, ${formatDatePL(d)}`;
  }
}

// ── Wybór usługi (krok 1) ───────────────────────────────────

document.querySelectorAll('.s-service-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedService = btn.dataset.service;
    document.querySelectorAll('.s-service-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (serviceTypeHidden) serviceTypeHidden.value = selectedService;
    // Odśwież pasek podsumowania jeśli jest wybrany slot
    if (selectedDateStr && selectedSummaryText) {
      const d = selectedDayDate || new Date(selectedDateStr);
      const dayLabel = dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1];
      selectedSummaryText.textContent = `${dayLabel}, ${formatDatePL(d)} · godz. ${selectedHour} · ${selectedService}`;
    }
  });
});

// ── Płeć psa ────────────────────────────────────────────────

document.querySelectorAll('.s-gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.s-gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGender = btn.dataset.gender;
  });
});

// ── Lokalizacja ─────────────────────────────────────────────

if (locationSelect) {
  locationSelect.addEventListener('change', () => {
    const isOther = locationSelect.value === 'Inna';
    if (otherLocationGroup) otherLocationGroup.classList.toggle('s-field--hidden', !isOther);
    if (otherLocationInput) {
      otherLocationInput.required = isOther;
      if (!isOther) otherLocationInput.value = '';
    }
  });
}

// ── Zmiana terminu ──────────────────────────────────────────

if (changeSelectionBtn) {
  changeSelectionBtn.addEventListener('click', () => {
    selectedDateStr = '';
    selectedHour    = '';
    hideStep3();
    document.getElementById('step2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderCalendar();
  });
}

// ── Wysyłka formularza ──────────────────────────────────────

if (spotkaniaForm) {
  spotkaniaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedDateStr || !selectedHour) {
      alert('⚠️ Proszę najpierw wybrać termin w kalendarzu powyżej.');
      return;
    }
    if (!spotkaniaForm.checkValidity()) {
      spotkaniaForm.reportValidity();
      return;
    }

    const fd         = new FormData(spotkaniaForm);
    const firstName  = fd.get('firstName');
    const lastName   = fd.get('lastName');
    const clientEmail = fd.get('clientEmail');
    const dogName    = fd.get('dogName');
    const dogAge     = fd.get('dogAge');
    const locValue   = fd.get('location') === 'Inna' ? fd.get('otherLocation') : fd.get('location');

    const [yr, mo, da] = selectedDateStr.split('-').map(Number);
    const dateDisplay  = formatDateFullPL(new Date(yr, mo - 1, da));

    submitBtn.disabled = true;
    submitBtnText.textContent = 'Zapisuję rezerwację…';

    const payload = {
      rawDate:     selectedDateStr,
      dateDisplay: dateDisplay,
      timeSlot:    selectedHour,
      serviceType: selectedService,
      location:    locValue,
      firstName,
      lastName,
      clientEmail,
      dogName,
      dogAge,
      dogGender:   selectedGender
    };

    try {
      const res  = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();

      if (data.status === 'success') {
        bookedData.push({ date: selectedDateStr, timeSlot: selectedHour, serviceType: selectedService });

        if (modalSummaryDetails) {
          modalSummaryDetails.innerHTML = `
            <div><strong>Termin:</strong> ${dateDisplay}, godz. ${selectedHour}</div>
            <div><strong>Usługa:</strong> ${selectedService}</div>
            <div><strong>Opiekun:</strong> ${firstName} ${lastName} (${clientEmail})</div>
            <div><strong>Pies:</strong> ${dogName} (${dogAge} lat, ${selectedGender})</div>
            <div><strong>Lokalizacja:</strong> ${locValue}</div>
          `;
        }

        // Pokaż sukces, ukryj formularz
        hideStep3();
        if (successSection) {
          successSection.classList.remove('s-step--hidden');
          successSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        spotkaniaForm.reset();
        selectedDateStr = '';
        selectedHour    = '';
        renderCalendar();

      } else if (data.status === 'conflict') {
        alert('⚠️ ' + (data.message || 'Ten termin właśnie zajął ktoś inny. Wybierz inny slot.'));
        fetchBookings();
      } else {
        alert('Błąd: ' + (data.message || 'Wystąpił problem. Spróbuj ponownie.'));
      }
    } catch (err) {
      console.error(err);
      alert('Wystąpił problem z połączeniem. Spróbuj ponownie za chwilę.');
    } finally {
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Potwierdź rezerwację';
    }
  });
}

// ── Zamknij sukces / wróć ────────────────────────────────────

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    if (successSection) successSection.classList.add('s-step--hidden');
    document.getElementById('step1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ── Nawigacja tygodniami ─────────────────────────────────────

if (prevWeekBtn) {
  prevWeekBtn.addEventListener('click', () => {
    const todayMon = getMonday(new Date());
    if (currentMonday > todayMon) {
      const prev = new Date(currentMonday);
      prev.setDate(prev.getDate() - 7);
      currentMonday = getMonday(prev);
      selectedMobileDayIndex = getInitialMobileDayIndex();
      renderCalendar();
    }
  });
}
if (nextWeekBtn) {
  nextWeekBtn.addEventListener('click', () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    currentMonday = getMonday(next);
    selectedMobileDayIndex = 0;
    renderCalendar();
  });
}
if (todayJumpBtn) {
  todayJumpBtn.addEventListener('click', () => {
    currentMonday = getMonday(new Date());
    selectedMobileDayIndex = getInitialMobileDayIndex();
    renderCalendar();
  });
}

// ── Nawigacja dniami (mobile) ────────────────────────────────

if (mobilePrevDayBtn) {
  mobilePrevDayBtn.addEventListener('click', () => {
    if (selectedMobileDayIndex > 0) {
      selectedMobileDayIndex--;
      updateMobileView();
    } else {
      const todayMon = getMonday(new Date());
      if (currentMonday > todayMon) {
        const prev = new Date(currentMonday);
        prev.setDate(prev.getDate() - 7);
        currentMonday = getMonday(prev);
        selectedMobileDayIndex = 6;
        renderCalendar();
      }
    }
  });
}
if (mobileNextDayBtn) {
  mobileNextDayBtn.addEventListener('click', () => {
    if (selectedMobileDayIndex < 6) {
      selectedMobileDayIndex++;
      updateMobileView();
    } else {
      const next = new Date(currentMonday);
      next.setDate(next.getDate() + 7);
      currentMonday = getMonday(next);
      selectedMobileDayIndex = 0;
      renderCalendar();
    }
  });
}

// ── Start ────────────────────────────────────────────────────
fetchBookings();
