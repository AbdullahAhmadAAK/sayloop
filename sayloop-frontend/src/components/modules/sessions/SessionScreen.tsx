import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { useSessionRoom } from '@/hooks/useSessionRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { toggleCamera, toggleMute } from '@/redux/slice/sessionSlice';
import VideoArea from '@/components/modules/sessions/VideoArea';
import ConversationPanel from '@/components/modules/sessions/ConversationPanel';
import ControlBar from '@/components/modules/sessions/ControlBar';
import { DrawOfferModal, ResignModal } from '@/components/modules/sessions/SessionActionModals';

export default function SessionScreen() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.session);
  const { offerDraw, acceptDraw, declineDraw, resign } = useSessionRoom();
  const { localVideoRef, remoteVideoRef, remoteStream, partnerConnected, connecting } =
    useWebRTC();
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [resignModalOpen, setResignModalOpen] = useState(false);
  const [drawLoading, setDrawLoading] = useState(false);
  const [resignLoading, setResignLoading] = useState(false);

  const handleOfferDraw = async () => {
    setDrawLoading(true);
    try {
      await offerDraw();
      setDrawModalOpen(false);
    } finally {
      setDrawLoading(false);
    }
  };

  const handleResign = async () => {
    setResignLoading(true);
    try {
      await resign();
      setResignModalOpen(false);
    } finally {
      setResignLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <VideoArea
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        localMuted={session.isMuted}
        cameraOff={session.isCameraOff}
        partnerName={session.partnerName}
        mediaError={session.mediaError}
        partnerConnected={partnerConnected}
        connecting={connecting}
        hasRemoteStream={Boolean(remoteStream)}
      />
      <ConversationPanel topic={session.topic} timerSeconds={session.timerSeconds} />
      <ControlBar
        isMuted={session.isMuted}
        isCameraOff={session.isCameraOff}
        drawOfferPending={session.drawOfferPending}
        drawOfferIncoming={session.drawOfferIncoming}
        onToggleMute={() => dispatch(toggleMute())}
        onToggleCamera={() => dispatch(toggleCamera())}
        onAcceptDraw={acceptDraw}
        onDeclineDraw={declineDraw}
        onOfferDraw={() => setDrawModalOpen(true)}
        onResign={() => setResignModalOpen(true)}
      />

      <DrawOfferModal
        open={drawModalOpen}
        loading={drawLoading}
        onConfirm={() => void handleOfferDraw()}
        onCancel={() => setDrawModalOpen(false)}
      />
      <ResignModal
        open={resignModalOpen}
        loading={resignLoading}
        onConfirm={() => void handleResign()}
        onCancel={() => setResignModalOpen(false)}
      />
    </div>
  );
}
