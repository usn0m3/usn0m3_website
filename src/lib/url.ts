/** Join the site's base path and a root-relative site path ("/about/"). */
export function withBase(base: string, path: string): string {
	return `${base.replace(/\/+$/, '')}${path}`;
}

/**
 * Link to a page or file of this site. Always use this instead of a bare "/..."
 * so links keep working when the site is served under a base path.
 */
export function url(path: string): string {
	return withBase(import.meta.env.BASE_URL, path);
}
