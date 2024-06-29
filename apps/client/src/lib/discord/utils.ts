export function s3UrlRewriter(url: string) {
  if (import.meta.env.PROD) {
    return url.replace(/https?:\/\//, '').replace('r2.starlightlabs.co/', '/r2/');
  }
  return url;
}
