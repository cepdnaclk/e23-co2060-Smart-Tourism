// Kramdown emits Mermaid fences as code blocks rather than rendered diagrams.
async function renderDiagrams() {
  const blocks = document.querySelectorAll('pre code.language-mermaid, .language-mermaid pre code');
  if (!blocks.length) return;

  try {
    const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    await document.fonts.ready;

    for (const [index, block] of Array.from(blocks).entries()) {
      // Keep the original source visible if loading or rendering fails.
      const { svg } = await mermaid.render(`project-diagram-${index}`, block.textContent);
      const diagram = document.createElement('div');
      diagram.className = 'mermaid-diagram';
      diagram.style.overflowX = 'auto';
      diagram.innerHTML = svg;
      block.closest('pre').replaceWith(diagram);
    }
  } catch (error) {
    console.error('Unable to render project diagrams:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderDiagrams, { once: true });
} else {
  renderDiagrams();
}
