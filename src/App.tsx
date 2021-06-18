import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');

const OrbitDbHandler = () => {
  const [ipfs, setIpfs] = useState(null);
  const [orbitdb, setOrbitdb] = useState(null);

  const initOrbitdb = async () => {
    const ipfs = await IPFS.create();
    setIpfs(ipfs);
    console.log('IPFS ready');

    const orbitdb = await OrbitDB.createInstance(ipfs);
    setOrbitdb(orbitdb);
    console.log('OrbitDB ready');
  };

  useEffect(() => {
    initOrbitdb();
  }, []);

  return (
    <div>
      <h1>IPFS and OrbitDB status</h1>
      <p>{ipfs === null ? `IPFS not connected` : `IPFS Connected`}</p>
      <p>
        {orbitdb === null ? `OrbitDB not instantiated` : `OrbitDB instantiated`}
      </p>
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
