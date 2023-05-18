export function fixLocalhost(url: string): string {
  return url.replace(/\/\/localhost/i, `//${window.location.hostname}`);
}
