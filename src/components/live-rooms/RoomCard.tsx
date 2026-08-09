import { Users, Play, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '../ui/UserAvatar';

export interface RoomOccupant {
  id: string;
  name: string;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  subject: string;
  /** Live occupancy. socket.ts rewrites this on every join/leave/disconnect. */
  activeCount: number;
  /** Who is actually inside. Populated by GET /rooms; empty for idle rooms. */
  participants: RoomOccupant[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
}

interface RoomCardProps {
  room: Room;
  onJoin: (id: string) => void;
}

const MAX_FACES = 4;

const openedLabel = (createdAt: string) => {
  const d = new Date(createdAt);
  return isNaN(d.getTime()) ? null : formatDistanceToNow(d, { addSuffix: true });
};

/**
 * A room with people in it.
 *
 * Deliberately louder than the idle row below: live green edge and wash, a
 * pulsing indicator, real faces, the occupancy count as the headline figure,
 * and the solid primary CTA. Occupancy is the only thing that earns this
 * treatment — the point is that a busy room and a dead one should never be
 * mistakable at a glance.
 */
export function ActiveRoomCard({ room, onJoin }: RoomCardProps) {
  const { name, subject, activeCount, participants, maxParticipants, createdAt } = room;
  const faces = participants.slice(0, MAX_FACES);
  const overflow = Math.max(0, activeCount - faces.length);
  const opened = openedLabel(createdAt);

  return (
    <div className="group relative flex flex-col rounded-[var(--radius-card)] bg-live/[0.06] border border-live/35 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden">
      {/* Live wash. pointer-events-none so it never swallows the CTA. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 w-44 h-44 rounded-full bg-live/15 blur-3xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* line-clamp-2, not truncate: a two-word room name was fine but
              "Organic Chem — Finals Grind" lost its ending to an ellipsis. */}
          <h3 className="font-heading font-bold text-base tracking-tight leading-snug line-clamp-2 break-words group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 truncate">{subject}</p>
        </div>

        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-live/15 text-live-ink">
          {/* Shared primitive — hidden automatically under reduced motion. */}
          <span className="motion-live-dot text-live" />
          LIVE
        </span>
      </div>

      {/* Occupancy is the headline, not a footnote. */}
      <p className="relative mt-3 text-sm font-bold text-live-ink">
        {activeCount} studying now
        <span className="ml-1.5 text-xs font-medium text-text-muted">
          of {maxParticipants} seats
        </span>
      </p>

      {faces.length > 0 && (
        <div className="relative flex items-center -space-x-2 mt-3">
          {faces.map(p => (
            <span key={p.id} title={p.name}>
              <UserAvatar name={p.name} avatarUrl={p.avatar} size="sm" />
            </span>
          ))}
          {overflow > 0 && (
            <span className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-[11px] font-bold text-text-muted">
              +{overflow}
            </span>
          )}
        </div>
      )}

      {opened && (
        <p className="relative text-[11px] text-text-muted mt-3">opened {opened}</p>
      )}

      <button
        onClick={() => onJoin(room.id)}
        className="relative w-full mt-4 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
      >
        Join room <Play size={15} className="fill-white" />
      </button>
    </div>
  );
}

/**
 * An empty room.
 *
 * A compact row rather than a card, with a ghost action. Seven of these used
 * to be full-size cards carrying the same solid primary button as a busy room,
 * which is what made the screen read as uniformly dead — every room shouted
 * equally loudly about having nobody in it.
 */
export function IdleRoomRow({ room, onJoin }: RoomCardProps) {
  const { name, subject, maxParticipants, createdAt } = room;
  const opened = openedLabel(createdAt);

  return (
    <div className="group flex items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3 hover:border-primary/25 transition-colors">
      <span className="shrink-0 w-9 h-9 rounded-xl bg-surface-alt text-text-muted flex items-center justify-center">
        <Users size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm text-text-main leading-snug line-clamp-1 break-words">
          {name}
        </h3>
        <p className="text-[11px] text-text-muted truncate">
          {subject} · empty{opened ? ` · opened ${opened}` : ''} · {maxParticipants} seats
        </p>
      </div>

      {/* Ghost, not a primary button. Starting an empty room is a secondary
          action next to joining one that already has people in it. */}
      <button
        onClick={() => onJoin(room.id)}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-muted hover:text-text-main hover:border-primary/30 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
      >
        <Plus size={13} /> Start it
      </button>
    </div>
  );
}

/** Kept so any older import keeps compiling; routes to the right variant. */
export function RoomCard({ room, onJoin }: RoomCardProps) {
  return room.activeCount > 0
    ? <ActiveRoomCard room={room} onJoin={onJoin} />
    : <IdleRoomRow room={room} onJoin={onJoin} />;
}
