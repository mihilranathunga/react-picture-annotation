import React, { useContext, useState, useEffect } from 'react';
import { CogniteClient, FileInfo } from '@cognite/sdk';
import {
  CogniteAnnotation,
  listAnnotationsForFile,
} from '@cognite/annotations';
import { ProposedCogniteAnnotation } from './FileViewerUtils';
import { DownloadFileFunction, ExtractFromCanvasFunction, ViewerZoomFunction } from '../ReactPictureAnnotation';

export type FileViewerContextObserver = {
  /**
   * The sdk that was provided via provider
   */
  sdk: CogniteClient;
  /**
   * The current page, available via usePage()
   */
  page: number;
  /**
   * Set the current page, available via usePage()
   */
  setPage: React.Dispatch<React.SetStateAction<number>>;
  /**
   * The current file
   */
  file?: FileInfo;
  /**
   * Set the current file
   */
  setFile: (file?: FileInfo) => void;
  /**
   * The current annotation, available via useSelectedAnnotation()
   */
  selectedAnnotation: ProposedCogniteAnnotation | CogniteAnnotation | undefined;
  /**
   * Set the current annotation, available via useSelectedAnnotation()
   */
  setSelectedAnnotation: React.Dispatch<
    React.SetStateAction<
      ProposedCogniteAnnotation | CogniteAnnotation | undefined
    >
  >;
  /**
   * Annotations to display, available via useAnnotations()
   */
  annotations: (CogniteAnnotation|ProposedCogniteAnnotation)[];
  /**
   * Set the annotations to display, useful if you want to modify annotations across views under the context, available via useAnnotations()
   */
  setAnnotations: (annotations: (CogniteAnnotation|ProposedCogniteAnnotation)[]) => void;
  /**
   * zoomIn() will zoom the viewer in, available via useAnnotationControls()
   */
  zoomIn: ViewerZoomFunction| undefined;
  /**
   * zoomOut() will zoom the viewer out, available via useAnnotationControls()
   */
  zoomOut: ViewerZoomFunction| undefined;
  /**
   * reset() reset the zoom and position, available via useAnnotationControls()
   */
  reset: ViewerZoomFunction| undefined;
  /**
   * DO NOT USE
   */
  setZoomIn: React.Dispatch<React.SetStateAction<ViewerZoomFunction| undefined>>;
  /**
   * DO NOT USE
   */
  setZoomOut: React.Dispatch<React.SetStateAction<ViewerZoomFunction| undefined>>;
  /**
   * DO NOT USE
   */
  setReset: React.Dispatch<React.SetStateAction<ViewerZoomFunction| undefined>>;
  /**
   * download() will allow you to download the file (and decide if annotations should be drawn on top), available via useDownload()
   */
  download:
    | DownloadFileFunction
    | undefined;
    /**
     * DO NOT USE
     */
  setDownload: React.Dispatch<
    React.SetStateAction<
      | DownloadFileFunction
      | undefined
    >
  >;
  /**
   * extractFromCanvas() will allow you to extract part of the PDF as an image string, available via useExtractFromCanvas()
   */
  extractFromCanvas:
    | ExtractFromCanvasFunction
    | undefined;
    /**
     * DO NOT USE
     */
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

export const usePage = () => {
  const { page, setPage } = useContext(FileViewerContext);
  return { page, setPage };
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
  /**
   * A CogniteClient to supply to the viewer
   */
  sdk: CogniteClient;
  /**
   * Should fetching of annotations happen automatically? Unless you want to hook annotations fetching/storing into your store or augment annotations from CDF before sending into viewer, and you can trust the viewer to fetch annotations each time a file is supplied. 
   */
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
