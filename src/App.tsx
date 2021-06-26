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

  const initStore = async () => {
    if (orbitdb === null) return;
    if (store !== null) return;

    const kvstore = await orbitdb.kvstore('reminders');
    await kvstore.load();
    setStore(kvstore);
  };

  useEffect(() => {
    initStore();
  }, [orbitdb]);

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
