import React, { useEffect, useState } from 'react';
import OrbitDB from 'orbit-db';

const IPFS = require('ipfs');

export const IpfsContext = React.createContext(null);
export const OrbitdbContext = React.createContext<OrbitDB | null>(null);

interface OrbitdbProps {
  children?: React.ReactChild;
}

export const OrbitdbConnection: React.FC<OrbitdbProps> = ({ children }) => {
  const [ipfs, setIpfs] = useState(null);
  const [orbitdb, setOrbitdb] = useState<OrbitDB | null>(null);

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
  };

  useEffect(() => {
    initOrbitdb();
  }, []);

  return (
    <IpfsContext.Provider value={ipfs}>
      <OrbitdbContext.Provider value={orbitdb}>
        {children}
      </OrbitdbContext.Provider>
    </IpfsContext.Provider>
  );
};
