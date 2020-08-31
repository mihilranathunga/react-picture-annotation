import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import {
  ReactPictureAnnotation,
  IAnnotation,
  IRectShapeData,
} from '..';
import { Button, Colors } from '@cognite/cogs.js';
import styled from 'styled-components';
import Pagination from 'rc-pagination';
import { CogniteAnnotation, CURRENT_VERSION } from '@cognite/annotations';
import { FileInfo, CogniteClient } from '@cognite/sdk';
import CogniteFileViewerContext from './CogniteFileViewerContext';
import {
  ProposedCogniteAnnotation,
  convertCogniteAnnotationToIAnnotation,
  isSameResource,
} from './CogniteFileViewerUtils';

export type IAnnotationWithPage = IAnnotation<IRectShapeData> & {
  page?: number;
};

export type ViewerEditCallbacks = {
  onUpdate: <T extends ProposedCogniteAnnotation | CogniteAnnotation>(
    annotation: T
  ) => T;
  onCreate: <T extends ProposedCogniteAnnotation | CogniteAnnotation>(
    annotation: T
  ) => T;
};

type Props = {
  file?: FileInfo;
  drawLabel?: boolean;
  editable?: boolean;
  creatable?: boolean;
  hoverable?: boolean;
  annotations?: CogniteAnnotation[];
  editCallbacks?: ViewerEditCallbacks;
  renderAnnotation?: (
    el: CogniteAnnotation | ProposedCogniteAnnotation,
    isSelected:boolean
  )=> IAnnotation<IRectShapeData>,
  renderItemPreview?: (
    editable: boolean,
    annotation: IAnnotation,
    onChange: (value: string) => void,
    onDelete: () => void,
    height: React.CSSProperties['maxHeight']
  ) => React.ReactElement;
  hidePagination?: boolean;
  hideControls?: boolean;
  loader?: React.ReactNode;
};

export const CogniteFileViewer = (
  (props:Props) => {
    const {
      file: fileFromProps,
      drawLabel = true,
      hoverable = false,
      editCallbacks = {
        onUpdate: a => a,
        onCreate: a => a,
      } as ViewerEditCallbacks,
      renderItemPreview,
      creatable,
      editable,
      hidePagination = false,
      hideControls = false,
      loader,
      renderAnnotation = convertCogniteAnnotationToIAnnotation,
      annotations: annotationsFromProps,
    } = props || {};

    const {
      annotations,
      setAnnotations,
      pendingAnnotations,
      setPendingAnnotations,
      page,
      setFile,
      setPage,
      sdk,
      file,
      selectedAnnotation,
      setSelectedAnnotation,
      setDownload,
      setExtractFromCanvas, setReset, setZoomIn, setZoomOut,
      zoomIn, zoomOut, reset
    } = useContext(CogniteFileViewerContext);

    useEffect(() => {
      if (
        annotationsFromProps &&
        annotationsFromProps.length !== annotations.length
      ) {
        setAnnotations(annotationsFromProps);
      }
    }, [annotationsFromProps, annotations.length, setAnnotations]);

    useEffect(() => {
      if (fileFromProps) {
        setFile(fileFromProps);
      }
    }, [fileFromProps, setFile]);

    const combinedAnnotations = useMemo(
      () => [...annotations, ...pendingAnnotations],
      [annotations, pendingAnnotations]
    );
    const combinedIAnnotations = useMemo(
      () =>
        combinedAnnotations.map(el =>
          renderAnnotation(
            el,
            selectedAnnotation ? isSameResource(el, selectedAnnotation) : false
          )
        ),
      [combinedAnnotations, selectedAnnotation]
    );

    const [realAnnotations, setRealAnnotations] = useState<
      IAnnotationWithPage[]
    >(combinedIAnnotations || ([] as IAnnotationWithPage[]));

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
      if (annotatorRef && annotatorRef.current){
      setDownload(()=>annotatorRef.current!.downloadFile);
      setExtractFromCanvas(()=>annotatorRef.current!.extractFromCanvas);
      setZoomIn(()=>annotatorRef.current!.zoomIn);
      setZoomOut(()=>annotatorRef.current!.zoomOut);
      setReset(()=> annotatorRef.current!.reset);
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
      if (!creatable) {
        setPendingAnnotations([]);
      }
    }, [creatable, setPendingAnnotations]);

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
      const annotation = combinedAnnotations.find(el => `${el.id}` === `${id}`);
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
      const pendingAnnotation = pendingAnnotations.find(
        el => el.id === annotation.id
      );
      if (pendingAnnotations.find(el => el.id === annotation.id)) {
        const editedAnnotation = editCallbacks.onUpdate({
          ...pendingAnnotation,
          box: {
            xMin: annotation.mark.x,
            yMin: annotation.mark.y,
            xMax: annotation.mark.x + annotation.mark.width,
            yMax: annotation.mark.y + annotation.mark.height,
          },
        } as ProposedCogniteAnnotation);
        setPendingAnnotations(
          pendingAnnotations.reduce((prev: ProposedCogniteAnnotation[], el) => {
            if (el.id !== annotation.id) {
              prev.push(el);
            } else {
              prev.push(editedAnnotation);
            }
            return prev;
          }, [] as ProposedCogniteAnnotation[])
        );
      } else {
        // message.info('Coming Soon');
      }
    };

    const onCreateAnnotation = async (annotation: IAnnotationWithPage) => {
      const pendingAnnotation = editCallbacks.onCreate({
        id: annotation.id,
        status: 'verified',
        ...(file!.externalId
          ? { fileExternalId: file!.externalId }
          : { fileId: file!.id }),
        version: CURRENT_VERSION,
        label: '',
        page: annotation.page,
        box: {
          xMin: annotation.mark.x,
          yMin: annotation.mark.y,
          xMax: annotation.mark.x + annotation.mark.width,
          yMax: annotation.mark.y + annotation.mark.height,
        },
      } as ProposedCogniteAnnotation);
      setPendingAnnotations(
        pendingAnnotations
          .filter(el => el.label.length > 0)
          .concat([pendingAnnotation])
      );
      setSelectedAnnotation(pendingAnnotation);
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
          drawLabel={drawLabel}
          hoverable={hoverable}
          editable={editable}
          annotationData={realAnnotations.filter(
            el => totalPages === 1 || el.page === page
          )}
          onChange={e => {
            setRealAnnotations(
              realAnnotations
                .filter(el => !(totalPages === 1 || el.page === page))
                .concat(e as IAnnotationWithPage[])
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
          onLoading={isLoading => setLoading(isLoading)}
          renderItemPreview={renderItemPreview}
          onPDFLoaded={({ pages }) => {
            setLoading(false);
            setTotalPages(pages);
          }}
        />
        {totalPages > 1 && !hidePagination && (
          <DocumentPagination
            total={totalPages}
            current={page || 1}
            pageSize={1}
            showPrevNextJumpers={true}
            onChange={newPageNum => setPage && setPage(newPageNum)}
          />
        )}
        {(!hideControls) && (
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
                  if (reset){
                    reset();
                  }
                }}
              />
              <Button
                icon="ZoomOut"
                onClick={() => {
                  if (zoomOut){
                    zoomOut();
                  }
                }}
              />
            </div>
          </Buttons>
        )}
      </div>
    );
  }
);

export const isPreviewableImage = (file: FileInfo) => {
  const { mimeType = '' } = file;
  return ['png', 'jpeg', 'jpg', 'svg'].some(el => mimeType.includes(el));
};

export const retrieveDownloadUrl = async (
  client: CogniteClient,
  fileId: number
) => {
  try {
    const [{ downloadUrl }] = await client.files.getDownloadUrls([
      { id: fileId },
    ]);
    return downloadUrl;
  } catch {
    return undefined;
  }
};


const DocumentPagination = styled(Pagination)`
.rc-pagination {
  margin: 0;
  padding: 0;
}
.rc-pagination ul,
.rc-pagination ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.rc-pagination::after {
  display: block;
  clear: both;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  content: ' ';
}
.rc-pagination-total-text {
  display: inline-block;
  height: 28px;
  margin-right: 8px;
  line-height: 26px;
  vertical-align: middle;
}
.rc-pagination-item {
  display: inline-block;
  min-width: 28px;
  height: 28px;
  margin-right: 8px;
  line-height: 26px;
  text-align: center;
  vertical-align: middle;
  list-style: none;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: 0;
  cursor: pointer;
  user-select: none;
}
.rc-pagination-item a {
  display: block;
  padding: 0 6px;
  color: rgba(0, 0, 0, 0.85);
  transition: none;
}
.rc-pagination-item a:hover {
  text-decoration: none;
}
.rc-pagination-item:focus,
.rc-pagination-item:hover {
  border-color: #1890ff;
  transition: all 0.3s;
}
.rc-pagination-item:focus a,
.rc-pagination-item:hover a {
  color: #1890ff;
}
.rc-pagination-item-active {
  font-weight: 500;
  background: #fff;
  border-color: #1890ff;
}
.rc-pagination-item-active a {
  color: #1890ff;
}
.rc-pagination-item-active:focus,
.rc-pagination-item-active:hover {
  border-color: #40a9ff;
}
.rc-pagination-item-active:focus a,
.rc-pagination-item-active:hover a {
  color: #40a9ff;
}
.rc-pagination-jump-prev,
.rc-pagination-jump-next {
  outline: 0;
}
.rc-pagination-jump-prev button,
.rc-pagination-jump-next button {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
}
.rc-pagination-jump-prev button:after,
.rc-pagination-jump-next button:after {
  display: block;
  content: '•••';
}
.rc-pagination-prev,
.rc-pagination-jump-prev,
.rc-pagination-jump-next {
  margin-right: 8px;
}
.rc-pagination-prev,
.rc-pagination-next,
.rc-pagination-jump-prev,
.rc-pagination-jump-next {
  display: inline-block;
  min-width: 28px;
  height: 28px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 28px;
  text-align: center;
  vertical-align: middle;
  list-style: none;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s;
}
.rc-pagination-prev,
.rc-pagination-next {
  outline: 0;
}
.rc-pagination-prev button,
.rc-pagination-next button {
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  user-select: none;
}
.rc-pagination-prev:hover button,
.rc-pagination-next:hover button {
  border-color: #40a9ff;
}
.rc-pagination-prev .rc-pagination-item-link,
.rc-pagination-next .rc-pagination-item-link {
  display: block;
  width: 100%;
  height: 100%;
  font-size: 12px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  transition: all 0.3s;
}
.rc-pagination-prev:focus .rc-pagination-item-link,
.rc-pagination-next:focus .rc-pagination-item-link,
.rc-pagination-prev:hover .rc-pagination-item-link,
.rc-pagination-next:hover .rc-pagination-item-link {
  color: #1890ff;
  border-color: #1890ff;
}
.rc-pagination-prev button:after {
  content: '‹';
  display: block;
}
.rc-pagination-next button:after {
  content: '›';
  display: block;
}
.rc-pagination-disabled,
.rc-pagination-disabled:hover,
.rc-pagination-disabled:focus {
  cursor: not-allowed;
}
.rc-pagination-disabled .rc-pagination-item-link,
.rc-pagination-disabled:hover .rc-pagination-item-link,
.rc-pagination-disabled:focus .rc-pagination-item-link {
  color: rgba(0, 0, 0, 0.25);
  border-color: #d9d9d9;
  cursor: not-allowed;
}
.rc-pagination-slash {
  margin: 0 10px 0 5px;
}
.rc-pagination-options {
  display: inline-block;
  margin-left: 16px;
  vertical-align: middle;
}
@media all and (-ms-high-contrast: none) {
  .rc-pagination-options *::-ms-backdrop,
  .rc-pagination-options {
    vertical-align: top;
  }
}
.rc-pagination-options-size-changer.rc-select {
  display: inline-block;
  width: auto;
  margin-right: 8px;
}
.rc-pagination-options-quick-jumper {
  display: inline-block;
  height: 28px;
  line-height: 28px;
  vertical-align: top;
}
.rc-pagination-options-quick-jumper input {
  width: 50px;
  margin: 0 8px;
}
.rc-pagination-simple .rc-pagination-prev,
.rc-pagination-simple .rc-pagination-next {
  height: 24px;
  line-height: 24px;
  vertical-align: top;
}
.rc-pagination-simple .rc-pagination-prev .rc-pagination-item-link,
.rc-pagination-simple .rc-pagination-next .rc-pagination-item-link {
  height: 24px;
  background-color: transparent;
  border: 0;
}
.rc-pagination-simple .rc-pagination-prev .rc-pagination-item-link::after,
.rc-pagination-simple .rc-pagination-next .rc-pagination-item-link::after {
  height: 24px;
  line-height: 24px;
}
.rc-pagination-simple .rc-pagination-simple-pager {
  display: inline-block;
  height: 24px;
  margin-right: 8px;
}
.rc-pagination-simple .rc-pagination-simple-pager input {
  box-sizing: border-box;
  height: 100%;
  margin-right: 8px;
  padding: 0 6px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  outline: none;
  transition: border-color 0.3s;
}
.rc-pagination-simple .rc-pagination-simple-pager input:hover {
  border-color: #1890ff;
}
.rc-pagination.rc-pagination-disabled {
  cursor: not-allowed;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item {
  background: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item a {
  color: rgba(0, 0, 0, 0.25);
  background: transparent;
  border: none;
  cursor: not-allowed;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item-active {
  background: #dbdbdb;
  border-color: transparent;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item-active a {
  color: #fff;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item-link {
  color: rgba(0, 0, 0, 0.25);
  background: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item-link-icon {
  opacity: 0;
}
.rc-pagination.rc-pagination-disabled .rc-pagination-item-ellipsis {
  opacity: 1;
}
@media only screen and (max-width: 992px) {
  .rc-pagination-item-after-jump-prev,
  .rc-pagination-item-before-jump-next {
    display: none;
  }
}
@media only screen and (max-width: 576px) {
  .rc-pagination-options {
    display: none;
  }
}

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