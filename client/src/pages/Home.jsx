import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { weatherAPI } from '../utils/api.js';
import { getCurrentCoordinates, reverseGeocodeIndia } from '../utils/location.js';
import { useAuth } from '../hooks/useAuth.jsx';

const FEATURES = [
  {
    icon: '🌡️',
    title: 'Live Heat Intelligence',
    desc: 'Weather signals are checked against your live area so riders can see risk build before they claim.',
    color: 'from-orange-50 via-amber-50 to-rose-50 border-orange-200',
  },
  {
    icon: '🛰️',
    title: 'Location-Aware Protection',
    desc: 'Your city and state drive pricing and payout range, keeping the cover aligned with real climate exposure.',
    color: 'from-sky-50 via-cyan-50 to-white border-sky-200',
  },
  {
    icon: '🛡️',
    title: 'Sentry Shield Active',
    desc: 'Hardware-backed checks use motion, battery, network, and location integrity before claim money moves.',
    color: 'from-emerald-50 via-lime-50 to-white border-emerald-200',
  },
  {
    icon: '💸',
    title: 'Flexible Payout Routes',
    desc: 'Approved money can land in the wallet, linked bank account, or UPI based on the worker’s choice.',
    color: 'from-fuchsia-50 via-rose-50 to-white border-fuchsia-200',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register With Live Location', desc: 'Create your account as a gig worker and verify your current city and state.' },
  { step: '02', title: 'Activate Weekly Cover', desc: 'Pay the premium shown for your location and unlock 7 days of climate cover.' },
  { step: '03', title: 'Track Unsafe Heat', desc: 'See the live weather window and file a claim when temperature crosses the trigger.' },
  { step: '04', title: 'Get Paid Fast', desc: 'Approved claims move to your wallet, UPI, or linked bank account.' },
];

const WORKERS = [
  { emoji: '🛵', label: 'Delivery Partners' },
  { emoji: '📦', label: 'Gig Workers' },
  { emoji: '⚡', label: 'On-the-road Riders' },
];

export default function Home() {
  const { user } = useAuth();
  const [live, setLive] = useState({
    loading: true,
    refreshing: false,
    locationLabel: user?.city ? `${user.city}${user?.state ? `, ${user.state}` : ''}` : 'Checking your area',
    city: user?.city || '',
    state: user?.state || '',
    coords: null,
    weather: null,
    error: '',
  });

  const loadLiveSnapshot = useCallback(async (isRefresh = false) => {
    setLive((current) => ({
      ...current,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: '',
    }));

    try {
      const coords = await getCurrentCoordinates();
      const place = await reverseGeocodeIndia(coords.latitude, coords.longitude);
      const { data } = await weatherAPI.getCurrent(place.city || user?.city || 'Jaipur');

      setLive({
        loading: false,
        refreshing: false,
        locationLabel: place.formatted || `${place.city || 'Current area'}, ${place.state || 'India'}`,
        city: place.city || data.city || user?.city || '',
        state: place.state || user?.state || '',
        coords,
        weather: data,
        error: '',
      });
    } catch (err) {
      const fallbackCity = user?.city || 'Jaipur';

      try {
        const { data } = await weatherAPI.getCurrent(fallbackCity);

        setLive({
          loading: false,
          refreshing: false,
          locationLabel: user?.city
            ? `${user.city}${user?.state ? `, ${user.state}` : ''}`
            : 'Location permission needed for live area',
          city: user?.city || data.city || fallbackCity,
          state: user?.state || '',
          coords: null,
          weather: data,
          error: err.message || 'Location access was not available.',
        });
      } catch {
        setLive((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: 'Unable to fetch live weather right now.',
        }));
      }
    }
  }, [user?.city, user?.state]);

  useEffect(() => {
    loadLiveSnapshot().catch(() => {});
  }, [loadLiveSnapshot]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadLiveSnapshot(true).catch(() => {});
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [loadLiveSnapshot]);

  const heroStatus = useMemo(() => {
    if (live.weather?.isHeatwave) {
      return {
        label: 'Heatwave Active',
        tone: 'bg-red-100 text-red-700 border-red-200',
        detail: 'Unsafe outdoor conditions detected near your live area.',
      };
    }

    if (live.weather) {
      return {
        label: 'Heat Watch Ready',
        tone: 'bg-sky-100 text-sky-700 border-sky-200',
        detail: 'Live monitoring is running for your current area.',
      };
    }

    return {
      label: 'Shield Warming Up',
      tone: 'bg-orange-100 text-orange-700 border-orange-200',
      detail: 'Checking your area and weather window.',
    };
  }, [live.weather]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fffaf4_38%,_#fff_100%)] font-body">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-16 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-kavach-orange shadow-sm backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-kavach-orange" />
              Sentry shield for India&apos;s gig workers
            </div>

            <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-kavach-dark md:text-6xl">
              See the heat.
              <br />
              <span className="relative text-kavach-orange">
                Stay covered on the road.
                <svg className="absolute -bottom-3 left-0 h-4 w-full" viewBox="0 0 260 16" fill="none">
                  <path d="M4 12C46 3 82 3 126 10C165 16 207 16 256 6" stroke="#F97316" strokeLinecap="round" strokeWidth="4" />
                </svg>
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-gray-600">
              Climate protection built for delivery riders and gig workers who stay outside when the day turns dangerous.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {WORKERS.map((worker) => (
                <span
                  key={worker.label}
                  className="rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {worker.emoji} {worker.label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-8 py-3.5 text-base shadow-kavach">
                Create Account →
              </Link>
              <Link to="/faqs" className="btn-secondary px-8 py-3.5 text-base">
                Learn the flow
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <TrustPill label="Live area checks" />
              <TrustPill label="Wallet, bank, or UPI" />
              <TrustPill label="Android-ready sensors" />
            </div>
          </div>

          <LiveConditionsCard live={live} heroStatus={heroStatus} />
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-orange-100 bg-white/80 p-6 shadow-[0_24px_70px_rgba(245,158,11,0.12)] backdrop-blur md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">Live window</div>
              <h2 className="mt-2 font-display text-3xl font-bold text-kavach-dark">Your area, your weather, your cover</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                The home page now acts like a live climate window, showing the worker&apos;s area snapshot before they even open the dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadLiveSnapshot(true)}
              className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-kavach-orange transition hover:border-orange-300 hover:bg-orange-100"
            >
              {live.refreshing ? 'Refreshing...' : 'Refresh live snapshot'}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <LocationStoryCard live={live} />
            <ShieldStoryCard />
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-4xl font-bold text-kavach-dark">Built Different. Built for the road.</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500">
              Every part of Kavach is designed for fast-moving workers, not desk-bound forms.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={`rounded-[1.75rem] border bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] ${feature.color}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-kavach-dark">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-orange-100 bg-white/80 px-4 py-20 backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-4xl font-bold text-kavach-dark">4 Steps to Heat Protection</h2>
          <div className="mt-12 space-y-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="group rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-sm transition duration-300 hover:border-orange-200 hover:shadow-[0_20px_40px_rgba(249,115,22,0.10)] md:flex md:items-start md:gap-5">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kavach-orange to-orange-600 font-display text-lg font-bold text-white shadow-kavach md:mb-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-kavach-dark">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/register" className="btn-primary px-10 py-4 text-base shadow-kavach">
              Start Coverage Today →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-kavach-orange to-orange-600">
              <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <span className="font-display font-bold text-kavach-dark">KavachForWork</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/faqs" className="transition-colors hover:text-kavach-orange">FAQs</Link>
            <Link to="/chatbot" className="transition-colors hover:text-kavach-orange">Support</Link>
            <Link to="/admin/login" className="transition-colors hover:text-kavach-orange">Admin</Link>
          </div>
          <div className="text-sm text-gray-400">© 2024 KavachForWork. Prototype, not a licensed insurer.</div>
        </div>
      </footer>
    </div>
  );
}

function LiveConditionsCard({ live, heroStatus }) {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-orange-200/40 via-transparent to-cyan-200/30 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,247,237,0.92))] p-6 shadow-[0_30px_80px_rgba(249,115,22,0.18)] backdrop-blur">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-orange-100/80 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-100/80 blur-2xl" />

        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Live field view
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${heroStatus.tone}`}>
              {heroStatus.label}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-slate-950 px-5 py-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-white/60">
              <span>Worker weather feed</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                live
              </span>
            </div>

            {live.loading ? (
              <div className="mt-8 animate-pulse">
                <div className="h-4 w-40 rounded bg-white/10" />
                <div className="mt-4 h-16 w-28 rounded bg-white/10" />
                <div className="mt-4 h-4 w-56 rounded bg-white/10" />
              </div>
            ) : (
              <div className="mt-6">
                <div className="text-sm text-white/70">Current area</div>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-3xl font-bold">{live.locationLabel}</div>
                    <div className="mt-2 text-sm text-white/65">{heroStatus.detail}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/55">Temp</div>
                    <div className="font-display text-4xl font-bold text-orange-300">
                      {live.weather?.temperature != null ? `${live.weather.temperature}°` : '--'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MetricTile label="Feels Like" value={live.weather?.feelsLike != null ? `${live.weather.feelsLike}°C` : '--'} />
                  <MetricTile label="Humidity" value={live.weather?.humidity != null ? `${live.weather.humidity}%` : '--'} />
                  <MetricTile label="Condition" value={live.weather?.condition || 'Waiting'} />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-300" />
                      {live.coords ? `Lat ${live.coords.latitude.toFixed(3)}, Lng ${live.coords.longitude.toFixed(3)}` : 'Using saved city snapshot'}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-300" />
                      {live.state || 'India'}
                    </span>
                  </div>
                  {live.error ? <div className="mt-3 text-xs text-amber-200">{live.error}</div> : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SignalCard title="Sentry Shield" value="Active" tone="text-emerald-600 bg-emerald-50 border-emerald-200" />
            <SignalCard title="Location pulse" value={live.city || 'Area ready'} tone="text-sky-600 bg-sky-50 border-sky-200" />
            <SignalCard title="Payout route" value="Wallet / Bank / UPI" tone="text-orange-600 bg-orange-50 border-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationStoryCard({ live }) {
  return (
    <div className="rounded-[1.75rem] border border-orange-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#eff6ff_100%)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Current rider view</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-kavach-dark">Live location + weather snapshot</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">📍</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Detected area</div>
          <div className="mt-2 font-display text-2xl font-bold text-kavach-dark">{live.locationLabel}</div>
          <div className="mt-2 text-sm text-gray-500">
            {live.coords ? 'Live browser location matched with reverse geocoding.' : 'Showing a city-based snapshot until live location is available.'}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/55">Weather now</div>
          <div className="mt-2 flex items-end gap-3">
            <div className="font-display text-4xl font-bold text-orange-300">{live.weather?.temperature != null ? `${live.weather.temperature}°C` : '--'}</div>
            <div className="pb-1 text-sm text-white/65">{live.weather?.condition || 'Waiting for feed'}</div>
          </div>
          <div className="mt-3 text-sm text-white/65">
            Feels like {live.weather?.feelsLike != null ? `${live.weather.feelsLike}°C` : '--'} • Humidity {live.weather?.humidity != null ? `${live.weather.humidity}%` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldStoryCard() {
  return (
    <div className="rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Sentry presence</div>
      <h3 className="mt-2 font-display text-2xl font-bold text-kavach-dark">AI protection stays in the background</h3>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Instead of showing service warnings to workers, Kavach now presents a cleaner shield experience. The system still uses hardware-backed fraud checks during claims, but the home screen stays focused on what riders care about: area, risk, and payout readiness.
      </p>

      <div className="mt-6 space-y-3">
        <StoryRow title="Motion + battery" desc="Used during claim verification to detect real outdoor activity." />
        <StoryRow title="Location integrity" desc="Helps verify that the worker is really where the phone says they are." />
        <StoryRow title="Payout confidence" desc="Keeps the flow fast when conditions match and blocks risky cycles when they do not." />
      </div>
    </div>
  );
}

function TrustPill({ label }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm backdrop-blur">
      {label}
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-2 font-semibold text-white">{value}</div>
    </div>
  );
}

function SignalCard({ title, value, tone }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{title}</div>
      <div className="mt-2 font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function StoryRow({ title, desc }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white px-4 py-4 shadow-sm">
      <div className="font-semibold text-kavach-dark">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{desc}</div>
    </div>
  );
}
