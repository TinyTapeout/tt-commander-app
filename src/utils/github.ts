export function extractRepoFromURL(githubUrl: string) {
  try {
    const url = new URL(githubUrl);
    if (url.hostname.toLowerCase() !== 'github.com') {
      return null;
    }

    const pathParts = url.pathname.split('/').slice(1);
    if (pathParts.length < 2) {
      return null;
    }

    return pathParts.slice(0, 2).join('/');
  } catch (err) {
    return null;
  }
}
