import React from 'react';
import styled from 'styled-components';
import { CogniteClient } from '@cognite/sdk';
import { CogniteFileViewer } from '../src';
import { response } from './resources';
import { CogniteFileViewerProvider } from '../src/Cognite/CogniteFileViewerContext';

export default { title: 'Cognite File Viewer' };

const imageSdk = ({
  events: {
    list: (..._: any[]) => ({autoPagingToArray: async() => response}),
  },
  files: {
    retrieve: async () => [{
      id: 1,
      lastUpdatedTime: new Date(),
      uploaded: false,
      createdTime: new Date(),
      name: 'Random File',
      mimeType: 'png',
    }],
    getDownloadUrls: async () => [{ downloadUrl: '//unsplash.it/800/400' }],
  },
} as unknown) as CogniteClient;

const pdfSdk = ({
  events: {
    list: (..._: any[]) => ({autoPagingToArray: async() => response}),
  },
  files: {
    retrieve: async () => [{
      id: 1,
      lastUpdatedTime: new Date(),
      uploaded: false,
      createdTime: new Date(),
      name: 'Random File',
      mimeType: 'application/pdf',
    }],
    getDownloadUrls: async () => [
      {
        downloadUrl:
          'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      },
    ],
  },
} as unknown) as CogniteClient;

export const Example = () => (
  <Wrapper
  sdk={imageSdk}>
    <CogniteFileViewer
      file={{
        id: 1,
        lastUpdatedTime: new Date(),
        uploaded: false,
        createdTime: new Date(),
        name: 'Random File',
        mimeType: 'png',
      }}
    />
  </Wrapper>
);

export const ExampleWithPDF = () => (
  <Wrapper
  sdk={pdfSdk}>
    <CogniteFileViewer
      file={{
        id: 1,
        lastUpdatedTime: new Date(),
        uploaded: false,
        createdTime: new Date(),
        name: 'Random File',
        mimeType: 'application/pdf',
      }}
    />
  </Wrapper>
);

export const ExampleWithEditing = () => (
  <Wrapper 
    sdk={imageSdk}>
    <CogniteFileViewer
      file={{
        id: 1,
        lastUpdatedTime: new Date(),
        uploaded: false,
        createdTime: new Date(),
        name: 'Random File',
        mimeType: 'png',
      }}
      creatable={true}
    />
  </Wrapper>
);



const Wrapper = ({children, sdk}:{children:React.ReactNode, sdk: CogniteClient}) => <CogniteFileViewerProvider sdk={sdk}><Container>{children}</Container></CogniteFileViewerProvider>

const Container = styled.div`
  width: 100%;
  height: 600px;
  background: grey;
`;
