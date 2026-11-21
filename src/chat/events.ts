/**
 * Dispatches Google Chat interaction events (Google Workspace add-on format)
 * and builds the DataActions response that makes Chat post a message.
 *
 * The add-on event object carries a top-level `chat` key whose payload field
 * depends on the trigger. New Chat apps (created after July 2025) receive this
 * format, and must respond with DataActions instead of a raw Message.
 *
 * https://developers.google.com/workspace/chat/receive-respond-interactions
 * https://developers.google.com/workspace/chat/commands
 */

import { flutterCommand } from "../commands/flutter";
import { helpCommand } from "../commands/help";
import { scheduleCommand } from "../commands/schedule";

// Command IDs as registered in the Chat API Configuration page.
const HELP_COMMAND_ID = 1;
const FLUTTER_COMMAND_ID = 2;
const SCHEDULE_COMMAND_ID = 3;

/** Minimal typing for the parts of the add-on event object we use. */
interface ChatEvent {
	chat?: {
		addedToSpacePayload?: unknown;
		removedFromSpacePayload?: unknown;
		messagePayload?: unknown;
		appCommandPayload?: {
			appCommandMetadata?: {
				appCommandId?: number;
				appCommandType?: string;
			};
		};
	};
}

/** Builds the DataActions response that posts `text` in the space. */
function createMessage(text: string): Record<string, unknown> {
	return {
		hostAppDataAction: {
			chatDataAction: {
				createMessageAction: {
					message: { text },
				},
			},
		},
	};
}

export async function handleChatEvent(
	body: unknown,
	env: Env,
): Promise<Record<string, unknown>> {
	const chat = (body as ChatEvent | null)?.chat;
	if (!chat) {
		return {};
	}

	// A user added the app to a space: say hello.
	if (chat.addedToSpacePayload) {
		return createMessage(
			"Hi, I'm **NI Bot** 👋 Type `/help` to see what I can do.",
		);
	}

	// The app was removed from a space: nothing to respond to.
	if (chat.removedFromSpacePayload) {
		return {};
	}

	// A user invoked a slash command or quick command.
	if (chat.appCommandPayload) {
		const commandId = Number(
			chat.appCommandPayload.appCommandMetadata?.appCommandId,
		);
		switch (commandId) {
			case HELP_COMMAND_ID:
				return createMessage(helpCommand());
			case SCHEDULE_COMMAND_ID:
				return createMessage(scheduleCommand());
			case FLUTTER_COMMAND_ID:
				return createMessage(await flutterCommand(env));
			default:
				return createMessage("Unknown command - try `/help`.");
		}
	}

	// A user @mentioned the app or sent it a direct message.
	if (chat.messagePayload) {
		return createMessage("Try `/help` to see what I can do.");
	}

	return {};
}
