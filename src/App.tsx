import React, { useEffect, useState } from 'react';
import OrbitDB from 'orbit-db';
import KeyValueStore from 'orbit-db-kvstore';
import './App.css';

const IPFS = require('ipfs');

const OrbitDbHandler = () => {
  const [ipfs, setIpfs] = useState(null);
  const [orbitdb, setOrbitdb] = useState<OrbitDB | null>(null);
  const [store, setStore] = useState<KeyValueStore<any> | null>(null);

  const initOrbitdb = async () => {
    // --- Create an IPFS node ---
    // This node works locally and is not connected to any peers so far.
    const ipfs = await IPFS.create({
      EXPERIMENTAL: {
        pubsub: true,
      },
    });
    setIpfs(ipfs);
    console.log('IPFS ready');

    // --- Create an OrbitDB instance ---
    // It loads an OrbitDB object into memory, ready to create datastores.
    const orbitdb = await OrbitDB.createInstance(ipfs);
    setOrbitdb(orbitdb);
    console.log('OrbitDB ready');

    const reminders = await orbitdb.kvstore('reminders');
    await reminders.load();
    setStore(reminders);
  };

  useEffect(() => {
    initOrbitdb();
  }, []);

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
      <OrbitDbHandler />
    </div>
  );
}

export default App;
