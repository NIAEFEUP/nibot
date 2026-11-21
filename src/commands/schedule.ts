/**
 * Stub for the /schedule command. It becomes a real neet integration once
 * neet.niaefeup.pt exposes a token-authenticated API to create events
 * (planned Phase 3).
 */
export function scheduleCommand(): string {
	return (
		"🛠️ `/schedule` is coming soon!\n\n" +
		"It will create an availability event on " +
		"[neet](https://neet.niaefeup.pt) and share the link here, " +
		"e.g. `/schedule Mon - Fri 8am - 6pm`."
	);
}
