import { useEffect, useRef } from 'react';

interface ArticleRendererProps {
  content: string;
}

export function ArticleRenderer({ content }: ArticleRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Add syntax highlighting to code blocks
    const codeBlocks = containerRef.current.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      block.classList.add('hljs');
    });

    // Handle images - ensure proper display
    const images = containerRef.current.querySelectorAll('img');
    images.forEach(img => {
      const el = img as HTMLImageElement;
      const layout = el.getAttribute('data-layout');
      const isFloated = layout === 'inline-left' || layout === 'inline-right';
      
      if (!isFloated) {
        if (!el.style.display) {
          el.style.display = 'block';
        }
        if (!el.style.margin) {
          el.style.margin = '1.5em auto';
        }
      }
    });
  }, [content]);

  // If content is empty or undefined, show placeholder
  if (!content || content.trim() === '') {
    return (
      <div className="text-muted-foreground italic">
        No content yet. Start writing or generate with AI.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
