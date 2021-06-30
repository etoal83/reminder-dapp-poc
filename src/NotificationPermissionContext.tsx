import React, { useEffect, useState } from 'react';

export const NotificationContext = React.createContext({
  permission: 'default',
  supported: true,
});

interface NotificationPermissionProps {
  children?: React.ReactChild;
}

export const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  children,
}) => {
  const [supported, _] = useState<boolean>('Notification' in window);
  const [permission, setPermission] = useState<string>(Notification.permission);

  const handlePermission = (perm: string) => {
    setPermission(perm);
  };

  const checkNotificationPromise = () => {
    try {
      Notification.requestPermission().then();
    } catch (e) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!supported) {
      console.log('This browser does NOT support notifications.');
      return;
    }

    if (checkNotificationPromise()) {
      Notification.requestPermission().then((perm) => {
        handlePermission(perm);
      });
    } else {
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ permission: permission, supported: supported }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
