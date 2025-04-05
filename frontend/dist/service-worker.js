// Service worker to automate logs based on location, time, and status


const LOG_SYNC = 'log-sync';
const LOG_API_URL = 'http://127.0.0.1:8000/api/update-log-entry/';

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installed.');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
  self.clients.claim();
});

// Sync logs when back online
self.addEventListener('sync', (event) => {
  if (event.tag === LOG_SYNC) {
    event.waitUntil(syncLogs());
  }
});

// Store logs for offline use
const saveLogOffline = async (log) => {
  const db = await openDB('logStore', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { autoIncrement: true });
      }
    },
  });
  const tx = db.transaction('logs', 'readwrite');
  await tx.store.add(log);
  await tx.done;
};

// Sync logs to the backend
const syncLogs = async () => {
  const db = await openDB('logStore', 1);
  const logs = await db.getAll('logs');

  for (const log of logs) {
    try {
      const response = await fetch(LOG_API_URL, {
        method: 'POST',
        body: JSON.stringify(log),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const tx = db.transaction('logs', 'readwrite');
        await tx.store.clear();
        await tx.done;
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
};

const sendFuelAlert = async (message = "Fuel level is low!") => {
  console.log('hello');
  const allClients = await self.clients.matchAll();
  for (const client of allClients) {
    client.postMessage({
      type: 'fuel-alert',
      message,
    });
  }
};

// Handle messages from App.tsx
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'log') {
    const log = event.data.log;
        // If a fuel alert is triggered
   

    try {
    const response =  await fetch(LOG_API_URL, {
        method: 'POST',
        body: JSON.stringify(log),
        headers: { 'Content-Type': 'application/json' },
      });
        if (response.ok) {
    const result = await response.json();

    // If backend includes a fuel warning

    if (result.fuel_warning) {
      await sendFuelAlert(result.fuel_warning || "Fuel alert .");
    }
  }
    } catch (error) {
      console.warn('Offline: Saving log locally.');
      await saveLogOffline(log);
      self.registration.sync.register(LOG_SYNC);
    }
  }
});
