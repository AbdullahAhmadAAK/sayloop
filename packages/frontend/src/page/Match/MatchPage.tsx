import { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '@/components/layout/PageShell';
import TopicPicker from '@/components/modules/match/TopicPicker';
import WaitingScreen from '@/components/modules/match/WaitingScreen';
import IncomingRequests from '@/components/modules/match/IncomingRequests';
import MatchHistory from '@/components/modules/match/MatchHistory';
import MatchHowItWorks from '@/components/modules/match/MatchHowItWorks';
import MatchLiveBar from '@/components/modules/match/MatchLiveBar';
import OnlinePartnerPicker from '@/components/modules/match/OnlinePartnerPicker';
import Button from '@/components/ui/Button';
import { getTopic } from '@/constants/topics';
import {
  acceptMatchChallenge,
  applyMatchAccepted,
  applySendSuccess,
  fetchOnlineUsers,
  fetchPendingRequests,
  rejectMatchRequest,
  sendMatchChallenge,
  socketRejectMatch,
} from '@/lib/matchApi';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  resetMatchFlow,
  setPendingRequests,
  setPartners,
  setSelectedPartner,
  setSending,
  setTopic,
  setToast,
} from '@/redux/slice/matchSlice';
import type { TopicId } from '@/constants/topics';

type Tab = 'challenge' | 'invites' | 'history';

export default function MatchPage() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('challenge');
  const [refreshing, setRefreshing] = useState(false);
  const match = useAppSelector((s) => s.match);
  const pendingCount = match.pendingRequests.length;

  const selectedPartner = useMemo(
    () => match.partners.find((p) => p.id === match.selectedPartnerId) ?? null,
    [match.partners, match.selectedPartnerId],
  );

  const topicMeta = getTopic(match.selectedTopic);

  const loadBrowse = useCallback(async () => {
    setRefreshing(true);
    try {
      const users = await fetchOnlineUsers();
      dispatch(setPartners(users));
    } catch {
      dispatch(
        setToast(
          'Cannot reach server. Run backend: cd sayloop-backend && npm run dev',
        ),
      );
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const loadPending = useCallback(async () => {
    try {
      const requests = await fetchPendingRequests();
      dispatch(setPendingRequests(requests));
    } catch {
      /* optional */
    }
  }, [dispatch]);

  useEffect(() => {
    loadBrowse();
    loadPending();
    const interval = setInterval(loadBrowse, 8000);
    return () => clearInterval(interval);
  }, [loadBrowse, loadPending]);

  const handleSendChallenge = async () => {
    if (!selectedPartner) {
      dispatch(setToast('Tap a person from the list first'));
      return;
    }
    dispatch(setSending(true));
    try {
      const res = await sendMatchChallenge(selectedPartner, match.selectedTopic);
      if (!res.ok || !res.matchId) {
        dispatch(setToast(res.message || 'Could not send challenge'));
        dispatch(setSending(false));
        return;
      }
      applySendSuccess(dispatch, selectedPartner, res.matchId);
      dispatch(setToast(`Challenge sent to ${selectedPartner.nickname}!`));
    } catch {
      dispatch(setToast('Could not send challenge'));
      dispatch(setSending(false));
    }
  };

  const handleAcceptRequest = async (id: string) => {
    const res = await acceptMatchChallenge(id);
    if (!res.ok) {
      dispatch(setToast(res.message || 'Could not accept'));
      return;
    }
    if (res.payload) {
      applyMatchAccepted(dispatch, res.payload);
      dispatch(setToast(`Accepted! Tap "I'm ready" when ${res.payload.partner.nickname} is set.`));
    }
  };

  const handleRejectRequest = async (id: string) => {
    const res = await socketRejectMatch(id);
    if (!res.ok) await rejectMatchRequest(id);
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'challenge', label: 'Challenge' },
    { id: 'invites', label: 'Invites', badge: pendingCount },
    { id: 'history', label: 'History' },
  ];

  const canSend = Boolean(selectedPartner) && !match.sending;

  return (
    <PageShell title="Challenge a partner" hideRight>
      <div className="mx-auto max-w-lg pb-32">
        <MatchLiveBar />
        <MatchHowItWorks />

        <div className="mb-5 flex rounded-2xl bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                tab === t.id ? 'bg-brand text-white shadow-sm' : 'text-ink/60'
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-extrabold text-white">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'challenge' && (
          <>
            {match.mode === 'browse' && (
              <>
                <section className="mb-6">
                  <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-ink">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">
                      1
                    </span>
                    Who do you want to challenge?
                  </h2>
                  <p className="mb-3 text-sm text-ink/55">
                    Only people <strong>online right now</strong> appear here.
                  </p>
                  <OnlinePartnerPicker
                    users={match.partners}
                    selectedId={match.selectedPartnerId}
                    onSelect={(id) => dispatch(setSelectedPartner(id))}
                    onRefresh={loadBrowse}
                    loading={refreshing}
                  />
                </section>

                <section className="mb-6">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-ink">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">
                      2
                    </span>
                    Pick a debate topic
                  </h2>
                  <TopicPicker
                    selected={match.selectedTopic}
                    onSelect={(id: TopicId) => dispatch(setTopic(id))}
                  />
                </section>

                {selectedPartner && (
                  <section className="mb-4 rounded-2xl border border-brand/20 bg-white p-4">
                    <p className="text-xs font-bold uppercase text-ink/45">Your challenge</p>
                    <p className="mt-1 text-lg font-extrabold text-ink">
                      {selectedPartner.nickname} · {topicMeta?.emoji} {topicMeta?.label}
                    </p>
                  </section>
                )}
              </>
            )}

            {match.mode === 'waiting' && match.activePartner && (
              <WaitingScreen
                partner={match.activePartner}
                onCancel={() => dispatch(resetMatchFlow())}
              />
            )}
          </>
        )}

        {tab === 'invites' && (
          <IncomingRequests
            requests={match.pendingRequests}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        )}

        {tab === 'history' && <MatchHistory history={match.history} />}
      </div>

      {tab === 'challenge' && match.mode === 'browse' && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-ink/10 bg-cream/95 px-4 py-4 backdrop-blur-md lg:bottom-0 lg:left-64">
          <div className="mx-auto max-w-lg">
            <p className="mb-2 text-center text-xs font-bold text-ink/45">
              Step 3 — Send the challenge
            </p>
            <Button
              fullWidth
              size="lg"
              disabled={!canSend}
              onClick={handleSendChallenge}
              className="py-4 text-base shadow-lg shadow-brand/25"
            >
              {match.sending
                ? 'Sending challenge…'
                : selectedPartner
                  ? `♟️ Send challenge to ${selectedPartner.nickname}`
                  : 'Select someone above first'}
            </Button>
            {!selectedPartner && match.partners.length > 0 && (
              <p className="mt-2 text-center text-xs text-brand">
                ↑ Tap a name in the list to continue
              </p>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
