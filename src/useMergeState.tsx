import { useState, useCallback } from 'react'

export type MergeStateFunction<T> = (
	value: Partial<T> | ((state: T) => Partial<T>)
) => void

type UseMergeStateTuple<T> = [T, MergeStateFunction<T>]

export const useMergeState = <T extends object>(
	initialState: T
): UseMergeStateTuple<T> => {
	const [state, setState] = useState(initialState)

	const mergeState: MergeStateFunction<T> = useCallback((value) => {
		if (typeof value === 'object') {
			setState((state) => ({ ...state, ...value }))
		} else if (typeof value === 'function') {
			setState((state) => ({ ...state, ...value(state) }))
		}
	}, [])

	return [state, mergeState]
}
