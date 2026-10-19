import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { parse } from 'yaml';
import { postSchema, profileSchema, projectSchema } from './schemas';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	schema: postSchema,
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
	schema: ({ image }) => projectSchema(image),
});

// profile.yaml is a single object; wrap it as one entry with id "main".
const profile = defineCollection({
	loader: file('src/data/profile.yaml', { parser: (text) => [{ id: 'main', ...parse(text) }] }),
	schema: profileSchema,
});

export const collections = { blog, projects, profile };
