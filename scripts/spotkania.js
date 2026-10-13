/* ==========================================================================
   PsiApsi — spotkania.js
   Dynamiczne usługi, grafik i lokalizacje sterowane z Google Sheets
   ========================================================================== */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3JNKKwOicbrz1LZm92jrqPS47xdXWRbJE8lOv8xDdkOOPQXRrvXi1_Y6zeNopKOAtKA/exec';

const dayNames      = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];
const shortDayNames = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];

// Domyślne wartości zapasowe (nadpisywane danymi z Arkusza Google)
let availableServices = [
  {
    id: "1-1",
    name: "Spacer 1-1",
    icon: "🦮",
    desc: "Indywidualny, 1 pies",
    maxDogs: 1,
    is1on1: true,
    locations: ["Warszawa Wawer (trasy leśne MPK)"]
  },
  {
    id: "grupowy",
    name: "Spacer grupowy",
    icon: "🐕‍🦺",
    desc: "Do 3 psów, socjalizacja",
    maxDogs: 3,
    is1on1: false,
    locations: ["Warszawa Wawer (trasy leśne MPK)"]
  },
  {
    id: "konsultacja",
    name: "Konsultacja",
    icon: "🎓",
    desc: "Behawioralna, diagnoza",
    maxDogs: 1,
    is1on1: true,
    locations: ["Warszawa Wawer (trasy leśne MPK)", "Dojazd do klienta"]
  }
];

let scheduleConfig = {
  defaultHours: ['18:00', '19:00', '20:00'],
  days: {}
};

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
const serviceRowContainer= document.getElementById('serviceRowContainer');
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

// Zwraca godziny dostępne dla konkretnego dnia tygodnia lub konkretnej daty
function getHoursForDay(dayDate, dayIndex) {
  const dateISO = formatDateISO(dayDate);
  const dayNameLower = dayNames[dayIndex].toLowerCase();

  // Sprawdzamy czy w grafiku jest wpis na konkretną datę (np. urlop lub wyjątek)
  if (scheduleConfig.days && scheduleConfig.days[dateISO] !== undefined) {
    return scheduleConfig.days[dateISO];
  }

  // Sprawdzamy czy jest wpis dla danego dnia tygodnia (np. sobota, niedziela)
  if (scheduleConfig.days && scheduleConfig.days[dayNameLower] !== undefined) {
    return scheduleConfig.days[dayNameLower];
  }

  // W przeciwnym razie domyślne godziny
  return scheduleConfig.defaultHours || ['18:00', '19:00', '20:00'];
}

// Próba odczytu zapamiętanych usług i grafiku z pamięci podręcznej (błyskawiczne ładowanie bez migotania)
try {
  const cachedServices = localStorage.getItem('psiapsi_services_cache');
  if (cachedServices) availableServices = JSON.parse(cachedServices);
  const cachedSchedule = localStorage.getItem('psiapsi_schedule_cache');
  if (cachedSchedule) scheduleConfig = JSON.parse(cachedSchedule);
} catch (e) {
  // Ignoruj błędy localStorage
}

// ── Pobieranie danych z Google Apps Script ───────────────────

async function fetchBookings() {
  if (studioGrid && bookedData.length === 0) {
    studioGrid.innerHTML = '<div style="grid-column:1/-1;padding:3rem 1rem;text-align:center;color:#9CA3AF;font-size:.9rem;">🐾 Ładowanie aktualnego grafiku...</div>';
  }
  try {
    const res  = await fetch(APPS_SCRIPT_URL);
    const json = await res.json();

    if (json.status === 'success') {
      // 1. Rezerwacje
      if (Array.isArray(json.bookedSlots)) {
        bookedData = json.bookedSlots.map(b => ({
          date:        normalizeDate(b.date),
          timeSlot:    normalizeTime(b.timeSlot),
          serviceType: String(b.serviceType || '').trim()
        }));
      }

      // 2. Usługi (jeśli skonfigurowane w arkuszu)
      if (Array.isArray(json.services) && json.services.length > 0) {
        availableServices = json.services;
        try {
          localStorage.setItem('psiapsi_services_cache', JSON.stringify(availableServices));
        } catch (e) {}

        const exists = availableServices.some(s => s.name === selectedService);
        if (!exists) {
          selectedService = availableServices[0].name;
        }
      }

      // 3. Grafik (jeśli skonfigurowany w arkuszu)
      if (json.schedule && typeof json.schedule === 'object') {
        scheduleConfig = json.schedule;
        try {
          localStorage.setItem('psiapsi_schedule_cache', JSON.stringify(scheduleConfig));
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('Błąd pobierania danych z Arkusza:', err);
  }

  renderServices();
  renderCalendar();
  updateLocationOptions();
}

// ── Dynamiczne renderowanie usług (Krok 1) ───────────────────

function renderServices() {
  if (!serviceRowContainer) return;
  serviceRowContainer.innerHTML = '';

  availableServices.forEach(srv => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 's-service-btn' + (srv.name === selectedService ? ' active' : '');
    btn.dataset.service = srv.name;

    btn.innerHTML = `
      <span class="s-service-icon">${srv.icon || '🐾'}</span>
      <span class="s-service-name">${srv.name}</span>
      <span class="s-service-desc">${srv.desc || ''}</span>
    `;

    btn.addEventListener('click', () => {
      selectedService = srv.name;
      document.querySelectorAll('.s-service-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (serviceTypeHidden) serviceTypeHidden.value = selectedService;
      
      updateLocationOptions();

      // Odśwież podsumowanie jeśli slot był wybrany
      if (selectedDateStr && selectedSummaryText) {
        const d = selectedDayDate || new Date(selectedDateStr);
        const dayLabel = dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1];
        selectedSummaryText.textContent = `${dayLabel}, ${formatDatePL(d)} · godz. ${selectedHour} · ${selectedService}`;
      }
    });

    serviceRowContainer.appendChild(btn);
  });

  if (serviceTypeHidden) serviceTypeHidden.value = selectedService;
}

// ── Aktualizacja listy lokalizacji dla wybranej usługi ────────

function updateLocationOptions() {
  if (!locationSelect) return;

  const currentServiceObj = availableServices.find(s => s.name === selectedService);
  const locList = (currentServiceObj && currentServiceObj.locations && currentServiceObj.locations.length > 0)
    ? currentServiceObj.locations
    : ["Warszawa Wawer (trasy leśne MPK)"];

  locationSelect.innerHTML = '';

  locList.forEach((loc, idx) => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    if (idx === 0) opt.selected = true;
    locationSelect.appendChild(opt);
  });

  // Dodajemy opcję "Inna lokalizacja..."
  const otherOpt = document.createElement('option');
  otherOpt.value = 'Inna';
  otherOpt.textContent = 'Inna lokalizacja (wpisz poniżej)…';
  locationSelect.appendChild(otherOpt);

  if (otherLocationGroup) {
    otherLocationGroup.classList.add('s-field--hidden');
  }
  if (otherLocationInput) {
    otherLocationInput.required = false;
    otherLocationInput.value = '';
  }
}

// ── Renderowanie kalendarza (Krok 2) ──────────────────────────

function renderCalendar() {
  if (!studioGrid) return;

  const sunday = new Date(currentMonday);
  sunday.setDate(sunday.getDate() + 6);

  if (weekRangeLabel) {
    weekRangeLabel.textContent = `${formatDatePL(currentMonday)} – ${formatDatePL(sunday)} ${sunday.getFullYear()}`;
  }

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

    const hdr = document.createElement('div');
    hdr.className = 's-day-col-header';
    hdr.innerHTML = `
      <span class="s-day-col-name">${shortDayNames[i]}</span>
      <span class="s-day-col-num">${dayDate.getDate()}</span>
    `;
    col.appendChild(hdr);

    const hoursForThisDay = getHoursForDay(dayDate, i);

    if (hoursForThisDay.length === 0) {
      const offLabel = document.createElement('div');
      offLabel.style.cssText = 'padding:1rem .3rem;font-size:.75rem;color:#9CA3AF;text-align:center;';
      offLabel.textContent = 'Brak terminów';
      col.appendChild(offLabel);
    } else {
      hoursForThisDay.forEach(hour => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 's-slot-btn';

        const inPast    = isSlotInPast(dayDate, hour);
        const matches   = bookedData.filter(b => b.date === dateStr && b.timeSlot === hour);
        
        // Sprawdzamy czy którykolwiek zapisany slot to zajęcia indywidualne
        const has1on1 = matches.some(m => {
          const s = (m.serviceType || '').toLowerCase();
          const sObj = availableServices.find(x => x.name.toLowerCase() === s);
          if (sObj) return sObj.is1on1;
          return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja');
        });

        const activeServiceObj = availableServices.find(s => s.name === selectedService);
        const currentMaxDogs = activeServiceObj ? activeServiceObj.maxDogs : 3;

        const groupCount = matches.length;

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
        } else if (groupCount >= currentMaxDogs) {
          isFull = true;
          btn.classList.add('is-full');
          statusText = 'Brak miejsc';
          btn.disabled = true;
        } else if (groupCount > 0) {
          btn.classList.add('is-partial');
          statusText = `Zapisanych ${groupCount}/${currentMaxDogs}`;
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
    }

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

  if (bookingDateInput)  bookingDateInput.value  = dateStr;
  if (timeSlotHidden)    timeSlotHidden.value    = hour;
  if (serviceTypeHidden) serviceTypeHidden.value = selectedService;

  // Jeśli ktoś dołącza do grupy
  if (groupCount > 0) {
    const groupService = availableServices.find(s => !s.is1on1) || availableServices[0];
    if (groupService) {
      selectedService = groupService.name;
      if (serviceTypeHidden) serviceTypeHidden.value = groupService.name;
      document.querySelectorAll('.s-service-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.service === groupService.name);
      });
      updateLocationOptions();
    }
  }

  if (selectedSummaryText) {
    const dayLabel = dayNames[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];
    selectedSummaryText.textContent = `${dayLabel}, ${formatDatePL(dayDate)} · godz. ${hour} · ${selectedService}`;
  }

  showStep3();
  renderCalendar();

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

// ── Pasek dni (mobile & strip) ──────────────────────────────

function renderDaysStrip() {
  if (!mobileDaysStrip) return;
  mobileDaysStrip.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const dayDate   = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr   = formatDateISO(dayDate);
    const todayFlag = isToday(dayDate);

    const dayHours = getHoursForDay(dayDate, i);
    let hasAvailable = false, hasPartial = false;

    dayHours.forEach(hour => {
      const inPast  = isSlotInPast(dayDate, hour);
      const matches = bookedData.filter(b => b.date === dateStr && b.timeSlot === hour);
      const has1on1 = matches.some(m => {
        const s = (m.serviceType || '').toLowerCase();
        const sObj = availableServices.find(x => x.name.toLowerCase() === s);
        return sObj ? sObj.is1on1 : (s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacja'));
      });
      const groupCount = matches.length;
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
  if (mobileDaysStrip) {
    mobileDaysStrip.querySelectorAll('.s-day-pill').forEach((p, idx) => {
      p.classList.toggle('active', idx === selectedMobileDayIndex);
    });
  }
  if (studioGrid) {
    studioGrid.querySelectorAll('.s-day-col').forEach((col, idx) => {
      col.classList.toggle('is-mobile-active', idx === selectedMobileDayIndex);
    });
  }
  if (mobileDayBannerTitle) {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + selectedMobileDayIndex);
    mobileDayBannerTitle.textContent = `${dayNames[selectedMobileDayIndex]}, ${formatDatePL(d)}`;
  }
}

// ── Płeć psa ────────────────────────────────────────────────

document.querySelectorAll('.s-gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.s-gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGender = btn.dataset.gender;
  });
});

// ── Obsługa wyboru lokalizacji ──────────────────────────────

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

    const fd          = new FormData(spotkaniaForm);
    const firstName   = fd.get('firstName');
    const lastName    = fd.get('lastName');
    const clientEmail = fd.get('clientEmail');
    const dogName     = fd.get('dogName');
    const dogAge      = fd.get('dogAge');
    const locValue    = fd.get('location') === 'Inna' ? fd.get('otherLocation') : fd.get('location');

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

// ── Zamknij sukces / powrót ─────────────────────────────────

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

// ── Inicjalizacja ───────────────────────────────────────────
fetchBookings();
