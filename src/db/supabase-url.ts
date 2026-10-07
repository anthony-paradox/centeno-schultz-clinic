const strip = (value: string | undefined) => value?.replace(/^"|"$/g, "");

/**
 * pg currently treats require, prefer, and verify-ca as verify-full, and warns
 * that those aliases will change. Keep today's certificate check explicit.
 */
function useVerifyFullSsl(connectionString: string): string {
	return connectionString.replace(
		/([?&])sslmode=(?:prefer|require|verify-ca)(?=&|#|$)/gi,
		"$1sslmode=verify-full",
	);
}

/**
 * Supabase's Vercel integration sets POSTGRES_URL_NON_POOLING to the
 * session-mode pooler (port 5432). That mode supports the prepared statements
 * and advisory locks EmDash uses. POSTGRES_URL is transaction mode on port
 * 6543, which does not.
 */
export function supabaseConnectionString(): string | undefined {
	const raw = strip(process.env.POSTGRES_URL_NON_POOLING);
	if (!raw) return undefined;

	const connectionString = useVerifyFullSsl(raw);
	if (process.env.POSTGRES_URL_NON_POOLING !== connectionString) {
		process.env.POSTGRES_URL_NON_POOLING = connectionString;
	}
	return connectionString;
}

supabaseConnectionString();
