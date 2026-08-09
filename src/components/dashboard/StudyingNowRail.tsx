import { Link } from 'react-router-dom';
import { Radio, ArrowRight, Plus } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';
import { useLivePresence } from '../../hooks/useLivePresence';

/**
 * "N studying now" — live Live Rooms presence on the dashboard.
 *
 * Replaces a static shortcut tile that just linked to /rooms. The point is
 * that the social side of the product should be visible from the home screen
 * rather than discovered in a nav group, so this shows real people when there
 * are any and invites you to start a room when there aren't.
 */

const MAX_FACES = 5;

export function StudyingNowRail() {
  const { people, totalActive, busiestRoom, loading } = useLivePresence();

  const faces = people.slice(0, MAX_FACES);
  const overflow = Math.max(0, totalActive - faces.length);
  const isLive = totalActive > 0;

  return (
    <Link
      to="/rooms"
      className="soft-card-interactive block p-4"
      aria-label={isLive ? `${totalActive} people studying now in Live Rooms` : 'Start a Live Room'}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-pastel-sky text-pastel-sky-ink flex items-center justify-center shrink-0">
            <Radio size={17} />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-bold text-text-main leading-tight">
              {loading ? 'Live Rooms' : isLive ? `${totalActive} studying now` : 'Live Rooms'}
            </span>
            <span className="text-[11px] text-text-muted leading-tight">
              {loading
                ? 'Checking who\'s in…'
                : isLive
                  ? busiestRoom
                    ? `Busiest: ${busiestRoom.name}`
                    : 'Join a room'
                  : 'Nobody\'s in a room right now'}
            </span>
          </span>
        </span>

        {isLive && (
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
        )}
      </div>

      {isLive ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center -space-x-2">
            {faces.map(person => (
              <span key={`${person.roomId}-${person.id}`} title={`${person.name} · ${person.roomName}`}>
                <UserAvatar name={person.name} avatarUrl={person.avatar} size="sm" />
              </span>
            ))}
            {overflow > 0 && (
              <span className="w-8 h-8 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-[11px] font-bold text-text-muted">
                +{overflow}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-primary inline-flex items-center gap-0.5 shrink-0">
            Join <ArrowRight size={12} />
          </span>
        </div>
      ) : (
        <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">
          <Plus size={13} /> Start a room
        </span>
      )}
    </Link>
  );
}
