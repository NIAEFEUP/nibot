export async function saveToKV(key: string, value: string, env: Env) {
	await env.APPSTATE.put(key, value);
}

export async function readFromKV(key: string, env: Env): Promise<string> {
	const value = await env.APPSTATE.get(key);

	return value ?? "";
}
