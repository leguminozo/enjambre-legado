const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function getGoogleMapsScriptUrl(): string {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined');
  }
  return `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
}

export async function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = getGoogleMapsScriptUrl();
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = (error) => reject(error);

    document.head.appendChild(script);
  });
}
