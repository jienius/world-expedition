import React, { useState, useContext } from 'react';
import { RouteProps } from 'react-router-dom';
import AvatarEdit from 'react-avatar-edit';
import { Button, Alert } from 'react-bootstrap';
import { Storage } from 'aws-amplify';
import UsernameContext from '../hooks/UsernameContext';
import AvatarContext from '../hooks/AvatarContext';
import Avatar from 'react-avatar';
import '../App.css';

import './ProfilePage.css';

export default function ProfilePage({ children, ...rest }: RouteProps) {
  const username = useContext(UsernameContext);
  const [preview, setPreview] = useState<undefined | string>(undefined);
  const { avatar, setAvatar } = useContext(AvatarContext);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const onCrop = (preview: any) => {
    setPreview(preview);
  };

  const onClear = () => {
    setPreview(undefined);
    setError('');
  };

  const onUpload = () => {
    if (preview !== undefined) {
      const filename = username + '_avatar.png';
      // console.log('aaaa');
      const buf = Buffer.from(preview!.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      setUploading(true);
      Storage.put(filename, buf, {
        contentType: 'image/png',
        ContentEncoding: 'base64',
        level: 'public',
      })
        .then(() => setError(''))
        .catch((err) => {
          setError('Upload failed');
        })
        .finally(() => setUploading(false));
      Storage.get(filename, { level: 'public' }).then((url) => {
        const myRequest = new Request(url as string);
        fetch(myRequest)
          .then(function (response) {
            if (response.status === 200) {
              setAvatar(url as string);
            }
          })
          .catch((err) => {
            // console.log('aaaa');
            console.log(err);
            setError(err);
          });
      });
    }
  };

  const onBeforeFileLoad = (elem: any) => {
    if (elem.target.files[0].size > 500000) {
      setError('File size must be smaller than 5KB');
      elem.target.value = '';
    } else {
      setError('');
    }
  };

  return (
    <div className="PageContent gameBckrnd">
      <h1 className="Header">User Profile</h1>
      {error !== '' && <Alert variant="danger">{error}</Alert>}

      <div className="Profile-edit">
        <div className="Profile">
          <div className="Avatar-container">
            <Avatar src={preview === undefined ? avatar : preview} size={'300'} />
          </div>
          <div className="Name-container">
            <div className="Name">{username}</div>
          </div>
        </div>

        <div className="Avatar-upload-container">
          <div className="Avatar-edit">
            <AvatarEdit
              width={390}
              height={295}
              onCrop={onCrop}
              onClose={onClear}
              onBeforeFileLoad={onBeforeFileLoad}
              label="Click here to edit avatar"
            />
          </div>
          <Button onClick={onUpload} disabled={uploading}>
            {uploading ? 'Uploading' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}
