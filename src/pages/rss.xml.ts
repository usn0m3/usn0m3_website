import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, getProfile } from '../lib/collections';

export async function GET(context: APIContext) {
	if (!context.site) throw new Error('Set `site` in astro.config.mjs to generate the RSS feed.');
	const [posts, profile] = await Promise.all([getPosts(), getProfile()]);
	return rss({
		title: `${profile.name} — Blog`,
		description: profile.intro,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: post.data.tags,
			link: `/blog/${post.id}/`,
		})),
	});
}
