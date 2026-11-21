import { buildFlutterStatusMessage, fetchFlutterStatus } from "../cron/flutter";
import { saveToKV } from "../database";

/**
 * Manual Flutter version check, triggered by the /flutter command.
 *
 * Mirrors the old manual-check semantics: always report the current status,
 * even when the project is up to date, and mark the latest version as
 * notified so the scheduled check stays quiet until a newer release.
 */
export async function flutterCommand(env: Env): Promise<string> {
	try {
		const status = await fetchFlutterStatus();
		await saveToKV(
			"flutter_last_notified_version",
			status.latestFlutterVersion,
			env,
		);
		return buildFlutterStatusMessage(
			status.currentVersion,
			status.latestFlutterVersion,
		);
	} catch (err) {
		console.error("Flutter check failed:", err);
		return "⚠️ Couldn't check the Flutter version right now - try again later.";
	}
}
