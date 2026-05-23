import { useQuery } from '@tanstack/react-query';
import { Copy, Users, Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import { PageLoader } from '../../components/shared/PageLoader.jsx';
import { formatDate, formatCoins } from '../../lib/utils.js';

export default function ReferralsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => api.get('/users/referrals').then((r) => r.data.data),
  });

  const copyLink = () => {
    navigator.clipboard.writeText(data?.referralLink || '');
    toast.success('Referral link copied!');
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Referral Program</h1>
        <p className="text-text-secondary mt-1">Invite friends and earn coins for every signup</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <Users size={24} className="text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">{data?.totalReferred || 0}</p>
          <p className="text-text-secondary text-sm">People Referred</p>
        </div>
        <div className="card text-center">
          <Coins size={24} className="text-warning mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">{formatCoins(data?.referralEarnings)} 🪙</p>
          <p className="text-text-secondary text-sm">Coins Earned</p>
        </div>
        <div className="card text-center">
          <Coins size={24} className="text-success mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-primary">50 🪙</p>
          <p className="text-text-secondary text-sm">Per Referral</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="card mb-6">
        <h3 className="font-semibold text-text-primary mb-3">Your Referral Link</h3>
        <div className="flex gap-2">
          <input
            readOnly
            value={data?.referralLink || ''}
            className="input flex-1 text-sm font-mono bg-background"
          />
          <button onClick={copyLink} className="btn-primary flex items-center gap-2 shrink-0">
            <Copy size={14} /> Copy
          </button>
        </div>
        <p className="text-text-muted text-xs mt-2">Share this link. Earn 50 coins for each friend who registers.</p>
      </div>

      {/* Referred users */}
      {data?.referredUsers?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Referred Users</h3>
          <div className="divide-y divide-border">
            {data.referredUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-text-primary text-sm">{u.name}</p>
                  <p className="text-text-muted text-xs">{u.email}</p>
                </div>
                <p className="text-text-muted text-xs">{formatDate(u.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
