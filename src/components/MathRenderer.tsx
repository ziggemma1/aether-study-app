import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
  id?: string;
}

export function renderMathToReactNodes(text: string): React.ReactNode[] {
  if (typeof text !== 'string') return [];
  
  const regex = /\$\$([\s\S]+?)\$\$|\$([\s\S]+?)\$/g;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    // Add text before the match
    if (matchIndex > lastIndex) {
      result.push(text.substring(lastIndex, matchIndex));
    }

    const blockMath = match[1];
    const inlineMath = match[2];
    const mathContent = blockMath || inlineMath;
    const isBlock = !!blockMath;

    try {
      const renderedHtml = katex.renderToString(mathContent, {
        displayMode: isBlock,
        throwOnError: false,
        trust: true
      });
      result.push(
        <span 
          key={matchIndex} 
          dangerouslySetInnerHTML={{ __html: renderedHtml }} 
          className={isBlock ? "block my-4 overflow-x-auto overflow-y-hidden" : "inline-block align-middle"}
        />
      );
    } catch (e) {
      console.error('[KATEX_RENDER_ERROR]', e);
      result.push(<span key={matchIndex}>{match[0]}</span>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}

export default function MathRenderer({ text, className = '', id }: MathRendererProps) {
  return (
    <div className={`math-renderer ${className}`} id={id}>
      {renderMathToReactNodes(text)}
    </div>
  );
}
