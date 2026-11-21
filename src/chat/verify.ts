/**
 * Verifies that an HTTP request comes from Google Chat.
 *
 * Every interaction event is sent with a Google-signed OIDC ID token in the
 * Authorization header. We validate it through Google's tokeninfo endpoint and
 * require that it was issued for our endpoint and signed by our Chat app's
 * per-project service account.
 *
 * https://developers.google.com/workspace/chat/verify-requests-from-chat
 */

/** The endpoint URL configured in the Chat API (Connection settings). */
const CHAT_ENDPOINT_URL = "https://nibot.niaefeup.pt/chat/events";

/** The service account email shown in the Chat API Connection settings. */
const CHAT_SERVICE_ACCOUNT_EMAIL =
	"service-528130578805@gcp-sa-gsuiteaddons.iam.gserviceaccount.com";

interface TokenInfo {
	aud?: string;
	email?: string;
	email_verified?: boolean | string;
	exp?: number | string;
}

function fail(reason: string): false {
	console.warn("Chat request verification failed:", reason);
	return false;
}

export async function verifyChatRequest(req: Request): Promise<boolean> {
	const authHeader = req.headers.get("Authorization") ?? "";
	if (!authHeader.startsWith("Bearer ")) {
		return fail("missing bearer token");
	}
	const token = authHeader.slice("Bearer ".length).trim();
	if (!token) {
		return fail("empty bearer token");
	}

	let info: TokenInfo;
	try {
		const res = await fetch(
			`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
		);
		if (!res.ok) {
			return fail(`tokeninfo returned ${res.status}`);
		}
		info = (await res.json()) as TokenInfo;
	} catch (err) {
		console.error("Chat request verification request failed:", err);
		return fail("tokeninfo request failed");
	}

	if (info.aud !== CHAT_ENDPOINT_URL) {
		return fail(`unexpected audience: ${info.aud}`);
	}
	if (info.email !== CHAT_SERVICE_ACCOUNT_EMAIL) {
		return fail(`unexpected signer: ${info.email}`);
	}
	if (info.email_verified !== true && info.email_verified !== "true") {
		return fail("signer email not verified");
	}
	if (Number(info.exp) <= Date.now() / 1000) {
		return fail("token expired");
	}

	return true;
}
