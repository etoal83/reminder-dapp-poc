import React, { useEffect, useState, useContext } from 'react';
import { HashRouter, Route, Switch, Link } from 'react-router-dom';
import OrbitDB from 'orbit-db';
import KeyValueStore from 'orbit-db-kvstore';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

import {
  IpfsContext,
  OrbitdbContext,
  OrbitdbConnection,
} from './OrbitdbContext';
import {
  NotificationContext,
  NotificationPermission,
} from './NotificationPermissionContext';

const MasterClock: React.FC<{}> = () => {
  const [current, setCurrent] = useState(new Date());
  const dayOfWeekStr: Array<string> = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  useEffect(() => {
    const timeoutId: number = window.setTimeout(
      () => setCurrent(new Date()),
      1000
    );
    return () => {
      clearTimeout(timeoutId);
    };
  }, [current]);

  const formatDigits = (digits: number) => ('0' + digits).slice(-2);

  return (
    <div className="master-clock">
      <div className="master-clock-date">
        {current.getFullYear()} / {formatDigits(current.getMonth() + 1)} /{' '}
        {formatDigits(current.getDate())} ({dayOfWeekStr[current.getDay()]})
      </div>
      <div className="master-clock-time">
        {formatDigits(current.getHours())}:{formatDigits(current.getMinutes())}:
        {formatDigits(current.getSeconds())}
      </div>
    </div>
  );
};

const About: React.FC<{}> = () => {
  const ipfs = useContext(IpfsContext);
  const orbitdb = useContext<OrbitDB | null>(OrbitdbContext);

  return (
    <div className="system-info">
      <h2>IPFS and OrbitDB Status</h2>
      <p>{ipfs === null ? `IPFS not connected` : `IPFS Connected`}</p>
      <p>
        {orbitdb === null
          ? `OrbitDB not instantiated`
          : `OrbitDB CID: ${orbitdb?.id}`}
      </p>
      <Link to="/">Back to app</Link>
    </div>
  );
};

const ReminderApp: React.FC<{}> = () => {
  const orbitdb = useContext<OrbitDB | null>(OrbitdbContext);
  const [store, setStore] =
    useState<KeyValueStore<object | unknown> | null>(null);
  const [reminders, setReminders] = useState<object>({});
  const [newReminder, setNewReminder] = useState({
    message: '',
    datetime: null,
  });

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

    const val = newReminder.message.trim();

    if (val) {
      const uuid = uuidv4();
      const now = new Date();
      await store.put(uuid, {
        message: val,
        datetime: now.setMinutes(now.getMinutes() + 3),
      });
      setNewReminder({ message: '', datetime: null });
      console.log(store.get(uuid));
    }
  };

  const handleNewReminderChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewReminder({ ...newReminder, message: event.target.value });
  };

  const destroyReminder = async (key: string) => {
    if (store === null) return;

    await store.del(key);
  };

  const formatDigits = (digits: number) => ('0' + digits).slice(-2);

  const reminderItems = Object.entries(reminders).map((key, value) => {
    const uuid = key[0];
    const message = key[1].message;
    const deadline = new Date(key[1].datetime);
    const hours = deadline.getHours();
    const minutes = deadline.getMinutes();
    const seconds = deadline.getSeconds();

    return (
      <li key={key[0]}>
        {uuid}: {message} / {formatDigits(hours)}:{formatDigits(minutes)}:
        {formatDigits(seconds)}{' '}
        <button onClick={() => destroyReminder(key[0])}>Delete</button>
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
      <MasterClock />
      <h2>Datastore multihash</h2>
      <p>
        {store?.address.root} / {store?.address.path}
      </p>
      <h2>Records</h2>
      <input
        className="new-reminder"
        value={newReminder.message}
        onChange={handleNewReminderChange}
        onKeyDown={handleNewReminderKeyDown}
      />
      <ul>{reminderItems}</ul>
      <Link to="/about">System info</Link>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <NotificationPermission>
        <OrbitdbConnection>
          <HashRouter>
            <Switch>
              <Route exact path="/" component={ReminderApp} />
              <Route path="/about" component={About} />
              <Route component={ReminderApp} />
            </Switch>
          </HashRouter>
        </OrbitdbConnection>
      </NotificationPermission>
    </div>
  );
}

export default App;
