// GradientBackground — "Soft Pastel Blend" by @serafimcloud, imported from
// 21st.dev (https://21st.dev/@serafimcloud/components/soft-pastel-blend) and
// made with the 21st.dev Gradient Builder.
//
// Its 4-colour palette (#FBE9F0 pink, #CDE7F0 sky, #E6D6F5 lavender,
// #D6F0E4 mint) is the source of the app's pastel category scale — see the
// --pastel-* tokens in index.css, which are these exact values. Keeping them
// identical is what makes the page wash and the cards read as one system.
//
// Zero dependencies: one <div> that fills its parent.
//   <div className="relative h-96"><GradientBackground className="absolute inset-0" /></div>
export function GradientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        containerType: 'size',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-0.8cqmin',
          filter: 'blur(0.4cqmin)',
          backgroundColor: '#D6F0E4',
          backgroundImage:
            'radial-gradient(circle at 65.44% 45.18%, rgba(251, 233, 240, 1) 0%, rgba(251, 233, 240, 0) 45.3%), radial-gradient(circle at 28.2% 73.9%, rgba(205, 231, 240, 1) 0%, rgba(205, 231, 240, 0) 56.85%), radial-gradient(circle at 52.5% 19.29%, rgba(230, 214, 245, 1) 0%, rgba(230, 214, 245, 0) 68.75%), radial-gradient(circle at 79.87% 84.43%, rgba(214, 240, 228, 1) 0%, rgba(214, 240, 228, 0) 80.3%)',
        }}
      />
    </div>
  );
}
