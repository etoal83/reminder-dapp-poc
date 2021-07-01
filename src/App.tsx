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

interface Reminder {
  message: string;
  datetime: number | null;
}

const isReminder = (arg: unknown): arg is Reminder => {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    typeof (arg as Reminder).message === 'string'
  );
};

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
    <div
      className="master-clock"
      style={{ textAlign: 'center', margin: '1em 0 2em' }}
    >
      {current.getFullYear()} / {formatDigits(current.getMonth() + 1)} /{' '}
      {formatDigits(current.getDate())} ({dayOfWeekStr[current.getDay()]}){' '}
      {formatDigits(current.getHours())}:{formatDigits(current.getMinutes())}:
      {formatDigits(current.getSeconds())}
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
  const { permission } = useContext(NotificationContext);
  const [store, setStore] =
    useState<KeyValueStore<object | unknown> | null>(null);
  const [reminders, setReminders] = useState<object>({});
  const [newReminder, setNewReminder] = useState({
    message: '',
    datetime: null,
  });
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [queue, setQueue] = useState<Array<any>>([]);
  const [tick, setTick] = useState(Date.now());

  const initStore = async () => {
    if (orbitdb === null) return;
    if (store !== null) return;

    const kvstore = await orbitdb.kvstore('reminders');
    await kvstore.load();
    setStore(kvstore);
    setUpdatedAt(Date.now());
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
      setUpdatedAt(Date.now());
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
    setUpdatedAt(Date.now());
  };

  const checkDueReminder = () => {
    const queuedKeys: Array<any> = [];

    Object.entries(reminders).map((key, _) => {
      const deadline = new Date(key[1].datetime);
      const now = new Date();

      const yearEq = deadline.getFullYear() === now.getFullYear();
      const monthEq = deadline.getMonth() === now.getMonth();
      const dateEq = deadline.getDate() === now.getDate();
      const dayOfWeekEq = deadline.getDay() === now.getDay();
      const hoursEq = deadline.getHours() === now.getHours();
      const minutesEq = deadline.getMinutes() === now.getMinutes();
      const secondsEq = deadline.getSeconds() === now.getSeconds();

      if (
        yearEq &&
        monthEq &&
        dateEq &&
        dayOfWeekEq &&
        hoursEq &&
        minutesEq &&
        secondsEq
      ) {
        queuedKeys.push(key[0]);
      }

      return null;
    });

    if (queuedKeys.length) {
      console.log(`keys: ${queuedKeys}`);
      setQueue((prev) => prev.concat(queuedKeys));
    }
  };

  const triggerNotification = () => {
    if (store === null) return;

    if (queue.length) {
      const uuid = queue[0];
      const reminder = store.get(uuid);

      if (!isReminder(reminder)) {
        console.log(
          `The reminder ${uuid} does NOT exist so the notification is skipped.`
        );
        setQueue((prev) => prev.slice(1));
        return;
      }

      const message = reminder.message;
      new Notification('dReminder', { body: message });
      setUpdatedAt(Date.now());
      setQueue((prev) => prev.slice(1));
    }
  };

  const formatDigits = (digits: number) => ('0' + digits).slice(-2);

  const reminderItems = Object.entries(reminders).map((key, _) => {
    const uuid = key[0];
    const message = key[1].message;
    const overdue = key[1].datetime < Date.now();
    const deadline = new Date(key[1].datetime);
    const hours = deadline.getHours();
    const minutes = deadline.getMinutes();
    const seconds = deadline.getSeconds();

    return (
      <li
        key={uuid}
        style={{
          textDecoration: overdue ? 'line-through' : 'none',
        }}
      >
        {formatDigits(hours)}:{formatDigits(minutes)}:{formatDigits(seconds)} /{' '}
        {message} <button onClick={() => destroyReminder(uuid)}>Delete</button>
      </li>
    );
  });

  const testNotification = () => {
    new Notification('dReminder', { body: 'Notification test' });
  };

  useEffect(() => {
    initStore();
  }, [orbitdb]);

  useEffect(() => {
    getAllReminders();
  }, [updatedAt]);

  useEffect(() => {
    const timeoutId: number = window.setTimeout(() => {
      checkDueReminder();
      setTick(Date.now());
    }, 1000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [tick]);

  useEffect(() => {
    triggerNotification();
  }, [queue]);

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <input
          className="new-reminder"
          value={newReminder.message}
          placeholder="Enter message"
          onChange={handleNewReminderChange}
          onKeyDown={handleNewReminderKeyDown}
          style={{
            width: '80%',
            padding: '12px 24px',
            fontSize: '1.6em',
            border: 'none',
            marginRight: 'auto',
            marginLeft: 'auto',
          }}
        />
      </div>
      <ul>{reminderItems}</ul>
      <h2 style={{ marginTop: '2em' }}>Dev info</h2>
      <dl>
        <dt>Datastore multihash</dt>
        <dd>
          {store?.address.root} / {store?.address.path}
        </dd>
        <dt>Notification permission</dt>
        <dd>
          {permission} <button onClick={testNotification}>test</button>{' '}
        </dd>
      </dl>
      <Link to="/about">more</Link>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <NotificationPermission>
        <OrbitdbConnection>
          <HashRouter>
            <div
              className="app-title"
              style={{
                width: '100%',
              }}
            >
              <h1
                style={{
                  color: '#61dafb',
                  fontWeight: 100,
                  fontSize: '5.5rem',
                  padding: '0.33em 0 0',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                dReminder
              </h1>
            </div>
            <MasterClock />
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
