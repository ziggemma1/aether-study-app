import React from 'react';
import { useVideoConfig, AbsoluteFill, interpolate, spring, useCurrentFrame, Sequence } from 'remotion';

const MockScannerUI: React.FC = () => {
  const frame = useCurrentFrame();
  const scanProgress = interpolate(frame % 60, [0, 50], [0, 100], { extrapolateRight: 'clamp' });
  
  return (
    <div className="w-80 h-96 bg-slate-800 rounded-3xl border-4 border-slate-700 relative overflow-hidden flex flex-col p-4 shadow-2xl">
      <div className="h-6 w-24 bg-slate-700 rounded-full mb-6 mx-auto" />
      <div className="flex-1 bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-700 p-4 flex flex-col gap-4">
        <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse" />
        {/* Scanning Line */}
        <div className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_20px_#7c3aed]" style={{ top: `${scanProgress}%` }} />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="w-10 h-10 rounded-full bg-slate-700" />
        <div className="w-10 h-10 rounded-full bg-slate-700" />
      </div>
    </div>
  );
};

const MockTimerUI: React.FC = () => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, 300], [0, 360]);

  return (
    <div className="w-80 h-80 bg-slate-900 rounded-full border-8 border-secondary/30 relative flex items-center justify-center shadow-2xl">
      <div className="absolute inset-0 border-8 border-secondary rounded-full border-t-transparent" style={{ transform: `rotate(${rotation}deg)` }} />
      <div className="text-center">
        <div className="text-5xl font-black text-white">25:00</div>
        <div className="text-xs text-secondary font-bold tracking-widest mt-2">DEEP FOCUS</div>
      </div>
    </div>
  );
};

const MockQuizUI: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div className="w-96 h-80 bg-slate-800 rounded-3xl border-4 border-slate-700 p-6 shadow-2xl">
      <div className="h-3 w-1/2 bg-secondary/20 rounded-full mb-6" />
      <div className="h-8 w-full bg-slate-700 rounded-lg mb-8" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => {
          const isCorrect = i === 2 && frame > 40;
          return (
            <div key={i} className={`h-12 rounded-xl border-2 flex items-center px-4 font-bold transition-all ${isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-700/30 border-slate-600 text-slate-400'}`}>
              Option {String.fromCharCode(64 + i)}
              {isCorrect && <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeatureSlide: React.FC<{
  title: string;
  subtitle: string;
  color: string;
  index: number;
  MockComponent: React.FC;
}> = ({ title, subtitle, color, index, MockComponent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const uiEntrance = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '100px', color: 'white', backgroundColor: '#020617' }}>
      <div className="flex-1 pr-12" style={{ opacity: entrance, transform: `translateX(${interpolate(entrance, [0, 1], [-100, 0])}px)` }}>
        <div style={{ 
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          background: `linear-gradient(to bottom right, ${color.includes('primary') ? '#7c3aed' : color.includes('secondary') ? '#db2777' : '#d97706'}, #000)`
        }}>
          {index + 1}
        </div>
        <h2 className="text-8xl font-black mb-6 tracking-tighter" style={{ fontSize: '80px' }}>
          {title}
        </h2>
        <p className="text-3xl text-slate-400 font-medium leading-relaxed max-w-xl">
          {subtitle}
        </p>
      </div>

      <div className="flex-1 flex justify-center" style={{ transform: `scale(${uiEntrance})`, opacity: uiEntrance }}>
        <MockComponent />
      </div>
    </AbsoluteFill>
  );
};

export const AppDemoReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#020617' }} className="font-sans">
      {/* Intro */}
      <Sequence durationInFrames={90}>
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent tracking-tighter" style={{ fontSize: '160px' }}>
                AETHER
            </h1>
            <div className="text-slate-500 font-bold tracking-[0.8em] mt-8">NEXT-GEN STUDY ENGINE</div>
        </AbsoluteFill>
      </Sequence>

      {/* Feature 1: OCR */}
      <Sequence from={90} durationInFrames={150}>
        <FeatureSlide 
          index={0}
          title="AI SCANNER"
          subtitle="Convert textbooks into organized modules with state-of-the-art OCR."
          color="from-primary"
          MockComponent={MockScannerUI}
        />
      </Sequence>

      {/* Feature 2: Timer */}
      <Sequence from={240} durationInFrames={150}>
        <FeatureSlide 
          index={1}
          title="FOCUS MODE"
          subtitle="Adaptive Pomodoro with spatial soundscapes for deep immersion."
          color="from-secondary"
          MockComponent={MockTimerUI}
        />
      </Sequence>

      {/* Feature 3: Quizzes */}
      <Sequence from={390} durationInFrames={150}>
        <FeatureSlide 
          index={2}
          title="SMART QUIZ"
          subtitle="AI-generated tests focused on your specific knowledge gaps."
          color="from-accent"
          MockComponent={MockQuizUI}
        />
      </Sequence>

      {/* Outro */}
      <Sequence from={540} durationInFrames={60}>
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-secondary font-bold tracking-[0.5em] mb-4 uppercase">Unlock Your Potential</div>
            <h1 className="text-8xl font-black text-white tracking-tighter" style={{ fontSize: '100px' }}>
                Aether Study
            </h1>
            <div className="mt-12 px-10 py-5 bg-primary rounded-full text-3xl font-bold hover:scale-105 transition-transform">JOIN THE FUTURE</div>
        </AbsoluteFill>
      </Sequence>

      {/* Global Grain/Noise Overlay */}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.05, background: 'url(https://grainy-gradients.vercel.app/noise.svg)', backgroundRepeat: 'repeat' }} />
    </AbsoluteFill>
  );
};


export const MyComposition: React.FC<{
  title: string;
  summary: string;
  topics: string[];
}> = ({ title, summary, topics }) => {
  // If we are on the reel page, we might want to show the specific material reel
  // But for the Demo, let's keep it clean
  return <AppDemoReel />;
};
