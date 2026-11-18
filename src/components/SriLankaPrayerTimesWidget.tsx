import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MoonStar, MapPin, Clock, Sun, Sunrise, Sunset } from 'lucide-react';

interface PrayerCity {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
}

export const SRI_LANKA_PRAYER_CITIES: PrayerCity[] = [
  { id: 'colombo', name: 'Colombo', region: 'Western', lat: 6.9271, lng: 79.8612 },
  { id: 'kandy', name: 'Kandy', region: 'Central', lat: 7.2906, lng: 80.6337 },
  { id: 'galle', name: 'Galle', region: 'Southern', lat: 6.0535, lng: 80.2210 },
  { id: 'jaffna', name: 'Jaffna', region: 'Northern', lat: 9.6615, lng: 80.0255 },
  { id: 'trincomalee', name: 'Trincomalee', region: 'Eastern', lat: 8.5874, lng: 81.2152 },
  { id: 'batticaloa', name: 'Batticaloa', region: 'Eastern', lat: 7.7310, lng: 81.6747 },
  { id: 'kalmunai', name: 'Kalmunai', region: 'Eastern', lat: 7.4167, lng: 81.8167 },
  { id: 'negombo', name: 'Negombo', region: 'Western', lat: 7.2008, lng: 79.8737 },
  { id: 'beruwala', name: 'Beruwala', region: 'Western', lat: 6.4788, lng: 79.9828 },
  { id: 'kurunegala', name: 'Kurunegala', region: 'North Western', lat: 7.4863, lng: 80.3623 },
  { id: 'anuradhapura', name: 'Anuradhapura', region: 'North Central', lat: 8.3114, lng: 80.4037 },
  { id: 'matara', name: 'Matara', region: 'Southern', lat: 5.9549, lng: 80.5550 },
];

type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface PrayerSchedule {
  Fajr: number; // minutes from midnight (0..1439)
  Sunrise: number;
  Dhuhr: number;
  Asr: number;
  Maghrib: number;
  Isha: number;
}

const SL_TIMEZONE = 'Asia/Colombo';
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const fixAngle = (a: number): number => {
  const res = a - 360 * Math.floor(a / 360);
  return res < 0 ? res + 360 : res;
};

const fixHour = (a: number): number => {
  const res = a - 24 * Math.floor(a / 24);
  return res < 0 ? res + 24 : res;
};

/**
 * Astronomical Solar Prayer Time Calculator tuned for Sri Lanka (UTC+5:30, MWL/ACJU: Fajr 18°, Isha 17°, Shafi Asr)
 */
function calculateSriLankaPrayers(
  year: number,
  month: number,
  day: number,
  lat: number,
  lng: number
): PrayerSchedule {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jdBase =
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;

  const tzOffset = 5.5; // Asia/Colombo UTC+5:30

  const sunPosition = (jd: number) => {
    const d = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * d);
    const q = fixAngle(280.459 + 0.98564736 * d);
    const L = fixAngle(
      q + 1.915 * Math.sin(g * DEG_TO_RAD) + 0.02 * Math.sin(2 * g * DEG_TO_RAD)
    );
    const e = 23.439 - 0.00000036 * d;
    const ra =
      Math.atan2(Math.cos(e * DEG_TO_RAD) * Math.sin(L * DEG_TO_RAD), Math.cos(L * DEG_TO_RAD)) *
      (RAD_TO_DEG / 15);
    const decl = Math.asin(Math.sin(e * DEG_TO_RAD) * Math.sin(L * DEG_TO_RAD)) * RAD_TO_DEG;
    const eqTime = q / 15 - fixHour(ra);
    return { decl, eqTime };
  };

  const computeMidDay = (dayFraction: number) => {
    const { eqTime } = sunPosition(jdBase + dayFraction - lng / 360);
    return fixHour(12 - eqTime);
  };

  const sunAngleTime = (angleDeg: number, dayFraction: number, direction: 'ccw' | 'cw') => {
    const { decl } = sunPosition(jdBase + dayFraction - lng / 360);
    const noon = computeMidDay(dayFraction);
    const numerator =
      -Math.sin(angleDeg * DEG_TO_RAD) -
      Math.sin(decl * DEG_TO_RAD) * Math.sin(lat * DEG_TO_RAD);
    const denominator = Math.cos(decl * DEG_TO_RAD) * Math.cos(lat * DEG_TO_RAD);
    const clampedCos = Math.max(-1, Math.min(1, numerator / denominator));
    const hourAngleHours = (Math.acos(clampedCos) * RAD_TO_DEG) / 15;
    return noon + (direction === 'ccw' ? -hourAngleHours : hourAngleHours);
  };

  const computeAsr = (dayFraction: number) => {
    const { decl } = sunPosition(jdBase + dayFraction - lng / 360);
    const altitudeDeg =
      Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl) * DEG_TO_RAD))) * RAD_TO_DEG;
    return sunAngleTime(-altitudeDeg, dayFraction, 'cw');
  };

  // Two-pass refinement for sub-minute precision
  let fajrH = sunAngleTime(18.0, 5 / 24, 'ccw');
  let sunriseH = sunAngleTime(0.833, 6 / 24, 'ccw');
  let dhuhrH = computeMidDay(12 / 24);
  let asrH = computeAsr(15 / 24);
  let sunsetH = sunAngleTime(0.833, 18 / 24, 'cw');
  let ishaH = sunAngleTime(17.0, 19 / 24, 'cw');

  fajrH = sunAngleTime(18.0, fajrH / 24, 'ccw');
  sunriseH = sunAngleTime(0.833, sunriseH / 24, 'ccw');
  dhuhrH = computeMidDay(dhuhrH / 24);
  asrH = computeAsr(asrH / 24);
  sunsetH = sunAngleTime(0.833, sunsetH / 24, 'cw');
  ishaH = sunAngleTime(17.0, ishaH / 24, 'cw');

  const toLocalMinutes = (solarHour: number, extraMin = 0) => {
    const localHour = fixHour(solarHour + tzOffset - lng / 15);
    return Math.round(localHour * 60 + extraMin);
  };

  return {
    Fajr: toLocalMinutes(fajrH),
    Sunrise: toLocalMinutes(sunriseH),
    Dhuhr: toLocalMinutes(dhuhrH, 1), // +1 min zenith safety margin
    Asr: toLocalMinutes(asrH),
    Maghrib: toLocalMinutes(sunsetH, 1), // +1 min sunset margin
    Isha: toLocalMinutes(ishaH),
  };
}

function getSriLankaNowParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || '0');
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour') % 24;
  const minute = get('minute');
  const second = get('second');

  const clock12 = new Intl.DateTimeFormat('en-US', {
    timeZone: SL_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: SL_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);

  let hijriLabel = '';
  try {
    hijriLabel = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone: SL_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    hijriLabel = '';
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    totalSeconds: hour * 3600 + minute * 60 + second,
    dateKey: `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
    clock12,
    dateLabel,
    hijriLabel,
  };
}

function parseHhMmToMinutes(value: string): number | null {
  const clean = value.split(' ')[0];
  const [hStr, mStr] = clean.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatMinutes12h(totalMins: number): string {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatCountdown(diffSeconds: number): string {
  const s = Math.max(0, Math.floor(diffSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${String(secs).padStart(2, '0')}s`;
  return `${secs}s`;
}

export const SriLankaPrayerTimesWidget: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [now, setNow] = useState<Date>(() => new Date());
  const [cityId, setCityId] = useState<string>(() => {
    try {
      return localStorage.getItem('huta_sl_prayer_city') || 'colombo';
    } catch {
      return 'colombo';
    }
  });
  const [apiSchedule, setApiSchedule] = useState<PrayerSchedule | null>(null);
  const [apiHijri, setApiHijri] = useState<string>('');

  const selectedCity =
    SRI_LANKA_PRAYER_CITIES.find((c) => c.id === cityId) || SRI_LANKA_PRAYER_CITIES[0];

  // Live 1-second Sri Lanka clock tick
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const slTime = useMemo(() => getSriLankaNowParts(now), [now]);

  // Persist city preference
  const handleChangeCity = (nextId: string) => {
    setCityId(nextId);
    setApiSchedule(null);
    try {
      localStorage.setItem('huta_sl_prayer_city', nextId);
    } catch {
      // ignore storage failure
    }
  };

  // Sync live daily schedule from AlAdhan API when reachable, keeping local astronomical timings instant
  useEffect(() => {
    const controller = new AbortController();
    const url = `https://api.aladhan.com/v1/timings/${slTime.dateKey}?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}&method=3&school=0&timezonestring=${encodeURIComponent(
      SL_TIMEZONE
    )}`;

    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const timings = json?.data?.timings;
        if (!timings) return;
        const f = parseHhMmToMinutes(timings.Fajr);
        const sr = parseHhMmToMinutes(timings.Sunrise);
        const d = parseHhMmToMinutes(timings.Dhuhr);
        const a = parseHhMmToMinutes(timings.Asr);
        const mg = parseHhMmToMinutes(timings.Maghrib);
        const is = parseHhMmToMinutes(timings.Isha);
        if (f !== null && sr !== null && d !== null && a !== null && mg !== null && is !== null) {
          setApiSchedule({ Fajr: f, Sunrise: sr, Dhuhr: d, Asr: a, Maghrib: mg, Isha: is });
        }
        const hijri = json?.data?.date?.hijri;
        if (hijri?.day && hijri?.month?.en && hijri?.year) {
          setApiHijri(`${hijri.day} ${hijri.month.en} ${hijri.year}`);
        }
      })
      .catch(() => {
        // Silent graceful fallback to instant local astronomical Sri Lanka calculation
      });

    return () => controller.abort();
  }, [slTime.dateKey, selectedCity.lat, selectedCity.lng]);

  const astronomicalSchedule = useMemo(
    () =>
      calculateSriLankaPrayers(
        slTime.year,
        slTime.month,
        slTime.day,
        selectedCity.lat,
        selectedCity.lng
      ),
    [slTime.year, slTime.month, slTime.day, selectedCity.lat, selectedCity.lng]
  );

  const schedule = apiSchedule || astronomicalSchedule;

  // Determine next upcoming prayer (excluding Sunrise as fard prayer, or highlighting upcoming obligatory prayer)
  const prayerOrder: { key: PrayerKey; label: string; isFard: boolean }[] = [
    { key: 'Fajr', label: 'Fajr', isFard: true },
    { key: 'Sunrise', label: 'Sunrise', isFard: false },
    { key: 'Dhuhr', label: 'Dhuhr', isFard: true },
    { key: 'Asr', label: 'Asr', isFard: true },
    { key: 'Maghrib', label: 'Maghrib', isFard: true },
    { key: 'Isha', label: 'Isha', isFard: true },
  ];

  let nextPrayerKey: PrayerKey = 'Fajr';
  let secondsUntilNext = 0;

  const upcomingToday = prayerOrder.find(
    (p) => p.isFard && schedule[p.key] * 60 > slTime.totalSeconds
  );

  if (upcomingToday) {
    nextPrayerKey = upcomingToday.key;
    secondsUntilNext = schedule[upcomingToday.key] * 60 - slTime.totalSeconds;
  } else {
    // After Isha -> countdown to tomorrow's Fajr
    nextPrayerKey = 'Fajr';
    secondsUntilNext = 86400 - slTime.totalSeconds + schedule.Fajr * 60;
  }

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Live Sri Lanka Prayer Times"
      className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-5"
    >
      <div className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200/80 dark:border-[#252836] shadow-sm overflow-hidden transition-colors">
        {/* Compact Top Bar: Live LK Clock, Next Prayer Countdown & City Selector */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-[#0B1324] via-[#0F1B30] to-[#0A2029] text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <MoonStar className="w-3.5 h-3.5" />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-black text-xs sm:text-sm tracking-tight text-white truncate">
                Sri Lanka Prayer Times
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/35 text-[9px] font-black uppercase tracking-wider text-emerald-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 tabular-nums border-l border-white/15 pl-2">
                <Clock className="w-3 h-3 text-cyan-300" />
                <span>{slTime.clock12} LK</span>
              </span>
              {(apiHijri || slTime.hijriLabel) && (
                <span className="hidden lg:inline text-[11px] text-slate-400 border-l border-white/15 pl-2 truncate">
                  {slTime.dateLabel} · {apiHijri || slTime.hijriLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {/* Compact Next Prayer Countdown */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
              <span className="text-slate-300">Next:</span>
              <span className="text-[#FF7A59] font-black">{nextPrayerKey}</span>
              <span className="text-cyan-300 font-mono tabular-nums">
                in {formatCountdown(secondsUntilNext)}
              </span>
            </div>

            {/* Compact City Selector */}
            <div className="relative flex items-center">
              <MapPin className="w-3 h-3 text-[#FF5A36] absolute left-2 pointer-events-none" />
              <select
                aria-label="Select Sri Lanka city for prayer times"
                value={selectedCity.id}
                onChange={(e) => handleChangeCity(e.target.value)}
                className="pl-6 pr-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white outline-none cursor-pointer transition-colors"
              >
                {SRI_LANKA_PRAYER_CITIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0F172A] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ultra-Compact 6-Prayer Grid (3x2 on Phone, 6-in-a-row on Tablet/Desktop) */}
        <div className="p-2 sm:px-4 sm:py-2.5 grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {prayerOrder.map(({ key, label, isFard }) => {
            const isNext = key === nextPrayerKey && isFard;
            return (
              <div
                key={key}
                className={`rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2 border text-center transition-all relative ${
                  isNext
                    ? 'bg-orange-50/80 dark:bg-[#FF5A36]/12 border-[#FF5A36]/60 shadow-xs'
                    : 'bg-gray-50/80 dark:bg-[#1A1E2B] border-gray-200/70 dark:border-[#262B3D]'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  {key === 'Sunrise' ? (
                    <Sunrise className="w-2.5 h-2.5 text-amber-500" />
                  ) : key === 'Maghrib' ? (
                    <Sunset className="w-2.5 h-2.5 text-orange-500" />
                  ) : key === 'Dhuhr' ? (
                    <Sun className="w-2.5 h-2.5 text-amber-500" />
                  ) : null}
                  <span
                    className={
                      isNext
                        ? 'text-[#FF5A36] font-black'
                        : 'text-gray-500 dark:text-slate-400'
                    }
                  >
                    {label}
                  </span>
                  {isNext && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] animate-pulse shrink-0" />
                  )}
                </div>

                <div
                  className={`text-xs sm:text-[13px] font-black tabular-nums mt-0.5 ${
                    isNext
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-800 dark:text-slate-200'
                  }`}
                >
                  {formatMinutes12h(schedule[key])}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
