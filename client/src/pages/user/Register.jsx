import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import Navbar from '../../components/Navbar.jsx';
import StatusPopup from '../../components/StatusPopup.jsx';
import TermsModal from '../../components/TermsModal.jsx';
import { INDIAN_STATES, canonicalizeState, resolvePricing } from '../../utils/pricing.js';
import { getCurrentCoordinates, reverseGeocodeIndia, statesMatch } from '../../utils/location.js';
import { useSensors } from '../../hooks/useSensors.js';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    workerType: 'delivery_driver',
    city: '',
    state: 'Rajasthan',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deviceSynced, setDeviceSynced] = useState(false);
  const [syncingTerms, setSyncingTerms] = useState(false);
  const [termsSyncError, setTermsSyncError] = useState('');
  const [toast, setToast] = useState(null);
  const [locationVerification, setLocationVerification] = useState(null);
  const { collectSensorData } = useSensors();
  const { login } = useAuth();
  const navigate = useNavigate();

  const pricing = useMemo(() => resolvePricing(form.state, form.city), [form.city, form.state]);
  const detectedState = locationVerification?.detectedState || '';
  const locationMatched = !!detectedState && statesMatch(form.state, detectedState);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (field === 'state') {
      setTermsAccepted(false);
      setDeviceSynced(false);
      setLocationVerification(null);
    }
  };

  const runLiveVerification = async () => {
    setSyncingTerms(true);
    setTermsSyncError('');

    try {
      const coords = await getCurrentCoordinates();
      const resolved = await reverseGeocodeIndia(coords.latitude, coords.longitude);
      const supportedState = canonicalizeState(resolved.state);
      const nextState = INDIAN_STATES.includes(supportedState) ? supportedState : form.state;
      const nextCity = resolved.city || form.city;

      setForm((current) => ({
        ...current,
        state: nextState,
        city: nextCity,
      }));

      setLocationVerification({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        detectedCity: resolved.city || nextCity,
        detectedState: supportedState,
        provider: 'browser_geolocation',
        verifiedAt: new Date().toISOString(),
        formatted: resolved.formatted || [resolved.city, supportedState].filter(Boolean).join(', '),
      });

      const sensorPayload = await collectSensorData({ requireLiveLocation: true });
      if (sensorPayload.isNative && !sensorPayload.hardwareHeartbeat) {
        throw new Error('Move the device once and try again so Sentry-AI can verify hardware activity.');
      }

      setDeviceSynced(true);
      showToast('Verification complete', 'Live location and device check completed.');
    } catch (err) {
      setDeviceSynced(false);
      setTermsSyncError(err.message || 'Verification failed.');
    } finally {
      setSyncingTerms(false);
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: form.name,
        phone: form.phone,
        password: form.password,
        workerType: 'delivery_driver',
        city: form.city,
        state: form.state,
        termsAccepted: true,
        locationVerification,
      });
      login(data.token, data.user);
      showToast('Money added', 'Rs 100 signup bonus added to your wallet.');
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted || !deviceSynced || !locationVerification || !locationMatched) {
      setTermsOpen(true);
      return;
    }

    await submitRegistration();
  };

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />
      <StatusPopup toast={toast} />

      <TermsModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setTermsOpen(false);
          showToast('Terms accepted', 'You can now create your account.');
        }}
        selectedState={form.state}
        detectedLocation={locationVerification}
        locationMatched={locationMatched}
        syncing={syncingTerms}
        syncError={termsSyncError}
        onRunSync={runLiveVerification}
        syncReady={deviceSynced && !!locationVerification}
      />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-kavach-orange to-orange-600 shadow-kavach">
              <svg viewBox="0 0 24 24" fill="white" className="h-8 w-8">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-kavach-dark">Create your gig worker account</h1>
            <p className="mt-1 text-sm text-gray-500">Built for delivery and field-based gig workers.</p>
          </div>

          <div className="card">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="Raju Kumar"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">+91</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="9876543210"
                    className="input-field pl-12"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="text-sm font-semibold text-kavach-dark">Worker category</div>
                <div className="mt-1 text-sm text-gray-700">Gig Worker</div>
                <div className="mt-1 text-xs text-gray-500">This product is configured only for delivery and outdoor gig work.</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">State</label>
                  <select value={form.state} onChange={setField('state')} className="input-field">
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={setField('city')}
                    placeholder="Enter city"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="mb-2 text-sm font-semibold text-kavach-dark">Dynamic pricing for your location</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Pricing Zone</div>
                    <div className="font-semibold text-kavach-dark">{pricing.label}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Category</div>
                    <div className="font-semibold text-kavach-dark">{pricing.category}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Weekly Premium</div>
                    <div className="font-display font-bold text-kavach-orange">Rs {pricing.weeklyPremium}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Max Payout</div>
                    <div className="font-display font-bold text-green-600">Rs {pricing.maxPayout}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="Min 6 characters"
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  placeholder="Repeat password"
                  className="input-field"
                  required
                />
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-semibold text-green-700">Rs 100 signup bonus will be added to your wallet automatically.</p>
              </div>

              <div className="text-xs text-gray-500">
                Terms and live verification will be shown only after you click create account.
              </div>

              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-kavach-orange hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
