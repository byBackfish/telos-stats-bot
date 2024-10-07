export type ObjectPath<T, K extends keyof T = keyof T> = K extends string
	? T[K] extends Record<string, unknown>
		? `${K}` | `${K}.${ObjectPath<T[K]>}`
		: `${K}`
	: never;
