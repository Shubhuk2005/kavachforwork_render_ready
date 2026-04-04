import { useEffect, useMemo, useState } from 'react';
import { payoutsAPI, userAPI, walletAPI } from '../../utils/api.js';
import Navbar from '../../components/Navbar.jsx';
import StatusPopup from '../../components/StatusPopup.jsx';

const TOPUP_AMOUNTS = [24, 100, 200, 500];

const emptyBankForm = {
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankName: '',
};

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [defaultMethod, setDefaultMethod] = useState('wallet');
  const [upiId, setUpiId] = useState('');
  const [bankForm, setBankForm] = useState(emptyBankForm);
  const [savingMethod, setSavingMethod] = useState(false);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const loadData = async (nextPage = 1) => {
    try {
      const [balRes, txRes, payoutRes] = await Promise.all([
        walletAPI.getBalance(),
        userAPI.getTransactions({ page: nextPage, limit: 15 }),
        payoutsAPI.getMethods(),
      ]);

      setBalance(balRes.data);
      setTransactions((prev) => (nextPage === 1 ? txRes.data.transactions : [...prev, ...txRes.data.transactions]));
      setTotalPages(txRes.data.pagination.pages);
      setPage(nextPage);
      setPayoutMethods(payoutRes.data.methods || []);
      setDefaultMethod(payoutRes.data.default || 'wallet');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const bankConfigured = useMemo(
    () => !!payoutMethods.find((item) => item.id === 'bank' && item.configured),
    [payoutMethods]
  );
  const resolvedTopUpAmount = Number(customAmount) || selectedAmount || 0;

  const handleTopUp = async () => {
    const amount = Number(customAmount) || selectedAmount;
    if (!amount || amount < 24) {
      showToast('Top-up blocked', 'Minimum top-up is Rs 24.', 'error');
      return;
    }

    setTopping(true);
    try {
      const { data } = await walletAPI.topUp({ amount });
      showToast('Money added', data.message);
      setCustomAmount('');
      setSelectedAmount(null);
      await loadData();
    } catch (err) {
      showToast('Top-up failed', err.response?.data?.error || 'Top-up failed', 'error');
    } finally {
      setTopping(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) {
      showToast('Transfer blocked', 'Minimum bank transfer is Rs 100.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      const { data } = await walletAPI.withdrawToBank({ amount });
      showToast('Money transferred', data.message);
      setWithdrawAmount('');
      await loadData();
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast('Transfer failed', errors?.[0]?.msg || err.response?.data?.error || 'Transfer failed', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const saveUpi = async () => {
    setSavingMethod(true);
    try {
      await payoutsAPI.configureUpi({ upiId });
      showToast('Payout route ready', 'Future claim payouts can be sent to your UPI account.');
      await loadData();
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast('UPI save failed', errors?.[0]?.msg || err.response?.data?.error || 'UPI save failed', 'error');
    } finally {
      setSavingMethod(false);
    }
  };

  const saveBank = async () => {
    setSavingMethod(true);
    try {
      await payoutsAPI.configureBankAccount(bankForm);
      showToast('Bank linked', 'Your bank account is ready for claim payouts and wallet transfers.');
      setBankForm(emptyBankForm);
      await loadData();
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast('Bank save failed', errors?.[0]?.msg || err.response?.data?.error || 'Bank save failed', 'error');
    } finally {
      setSavingMethod(false);
    }
  };

  const updateDefaultMethod = async (method) => {
    setSavingMethod(true);
    try {
      await payoutsAPI.setDefaultMethod({ method });
      setDefaultMethod(method);
      showToast(
        method === 'wallet' ? 'Wallet selected' : 'Payout route updated',
        method === 'wallet' ? 'Approved claim money will be added to your wallet.' : `Approved claim money will be sent to your ${method}.`
      );
      await loadData();
    } catch (err) {
      showToast('Update failed', err.response?.data?.error || 'Could not update payout method', 'error');
    } finally {
      setSavingMethod(false);
    }
  };

  const txIcons = {
    premium_deduction: { icon: 'S', label: 'Weekly Premium', bg: 'bg-orange-100' },
    payout: { icon: 'P', label: 'Claim Payout', bg: 'bg-green-100' },
    claim_payout: { icon: 'P', label: 'Claim Payout', bg: 'bg-green-100' },
    topup: { icon: 'T', label: 'Top-up', bg: 'bg-blue-100' },
    refund: { icon: 'R', label: 'Refund', bg: 'bg-gray-100' },
    bank_withdrawal: { icon: 'B', label: 'Bank Transfer', bg: 'bg-stone-100' },
  };

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />
      <StatusPopup toast={toast} />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-kavach-dark">Wallet and Transfers</h1>
            <p className="mt-1 text-sm text-gray-500">Add money, send balance to your bank, and control where claim payouts go.</p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-card">
            Default payout: <span className="capitalize text-kavach-dark">{defaultMethod}</span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kavach-orange via-orange-500 to-amber-500 p-6 text-white shadow-kavach-lg">
            <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute bottom-0 right-10 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="text-sm font-medium opacity-80">Available Wallet Balance</div>
              <div className="mt-3 font-display text-5xl font-bold">{loading ? '-' : `Rs ${balance?.balance || 0}`}</div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Weekly premium: Rs {balance?.weeklyPremium || 24}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {bankConfigured ? 'Bank ready for transfer' : 'Link bank to transfer out'}
                </span>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <div className="text-sm font-semibold text-kavach-dark">Quick actions</div>
              <div className="mt-1 text-sm text-gray-500">Choose a quick amount or enter your own custom top-up below.</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TOPUP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                    selectedAmount === amount ? 'border-kavach-orange bg-orange-50 text-kavach-orange' : 'border-gray-200 hover:border-orange-200'
                  }`}
                >
                  Add Rs {amount}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <div className="text-sm font-semibold text-kavach-dark">Selected top-up</div>
              <div className="mt-1 text-xs text-gray-500">
                {resolvedTopUpAmount > 0 ? `You are about to add Rs ${resolvedTopUpAmount}.` : 'Pick a shortcut or type a custom amount.'}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-kavach-dark">Bank transfer out</div>
              <div className="mt-1 text-xs text-gray-500">Move your wallet money to your linked bank account.</div>
              <div className="mt-3 flex flex-col gap-3">
                <input
                  type="number"
                  min={100}
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder={bankConfigured ? 'Enter amount to send to bank' : 'Link a bank account first'}
                  className="input-field"
                  disabled={!bankConfigured}
                />
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={!bankConfigured || withdrawing || !withdrawAmount}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {withdrawing ? 'Sending to bank...' : 'Send to bank account'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-4">
              <h2 className="font-display font-bold text-kavach-dark">Add money to wallet</h2>
              <p className="mt-1 text-sm text-gray-500">Keep enough balance for coverage and add any custom amount you want.</p>
            </div>
            <input
              type="number"
              placeholder="Enter custom amount (min Rs 24)"
              value={customAmount}
              onChange={(event) => {
                setCustomAmount(event.target.value);
                setSelectedAmount(null);
              }}
              className="input-field mb-4"
              min={24}
              step="1"
              max={50000}
            />
            <div className="mb-4 text-xs text-gray-500">
              Custom top-up is supported. Minimum Rs 24.
            </div>
            <button
              onClick={handleTopUp}
              disabled={topping || (!selectedAmount && !customAmount)}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {topping ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                `Add Rs ${customAmount || selectedAmount || '-'}`
              )}
            </button>
          </div>

          <div className="card">
            <div className="mb-4">
              <h2 className="font-display font-bold text-kavach-dark">Claim payout destination</h2>
              <p className="mt-1 text-sm text-gray-500">Choose where approved claim money should arrive.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {['wallet', 'upi', 'bank'].map((method) => {
                const methodMeta = payoutMethods.find((item) => item.id === method);
                const configured = method === 'wallet' || methodMeta?.configured;

                return (
                  <button
                    key={method}
                    type="button"
                    disabled={!configured || savingMethod}
                    onClick={() => updateDefaultMethod(method)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      defaultMethod === method ? 'border-kavach-orange bg-orange-50' : 'border-gray-200 bg-white'
                    } ${!configured ? 'cursor-not-allowed opacity-50' : 'hover:border-orange-200'}`}
                  >
                    <div className="font-semibold capitalize text-kavach-dark">{method}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {method === 'wallet'
                        ? 'Instant wallet credit'
                        : method === 'upi'
                          ? configured
                            ? 'Send claim payouts to your UPI ID'
                            : 'Configure UPI first'
                          : configured
                            ? 'Send claim payouts to your bank account'
                            : 'Configure bank first'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="text-sm font-semibold text-kavach-dark">UPI payout setup</div>
            <div className="mt-1 text-sm text-gray-500">Use this if you want claim money sent straight to UPI.</div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                className="input-field"
                placeholder="worker@okbank"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
              />
              <button type="button" onClick={saveUpi} disabled={savingMethod || !upiId} className="btn-secondary">
                Save UPI
              </button>
            </div>
          </div>

          <div className="card">
            <div className="text-sm font-semibold text-kavach-dark">Bank account setup</div>
            <div className="mt-1 text-sm text-gray-500">Link your bank once to receive claim payouts and transfer wallet money out.</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                className="input-field"
                placeholder="Account holder name"
                value={bankForm.accountHolderName}
                onChange={(event) => setBankForm((current) => ({ ...current, accountHolderName: event.target.value }))}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Bank name"
                value={bankForm.bankName}
                onChange={(event) => setBankForm((current) => ({ ...current, bankName: event.target.value }))}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Account number"
                value={bankForm.accountNumber}
                onChange={(event) => setBankForm((current) => ({ ...current, accountNumber: event.target.value }))}
              />
              <input
                type="text"
                className="input-field"
                placeholder="IFSC code"
                value={bankForm.ifscCode}
                onChange={(event) => setBankForm((current) => ({ ...current, ifscCode: event.target.value.toUpperCase() }))}
              />
            </div>
            <button type="button" onClick={saveBank} disabled={savingMethod} className="btn-secondary mt-4">
              Save bank account
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-display font-bold text-kavach-dark">Transaction history</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="heat-shimmer h-14 rounded-xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <div className="mb-2 text-3xl">-</div>
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx) => {
                const meta = txIcons[tx.type] || { icon: '.', label: tx.type, bg: 'bg-gray-100' };
                const isCredit = tx.amount > 0;

                return (
                <div key={tx._id} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${meta.bg}`}>
                    {meta.icon}
                  </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-kavach-dark">{meta.label}</div>
                      <div className="truncate text-xs text-gray-400">{tx.description}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                    <div className={`font-display text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : ''}
                      Rs {Math.abs(tx.amount)}
                    </div>
                      <div className="text-xs text-gray-300">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {page < totalPages && (
                <button
                  onClick={() => loadData(page + 1)}
                  className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-kavach-orange transition-colors hover:bg-orange-50"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
