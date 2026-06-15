import React from 'react';
import 'katex/dist/katex.min.css';
// @ts-ignore
import Latex from 'react-latex-next';

interface MathRendererProps {
  text: string;
  className?: string;
  id?: string;
}

export default function MathRenderer({ text, className = '', id }: MathRendererProps) {
  // Ensure we render using standard Latex delimiters support
  return (
    <div className={`math-renderer ${className}`} id={id}>
      <Latex>{text}</Latex>
    </div>
  );
}
