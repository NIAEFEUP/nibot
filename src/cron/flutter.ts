import { readFromKV, saveToKV } from "../database";
import {
	getCurrentFlutterVersionFromPubspec,
	getLatestFlutterStableVersion,
} from "../version-fetcher";

export interface FlutterStatus {
	currentVersion: string;
	latestFlutterVersion: string;
}

export async function fetchFlutterStatus(): Promise<FlutterStatus> {
	const latestFlutterVersion = await getLatestFlutterStableVersion();
	const currentVersion = await getCurrentFlutterVersionFromPubspec();
	return { currentVersion, latestFlutterVersion };
}

export function buildFlutterStatusMessage(
	currentVersion: string,
	latestFlutterVersion: string,
): string {
	if (currentVersion === latestFlutterVersion) {
		return (
			"✅ **Flutter Version Check**\n\n" +
			`• Latest stable: **${latestFlutterVersion}**\n` +
			`• UNI's version: **${currentVersion}**\n\n` +
			"🎉 UNI is up to date!"
		);
	}

	return (
		"🚀 **Flutter Version Check**\n\n" +
		`• Latest stable: **${latestFlutterVersion}**\n` +
		`• UNI's version: **${currentVersion}**\n\n` +
		"⚠️ **Update available!** UNI is behind."
	);
}

/**
 * Scheduled check, runs every 6 hours via the cron trigger.
 *
 * Stays silent unless a new Flutter stable version is out AND the UNI
 * project is still behind, and only notifies once per release (deduped
 * with the `flutter_last_notified_version` KV key).
 */
export async function runScheduledFlutterCheck(env: Env): Promise<void> {
	const { currentVersion, latestFlutterVersion } = await fetchFlutterStatus();

	console.log("Latest Flutter stable version:", latestFlutterVersion);
	console.log("Current Flutter version in pubspec.yaml:", currentVersion);

	const lastNotifiedVersion = await readFromKV(
		"flutter_last_notified_version",
		env,
	);
	console.log("Last notified version:", lastNotifiedVersion);

	if (lastNotifiedVersion === latestFlutterVersion) {
		console.log("Already notified for version", latestFlutterVersion);
		return;
	}
	if (currentVersion === latestFlutterVersion) {
		console.log("Project is up to date. No notification sent.");
		return;
	}

	const message = buildFlutterStatusMessage(
		currentVersion,
		latestFlutterVersion,
	);
	await postToSpace(message, env);
	await saveToKV("flutter_last_notified_version", latestFlutterVersion, env);
}

/** Posts `text` to the UNI space via its incoming webhook. */
async function postToSpace(message: string, env: Env): Promise<void> {
	if (!env.UNI_WEBHOOK) {
		console.warn("UNI_WEBHOOK not configured, skipping notification");
		return;
	}
	await fetch(env.UNI_WEBHOOK, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ text: message }),
	});
}
