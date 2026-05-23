import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { useSessionRoom } from '@/hooks/useSessionRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { toggleCamera, toggleMute } from '@/redux/slice/sessionSlice';
import VideoArea from '@/components/modules/sessions/VideoArea';
import ConversationPanel from '@/components/modules/sessions/ConversationPanel';
import ControlBar from '@/components/modules/sessions/ControlBar';

export default function SessionScreen() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.session);
  const { offerDraw, acceptDraw, declineDraw, resign } = useSessionRoom();
  const { localVideoRef, remoteVideoRef, remoteStream, partnerConnected } = useWebRTC();

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
        onOfferDraw={offerDraw}
        onAcceptDraw={acceptDraw}
        onDeclineDraw={declineDraw}
        onResign={() => {
          if (window.confirm('Resign? Your opponent gets +50 XP and you lose 50.')) {
            resign();
          }
        }}
      />
    </div>
  );
}
