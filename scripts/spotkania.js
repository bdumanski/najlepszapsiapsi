/* ==========================================================================
   PsiApsi — spotkania.js
   Dynamiczne usługi, grafik i lokalizacje sterowane z Google Sheets
   ========================================================================== */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3JNKKwOicbrz1LZm92jrqPS47xdXWRbJE8lOv8xDdkOOPQXRrvXi1_Y6zeNopKOAtKA/exec';

const dayNames      = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];
const shortDayNames = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];

// Miejsce spotkania — używane w domyślnej ofercie zapasowej
const LOC_TRAIL  = 'Warszawa Wawer — trasy leśne';
const LOC_HALL   = 'Salka treningowa — Warszawa Wawer';
const LOC_CLIENT = 'Dojazd do klienta';

// Domyślna oferta szkoły (nadpisywana danymi z zakładki "Uslugi").
// To psia szkoła: opiekun ćwiczy razem ze swoim psem.
let availableServices = [
  {
    id: "spacer-socjalizacyjny",
    name: "Spacer socjalizacyjny",
    icon: "🐕‍🦺",
    desc: "Grupa do 3 psów, leśna trasa",
    maxDogs: 3,
    is1on1: false,
    locations: [LOC_TRAIL]
  },
  {
    id: "posluszenstwo",
    name: "Grupowe zajęcia posłuszeństwa",
    icon: "🎯",
    desc: "Salka, grupa do 4 psów",
    maxDogs: 4,
    is1on1: false,
    locations: [LOC_HALL]
  },
  {
    id: "szczeniaki",
    name: "Socjalizacja szczeniąt",
    icon: "🐶",
    desc: "Salka, grupa do 4 szczeniąt",
    maxDogs: 4,
    is1on1: false,
    locations: [LOC_HALL]
  },
  {
    id: "indywidualny",
    name: "Trening indywidualny 1-1",
    icon: "🎓",
    desc: "Salka, Ty i Twój pies",
    maxDogs: 1,
    is1on1: true,
    locations: [LOC_HALL]
  },
  {
    id: "lekliwe",
    name: "Psy lękliwe i reaktywne",
    icon: "🧘",
    desc: "Mała grupa do 2 psów",
    maxDogs: 2,
    is1on1: false,
    locations: [LOC_HALL, LOC_TRAIL]
  },
  {
    id: "konsultacja",
    name: "Konsultacja behawioralna",
    icon: "📋",
    desc: "Diagnoza i plan pracy",
    maxDogs: 1,
    is1on1: true,
    locations: [LOC_CLIENT]
  }
];

let scheduleConfig = {
  defaultHours: ['18:00', '19:00', '20:00'],
  days: {},
  serviceHours: {}
};

// ── Stan aplikacji ──────────────────────────────────────────
let currentMonday        = getMonday(new Date());
let bookedData           = [];
let selectedService      = 'Spacer socjalizacyjny';
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
const nextFreeBtn        = document.getElementById('nextFreeBtn');
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
const submitBtn          = document.getElementById('submitBtn');
const submitBtnText      = document.getElementById('submitBtnText');
const selectedSummaryText = document.getElementById('selectedSummaryText');
const changeSelectionBtn = document.getElementById('changeSelectionBtn');
const modalSummaryDetails = document.getElementById('modalSummaryDetails');
const closeModalBtn      = document.getElementById('closeModalBtn');
const priceGrid          = document.getElementById('priceGrid');
const testimonialGrid    = document.getElementById('testimonialGrid');
const opinieSection      = document.getElementById('opinie');
const menuToggle         = document.getElementById('menuToggle');
const siteHeader         = document.querySelector('.s-header');
const addToCalendarBtn   = document.getElementById('addToCalendarBtn');
const anotherBookingBtn  = document.getElementById('anotherBookingBtn');
const clientPhoneInput   = document.getElementById('clientPhone');
const dogSociabilityInput= document.getElementById('dogSociability');
const dogNotesInput      = document.getElementById('dogNotes');
const healthConfirmInput = document.getElementById('healthConfirm');
const rodoConsentInput   = document.getElementById('rodoConsent');

// Ostatnia przyjęta rezerwacja (potrzebna do wygenerowania pliku .ics)
let lastBooking = null;

// Zabezpiecza dane pochodzące z arkusza i z formularza przed wstrzyknięciem HTML
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// Polska nazwa dnia tygodnia (getDay(): 0 = niedziela)
function getPolishDayName(d) {
  return dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1];
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

// Wpis grafiku obowiązujący danego dnia: data → dzień tygodnia → godziny domyślne.
// `key` to klucz, pod którym ten wpis występuje w zakładce Grafik.
function getScheduleEntry(dateISO) {
  const dayIndex = (new Date(dateISO + 'T00:00:00').getDay() + 6) % 7;
  const dayNameLower = dayNames[dayIndex].toLowerCase();

  // Sprawdzamy czy w grafiku jest wpis na konkretną datę (np. urlop lub wyjątek)
  if (scheduleConfig.days && scheduleConfig.days[dateISO] !== undefined) {
    return { key: dateISO, hours: scheduleConfig.days[dateISO] };
  }

  // Sprawdzamy czy jest wpis dla danego dnia tygodnia (np. sobota, niedziela)
  if (scheduleConfig.days && scheduleConfig.days[dayNameLower] !== undefined) {
    return { key: dayNameLower, hours: scheduleConfig.days[dayNameLower] };
  }

  // W przeciwnym razie domyślne godziny
  return { key: 'default', hours: scheduleConfig.defaultHours || ['18:00', '19:00', '20:00'] };
}

// Czy o tej godzinie można zapisać się na te zajęcia? Trzecia kolumna zakładki
// Grafik pozwala zawęzić godzinę do wybranych zajęć (np. tylko salka).
function isServiceAvailableAt(dateISO, hour, serviceName) {
  const entry = getScheduleEntry(dateISO);
  if (entry.hours.indexOf(hour) === -1) return false;

  const restrictions = (scheduleConfig.serviceHours && scheduleConfig.serviceHours[entry.key]) || null;
  const allowed = restrictions ? restrictions[hour] : null;
  if (!allowed || !allowed.length) return true;

  const target = String(serviceName || '').trim().toLowerCase();
  return allowed.some(name => String(name).trim().toLowerCase() === target);
}

// Zwraca godziny dostępne dla wybranych zajęć w danym dniu.
function getHoursForDay(dayDate) {
  const dateISO = formatDateISO(dayDate);
  return getScheduleEntry(dateISO).hours
    .filter(hour => isServiceAvailableAt(dateISO, hour, selectedService));
}

// Nazwy zajęć, które mają tego dnia jakiekolwiek terminy — także inne niż wybrane.
// Dzięki temu dzień z samą salką nie wygląda dla klienta jak dzień wolny.
function getServicesWithSlotsOn(dateISO) {
  const entry = getScheduleEntry(dateISO);
  if (!entry.hours.length) return [];

  return availableServices
    .filter(srv => entry.hours.some(hour => isServiceAvailableAt(dateISO, hour, srv.name)))
    .map(srv => srv.name);
}

// Godziny, których nie widzi klient przy wybranych zajęciach — z nazwami zajęć,
// które się wtedy odbywają. `visibleHours` to godziny już pokazane w kolumnie dnia.
function getOtherServiceHours(dateISO, visibleHours) {
  const entry = getScheduleEntry(dateISO);
  const visible = visibleHours || [];

  return entry.hours
    .filter(hour => visible.indexOf(hour) === -1)
    .map(hour => ({
      hour: hour,
      services: availableServices
        .filter(srv => isServiceAvailableAt(dateISO, hour, srv.name))
        .map(srv => srv.name)
    }))
    .filter(slot => slot.services.length > 0);
}

// Łączy godziny z tym samym zestawem zajęć: 18:00, 19:00, 20:00 → „18:00–20:00”.
function groupOtherHours(otherHours) {
  const groups = [];
  const byKey = {};

  otherHours.forEach(slot => {
    const key = slot.services.join('|');
    if (!byKey[key]) {
      byKey[key] = { services: slot.services, hours: [] };
      groups.push(byKey[key]);
    }
    byKey[key].hours.push(slot.hour);
  });

  groups.forEach(group => {
    group.hours.sort(compareHours);
    group.label = group.hours.length > 1 && areHoursConsecutive(group.hours)
      ? group.hours[0] + '–' + group.hours[group.hours.length - 1]
      : group.hours.join(', ');
  });

  return groups;
}

function areHoursConsecutive(hours) {
  for (let i = 1; i < hours.length; i++) {
    if (timeToMinutes(hours[i]) - timeToMinutes(hours[i - 1]) !== 60) return false;
  }
  return true;
}

// Najczęstszy zestaw zajęć w widocznym tygodniu. Dni, które się od niego różnią,
// to wyjątki (np. jednorazowa salka) — tylko tam warto tłumaczyć „tylko…” ,
// inaczej cała siatka zamienia się w ścianę podpowiedzi.
function getBackgroundServiceSignature(mondayDate) {
  const counts = {};
  let best = '';
  let bestCount = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(mondayDate);
    dayDate.setDate(dayDate.getDate() + i);
    const signature = getServicesWithSlotsOn(formatDateISO(dayDate)).join('|');
    counts[signature] = (counts[signature] || 0) + 1;
    if (counts[signature] > bestCount) {
      bestCount = counts[signature];
      best = signature;
    }
  }

  return best;
}

// Próba odczytu zapamiętanych usług i grafiku z pamięci podręcznej (błyskawiczne ładowanie bez migotania)
try {
  const cachedServices = localStorage.getItem('psiapsi_services_cache');
  if (cachedServices) availableServices = JSON.parse(cachedServices);
  const cachedSchedule = localStorage.getItem('psiapsi_schedule_cache');
  if (cachedSchedule) scheduleConfig = JSON.parse(cachedSchedule);
  const cachedBookings = localStorage.getItem('psiapsi_bookings_cache');
  if (cachedBookings) {
    const parsedBookings = JSON.parse(cachedBookings);
    if (Array.isArray(parsedBookings)) bookedData = parsedBookings;
  }
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
          serviceType: String(b.serviceType || '').trim(),
          location:    String(b.location || '').trim()
        }));
        try {
          localStorage.setItem('psiapsi_bookings_cache', JSON.stringify(bookedData));
        } catch (e) {}
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

      // 4. Opinie opiekunów (sekcja pojawia się tylko, gdy są dane)
      renderTestimonials(json.testimonials);
    }
  } catch (err) {
    console.error('Błąd pobierania danych z Arkusza:', err);
  }

  renderServices();
  renderPricing();
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
    btn.setAttribute('aria-pressed', srv.name === selectedService ? 'true' : 'false');

    const metaParts = [];
    if (srv.duration) metaParts.push(srv.duration);
    if (srv.price)    metaParts.push(srv.price);

    btn.innerHTML = `
      <span class="s-service-icon">${escapeHtml(srv.icon || '🐾')}</span>
      <span class="s-service-text">
        <span class="s-service-name">${escapeHtml(srv.name)}</span>
        <span class="s-service-desc">${escapeHtml(srv.desc || '')}</span>
        ${metaParts.length ? `<span class="s-service-meta">${escapeHtml(metaParts.join(' · '))}</span>` : ''}
      </span>
    `;

    btn.addEventListener('click', () => {
      const changed = selectedService !== srv.name;
      selectedService = srv.name;
      if (changed) track('usluga_wybrana', srv.name);
      document.querySelectorAll('.s-service-btn').forEach(b => {
        const isActive = b.dataset.service === selectedService;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      if (serviceTypeHidden) serviceTypeHidden.value = selectedService;
      
      // Jeśli wybrany wcześniej slot nie należy do tych zajęć, odznacz go
      if (selectedDateStr && selectedHour && !isServiceAvailableAt(selectedDateStr, selectedHour, srv.name)) {
        selectedDateStr = '';
        selectedHour = '';
        hideStep3();
      }

      // Jeśli wybrany wcześniej slot ma już zapisaną inną usługę, odznacz slot
      if (selectedDateStr && selectedHour) {
        const matches = bookedData.filter(b => b.date === selectedDateStr && b.timeSlot === selectedHour);
        if (matches.length > 0) {
          const bookedService = matches[0].serviceType || '';
          if (bookedService.toLowerCase() !== srv.name.toLowerCase()) {
            selectedDateStr = '';
            selectedHour = '';
            hideStep3();
          }
        }
      }

      updateLocationOptions();
      renderCalendar();

      // Odśwież podsumowanie jeśli slot był wybrany
      if (selectedDateStr && selectedSummaryText) {
        const d = selectedDayDate || new Date(selectedDateStr);
        selectedSummaryText.textContent = `${getPolishDayName(d)}, ${formatDatePL(d)} · godz. ${selectedHour} · ${selectedService}`;
      }
    });

    serviceRowContainer.appendChild(btn);
  });

  if (serviceTypeHidden) serviceTypeHidden.value = selectedService;
}

// ── Cennik (sekcja #cennik) ─────────────────────────────────

function renderPricing() {
  if (!priceGrid) return;
  priceGrid.innerHTML = '';

  availableServices.forEach(srv => {
    const features = Array.isArray(srv.features) ? srv.features : [];
    const price    = String(srv.price || '').trim();
    const duration = String(srv.duration || '').trim();

    const card = document.createElement('article');
    card.className = 's-price-card';
    card.innerHTML = `
      <div class="s-price-head">
        <span class="s-price-icon">${escapeHtml(srv.icon || '🐾')}</span>
        <h3 class="s-price-name">${escapeHtml(srv.name)}</h3>
      </div>
      <p class="s-price-desc">${escapeHtml(srv.desc || '')}</p>
      <div class="s-price-value">
        <span class="s-price-amount${price ? '' : ' s-price-amount--ask'}">${escapeHtml(price || 'Wycena po zapytaniu')}</span>
        ${duration ? `<span class="s-price-duration">${escapeHtml(duration)}</span>` : ''}
      </div>
      ${features.length ? `<ul class="s-price-features">${features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
      <button type="button" class="s-price-cta">Wybierz termin</button>
    `;

    card.querySelector('.s-price-cta').addEventListener('click', () => {
      const tile = Array.from(document.querySelectorAll('.s-service-btn'))
        .find(b => b.dataset.service === srv.name);
      if (tile) tile.click();
      document.getElementById('step1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    priceGrid.appendChild(card);
  });
}

// ── Opinie opiekunów (sekcja #opinie) ────────────────────────

function renderTestimonials(list) {
  if (!testimonialGrid || !opinieSection) return;

  const items = Array.isArray(list) ? list : [];
  if (items.length === 0) {
    // Bez danych w zakładce "Opinie" sekcja w ogóle się nie pojawia
    opinieSection.classList.add('s-section--hidden');
    testimonialGrid.innerHTML = '';
    return;
  }

  testimonialGrid.innerHTML = items.map(t => {
    const rating = Math.min(5, Math.max(1, parseInt(t.rating, 10) || 5));
    const stars  = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    return `
      <figure class="s-testimonial">
        <div class="s-stars" role="img" aria-label="Ocena ${rating} z 5">${stars}</div>
        <blockquote class="s-testimonial-text">${escapeHtml(t.text)}</blockquote>
        <figcaption class="s-testimonial-author">
          ${escapeHtml(t.author)}${t.dog ? `<span class="s-testimonial-dog"> · ${escapeHtml(t.dog)}</span>` : ''}
        </figcaption>
      </figure>
    `;
  }).join('');

  opinieSection.classList.remove('s-section--hidden');
}

// ── Dodawanie terminu do kalendarza (plik .ics) ──────────────

function buildIcs(booking) {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hour, minute]    = booking.hour.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const escIcs = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\r?\n/g, '\\n');

  const start = new Date(year, month - 1, day, hour, minute, 0);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Psiapsi//Rezerwacja//PL',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:psiapsi-${stamp(start)}@psiapsi.pl`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escIcs('Psiapsi: ' + booking.service)}`,
    `LOCATION:${escIcs(booking.location)}`,
    `DESCRIPTION:${escIcs(booking.description)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function downloadIcs() {
  if (!lastBooking) return;
  const href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(buildIcs(lastBooking));
  const link = document.createElement('a');
  link.href = href;
  link.download = `psiapsi-${lastBooking.date}-${lastBooking.hour.replace(':', '')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Analityka pierwszej strony (bez cookies) ─────────────────

function track(event, detail = '') {
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'track', event, detail: String(detail).slice(0, 200) }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {
    // Analityka nigdy nie może przerwać rezerwacji
  }
}

// ── Aktualizacja listy lokalizacji dla wybranej usługi ────────

function updateLocationOptions(fixedLocation = null) {
  if (!locationSelect) return;

  const currentServiceObj = availableServices.find(s => s.name === selectedService);
  const locList = (currentServiceObj && currentServiceObj.locations && currentServiceObj.locations.length > 0)
    ? currentServiceObj.locations
    : ["Warszawa Wawer (trasy leśne MPK)"];

  locationSelect.innerHTML = '';

  // Jeśli w danym slocie grupowym jest już ustalona lokalizacja przez pierwszą osobę
  if (fixedLocation) {
    const opt = document.createElement('option');
    opt.value = fixedLocation;
    opt.textContent = fixedLocation;
    opt.selected = true;
    locationSelect.appendChild(opt);

    locationSelect.disabled = true;
    return;
  }

  // W przeciwnym razie odblokuj pole wyboru
  locationSelect.disabled = false;

  locList.forEach((loc, idx) => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    if (idx === 0) opt.selected = true;
    locationSelect.appendChild(opt);
  });
}

// ── Wspólna logika slotów ────────────────────────────────────
// Jedno źródło prawdy dla siatki tygodnia i paska dni — wcześniej
// oba miejsca liczyły dostępność osobno i wyniki się rozjeżdżały.

function timeToMinutes(hour) {
  const [h, m] = String(hour).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function compareHours(a, b) {
  return timeToMinutes(a) - timeToMinutes(b);
}

function addMinutesToHour(hour, minutes) {
  const total = (timeToMinutes(hour) + minutes) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// „60 min”, „1,5 h”, „90” → liczba minut (albo null, gdy nie da się odczytać)
function parseDurationMinutes(text) {
  const raw = String(text || '').trim().toLowerCase();
  if (!raw) return null;

  const hours = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:h|godz)/);
  if (hours) return Math.round(parseFloat(hours[1].replace(',', '.')) * 60);

  const minutes = raw.match(/(\d+)\s*min/) || raw.match(/^\s*(\d+)\s*$/);
  if (minutes) return parseInt(minutes[1], 10);

  return null;
}

function getServiceByName(name) {
  if (!name) return null;
  const target = String(name).toLowerCase();
  return availableServices.find(s => s.name.toLowerCase() === target) || null;
}

// Zwraca pełny stan jednej godziny w danym dniu.
function getSlotState(dayDate, dateStr, hour, activeServiceObj) {
  const inPast     = isSlotInPast(dayDate, hour);
  const matches    = bookedData.filter(b => b.date === dateStr && b.timeSlot === hour);
  const groupCount = matches.length;

  let slotService  = '';
  let slotLocation = '';
  let slotMaxDogs  = 3;

  if (groupCount > 0) {
    slotService = matches[0].serviceType || '';

    const slotObj = getServiceByName(slotService);
    if (slotObj) {
      slotMaxDogs = slotObj.is1on1 ? 1 : (slotObj.maxDogs || 1);
    } else {
      const s = slotService.toLowerCase();
      slotMaxDogs = (s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacj')) ? 1 : 3;
    }

    const bookedWithLoc = matches.find(m => m.location);
    if (bookedWithLoc) slotLocation = bookedWithLoc.location;
  }

  const has1on1 = matches.some(m => {
    const obj = getServiceByName(m.serviceType);
    if (obj) return obj.is1on1;
    const s = (m.serviceType || '').toLowerCase();
    return s.includes('1-1') || s.includes('indywidualny') || s.includes('konsultacj');
  });

  const sameService = slotService
    ? (!activeServiceObj || activeServiceObj.name.toLowerCase() === slotService.toLowerCase())
    : true;

  let state, label;
  if (inPast) {
    state = 'past';
    label = 'termin minął';
  } else if (has1on1) {
    state = 'full';
    label = 'zajęty — zajęcia indywidualne';
  } else if (groupCount >= slotMaxDogs) {
    state = 'full';
    label = 'brak wolnych miejsc';
  } else if (groupCount > 0 && sameService) {
    state = 'partial';
    label = `zajęte ${groupCount} z ${slotMaxDogs} miejsc — można dołączyć`;
  } else if (groupCount > 0) {
    state = 'full';
    label = `zajęty — trwają inne zajęcia (${slotService})`;
  } else {
    state = 'free';
    label = 'wolny termin';
  }

  // Godzina zakończenia liczona z „Czas trwania” wybranych zajęć
  const durationSource = groupCount > 0 ? (getServiceByName(slotService) || activeServiceObj) : activeServiceObj;
  const durationMin    = durationSource ? parseDurationMinutes(durationSource.duration) : null;

  return {
    state,
    label,
    groupCount,
    maxDogs: slotMaxDogs,
    service: groupCount > 0 ? slotService : (activeServiceObj ? activeServiceObj.name : ''),
    location: slotLocation,
    endTime: (state !== 'past' && durationMin) ? addMinutesToHour(hour, durationMin) : ''
  };
}

// ── Renderowanie kalendarza (Krok 2) ──────────────────────────

// Buduje pojedynczy przycisk terminu
function buildSlot(day, hour, rowIndex, activeServiceObj) {
  const info       = getSlotState(day.date, day.dateStr, hour, activeServiceObj);
  const isSelected = (day.dateStr === selectedDateStr && hour === selectedHour);
  const blocked    = info.state === 'past' || info.state === 'full';

  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.className = 's-slot-btn is-' + info.state + (isSelected ? ' is-selected' : '');
  btn.dataset.row  = String(rowIndex);
  btn.dataset.col  = String(day.index);
  btn.dataset.hour = hour;
  btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

  // Drugi wiersz tylko wtedy, gdy niesie informację: licznik miejsc albo godzina końca.
  let sub = '';
  if (info.state === 'partial') {
    sub = `<span class="s-slot-count">${info.groupCount}/${info.maxDogs}</span>`;
  } else if (info.endTime) {
    sub = `<span class="s-slot-end">do ${escapeHtml(info.endTime)}</span>`;
  }

  btn.innerHTML = `
    <span class="s-slot-time">${escapeHtml(hour)}</span>
    ${sub}
  `;

  const dayLabel  = `${getPolishDayName(day.date)} ${formatDatePL(day.date)}`;
  const timeLabel = info.endTime ? `${hour}–${info.endTime}` : hour;
  btn.setAttribute('aria-label', escapeHtml(`${dayLabel}, godz. ${timeLabel} — ${info.label}`));

  if (blocked) {
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
  } else {
    btn.addEventListener('click', () => selectSlot(day.date, day.index, hour, info));
  }

  return btn;
}

function renderCalendar() {
  if (!studioGrid) return;

  const sunday = new Date(currentMonday);
  sunday.setDate(sunday.getDate() + 6);

  if (weekRangeLabel) {
    weekRangeLabel.textContent = `${formatDatePL(currentMonday)} – ${formatDatePL(sunday)} ${sunday.getFullYear()}`;
  }

  // Nie ma po co cofać się przed bieżący tydzień
  if (prevWeekBtn) prevWeekBtn.disabled = currentMonday <= getMonday(new Date());

  const activeServiceObj = getServiceByName(selectedService);

  const background = getBackgroundServiceSignature(currentMonday);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = formatDateISO(dayDate);
    const hours = getHoursForDay(dayDate, i).slice().sort(compareHours);
    const allServices = getServicesWithSlotsOn(dateStr);
    const isUnusual = allServices.join('|') !== background;

    days.push({
      index:   i,
      date:    dayDate,
      dateStr: dateStr,
      today:   isToday(dayDate),
      hours:   hours,
      allServices: allServices,
      isUnusual:   isUnusual,
      otherGroups: isUnusual ? groupOtherHours(getOtherServiceHours(dateStr, hours)) : []
    });
  }

  // Kolumny są zbite: dzień pokazuje tylko swoje godziny, bez pustych
  // wypełniaczy rozciągających siatkę w pionie. Gdy dni mają wspólny grafik
  // (najczęstszy przypadek), godziny i tak układają się w jednej linii.
  studioGrid.innerHTML = '';

  days.forEach(day => {
    const onlyOtherServices = day.hours.length === 0 && day.otherGroups.length > 0;

    const col = document.createElement('div');
    col.className = 's-day-col'
      + (day.today ? ' is-today' : '')
      + (day.index === selectedMobileDayIndex ? ' is-mobile-active' : '')
      + (day.hours.length === 0 ? (onlyOtherServices ? ' is-other' : ' is-off') : '');
    col.dataset.dayIndex = day.index;

    const hdr = document.createElement('div');
    hdr.className = 's-day-col-header';
    hdr.innerHTML = `
      <span class="s-day-col-name">${shortDayNames[day.index]}</span>
      <span class="s-day-col-num">${day.date.getDate()}</span>
    `;
    col.appendChild(hdr);

    if (onlyOtherServices) {
      col.appendChild(buildOtherHoursHint(day, 'tylko'));
    } else if (day.hours.length === 0) {
      // Dzień bez terminów — jedna kreska zamiast pustej kolumny
      const off = document.createElement('span');
      off.className = 's-slot-empty';
      off.setAttribute('aria-hidden', 'true');
      off.textContent = '—';
      col.appendChild(off);
    } else {
      day.hours.forEach((hour, rowIndex) => {
        col.appendChild(buildSlot(day, hour, rowIndex, activeServiceObj));
      });

      // Ten sam dzień może mieć też godziny na inne zajęcia (np. rano salka,
      // wieczorem spacery) — pokazujemy je pod slotami, zamiast je ukrywać.
      if (day.otherGroups.length) {
        col.appendChild(buildOtherHoursHint(day, 'także'));
      }
    }

    studioGrid.appendChild(col);
  });

  applyRovingTabindex();
  renderDaysStrip();
  updateMobileView();
}

// Terminy na inne zajęcia w tym samym dniu. „tylko” — gdy wybrane zajęcia nie mają
// wtedy nic, „także” — gdy mają, ale dzień zawiera też inne godziny.
// Kliknięcie nazwy przełącza zajęcia, więc klient od razu widzi te terminy w siatce.
function buildOtherHoursHint(day, labelText) {
  const wrap = document.createElement('div');
  wrap.className = 's-slot-hint' + (day.hours.length ? ' s-slot-hint--inline' : '');

  const label = document.createElement('span');
  label.className = 's-slot-hint-label';
  label.textContent = labelText;
  wrap.appendChild(label);

  day.otherGroups.forEach(group => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 's-slot-hint-btn';
    btn.textContent = group.label + ' · ' + group.services.join(', ');
    btn.setAttribute('aria-label', `Pokaż terminy: ${group.services.join(', ')} o ${group.label}, ${getPolishDayName(day.date)} ${formatDatePL(day.date)}`);
    btn.addEventListener('click', () => {
      const tile = Array.from(document.querySelectorAll('.s-service-btn'))
        .find(b => b.dataset.service === group.services[0]);
      if (tile) tile.click();
    });
    wrap.appendChild(btn);
  });

  return wrap;
}

// Cała siatka to jeden przystanek klawisza Tab — dalej poruszamy się strzałkami.
function applyRovingTabindex(preferred) {
  if (!studioGrid) return;

  const slots = Array.from(studioGrid.querySelectorAll('.s-slot-btn:not(:disabled)'));
  if (slots.length === 0) return;

  const target = (preferred && slots.includes(preferred))
    ? preferred
    : (slots.find(s => s.classList.contains('is-selected')) || slots[0]);

  slots.forEach(s => { s.tabIndex = (s === target) ? 0 : -1; });
}

function findSlotInDirection(row, col, hour, dRow, dCol) {
  if (!studioGrid) return null;

  const slots = Array.from(studioGrid.querySelectorAll('.s-slot-btn:not(:disabled)'))
    .map(el => ({
      el,
      row: parseInt(el.dataset.row, 10),
      col: parseInt(el.dataset.col, 10),
      min: timeToMinutes(el.dataset.hour)
    }));

  // Pion: zostajemy w tej samej kolumnie (kolumny są zbite, więc kolejny
  // wiersz to po prostu późniejsza godzina tego samego dnia).
  if (dRow) {
    const inColumn = slots.filter(s => s.col === col && Math.sign(s.row - row) === Math.sign(dRow));
    const hit = inColumn
      .slice()
      .sort((a, b) => Math.abs(a.row - row) - Math.abs(b.row - row))[0];
    return hit ? hit.el : null;
  }

  // Poziom: najbliższa kolumna w danym kierunku. Dni mogą mieć różne
  // godziny, więc szukamy na tej samej godzinie, a gdy jej nie ma —
  // najbliższej godzinowo.
  const columns = slots
    .filter(s => Math.sign(s.col - col) === Math.sign(dCol))
    .sort((a, b) => Math.abs(a.col - col) - Math.abs(b.col - col));
  if (columns.length === 0) return null;

  const targetCol = columns[0].col;
  const inTarget = slots.filter(s => s.col === targetCol);

  const sameHour = inTarget.find(s => s.el.dataset.hour === hour);
  if (sameHour) return sameHour.el;

  const current = timeToMinutes(hour);
  const hit = inTarget
    .slice()
    .sort((a, b) => Math.abs(a.min - current) - Math.abs(b.min - current))[0];
  return hit ? hit.el : null;
}

if (studioGrid) {
  studioGrid.addEventListener('keydown', (e) => {
    const step = {
      ArrowLeft:  [0, -1],
      ArrowRight: [0, 1],
      ArrowUp:    [-1, 0],
      ArrowDown:  [1, 0]
    }[e.key];
    if (!step) return;

    const current = e.target.closest('.s-slot-btn');
    if (!current || current.disabled) return;

    e.preventDefault();

    const next = findSlotInDirection(
      parseInt(current.dataset.row, 10),
      parseInt(current.dataset.col, 10),
      current.dataset.hour,
      step[0],
      step[1]
    );

    if (next) {
      applyRovingTabindex(next);
      next.focus();
    }
  });
}

// ── Najbliższy wolny termin ─────────────────────────────────

function findNextAvailable(daysAhead = 60) {
  const activeServiceObj = getServiceByName(selectedService);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < daysAhead; offset++) {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + offset);

    const dayIndex = dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1;
    const dateStr  = formatDateISO(dayDate);
    const hours    = getHoursForDay(dayDate, dayIndex).slice().sort(compareHours);

    for (const hour of hours) {
      const info = getSlotState(dayDate, dateStr, hour, activeServiceObj);
      if (info.state === 'free') return { dayDate, dayIndex, dateStr, hour, info };
    }
  }

  return null;
}

if (nextFreeBtn) {
  nextFreeBtn.addEventListener('click', () => {
    const found = findNextAvailable();

    if (!found) {
      alert('Nie znalazłem wolnego terminu w najbliższych tygodniach. Napisz do mnie na kontakt@psiapsi.pl.');
      return;
    }

    currentMonday          = getMonday(found.dayDate);
    selectedMobileDayIndex = found.dayIndex;

    track('najblizszy_wolny', `${found.dateStr} ${found.hour} · ${selectedService}`);

    selectSlot(found.dayDate, found.dayIndex, found.hour, found.info);
  });
}

// ── Wybór slotu ─────────────────────────────────────────────

function selectSlot(dayDate, dayIndex, hour, info) {
  const dateStr = formatDateISO(dayDate);

  selectedDateStr        = dateStr;
  selectedHour           = hour;
  selectedDayDate        = dayDate;
  selectedMobileDayIndex = dayIndex;

  track('termin_wybrany', `${dateStr} ${hour} · ${selectedService}`);

  if (bookingDateInput) bookingDateInput.value = dateStr;
  if (timeSlotHidden)   timeSlotHidden.value   = hour;

  // Slot, w którym trwają już konkretne zajęcia grupowe: przełączamy
  // zaznaczoną usługę i blokujemy lokalizację na tej wybranej przez pierwszą osobę.
  if (info && info.groupCount > 0 && info.service) {
    const matchedService = getServiceByName(info.service);

    if (matchedService) {
      selectedService = matchedService.name;
      if (serviceTypeHidden) serviceTypeHidden.value = matchedService.name;

      document.querySelectorAll('.s-service-btn').forEach(btn => {
        const isActive = btn.dataset.service === matchedService.name;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    updateLocationOptions(info.location || null);
  } else {
    if (serviceTypeHidden) serviceTypeHidden.value = selectedService;
    updateLocationOptions(null);
  }

  if (selectedSummaryText) {
    const endLabel = (info && info.endTime) ? `–${info.endTime}` : '';
    selectedSummaryText.textContent =
      `${getPolishDayName(dayDate)}, ${formatDatePL(dayDate)} · godz. ${hour}${endLabel} · ${selectedService}`;
  }

  showStep3();
  renderCalendar();

  if (step3Section) {
    setTimeout(() => step3Section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
}

function showStep3() {
  if (!step3Section) return;
  step3Section.classList.remove('s-step--hidden');
  step3Section.removeAttribute('aria-hidden');
  step3Section.focus({ preventScroll: true });
}

function hideStep3() {
  if (step3Section) {
    step3Section.classList.add('s-step--hidden');
    step3Section.setAttribute('aria-hidden', 'true');
  }
}

// Czyści wybór terminu — także ukryte pola formularza i stan płci psa,
// żeby po „Zarezerwuj kolejny termin” nic nie zostało z poprzedniego zapisu.
function clearSelection() {
  selectedDateStr = '';
  selectedHour    = '';
  selectedDayDate = null;

  if (bookingDateInput) bookingDateInput.value = '';
  if (timeSlotHidden)   timeSlotHidden.value   = '';

  selectedGender = 'pies';
  document.querySelectorAll('.s-gender-btn').forEach(b => {
    const isActive = b.dataset.gender === 'pies';
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  hideStep3();
}

// ── Pasek dni (mobile) ──────────────────────────────────────

function renderDaysStrip() {
  if (!mobileDaysStrip) return;
  mobileDaysStrip.innerHTML = '';

  const activeServiceObj = getServiceByName(selectedService);
  const background = getBackgroundServiceSignature(currentMonday);

  for (let i = 0; i < 7; i++) {
    const dayDate   = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr   = formatDateISO(dayDate);
    const todayFlag = isToday(dayDate);

    // Ten sam stan slotu, co w siatce — kropka nie może mówić czegoś innego.
    let hasFree = false;
    let hasPartial = false;

    getHoursForDay(dayDate, i).forEach(hour => {
      const state = getSlotState(dayDate, dateStr, hour, activeServiceObj).state;
      if (state === 'free') hasFree = true;
      else if (state === 'partial') hasPartial = true;
    });

    // Dzień z terminami tylko na inne zajęcia nie jest „zajęty” — warto to pokazać,
    // ale wyłącznie wtedy, gdy ten dzień różni się od reszty tygodnia.
    const dayServices = (hasFree || hasPartial) ? [] : getServicesWithSlotsOn(dateStr);
    const otherServices = dayServices.join('|') !== background
      ? dayServices.filter(name => name !== selectedService)
      : [];

    const dotClass = hasFree ? 'is-free'
      : (hasPartial ? 'is-partial' : (otherServices.length ? 'is-other' : 'is-busy'));
    const summary  = hasFree ? 'są wolne terminy'
      : (hasPartial ? 'można jeszcze dołączyć'
        : (otherServices.length ? 'tylko ' + otherServices.join(', ') : 'brak wolnych terminów'));

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 's-day-pill'
      + (i === selectedMobileDayIndex ? ' active' : '')
      + (todayFlag ? ' is-today' : '');
    pill.innerHTML = `
      <span class="s-day-name">${shortDayNames[i]}</span>
      <span class="s-day-num">${dayDate.getDate()}</span>
      <span class="s-day-dot ${dotClass}"></span>
    `;
    pill.setAttribute('aria-pressed', i === selectedMobileDayIndex ? 'true' : 'false');
    pill.setAttribute('aria-label', `${dayNames[i]}, ${formatDatePL(dayDate)}${todayFlag ? ' (dzisiaj)' : ''} — ${summary}`);
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
      const isActive = idx === selectedMobileDayIndex;
      p.classList.toggle('active', isActive);
      p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
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
    document.querySelectorAll('.s-gender-btn').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    selectedGender = btn.dataset.gender;
  });
});

// ── Zmiana terminu ──────────────────────────────────────────

if (changeSelectionBtn) {
  changeSelectionBtn.addEventListener('click', () => {
    clearSelection();
    renderCalendar();
    document.getElementById('step2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const clientPhone = fd.get('clientPhone');
    const dogName     = fd.get('dogName');
    const dogAge      = fd.get('dogAge');
    // Pobieramy bezpośrednio z locationSelect.value, bo pola disabled nie trafiają do FormData
    const locValue    = locationSelect ? locationSelect.value : (fd.get('location') || '');

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
      clientPhone,
      dogName,
      dogAge,
      dogGender:   selectedGender,
      dogSociability: dogSociabilityInput ? dogSociabilityInput.value : '',
      dogNotes:       dogNotesInput ? dogNotesInput.value.trim() : '',
      healthConfirm:  healthConfirmInput ? healthConfirmInput.checked : false,
      rodoConsent:    rodoConsentInput ? rodoConsentInput.checked : false
    };

    track('formularz_wyslany', `${selectedService} · ${selectedDateStr} ${selectedHour}`);

    try {
      const res  = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();

      if (data.status === 'success') {
        bookedData.push({
          date:        selectedDateStr,
          timeSlot:    selectedHour,
          serviceType: selectedService,
          location:    locValue
        });

        lastBooking = {
          date:        selectedDateStr,
          hour:        selectedHour,
          service:     selectedService,
          location:    locValue,
          description: `Zajęcia: ${selectedService}\nOpiekun: ${firstName} ${lastName}\nPies: ${dogName}\nKontakt: ${clientPhone || clientEmail}`
        };

        if (modalSummaryDetails) {
          modalSummaryDetails.innerHTML = `
            <div><strong>Termin:</strong> ${escapeHtml(dateDisplay)}, godz. ${escapeHtml(selectedHour)}</div>
            <div><strong>Zajęcia:</strong> ${escapeHtml(selectedService)}</div>
            <div><strong>Opiekun:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)} (${escapeHtml(clientEmail)})</div>
            <div><strong>Pies:</strong> ${escapeHtml(dogName)} (${escapeHtml(dogAge)} lat, ${escapeHtml(selectedGender)})</div>
            <div><strong>Miejsce:</strong> ${escapeHtml(locValue)}</div>
          `;
        }

        track('rezerwacja_przyjeta', `${selectedService} · ${selectedDateStr} ${selectedHour}`);

        hideStep3();
        if (successSection) {
          successSection.classList.remove('s-step--hidden');
          successSection.focus({ preventScroll: true });
          successSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        spotkaniaForm.reset();
        selectedDateStr = '';
        selectedHour    = '';
        renderCalendar();

      } else if (data.status === 'conflict') {
        track('rezerwacja_konflikt', data.message || '');
        alert('⚠️ ' + (data.message || 'Ten termin właśnie zajął ktoś inny. Wybierz inny slot.'));
        fetchBookings();
      } else {
        track('rezerwacja_blad', data.message || '');
        alert('Błąd: ' + (data.message || 'Wystąpił problem. Spróbuj ponownie.'));
      }
    } catch (err) {
      console.error(err);
      track('rezerwacja_blad', 'brak połączenia');
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

// ── Ekran sukcesu: dodanie do kalendarza i kolejna rezerwacja ─────────

if (addToCalendarBtn) {
  addToCalendarBtn.addEventListener('click', () => {
    track('dodaj_do_kalendarza', lastBooking ? lastBooking.service : '');
    downloadIcs();
  });
}

if (anotherBookingBtn) {
  anotherBookingBtn.addEventListener('click', () => {
    if (successSection) successSection.classList.add('s-step--hidden');
    clearSelection();
    renderCalendar();
    document.getElementById('step1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ── Menu w nagłówku (mobile) ───────────────────────────────────────

if (menuToggle && siteHeader) {
  const setMenu = (open) => {
    siteHeader.classList.toggle('is-menu-open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  };

  menuToggle.addEventListener('click', () => {
    setMenu(!siteHeader.classList.contains('is-menu-open'));
  });

  // Zamknij po kliknięciu odnośnika wewnątrz menu
  siteHeader.querySelector('.s-nav-links')?.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
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
// Renderujemy natychmiast z pamięci podręcznej (brak migotania),
// a następnie w tle odświeżamy dane z Arkusza Google.
renderServices();
renderPricing();
renderCalendar();
updateLocationOptions();
fetchBookings();
