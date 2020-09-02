import React, { useContext, useState, useEffect } from 'react';
import { CogniteClient, FileInfo } from '@cognite/sdk';
import {
  CogniteAnnotation,
  listAnnotationsForFile,
} from '@cognite/annotations';
import { ProposedCogniteAnnotation } from './FileViewerUtils';
import { DownloadFileFunction, ExtractFromCanvasFunction, ViewerZoomFunction } from '../ReactPictureAnnotation';

export type FileViewerContextObserver = {
  sdk: CogniteClient;
  page?: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  file?: FileInfo;
  setFile: (file?: FileInfo) => void;
  selectedAnnotation: ProposedCogniteAnnotation | CogniteAnnotation | undefined;
  setSelectedAnnotation: React.Dispatch<
    React.SetStateAction<
      ProposedCogniteAnnotation | CogniteAnnotation | undefined
    >
  >;
  annotations: (CogniteAnnotation|ProposedCogniteAnnotation)[];
  setAnnotations: (annotations: (CogniteAnnotation|ProposedCogniteAnnotation)[]) => void;
  zoomIn: ViewerZoomFunction| undefined;
  zoomOut: ViewerZoomFunction| undefined;
  reset: ViewerZoomFunction| undefined;
  setZoomIn: React.Dispatch<React.SetStateAction<ViewerZoomFunction| undefined>>;
  setZoomOut: React.Dispatch<React.SetStateAction<ViewerZoomFunction| undefined>>;
  setReset: React.Dispatch<React.SetStateAction<ViewerZoomFunction| undefined>>;
  download:
    | DownloadFileFunction
    | undefined;
  setDownload: React.Dispatch<
    React.SetStateAction<
      | DownloadFileFunction
      | undefined
    >
  >;
  extractFromCanvas:
    | ExtractFromCanvasFunction
    | undefined;
  setExtractFromCanvas: React.Dispatch<
    React.SetStateAction<
      | ExtractFromCanvasFunction
      | undefined
    >
  >;
};

const FileViewerContext = React.createContext(
  {} as FileViewerContextObserver
);

export const useAnnotations = () => {
  const { annotations, setAnnotations } = useContext(FileViewerContext);
  return { annotations, setAnnotations };
};

export const useAnnotationControls = () => {
  const { zoomIn, zoomOut, reset } = useContext(FileViewerContext);
  return { zoomIn, zoomOut, reset };
};

export const useDownloadPDF = () => {
  const { download } = useContext(FileViewerContext);
  return download;
};

export const useExtractFromCanvas = () => {
  const { extractFromCanvas } = useContext(FileViewerContext);
  return extractFromCanvas;
};
export const useSelectedAnnotation = () => {
  const { selectedAnnotation, setSelectedAnnotation } = useContext(FileViewerContext);
  return {selectedAnnotation, setSelectedAnnotation};
};

export const useViewerPage = () => {
  const { page, setPage } = useContext(FileViewerContext);
  return { page, setPage };
};

export type ContextProps = {
  sdk: CogniteClient;
  disableAutoFetch?: boolean;
}

const FileViewerProvider = ({
  sdk,
  children,
  disableAutoFetch = false,
}: {
  children: React.ReactNode;
} & ContextProps) => {
  const [annotations, setAnnotations] = useState<(CogniteAnnotation|ProposedCogniteAnnotation)[]>([]);

  const [selectedAnnotation, setSelectedAnnotation] = useState<
    ProposedCogniteAnnotation | CogniteAnnotation | undefined
  >(undefined);

  const [page, setPage] = useState<number>(1);
  const [file, setFile] = useState<FileInfo | undefined>(undefined);

  const [download, setDownload] = useState<
    | DownloadFileFunction
    | undefined
  >(undefined);
  const [zoomIn, setZoomIn] = useState<ViewerZoomFunction| undefined>(undefined);
  const [zoomOut, setZoomOut] = useState<ViewerZoomFunction| undefined>(undefined);
  const [reset, setReset] = useState<ViewerZoomFunction| undefined>(undefined);
  const [extractFromCanvas, setExtractFromCanvas] = useState<
    | ExtractFromCanvasFunction
    | undefined
  >(undefined);

  const fileId = file ? file.id : undefined;

  useEffect(() => {
    (async () => {
      if (fileId && sdk && !disableAutoFetch) {
        const [fetchedFile] = await sdk.files.retrieve([{ id: fileId }], {
          ignoreUnknownIds: true,
        });
        setFile(fetchedFile);
        if (fetchedFile) {
          const annos = await listAnnotationsForFile(sdk, fetchedFile);
          setAnnotations(annos);
        }
      }
    })();
  }, [sdk, fileId, disableAutoFetch]);

  useEffect(() => {
    if (fileId) {
      setPage(1);
    }
  }, [fileId]);

  return (
    <FileViewerContext.Provider
      value={{
        sdk,
        annotations,
        setAnnotations,
        download,
        zoomIn,
        zoomOut,
        reset,
        extractFromCanvas,
        setDownload,
        setZoomIn,
        setZoomOut,
        setReset,
        setExtractFromCanvas,
        page,
        file,
        setFile,
        setPage,
        selectedAnnotation,
        setSelectedAnnotation: anno => {
          setSelectedAnnotation(anno);
        },
      }}
    >
      {children}
    </FileViewerContext.Provider>
  );
};

export { FileViewerProvider };
export default FileViewerContext;
