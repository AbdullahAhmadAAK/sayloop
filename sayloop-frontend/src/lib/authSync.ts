/** Fired after POST /users/sync succeeds so the socket can connect with a DB user id. */
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeUserSynced(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyUserSynced() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.warn('[authSync] listener error', err);
    }
  });
}
