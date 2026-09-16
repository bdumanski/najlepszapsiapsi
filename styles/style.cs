/* Nowoczesny, przejrzysty styl na wzór strony docelowej */
:root {
  color-scheme: light;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
  color: #112a46;
  background: #eef4f8;
}
* {
  box-sizing: border-box;
}
html {
  scroll-behavior: smooth;
}
body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef4f8 100%);
  color: #112a46;
}
img {
  max-width: 100%;
  display: block;
}
.hidden {
  display: none !important;
}
button,
input,
select,
textarea {
  font: inherit;
}
.container {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(17, 42, 70, 0.08);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
}
.brand {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  text-decoration: none;
}
.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: center;
}
.site-nav a,
.footer-nav a {
  color: #475569;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}
.site-nav a:hover,
.site-nav a:focus-visible,
.footer-nav a:hover,
.footer-nav a:focus-visible {
  color: #0f172a;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.95rem 1.7rem;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: white;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 16px 40px rgba(37, 99, 235, 0.15);
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.button:hover,
.button:focus-visible {
  background: #1d4ed8;
  transform: translateY(-1px);
}
.button--secondary {
  background: #0f172a;
}
.button--ghost {
  background: transparent;
  color: #2563eb;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.25);
}
.hero {
  padding: clamp(3rem, 6vw, 5rem) 0 4rem;
}
.hero-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 2rem;
  align-items: center;
}
.hero-copy {
  max-width: 42rem;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
  margin-bottom: 1rem;
}
.hero h1 {
  margin: 0;
  font-size: clamp(2.75rem, 5vw, 4.25rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}
.hero p {
  max-width: 38rem;
  margin: 1.5rem 0 2rem;
  color: #475569;
  font-size: 1.05rem;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.hero-visual {
  position: relative;
}
.hero-panel {
  position: relative;
  border-radius: 32px;
  background: linear-gradient(180deg, #ffffff 0%, #e2efff 100%);
  padding: 2rem;
  min-height: 320px;
  box-shadow: 0 38px 80px rgba(15, 23, 42, 0.08);
}
.hero-panel__label {
  margin: 0 0 0.75rem;
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 700;
}
.hero-panel h2 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
}
.hero-panel p {
  color: #475569;
  margin: 1rem 0 0;
  line-height: 1.8;
}
.services {
  padding: 4rem 0 2rem;
}
.section-header {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.section-header h2 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.75rem);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}
.card {
  padding: 1.75rem;
  border-radius: 28px;
  background: white;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 26px 50px rgba(15, 23, 42, 0.04);
}
.card h3 {
  margin-top: 0;
  font-size: 1.25rem;
}
.card p {
  color: #475569;
  margin: 1rem 0 1.5rem;
  line-height: 1.75;
}
.card-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
}
.stats {
  padding: 3rem 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  background: white;
  border-radius: 32px;
  padding: 2rem;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.06);
}
.stat {
  text-align: center;
  padding: 1rem 1.25rem;
}
.stat-value {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 800;
  color: #0f172a;
}
.stat-label {
  margin: 0.5rem 0 0;
  color: #475569;
}
.about {
  padding: 3rem 0;
}
.about-grid {
  display: grid;
  gap: 1.75rem;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
}
.about-card {
  padding: 2rem;
  border-radius: 28px;
  background: #2563eb;
  color: white;
  box-shadow: 0 28px 60px rgba(37, 99, 235, 0.14);
}
.about-card__label {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}
.about h2,
.cta h2,
.section-header h2 {
  line-height: 1.05;
}
.about p {
  color: #475569;
  margin: 1.4rem 0 0;
  line-height: 1.8;
}
.cta {
  padding: 3rem 0 5rem;
}
.cta-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 32px;
  padding: 2rem;
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.08);
}
.cta-panel h2 {
  margin: 0;
  font-size: clamp(1.75rem, 2.5vw, 2.5rem);
}
.booking {
  padding: 3rem 0 5rem;
}

.location-map {
  padding: 3rem 0 0;
}

.map-card {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  background: white;
  border-radius: 28px;
  padding: 1.75rem;
  box-shadow: 0 26px 50px rgba(15, 23, 42, 0.04);
  align-items: center;
}

.map-card__content h2 {
  margin: 0.75rem 0 0.85rem;
}

.map-card__content p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}

.map-placeholder {
  min-height: 220px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #e2efff 0%, #f8fafc 100%);
  display: grid;
  place-items: center;
  color: #1e3a8a;
  font-weight: 700;
  font-size: 1rem;
  text-align: center;
  border: 1px solid rgba(37, 99, 235, 0.18);
}
.map-placeholder iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.booking-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
  gap: 1.5rem;
}
.calendar-card,
.booking-summary {
  background: white;
  border-radius: 28px;
  padding: 1.75rem;
  box-shadow: 0 26px 50px rgba(15, 23, 42, 0.04);
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.calendar-nav {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 14px;
  background: white;
  color: #2563eb;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}
.calendar-nav:hover,
.calendar-nav:focus-visible {
  background: rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}
.calendar-month {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}
.calendar-subtitle {
  margin: 0.35rem 0 0;
  color: #6b7280;
}
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.5rem;
  color: #6b7280;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.5rem;
}
.calendar-day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  min-height: 54px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid transparent;
  color: #111827;
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.calendar-day:hover,
.calendar-day:focus-visible {
  background: #eff6ff;
  transform: translateY(-1px);
}
.calendar-day.active {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
}
.calendar-day.disabled {
  background: transparent;
  cursor: default;
}
.booking-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.booking-form {
  display: grid;
  gap: 0.9rem;
}
.booking-form label {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}
.booking-form input,
.booking-form select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 16px;
  background: #f8fafc;
  color: #0f172a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.booking-form input:focus,
.booking-form select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}
.booking-summary h3 {
  margin: 0;
  font-size: 1.6rem;
}
.booking-summary p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
}
#bookingButton {
  margin-top: auto;
}
.site-footer {
  padding: 2rem 0 3rem;
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  color: #475569;
}
.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
@media (max-width: 860px) {
  .hero-grid,
  .about-grid,
  .stats-grid,
  .cta-panel,
  .booking-panel,
  .map-card {
    grid-template-columns: 1fr;
  }
  .header-inner {
    flex-direction: column;
    align-items: stretch;
  }
  .site-nav {
    justify-content: center;
  }
}
@media (max-width: 560px) {
  .hero h1 {
    font-size: 2.5rem;
  }
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .calendar-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  .calendar-nav {
    width: 38px;
    height: 38px;
    font-size: 1.25rem;
  }
  .calendar-weekdays,
  .calendar-days {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .calendar-day {
    min-height: 46px;
  }
}
