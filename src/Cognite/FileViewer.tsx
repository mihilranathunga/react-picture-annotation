import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import {
  ReactPictureAnnotation,
  RenderItemPreviewFunction,
  IAnnotation,
  IRectShapeData,
} from '..';
import { Button, Colors, Pagination } from '@cognite/cogs.js';
import styled from 'styled-components';
import {
  CogniteAnnotation,
  CURRENT_VERSION,
  createAnnotations,
  updateAnnotation,
  PendingCogniteAnnotation,
} from '@cognite/annotations';
import { FileInfo } from '@cognite/sdk';
import CogniteFileViewerContext from './FileViewerContext';
import {
  ProposedCogniteAnnotation,
  convertCogniteAnnotationToIAnnotation,
  isSameResource,
  retrieveDownloadUrl,
  isPreviewableImage,
} from './FileViewerUtils';

export type ViewerEditCallbacks = {
  onUpdate: <T extends ProposedCogniteAnnotation | CogniteAnnotation>(
    annotation: T
  ) => T | false;
  onCreate: <T extends PendingCogniteAnnotation | CogniteAnnotation>(
    annotation: T
  ) => T | false;
};

export type ViewerProps = {
  /**
   * File will tell the viewer what file to show.
   */
  file?: FileInfo; 
  /**
   * Should the label of the of the annotation be hidden
   */
  editable?: boolean;
  /**
   * should you be able to create new annotations?
   */
  creatable?: boolean;
  /**
   * Should you be able to choose annotations purely using hovers? Useful in conjunction with `renderItemPreview`
   */
  hoverable?: boolean;
  /**
   * Used when `disableAutoFetch` is true to supply `annotations` to display
   */
  annotations?: CogniteAnnotation[];
  /**
   * Callbacks when something is created or edited. Return false from function if you want to handle it in a custom manner.
   */
  editCallbacks?: ViewerEditCallbacks;
  /**
   * Useful when in hover mode. Renders a small display of whatever you link near the box when something is selected.
   */
  renderAnnotation?: (
    el: CogniteAnnotation | ProposedCogniteAnnotation,
    isSelected: boolean
  ) => IAnnotation<IRectShapeData>;
  /**
   * Override how an annotation box is drawn on top of the file
   */
  renderItemPreview?: RenderItemPreviewFunction;
  /**
   * Callback for when something is selected
   */
  onAnnotationSelected?: (annotation: CogniteAnnotation | ProposedCogniteAnnotation|undefined )=>void;
  /**
   * Should pagination be shown, and what size? One page files will have no pagination displayed regardless of settings!
   */
  pagination?: false | 'small' | 'normal';
  /**
   * Should controls (zoom levels) be hidden.
   */
  hideLabel?: boolean;
  /**
   * Should you be able to edit existing annotations and add new ones
   */
  hideControls?: boolean;
  /**
   * What to display while loading. Note this is NOT displayed when `file` is not set.
   */
  loader?: React.ReactNode;
};

export const FileViewer = ({
  file: fileFromProps,
  hideLabel = true,
  hoverable = false,
  editCallbacks = {
    onUpdate: (a) => a,
    onCreate: (a) => a,
  } as ViewerEditCallbacks,
  renderItemPreview = () => <></>,
  creatable,
  editable,
  pagination = 'normal',
  hideControls = false,
  loader,
  onAnnotationSelected,
  renderAnnotation = convertCogniteAnnotationToIAnnotation,
  annotations: annotationsFromProps,
}: ViewerProps) => {

  const {
    annotations,
    setAnnotations,
    page,
    setFile,
    setPage,
    sdk,
    file,
    selectedAnnotation,
    setSelectedAnnotation,
    setDownload,
    setExtractFromCanvas,
    setReset,
    setZoomIn,
    setZoomOut,
    zoomIn,
    zoomOut,
    reset,
  } = useContext(CogniteFileViewerContext);

  useEffect(() => {
    if (annotationsFromProps) {
      setAnnotations(annotationsFromProps);
    }
  }, [annotationsFromProps, setAnnotations]);

  useEffect(() => {
    if (onAnnotationSelected) {
      onAnnotationSelected(selectedAnnotation);
    }
  }, [selectedAnnotation, onAnnotationSelected]);

  useEffect(() => {
    if (fileFromProps) {
      setFile(fileFromProps);
    }
  }, [fileFromProps, setFile]);

  const combinedIAnnotations = useMemo(
    () =>
      annotations.map((el) =>
        renderAnnotation(
          el,
          selectedAnnotation ? isSameResource(el, selectedAnnotation) : false
        )
      ),
    [annotations, selectedAnnotation]
  );

  const [realAnnotations, setRealAnnotations] = useState<
    IAnnotation<IRectShapeData>[]
  >(combinedIAnnotations || ([] as IAnnotation<IRectShapeData>[]));

  const wrapperRef = useRef<HTMLDivElement>(null);
  const annotatorRef = useRef<ReactPictureAnnotation>(null);

  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  const fileId = file ? file.id : undefined;

  useEffect(() => {
    (async () => {
      if (fileId) {
        setPreviewUrl(undefined);
        setLoading(true);
        setPreviewUrl(await retrieveDownloadUrl(sdk, fileId));
        setLoading(false);
      }
    })();
  }, [sdk, fileId]);
  useEffect(() => {
    if (annotatorRef && annotatorRef.current) {
      setDownload(() => annotatorRef.current!.downloadFile);
      setExtractFromCanvas(() => annotatorRef.current!.extractFromCanvas);
      setZoomIn(() => annotatorRef.current!.zoomIn);
      setZoomOut(() => annotatorRef.current!.zoomOut);
      setReset(() => annotatorRef.current!.reset);
    }
  }, [annotatorRef]);

  useEffect(() => {
    setRealAnnotations(combinedIAnnotations);
  }, [combinedIAnnotations]);

  useEffect(() => {
    if (wrapperRef.current) {
      // change width from the state object
      setHeight(wrapperRef.current!.clientHeight);
      setWidth(wrapperRef.current!.clientWidth);
    }
  }, [wrapperRef]);

  useEffect(() => {
    const resizeListener = () => {
      if (wrapperRef.current) {
        // change width from the state object
        setHeight(wrapperRef.current!.clientHeight);
        setWidth(wrapperRef.current!.clientWidth);
      }
    };
    // set resize listener
    window.addEventListener('resize', resizeListener);

    // clean up function
    return () => {
      // remove resize listener
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  const onAnnotationSelect = (id: string | null) => {
    if (id === null) {
      setSelectedAnnotation(undefined);
    }
    const annotation = annotations.find((el) => `${el.id}` === `${id}`);
    if (annotation) {
      setSelectedAnnotation(annotation);
    }
  };

  const isImage: boolean = useMemo(() => {
    if (file) {
      return isPreviewableImage(file);
    }
    return false;
  }, [file]);

  const onUpdateAnnotation = async (
    annotation: IAnnotation<IRectShapeData>
  ) => {
    const foundAnno = annotations.find(
      (el) => el.id === Number(annotation.id) || el.id === annotation.id
    );
    if (foundAnno) {
      const pendingAnnotation = editCallbacks.onUpdate({
        ...foundAnno!,
        box: {
          xMin: annotation.mark.x,
          yMin: annotation.mark.y,
          xMax: annotation.mark.x + annotation.mark.width,
          yMax: annotation.mark.y + annotation.mark.height,
        },
      });
      if (pendingAnnotation) {
        if (typeof pendingAnnotation.id === 'number') {
          await updateAnnotation(sdk, [
            {
              id: pendingAnnotation.id,
              annotation: (pendingAnnotation as CogniteAnnotation),
              update: {
                box: {
                  set: pendingAnnotation.box,
                },
              },
            },
          ]);
        }
        setAnnotations(
          annotations.reduce((prev, el) => {
            if (el.id !== Number(annotation.id) && el.id !== annotation.id) {
              prev.push(el);
            } else {
              prev.push(pendingAnnotation);
            }
            return prev;
          }, [] as (CogniteAnnotation | ProposedCogniteAnnotation)[])
        );
      }
    }
  };

  const onCreateAnnotation = async (
    annotation: IAnnotation<IRectShapeData>
  ) => {
    const pendingAnnotation = editCallbacks.onCreate({
      status: 'verified',
      ...(file!.externalId
        ? { fileExternalId: file!.externalId }
        : { fileId: file!.id }),
      version: CURRENT_VERSION,
      label: '',
      page: annotation.page || page,
      box: {
        xMin: annotation.mark.x,
        yMin: annotation.mark.y,
        xMax: annotation.mark.x + annotation.mark.width,
        yMax: annotation.mark.y + annotation.mark.height,
      },
    } as ProposedCogniteAnnotation);
    if (pendingAnnotation) {
      const [createdAnnotation] = await createAnnotations(sdk, [
        pendingAnnotation,
      ]);
      setAnnotations(annotations.concat([createdAnnotation]));
      setSelectedAnnotation(createdAnnotation);
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {loading && (
        <div style={{ position: 'absolute', height: '100%', width: '100%' }}>
          {loader}
        </div>
      )}
      <ReactPictureAnnotation
        ref={annotatorRef}
        drawLabel={!hideLabel}
        hoverable={hoverable}
        editable={editable}
        annotationData={realAnnotations.filter(
          (el) => totalPages === 1 || el.page === page
        )}
        onChange={(e) => {
          setRealAnnotations(
            realAnnotations
              .filter((el) => !(totalPages === 1 || el.page === page))
              .concat(e as IAnnotation<IRectShapeData>[])
          );
        }}
        onSelect={onAnnotationSelect}
        onAnnotationCreate={onCreateAnnotation}
        onAnnotationUpdate={onUpdateAnnotation}
        pdf={
          file && file.mimeType === 'application/pdf' ? previewUrl : undefined
        }
        image={file && isImage ? previewUrl : undefined}
        creatable={creatable}
        width={width}
        height={height}
        page={page}
        onLoading={(isLoading) => setLoading(isLoading)}
        renderItemPreview={renderItemPreview}
        onPDFLoaded={({ pages }) => {
          setLoading(false);
          setTotalPages(pages);
        }}
      />
      {totalPages > 1 && pagination && (
        <DocumentPagination
          total={totalPages}
          current={page || 1}
          pageSize={1}
          showPrevNextJumpers={true}
          simple={pagination === 'small'}
          onChange={(newPageNum) => setPage && setPage(newPageNum)}
        />
      )}
      {!hideControls && (
        <Buttons>
          <div id="controls">
            <Button
              onClick={() => {
                if (zoomIn) {
                  zoomIn();
                }
              }}
              icon="ZoomIn"
            />
            <Button
              icon="Refresh"
              onClick={() => {
                if (reset) {
                  reset();
                }
              }}
            />
            <Button
              icon="ZoomOut"
              onClick={() => {
                if (zoomOut) {
                  zoomOut();
                }
              }}
            />
          </div>
        </Buttons>
      )}
    </div>
  );
};

const DocumentPagination = styled(Pagination)`
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  bottom: 16px;
  && {
    background: #fff;
    border-radius: 50px;
    padding: 12px 24px;
    box-shadow: 0px 0px 8px ${Colors['greyscale-grey3'].hex()};
  }
`;

const Buttons = styled.div`
  display: inline-flex;
  position: absolute;
  z-index: 2;
  right: 24px;
  bottom: 24px;
  && #controls {
    display: inline-flex;
  }
  && #controls > * {
    border-radius: 0px;
  }
  && #controls > *:nth-child(1) {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  && #controls > *:nth-last-child(1) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;