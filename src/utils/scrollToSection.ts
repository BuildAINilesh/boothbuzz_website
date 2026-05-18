/** Scroll to a page section by id (matches App nav: gallery → event-archives). */
export function scrollToSection(sectionId: string): void {
  const targetId = sectionId === 'gallery' ? 'event-archives' : sectionId;
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  window.dispatchEvent(new CustomEvent('boothbuzz-navigate-section', { detail: sectionId }));
}

export function scrollToContactSection(): void {
  scrollToSection('contact');
}
