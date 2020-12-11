import React from 'react';

const AvatarContext = React.createContext({
  avatar: '',
  setAvatar: (url: string) => {},
});

export default AvatarContext;
