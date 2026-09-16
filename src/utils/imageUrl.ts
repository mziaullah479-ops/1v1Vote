export function imageVariant(url: string, width: number) {
  try {
    const parsed = new URL(url);
    const safeWidth = Math.max(64, Math.round(width));

    if (parsed.hostname === 'upload.wikimedia.org' || parsed.hostname === 'thumb.wikimedia.org') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'wikipedia' && parts[1] === 'commons' && parts.length >= 4) {
        const fileName = parts[parts.length - 1];
        const isThumb = parts[2] === 'thumb';
        const sourceParts = isThumb ? parts.slice(3, -1) : parts.slice(2);
        const sourceName = isThumb ? fileName.replace(/^\d+px-/i, '') : fileName;
        parsed.pathname = `/wikipedia/commons/thumb/${sourceParts.join('/')}/${safeWidth}px-${sourceName}`;
        return parsed.toString();
      }
    }

    if (parsed.hostname.endsWith('googleusercontent.com')) {
      parsed.search = parsed.search.replace(/=s\d+/i, `=s${safeWidth}`);
      parsed.pathname = parsed.pathname.replace(/=s\d+/i, `=s${safeWidth}`);
      return parsed.toString();
    }

    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('w', String(safeWidth));
      parsed.searchParams.set('q', '75');
      return parsed.toString();
    }

    return url;
  } catch {
    return url.replace(/\/\d+px-/i, `/${Math.max(64, Math.round(width))}px-`);
  }
}
