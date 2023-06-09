import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type GlobalStoreKey<Store> = {
  subscriptions: Set<(value: Store) => void>;
};
export type GetStore<Store> = () => Store;
export type SetStore<Action> = (update: Action) => void;
export type ResetActon = () => void;
export type SubscribeToStore<Store> = (
  cb: (store: Store) => void
) => () => void;

export type UseCreateStore<Store, Action = Partial<Store>> = {
  get: GetStore<Store>;
  set: SetStore<Action>;
  reset: ResetActon;
  subscribe: SubscribeToStore<Store>;
};

export type ReadOnlyUseCreateStore<Store> = Omit<UseCreateStore<Store>, "set">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalStore = new Map<GlobalStoreKey<any>, any>();

/*
 * Creates a store outside of a React component.
 * This is useful when you want multiple components without a common parent
 * to be able to communicate.
 */
export const createGlobalStore = <Store, Action = Partial<Store>>(
  value: Store,
  reducer?: (current: Store, action: Action) => Store
): UseCreateStore<Store, Action> => {
  const key: GlobalStoreKey<Store> = {
    subscriptions: new Set(),
  };
  globalStore.set(key, value);

  const get: UseCreateStore<Store>["get"] = () => globalStore.get(key);
  const set: UseCreateStore<Store, Action>["set"] = (value) => {
    const prev = globalStore.get(key);
    const update = reducer ? reducer(prev, value) : { ...prev, ...value };
    globalStore.set(key, update);
    key.subscriptions.forEach((sub) => sub(get()));
  };
  const reset: UseCreateStore<Store>["reset"] = () => {
    globalStore.set(key, value);
    key.subscriptions.forEach((sub) => sub(get()));
  };
  const subscribe: UseCreateStore<Store>["subscribe"] = (cb) => {
    key.subscriptions.add(cb);
    /*
    Call the sub function once the useStore subscribes to a global store
    This ensure that if an update comes in after the lazy initializer useState
    function runs but before the useEffect runs to subscribe to the changes that
    the update is still dispatched to the subscriber.
    */
    cb(get());
    return () => key.subscriptions.delete(cb);
  };
  return { get, set, reset, subscribe };
};

/*
 * Used to create a new store without using useState.
 * This is most beneficial when passing state down through context.
 * This will avoid updating the entire component tree when the value changes.
 */
export const useCreateStore = <Store, Action = Partial<Store>>(
  initial: Store,
  reducer?: (current: Store, action: Action) => Store
): UseCreateStore<Store, Action> => {
  const store = useRef<Store>(initial);
  const subscriptions = useRef<Set<(store: Store) => void>>(new Set());

  const get = useCallback<GetStore<Store>>(() => store.current, []);

  const set = useCallback<SetStore<Action>>(
    (update) => {
      store.current = reducer
        ? reducer(store.current, update)
        : { ...store.current, ...update };
      /** Notify all subscription when store is set */
      subscriptions.current.forEach((sub) => sub(store.current));
    },
    [reducer]
  );

  const reset = useCallback<ResetActon>(() => {
    store.current = initial;
    /** Notify all subscription when store is set */
    subscriptions.current.forEach((sub) => sub(store.current));
  }, [initial]);

  const subscribe = useCallback<SubscribeToStore<Store>>((cb) => {
    subscriptions.current.add(cb);
    return () => subscriptions.current.delete(cb);
  }, []);

  return useMemo(
    () => ({ get, set, reset, subscribe }),
    [get, reset, set, subscribe]
  );
};

export type SelectorFn<Store, Selected = Store> = (
  store: Store,
  prev: Selected | null
) => Selected;

/**
 * A hook for consuming a store, usually after it is passed down through context.
 *
 * @see {@link [Storybook](https://design-system.chrisouellette.com/?path=/docs/utilities-store--page)}
 */
export const useStore = <Store, Selected = Store, Action = Partial<Store>>(
  store: UseCreateStore<Store, Action> | ReadOnlyUseCreateStore<Store>,
  selector?: SelectorFn<Store, Selected>
): Selected => {
  const [state, setState] = useState<ReturnType<GetStore<Store | Selected>>>(
    () => (selector ? selector(store.get(), null) : store.get())
  );

  useEffect(() => {
    return store.subscribe((newState) => {
      setState((prev) =>
        selector ? selector(newState, prev as Selected) : newState
      );
    });
  }, [selector, store]);

  return state as Selected;
};
