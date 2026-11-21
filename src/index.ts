import { handleChatEvent } from "./chat/events";
import { verifyChatRequest } from "./chat/verify";
import { runScheduledFlutterCheck } from "./cron/flutter";

export default {
	async fetch(req, env) {
		const url = new URL(req.url);

		if (req.method === "POST" && url.pathname === "/chat/events") {
			if (!(await verifyChatRequest(req))) {
				return new Response("Unauthorized", { status: 401 });
			}

			const event = await req.json().catch(() => null);
			const action = await handleChatEvent(event, env);
			return new Response(JSON.stringify(action), {
				headers: { "Content-Type": "application/json" },
			});
		}

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
