const strip = (value: string | undefined) => value?.replace(/^"|"$/g, "");

/**
 * Supabase's Vercel integration sets POSTGRES_URL_NON_POOLING to the
 * session-mode pooler (port 5432). That mode supports the prepared statements
 * and advisory locks EmDash uses. POSTGRES_URL is transaction mode on port
 * 6543, which does not.
 */
export function supabaseConnectionString(): string | undefined {
	return strip(process.env.POSTGRES_URL_NON_POOLING);
}
