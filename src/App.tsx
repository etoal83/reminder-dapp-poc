import React, { useEffect, useState, useContext } from 'react';
import OrbitDB from 'orbit-db';
import KeyValueStore from 'orbit-db-kvstore';
import './App.css';

import {
  IpfsContext,
  OrbitdbContext,
  OrbitdbConnection,
} from './OrbitdbContext';

const ReminderApp: React.FC<{}> = () => {
  const ipfs = useContext(IpfsContext);
  const orbitdb = useContext<OrbitDB | null>(OrbitdbContext);
  const [store, setStore] =
    useState<KeyValueStore<object | unknown> | null>(null);
  const [reminders, setReminders] = useState<object>({});
  const [newReminder, setNewReminder] = useState('');

  const initStore = async () => {
    if (orbitdb === null) return;
    if (store !== null) return;

    const kvstore = await orbitdb.kvstore('reminders');
    await kvstore.load();
    setStore(kvstore);
  };

  const getAllReminders = () => {
    if (store === null) return;

    const records = store.all;
    setReminders(records);
  };

  const handleNewReminderKeyDown = async (event: React.KeyboardEvent) => {
    if (store === null) return;
    if (event.key !== 'Enter') return;

    event.preventDefault();

    const val = newReminder.trim();

    if (val) {
      const now = new Date();
      await store.put(val, {
        datetime: now.setMinutes(now.getMinutes() + 3),
      });
      setNewReminder('');
      console.log(store.get(val));
    }
  };

  const handleNewReminderChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewReminder(event.target.value);
  };

  const putRandomReminder = async () => {
    if (store === null) return;

    const messages = ['Wake up', 'Lunch time', 'Good night'];
    const randomIndex = Math.floor(Math.random() * messages.length);
    const pickedMessage = messages[randomIndex];
    const now = new Date();
    await store.put(pickedMessage, {
      datetime: now.setMinutes(now.getMinutes() + 3),
    });
    console.log(store.get(pickedMessage));
  };

  const reminderItems = Object.entries(reminders).map((key, value) => {
    return (
      <li>
        {key.toString()} : {value}
      </li>
    );
  });

  useEffect(() => {
    initStore();
  }, [orbitdb]);

  useEffect(() => {
    getAllReminders();
  });

  return (
    <div>
      <h1>dReminder</h1>
      <h2>IPFS and OrbitDB Status</h2>
      <p>{ipfs === null ? `IPFS not connected` : `IPFS Connected`}</p>
      <p>
        {orbitdb === null
          ? `OrbitDB not instantiated`
          : `OrbitDB instantiated: ${orbitdb?.id}`}
      </p>
      <h2>Datastores</h2>
      <p>
        {store?.address.root} / {store?.address.path}
      </p>
      <h2>Records</h2>
      <input
        className="new-reminder"
        value={newReminder}
        onChange={handleNewReminderChange}
        onKeyDown={handleNewReminderKeyDown}
      />
      <ul>{reminderItems}</ul>
      <button onClick={putRandomReminder}>Set a random reminder</button>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <OrbitdbConnection>
        <ReminderApp />
      </OrbitdbConnection>
    </div>
  );
}

export default App;
