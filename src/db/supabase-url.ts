const strip = (value: string | undefined) => value?.replace(/^"|"$/g, "");

/**
 * Supavisor's certificate chain is rejected by Node as self-signed when
 * sslmode is verify-full. pg's no-verify mode keeps the connection encrypted
 * and skips that check.
 */
function useNoVerifySsl(connectionString: string): string {
	if (/[?&]sslmode=/i.test(connectionString)) {
		return connectionString.replace(/([?&])sslmode=[^&#]*/gi, "$1sslmode=no-verify");
	}
	const joiner = connectionString.includes("?") ? "&" : "?";
	return `${connectionString}${joiner}sslmode=no-verify`;
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

	const connectionString = useNoVerifySsl(raw);
	if (process.env.POSTGRES_URL_NON_POOLING !== connectionString) {
		process.env.POSTGRES_URL_NON_POOLING = connectionString;
	}
	return connectionString;
}

supabaseConnectionString();
