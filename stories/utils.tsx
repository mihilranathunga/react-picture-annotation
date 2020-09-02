import styled from 'styled-components';
import { CogniteClient } from '@cognite/sdk';
import { response } from './resources';

export const pdfFile = {
  id: 1,
  lastUpdatedTime: new Date(),
  uploaded: false,
  createdTime: new Date(),
  name: 'Random File',
  mimeType: 'application/pdf',
}

export const imgFile = {
  id: 1,
  lastUpdatedTime: new Date(),
  uploaded: false,
  createdTime: new Date(),
  name: 'Random File',
  mimeType: 'image/png',
}

export const imgSdk = ({
  events: {
    list: (..._: any[]) => ({autoPagingToArray: async() => response}),
  },
  files: {
    retrieve: async () => [imgFile],
    getDownloadUrls: async () => [{ downloadUrl: '//unsplash.it/800/400' }],
  },
} as unknown) as CogniteClient;

export const pdfSdk = ({
  events: {
    list: (..._: any[]) => ({autoPagingToArray: async() => response}),
  },
  files: {
    retrieve: async () => [pdfFile],
    getDownloadUrls: async () => [
      {
        downloadUrl:
          'https://cors-anywhere.herokuapp.com/http://www.africau.edu/images/default/sample.pdf',
      },
    ],
  },
} as unknown) as CogniteClient;

export const Container = styled.div`
  width: 100%;
  height: 600px;
  background: grey;
`;
