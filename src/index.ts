import { runScheduledFlutterCheck } from "./cron/flutter";

export default {
	async fetch(req) {
		if (req.method === "GET") {
			const scheduledUrl = new URL(req.url);
			scheduledUrl.pathname = "/__scheduled";
			scheduledUrl.searchParams.append("cron", "0 */6 * * *");
			return new Response(
				"nibot is running.\n\n" +
					`To test the scheduled handler locally, use "wrangler dev --test-scheduled" and then "curl ${scheduledUrl.href}".`,
			);
		}

		return new Response("Not found", { status: 404 });
	},

	async scheduled(_event, env, _ctx): Promise<void> {
		console.log("Running scheduled handler at", new Date().toISOString());
		await runScheduledFlutterCheck(env);
	},
} satisfies ExportedHandler<Env>;
