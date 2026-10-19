import { describe, expect, it } from 'vitest';
import { exists } from './helpers';

describe('build smoke', () => {
	it('produces the home page', () => {
		expect(exists('index.html')).toBe(true);
	});
});
