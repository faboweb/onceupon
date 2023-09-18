const listeners: Record<string, Array<(Event) => void>> = {};

export const scroll = (route, event) => {
  listeners[route]?.forEach((cb) => cb(event));
};

export const listenScroll = (_route, cb) => {
  listeners[_route] = listeners[_route] || [];
  listeners[_route].push(cb);
};
