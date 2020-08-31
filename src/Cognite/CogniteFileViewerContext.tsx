import React, { useContext, useState, useEffect } from 'react';
import { CogniteClient, FileInfo } from '@cognite/sdk';
import { PDFDocument } from 'pdf-lib';
import {
  CogniteAnnotation,
  listAnnotationsForFile,
} from '@cognite/annotations';
import { ProposedCogniteAnnotation } from './CogniteFileViewerUtils';

export type CogniteFileViewerContextObserver = {
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
  annotations: CogniteAnnotation[];
  setAnnotations: (annotations: CogniteAnnotation[]) => void;
  pendingAnnotations: ProposedCogniteAnnotation[];
  setPendingAnnotations: (annotations: ProposedCogniteAnnotation[]) => void;
  download:
    | ((
        fileName: string,
        drawText?: boolean,
        drawBox?: boolean,
        drawCustom?: boolean,
        immediateDownload?: boolean
      ) => Promise<PDFDocument | undefined>)
    | undefined;
  zoomIn: (() => void) | undefined;
  zoomOut: (() => void) | undefined;
  reset: (() => void) | undefined;
  extractFromCanvas:
    | ((x: number, y: number, width: number, height: number) => string)
    | undefined;
  setDownload: React.Dispatch<
    React.SetStateAction<
      | ((
          fileName: string,
          drawText?: boolean,
          drawBox?: boolean,
          drawCustom?: boolean,
          immediateDownload?: boolean
        ) => Promise<PDFDocument | undefined>)
      | undefined
    >
  >;
  setZoomIn: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  setZoomOut: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  setReset: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  setExtractFromCanvas: React.Dispatch<
    React.SetStateAction<
      | ((x: number, y: number, width: number, height: number) => string)
      | undefined
    >
  >;
};

const CogniteFileViewerContext = React.createContext(
  {} as CogniteFileViewerContextObserver
);

export const useAnnotations = () => {
  const { annotations, setAnnotations } = useContext(CogniteFileViewerContext);
  return { annotations, setAnnotations };
};

export const usePendingAnnotations = () => {
  const { pendingAnnotations, setPendingAnnotations } = useContext(
    CogniteFileViewerContext
  );
  return { pendingAnnotations, setPendingAnnotations };
};

export const useAnnotationControls = () => {
  const { zoomIn, zoomOut, reset } = useContext(CogniteFileViewerContext);
  return { zoomIn, zoomOut, reset };
};

export const useDownloadPDF = () => {
  const { download } = useContext(CogniteFileViewerContext);
  return download;
};
export const useViewerPage = () => {
  const { page, setPage } = useContext(CogniteFileViewerContext);
  return { page, setPage };
};

const CogniteFileViewerProvider = ({
  sdk,
  children,
  disableAutoFetch = false,
}: {
  sdk: CogniteClient; // By setting the SDK it will auto fetch the annotations by default
  children: React.ReactNode;
  disableAutoFetch?: boolean;
}) => {
  const [annotations, setAnnotations] = useState<CogniteAnnotation[]>([]);

  const [selectedAnnotation, setSelectedAnnotation] = useState<
    ProposedCogniteAnnotation | CogniteAnnotation | undefined
  >(undefined);

  const [pendingAnnotations, setPendingAnnotations] = useState<
    ProposedCogniteAnnotation[]
  >([]);
  const [download, setDownload] = useState<
    | ((
        fileName: string,
        drawText?: boolean,
        drawBox?: boolean,
        drawCustom?: boolean,
        immediateDownload?: boolean
      ) => Promise<PDFDocument | undefined>)
    | undefined
  >(undefined);
  const [zoomIn, setZoomIn] = useState<(() => void) | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [file, setFile] = useState<FileInfo | undefined>(undefined);
  const [zoomOut, setZoomOut] = useState<(() => void) | undefined>(undefined);
  const [reset, setReset] = useState<(() => void) | undefined>(undefined);
  const [extractFromCanvas, setExtractFromCanvas] = useState<
    | ((x: number, y: number, width: number, height: number) => string)
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
      setPendingAnnotations([]);
    }
  }, [fileId]);

  return (
    <CogniteFileViewerContext.Provider
      value={{
        sdk,
        annotations,
        pendingAnnotations,
        setAnnotations,
        setPendingAnnotations,
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
    </CogniteFileViewerContext.Provider>
  );
};

export { CogniteFileViewerProvider };
export default CogniteFileViewerContext;
