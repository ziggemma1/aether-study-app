import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Headphones, Palette, Snowflake, Check, Loader2, Volume2, Play
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import api from '../services/api';
import { previewVoice, playAudio } from '../services/ttsService';
import { SHOP_ITEMS, ShopItem, ownsItem, DEFAULT_VOICE } from '../lib/shopCatalog';
import { PageHeader } from '../components/ui/PageHeader';
import { CountUp } from '../components/motion/CountUp';

export default function Shop() {
  const { user, showToast, setUser } = useAppContext();

  const points = user?.aetherPoints || 0;
  const freezeTokens = user?.freezeTokens || 0;
  const owned = user?.themeUnlocked || [];
  const equippedTheme = user?.equippedTheme || '';
  const equippedVoice = user?.equippedVoice || DEFAULT_VOICE;

  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [previewing, setPreviewing] = React.useState<string | null>(null);

  const utilities = SHOP_ITEMS.filter((i) => i.kind === 'utility');
  const themes = SHOP_ITEMS.filter((i) => i.kind === 'theme');
  const voices = SHOP_ITEMS.filter((i) => i.kind === 'voice');

  const buy = async (item: ShopItem) => {
    setBusyId(item.id);
    try {
      const { data } = await api.post('/users/shop/purchase', { itemId: item.id });
      if (setUser && user) {
        setUser({
          ...user,
          aetherPoints: data.aetherPoints,
          freezeTokens: data.freezeTokens,
          themeUnlocked: data.themeUnlocked
        });
      }
      showToast(
        item.kind === 'utility'
          ? `Streak freeze added. You have ${data.freezeTokens}.`
          : `${item.name} unlocked — equip it whenever you like.`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'That purchase did not go through.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  /** Equip an owned theme/voice, or pass null to go back to the default. */
  const equip = async (item: ShopItem | null, kind: 'theme' | 'voice') => {
    setBusyId(item?.id || `default-${kind}`);
    try {
      const { data } = await api.post('/users/shop/equip', { itemId: item?.id || null, kind });
      if (setUser && user) {
        setUser({ ...user, equippedTheme: data.equippedTheme, equippedVoice: data.equippedVoice });
      }
      showToast(item ? `${item.name} is now active.` : 'Back to the default.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Could not switch to that.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Hear a voice before buying it. The shop used to sell voices with no way to
   * sample one — and the names it sold ("Atlas (Deep UK)", "Nova (Bright US)")
   * did not exist at all, since speech was hardcoded to a single Gemini voice.
   */
  const preview = async (id: string) => {
    setPreviewing(id);
    try {
      const audio = await previewVoice(id);
      if (audio) playAudio(audio);
      else showToast('The voice preview is unavailable right now.', 'error');
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || 'The voice preview is unavailable right now.',
        'error'
      );
    } finally {
      setPreviewing(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full min-w-0 pb-24">
      <PageHeader
        title="Aether Shop"
        subtitle="Spend the points you earn from study sessions and quizzes."
        action={
          <div className="flex items-center gap-2">
            <Balance icon={<Zap size={15} className="text-pastel-peach-ink" />} value={points} label="points" />
            <Balance icon={<Snowflake size={15} className="text-pastel-sky-ink" />} value={freezeTokens} label="freezes" />
          </div>
        }
      />

      <div className="space-y-8">
        {/* ---- Utilities ---- */}
        <Section icon={<Snowflake size={16} className="text-pastel-sky-ink" />} title="Utilities">
          {utilities.map((item) => (
            <div
              key={item.id}
              className="sm:col-span-2 lg:col-span-3 rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <span className="w-11 h-11 shrink-0 rounded-xl bg-pastel-sky text-pastel-sky-ink flex items-center justify-center">
                <Snowflake size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-main">{item.name}</h3>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{item.description}</p>
                {freezeTokens > 0 && (
                  <p className="text-xs text-text-muted mt-1.5">
                    You have {freezeTokens} {freezeTokens === 1 ? 'freeze' : 'freezes'} saved.
                  </p>
                )}
              </div>
              <BuyButton item={item} points={points} busy={busyId === item.id} onBuy={() => buy(item)} />
            </div>
          ))}
        </Section>

        {/* ---- Themes ---- */}
        <Section icon={<Palette size={16} className="text-pastel-lavender-ink" />} title="Accent themes">
          {/* The default is a card like any other, so switching back is a real
              control rather than something you have to guess at. */}
          <ThemeCard
            name="Aether"
            description="The default violet."
            swatch={['#6C5CE7', '#0089B0', '#0E9F6E']}
            owned
            equipped={equippedTheme === ''}
            busy={busyId === 'default-theme'}
            onEquip={() => equip(null, 'theme')}
          />
          {themes.map((item) => {
            const isOwned = ownsItem(owned, item.id);
            return (
              <ThemeCard
                key={item.id}
                name={item.name}
                description={item.description}
                swatch={item.swatch!}
                owned={isOwned}
                equipped={equippedTheme === item.value}
                cost={item.cost}
                affordable={points >= item.cost}
                busy={busyId === item.id}
                onBuy={() => buy(item)}
                onEquip={() => equip(item, 'theme')}
              />
            );
          })}
        </Section>

        {/* ---- Voices ---- */}
        <Section icon={<Headphones size={16} className="text-pastel-mint-ink" />} title="Read-aloud voices">
          <VoiceCard
            name={DEFAULT_VOICE}
            description="Clear and level. Included with every account."
            owned
            equipped={equippedVoice === DEFAULT_VOICE}
            busy={busyId === 'default-voice'}
            previewing={previewing === DEFAULT_VOICE}
            onEquip={() => equip(null, 'voice')}
            onPreview={() => preview(DEFAULT_VOICE)}
          />
          {voices.map((item) => {
            const isOwned = ownsItem(owned, item.id);
            const isEquipped = equippedVoice === item.value;
            return (
              <VoiceCard
                key={item.id}
                name={item.name}
                description={item.description}
                owned={isOwned}
                equipped={isEquipped}
                cost={item.cost}
                affordable={points >= item.cost}
                busy={busyId === item.id}
                previewing={previewing === item.id}
                onBuy={() => buy(item)}
                onEquip={() => equip(item, 'voice')}
                onPreview={() => preview(item.id)}
              />
            );
          })}
        </Section>
      </div>

      <p className="text-xs text-text-muted mt-8 text-center max-w-md mx-auto leading-relaxed">
        Points come from finishing study sessions and quizzes. Themes and voices
        are yours permanently once bought; freezes are spent one at a time.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function Balance({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    /* The label drops below `sm`: at 390px the two pills together were wide
       enough to push "Aether Shop" onto two lines. */
    <span
      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface border border-border"
      title={`${value.toLocaleString()} ${label}`}
    >
      {icon}
      <span className="font-mono text-sm font-bold text-text-main tabular-nums"><CountUp value={value} /></span>
      <span className="hidden sm:inline text-[11px] text-text-muted">{label}</span>
    </span>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      {/* Two columns, not three: the shop has never had more than four items in
          a row and a 3-column grid left a permanently ragged right edge. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function BuyButton({
  item, points, busy, onBuy
}: { item: ShopItem; points: number; busy: boolean; onBuy: () => void }) {
  const affordable = points >= item.cost;
  return (
    <button
      onClick={onBuy}
      disabled={busy || !affordable}
      title={affordable ? undefined : `You need ${(item.cost - points).toLocaleString()} more points`}
      className={cn(
        'shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] cursor-pointer',
        affordable
          ? 'bg-primary hover:bg-primary/90 text-white active:scale-[0.98]'
          : 'bg-surface-alt text-text-muted border border-border cursor-not-allowed'
      )}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={14} className="fill-current" />}
      {item.cost}
    </button>
  );
}

/** Shared footer for a purchasable card: locked, owned, or active. */
function CardAction({
  owned, equipped, cost, affordable, busy, onBuy, onEquip
}: {
  owned: boolean;
  equipped: boolean;
  cost?: number;
  affordable?: boolean;
  busy: boolean;
  onBuy?: () => void;
  onEquip: () => void;
}) {
  if (equipped) {
    return (
      <span className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-semibold min-h-[44px]">
        <Check size={15} /> Active
      </span>
    );
  }

  if (owned) {
    return (
      <button
        onClick={onEquip}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 min-h-[44px] cursor-pointer"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : null} Use this
      </button>
    );
  }

  return (
    <button
      onClick={onBuy}
      disabled={busy || !affordable}
      title={affordable ? undefined : 'Not enough points yet'}
      className={cn(
        'w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] cursor-pointer',
        affordable
          ? 'bg-surface-alt hover:bg-primary/10 hover:text-primary text-text-main border border-border'
          : 'bg-surface-alt text-text-muted border border-border cursor-not-allowed'
      )}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={14} className="fill-current" />}
      {cost}
    </button>
  );
}

function ThemeCard({
  name, description, swatch, owned, equipped, cost, affordable, busy, onBuy, onEquip
}: {
  name: string;
  description: string;
  swatch: [string, string, string];
  owned: boolean;
  equipped: boolean;
  cost?: number;
  affordable?: boolean;
  busy: boolean;
  onBuy?: () => void;
  onEquip: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        'rounded-[var(--radius-card)] bg-surface border shadow-[var(--shadow-card)] p-5 flex flex-col',
        equipped ? 'border-primary/40' : 'border-border'
      )}
    >
      {/* A colour swatch, because the old theme cards showed the same grey
          palette glyph for every theme — you bought a colour scheme sight
          unseen. Inline style: these are literal item colours, not tokens, and
          a class built from a template literal would not compile. */}
      <div className="flex items-center gap-1.5 mb-3">
        {swatch.map((c, i) => (
          <span
            key={i}
            className="h-8 flex-1 rounded-lg border border-border/60"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <h3 className="font-semibold text-text-main">{name}</h3>
      <p className="text-sm text-text-muted mt-0.5 mb-4 leading-relaxed flex-1">{description}</p>

      <CardAction
        owned={owned}
        equipped={equipped}
        cost={cost}
        affordable={affordable}
        busy={busy}
        onBuy={onBuy}
        onEquip={onEquip}
      />
    </motion.div>
  );
}

function VoiceCard({
  name, description, owned, equipped, cost, affordable, busy, previewing, onBuy, onEquip, onPreview
}: {
  name: string;
  description: string;
  owned: boolean;
  equipped: boolean;
  cost?: number;
  affordable?: boolean;
  busy: boolean;
  previewing?: boolean;
  onBuy?: () => void;
  onEquip: () => void;
  onPreview?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        'rounded-[var(--radius-card)] bg-surface border shadow-[var(--shadow-card)] p-5 flex flex-col',
        equipped ? 'border-primary/40' : 'border-border'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="w-11 h-11 shrink-0 rounded-xl bg-pastel-mint text-pastel-mint-ink flex items-center justify-center">
          <Volume2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-main">{name}</h3>
          <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      {onPreview && (
        <button
          onClick={onPreview}
          disabled={previewing}
          className="self-start mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-60 cursor-pointer"
        >
          {previewing
            ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
            : <><Play size={13} className="fill-current" /> Hear a sample</>}
        </button>
      )}

      <div className="mt-auto">
        <CardAction
          owned={owned}
          equipped={equipped}
          cost={cost}
          affordable={affordable}
          busy={busy}
          onBuy={onBuy}
          onEquip={onEquip}
        />
      </div>
    </motion.div>
  );
}
