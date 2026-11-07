// A full-screen overlay (project case, CV) takes one history entry, so the browser's Back arrow closes it and
// leaves the page exactly where it was, like its own Back button does.
export const overlayPush = () => history.pushState({ overlay: true }, '');

// Close through history when the overlay owns the top entry; the popstate listener then runs the animated close.
export const overlayBack = (closeNow: () => void) => (history.state?.overlay ? history.back() : closeNow());
