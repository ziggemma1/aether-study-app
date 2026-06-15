import React from 'react';
import MathRenderer from '../components/MathRenderer';
import MathMarkdown from '../components/MathMarkdown';

export default function TestMath() {
  const testMarkdownContent = `
# LaTeX & KaTeX Rendering Playground

This page demonstrates high-fidelity mathematical notation rendering integrated into **Aether Study** summaries, key terms, and detailed notes.

## 📐 The Quadratic Equation
The solution to the quadratic equation $ax^2 + bx + c = 0$ is given by the beautiful **quadratic formula**:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

We can easily isolate the discriminant $\\Delta = b^2 - 4ac$.

## 🔬 Physics Relativities
Einstein's most famous mass-energy equivalence equation:

$$E = mc^2$$

And Planck's equation for energy of a photon:

$$E = h\\nu = \\frac{hc}{\\lambda}$$

## 📈 Calculus & Integrals
The fundamental theorem of calculus:

$$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$$

We can also express a normal distribution:

$$f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2} \\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$

## 🧬 List of Mathematical Definitions
- **Euler's Identity**: $e^{i\\pi} + 1 = 0$, which links five fundamental mathematical constants.
- **Summation of Squares**: $\\sum_{k=1}^n k^2 = \\frac{n(n+1)(2n+1)}{6}$.
`;

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto bg-surface rounded-3xl border border-white/5 shadow-2xl my-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-text-main">Aether Math Arena</h1>
          <p className="text-text-muted text-xs uppercase tracking-widest font-semibold mt-1">LaTeX Notation & Formula Verification</p>
        </div>
        <span className="text-xs bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full font-black">
          ACTIVE RECALL ON
        </span>
      </div>

      <div className="space-y-8">
        <section className="p-6 bg-background rounded-2xl border border-white/5">
          <h2 className="text-sm font-black uppercase text-primary tracking-wider mb-4">1. Direct MathRenderer Rendering</h2>
          <MathRenderer text="Here is inline math: $S = k \\ln \\Omega$ (Boltzmann entropy), and here is a block display: $$H\\psi = E\\psi$$" />
        </section>

        <section className="p-6 bg-background rounded-2xl border border-white/5">
          <h2 className="text-sm font-black uppercase text-primary tracking-wider mb-4">2. Combined Markdown + LaTeX Rendering (MathMarkdown)</h2>
          <MathMarkdown>{testMarkdownContent}</MathMarkdown>
        </section>
      </div>
    </div>
  );
}
