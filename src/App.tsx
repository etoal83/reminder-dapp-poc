import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

const OrbitDbHandler = () => {
  const [ipfs, setIpfs] = useState(null);
  const [orbitdb, setOrbitdb] = useState<typeof OrbitDB | null>(null);
  const [stores, setStores] = useState<Array<any>>([]);

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

    const defaultOptions = {
      accessController: {
        write: [orbitdb.identity.id],
      },
    };
    const docStoreOption = {
      ...defaultOptions,
      indexBy: 'hash',
    };
    const pieces = await orbitdb.docstore('pieces', docStoreOption);
    setStores((prevStores) => [...prevStores, pieces]);
  };

  useEffect(() => {
    initOrbitdb();
  }, []);

  const storeList = stores.map((store) => store.id);

  return (
    <div>
      <h1>IPFS and OrbitDB status</h1>
      <p>{ipfs === null ? `IPFS not connected` : `IPFS Connected`}</p>
      <p>
        {orbitdb === null
          ? `OrbitDB not instantiated`
          : `OrbitDB instantiated: ${orbitdb?.id}`}
      </p>
      <p>Datastores: {storeList}</p>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <OrbitDbHandler />
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
