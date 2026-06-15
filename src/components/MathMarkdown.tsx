import React from 'react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

// Helper to recursively wrap string child endpoints with Latex renderer
function renderLatexNode(node: any): any {
  if (typeof node === 'string') {
    return <Latex>{node}</Latex>;
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      if (typeof child === 'string') {
        return <Latex key={index}>{child}</Latex>;
      }
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement<any>;
        if (element.props && element.props.children) {
          return React.cloneElement(element, {
            ...element.props,
            children: renderLatexNode(element.props.children)
          });
        }
      }
      return child;
    });
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    if (element.props && element.props.children) {
      return React.cloneElement(element, {
        ...element.props,
        children: renderLatexNode(element.props.children)
      });
    }
  }
  return node;
}

interface MathMarkdownProps {
  children: string;
  className?: string;
}

export default function MathMarkdown({ children, className = '' }: MathMarkdownProps) {
  // We override standard text nodes or typical parents to map LaTeX correctly.
  // Overriding standard inline text within elements inside ReactMarkdown
  return (
    <div className={`math-rendered-markdown ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-4 leading-relaxed">{renderLatexNode(children)}</p>,
          li: ({ children }) => <li className="mb-1 leading-relaxed">{renderLatexNode(children)}</li>,
          span: ({ children }) => <span>{renderLatexNode(children)}</span>,
          h1: ({ children }) => <h1 className="text-2xl font-black mt-6 mb-4">{renderLatexNode(children)}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-black mt-5 mb-3">{renderLatexNode(children)}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-black mt-4 mb-2">{renderLatexNode(children)}</h3>,
          h4: ({ children }) => <h4 className="text-base font-black mt-3 mb-2">{renderLatexNode(children)}</h4>,
          strong: ({ children }) => <strong className="font-bold text-primary">{renderLatexNode(children)}</strong>,
          em: ({ children }) => <em className="italic">{renderLatexNode(children)}</em>,
          td: ({ children }) => <td className="p-2 border-b border-white/5">{renderLatexNode(children)}</td>,
          th: ({ children }) => <th className="p-2 font-black border-b border-white/10">{renderLatexNode(children)}</th>
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
