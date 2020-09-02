import React from 'react';
import {
  FileViewer,
  ViewerProps,
} from './FileViewer';
import {
  ContextProps,
  FileViewerProvider,
} from './FileViewerContext';

const CombinedCogniteFileViewer = (
  { sdk, disableAutoFetch, ...extraProps }: ContextProps & ViewerProps
) => {
  return (
    <FileViewerProvider sdk={sdk} disableAutoFetch={disableAutoFetch}>
      <FileViewer {...(extraProps as ViewerProps)} />
    </FileViewerProvider>
  );
};

const CogniteFileViewer = Object.assign(CombinedCogniteFileViewer, {
  FileViewer,
  Provider: FileViewerProvider,
});

export { CogniteFileViewer, CombinedCogniteFileViewer };
