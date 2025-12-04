// Centralized Google Maps API Loader
declare global {
  interface Window {
    google: any;
    googleMapsLoaded?: boolean;
    googleMapsCallbacks?: (() => void)[];
  }
}

export function loadGoogleMaps(
  apiKey: string,
  libraries: string[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.google) {
      resolve();
      return;
    }

    // If already loading, add to callbacks
    if (window.googleMapsLoaded) {
      if (!window.googleMapsCallbacks) {
        window.googleMapsCallbacks = [];
      }
      window.googleMapsCallbacks.push(() => resolve());
      return;
    }

    // Initialize callbacks array
    if (!window.googleMapsCallbacks) {
      window.googleMapsCallbacks = [];
    }

    // Add our resolve callback
    window.googleMapsCallbacks.push(() => resolve());

    // Only load script once
    if (window.googleMapsCallbacks.length === 1) {
      const script = document.createElement("script");
      const librariesParam =
        libraries.length > 0 ? `&libraries=${libraries.join(",")}` : "";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        window.googleMapsLoaded = true;
        // Execute all queued callbacks
        window.googleMapsCallbacks?.forEach((callback) => callback());
        window.googleMapsCallbacks = [];
      };

      script.onerror = () => {
        window.googleMapsCallbacks = [];
        reject(new Error("Failed to load Google Maps API"));
      };

      document.head.appendChild(script);
    }
  });
}

export function isGoogleMapsLoaded(): boolean {
  return !!window.google;
}
