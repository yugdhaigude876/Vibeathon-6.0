import { useState, useEffect } from 'react'

export function create<T>(
  createState: (
    set: (partial: Partial<T> | ((state: T) => Partial<T> | T)) => void,
    get: () => T
  ) => T
) {
  let state: T
  const listeners = new Set<() => void>()

  const setState = (partial: Partial<T> | ((state: T) => Partial<T> | T)) => {
    const nextState = typeof partial === 'function' ? (partial as any)(state) : partial
    state = { ...state, ...nextState }
    listeners.forEach((listener) => listener())
  }

  const getState = () => state

  state = createState(setState, getState)

  const useStore = () => {
    const [, setTick] = useState(0)
    useEffect(() => {
      const listener = () => setTick((t) => t + 1)
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }, [])
    return state
  }

  Object.assign(useStore, {
    getState,
    setState,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  })

  return useStore as (() => T) & {
    getState: () => T
    setState: (partial: Partial<T> | ((state: T) => Partial<T> | T)) => void
    subscribe: (listener: () => void) => () => void
  }
}

