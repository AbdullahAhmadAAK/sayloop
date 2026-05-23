import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setLevelledUp } from '@/redux/slice/economySlice';

export default function LevelUpModal() {
  const dispatch = useAppDispatch();
  const { levelledUp, level, levelTitle } = useAppSelector((s) => s.economy);

  return (
    <Modal
      open={levelledUp}
      title="Level up!"
      onClose={() => dispatch(setLevelledUp(false))}
    >
      <div className="text-center">
        <p className="text-5xl">🎉</p>
        <p className="mt-4 text-2xl font-extrabold text-brand">Level {level}</p>
        <p className="font-bold text-ink">{levelTitle}</p>
        <Button className="mt-6" fullWidth onClick={() => dispatch(setLevelledUp(false))}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
