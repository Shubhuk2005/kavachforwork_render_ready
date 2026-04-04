import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { userAPI, walletAPI } from '../../utils/api.js';
import Navbar from '../../components/Navbar.jsx';
import StatusPopup from '../../components/StatusPopup.jsx';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const loadData = useCallback(async () => {
    try {
      const [balRes, claimsRes] = await Promise.allSettled([
        walletAPI.getBalance(),
        userAPI.getTransactions({ limit: 5 }),
      ]);

      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data);
      }

      if (claimsRes.status === 'fulfilled') {
        setClaims(claimsRes.value.data.transactions || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activateInsurance = async () => {
    setActivating(true);
    try {
      const { data } = await userAPI.activateInsurance();
      showToast('Insurance activated', data.message);
      await Promise.all([loadData(), refreshUser()]);
    } catch (err) {
      showToast('Activation failed', err.response?.data?.error || 'Activation failed', 'error');
    } finally {
      setActivating(false);
    }
  };

  const isActive = balance?.isInsuranceActive;
  const premium = balance?.weeklyPremium || user?.weeklyPremium || 29;
  const expiryDate = balance?.premiumUntil
    ? new Date(balance.premiumUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;
  const workerLabel = 'Gig Worker';
  const locationLabel = user?.city || 'India';

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />
      <StatusPopup toast={toast} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-kavach-dark">
            Namaste, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {workerLabel} • {locationLabel}
          </p>
        </div>

        <div
          className={`relative mb-6 overflow-hidden rounded-2xl border-2 p-6 transition-all ${
            isActive
              ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
              : 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50'
          }`}
        >
          <div className="absolute right-4 top-4 opacity-10">
            <svg viewBox="0 0 24 24" fill="currentColor" className={`h-28 w-28 ${isActive ? 'text-green-500' : 'text-orange-400'}`}>
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>

          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl shadow-md ${isActive ? 'bg-green-500 shield-active' : 'bg-orange-400'}`}>
              <svg viewBox="0 0 24 24" fill="white" className="h-9 w-9">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>

            <div className="flex-1">
              {isActive ? (
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="badge-active">Live cover active</span>
                  </div>
                  <div className="font-display text-xl font-bold text-green-800">
                    You are protected until {expiryDate}
                  </div>
                  <p className="mt-1 text-sm text-green-700">
                    Coverage active. Verified weather triggers can pay out to your wallet or linked account.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="badge-inactive">Coverage inactive</span>
                  </div>
                  <div className="font-display text-xl font-bold text-gray-800">Activate your Kavach Shield</div>
                  <p className="mt-1 text-sm text-gray-600">
                    Pay Rs {premium} from your wallet for 7-day climate protection based on your registered state.
                  </p>
                </>
              )}
            </div>

            {!isActive ? (
              <button
                onClick={activateInsurance}
                disabled={activating || (balance?.balance ?? 0) < premium}
                className="btn-primary flex flex-shrink-0 items-center gap-2 py-3"
              >
                {activating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Activating...
                  </>
                ) : (
                  `Activate - Rs ${premium}`
                )}
              </button>
            ) : (
              <Link to="/claim" className="btn-primary flex-shrink-0 py-3 text-center">
                File Claim
              </Link>
            )}
          </div>

          {!isActive && (balance?.balance ?? 0) < premium && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-100 p-2.5">
              <p className="text-xs font-medium text-amber-700">
                Insufficient balance (Rs {balance?.balance || 0}). <Link to="/wallet" className="underline">Top up wallet</Link>
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Wallet Balance" value={loading ? '-' : `Rs ${balance?.balance || 0}`} link="/wallet" />
          <StatCard label="Weekly Premium" value={`Rs ${premium}`} />
          <StatCard label="Claims Filed" value={user?.totalClaimsSubmitted || 0} />
          <StatCard label="Payouts Received" value={`Rs ${user?.totalPayoutsReceived || 0}`} />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          <QuickAction to="/claim" label="File Claim" desc="Submit weather-trigger claim" />
          <QuickAction to="/wallet" label="Wallet and Payouts" desc="Top up, manage bank or UPI" />
          <QuickAction to="/chatbot" label="Get Help" desc="Chat with support assistant" />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-bold text-kavach-dark">Recent Activity</h2>
            <Link to="/wallet" className="text-sm font-semibold text-kavach-orange hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="heat-shimmer h-12 rounded-xl" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <div className="mb-2 text-3xl">-</div>
              <p className="text-sm">No transactions yet. Activate your coverage to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map((tx) => (
                <TransactionRow key={tx._id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, link }) {
  const body = (
    <div className="card cursor-pointer p-4 transition-colors hover:border-orange-200">
      <div className="font-display text-lg font-bold text-kavach-dark">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
  return link ? <Link to={link}>{body}</Link> : body;
}

function QuickAction({ to, label, desc }) {
  return (
    <Link to={to} className="card flex items-start gap-3 p-4 transition-all hover:border-orange-200 hover:shadow-kavach">
      <div>
        <div className="text-sm font-semibold text-kavach-dark">{label}</div>
        <div className="mt-0.5 text-xs text-gray-400">{desc}</div>
      </div>
    </Link>
  );
}

function TransactionRow({ tx }) {
  const isCredit = tx.amount > 0;
  const typeLabel = {
    premium_deduction: 'Weekly Premium',
    payout: 'Claim Payout',
    claim_payout: 'Claim Payout',
    topup: 'Wallet Top-up',
    bank_withdrawal: 'Sent To Bank',
    refund: 'Refund',
  }[tx.type] || tx.type;

  return (
    <div className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-orange-50/50">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base ${isCredit ? 'bg-green-100' : 'bg-orange-100'}`}>
        {tx.type === 'premium_deduction' ? 'S' : tx.type === 'payout' || tx.type === 'claim_payout' ? 'P' : tx.type === 'topup' ? 'T' : 'R'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-kavach-dark">{typeLabel}</div>
        <div className="truncate text-xs text-gray-400">{tx.description}</div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className={`font-display text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
          {isCredit ? '+' : ''}
          Rs {Math.abs(tx.amount)}
        </div>
        <div className="text-xs text-gray-400">
          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  );
}
