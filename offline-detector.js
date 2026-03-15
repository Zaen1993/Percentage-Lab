const detectConnection = () => navigator.onLine;

const syncWhenOnline = () => Promise.resolve(false);

export { detectConnection, syncWhenOnline };
