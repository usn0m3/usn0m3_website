import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, getProfile } from '../lib/collections';
import { url } from '../lib/url';

export async function GET(context: APIContext) {
	if (!context.site) throw new Error('Set `site` in astro.config.mjs to generate the RSS feed.');
	const [posts, profile] = await Promise.all([getPosts(), getProfile()]);
	return rss({
		title: `${profile.name} — Blog`,
		description: profile.intro,
		// The feed's home link and item links resolve against this, so it must include the base path.
		site: new URL(url('/'), context.site),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: post.data.tags,
			link: url(`/blog/${post.id}/`),
		})),
	});
}
