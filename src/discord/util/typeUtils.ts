export type ObjectPath<T, K extends keyof T = keyof T> = K extends string
	? T[K] extends Record<string, any>
		? `${K}` | `${K}.${ObjectPath<T[K]>}`
		: `${K}`
	: never;

export function getValueAtPath<T, P extends ObjectPath<T>>(
	obj: T,
	path: P,
): P extends `${infer K}.${infer Rest}`
	? K extends keyof T
		? Rest extends ObjectPath<T[K]>
			? ReturnType<typeof getValueAtPath<T[K], Rest>>
			: never
		: never
	: P extends keyof T
		? T[P]
		: never {
	// Split the path into an array of keys
	const keys = path.split(".") as Array<keyof any>;

	// Traverse the object based on the keys
	return keys.reduce(
		(current: any, key) => (current ? current[key] : undefined),
		obj,
	);
}
