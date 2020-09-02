import React, { useEffect, useState, useMemo } from 'react';
import { action } from '@storybook/addon-actions';
import { boolean, select } from '@storybook/addon-knobs';
import { CogniteFileViewer, ViewerEditCallbacks } from '../src';
import { imgSdk, imgFile, pdfFile, pdfSdk } from './utils';
import {
  listAnnotationsForFile,
  CogniteAnnotation,
} from '@cognite/annotations';
import { Button } from '@cognite/cogs.js';
import {
  useSelectedAnnotation,
  useExtractFromCanvas,
} from '../src/Cognite/FileViewerContext';
import {
  useDownloadPDF,
  useZoomControls,
} from '../src/Cognite/FileViewerContext';

export const AllowCustomization = () => {
  const [annotations, setAnnotations] = useState<CogniteAnnotation[]>([]);
  useEffect(() => {
    (async () => {
      const annotationsFromCdf = await listAnnotationsForFile(pdfSdk, pdfFile);
      setAnnotations(
        annotationsFromCdf.concat([
          {
            id: 123,
            label: 'David',
            createdTime: new Date(),
            lastUpdatedTime: new Date(),
            type: 'tmp_annotation',
            status: 'unhandled',
            box: { xMin: 0.1, xMax: 0.2, yMin: 0.1, yMax: 0.2 },
            version: 5,
            page: 1,
            source: 'tmp',
          },
        ])
      );
    })();
  }, []);
  return (
    <CogniteFileViewer
      sdk={pdfSdk}
      file={pdfFile}
      disableAutoFetch={true}
      annotations={annotations}
    />
  );
};

export const AllowControlledEditing = () => {
  const [annotations, setAnnotations] = useState<CogniteAnnotation[]>([]);
  useEffect(() => {
    (async () => {
      setAnnotations(await listAnnotationsForFile(pdfSdk, pdfFile));
    })();
  }, []);

  const callbacks: ViewerEditCallbacks = useMemo(
    () => ({
      onCreate: (annotation) => {
        // decide if changes should complete
        setAnnotations(annotations.concat([annotation as CogniteAnnotation]));
        return false;
      },
      onUpdate: (annotation) => {
        // decide if changes should complete
        setAnnotations(
          annotations
            .filter((el) => `${el.id}` !== `${annotation.id}`)
            .concat([annotation as CogniteAnnotation])
        );
        return false;
      },
    }),
    [annotations, setAnnotations]
  );
  return (
    <CogniteFileViewer
      sdk={imgSdk}
      file={imgFile}
      disableAutoFetch={true}
      annotations={annotations}
      editable={true}
      editCallbacks={callbacks}
      renderItemPreview={(anno) => (
        <>
          <span>{anno.comment}</span>
          <Button
            icon="Delete"
            onClick={() =>
              setAnnotations(
                annotations.filter((el) => `${el.id}` !== `${anno.id}`)
              )
            }
          />
        </>
      )}
    />
  );
};

export const SplitContextAndViewer = () => {
  const AnotherComponent = () => {
    // This component now has access to all of the utilities and props of the viewer!
    const download = useDownloadPDF();
    const { zoomIn, zoomOut, reset } = useZoomControls();
    const extract = useExtractFromCanvas();
    const {
      selectedAnnotation,
      setSelectedAnnotation,
    } = useSelectedAnnotation();

    return (
      <div style={{ width: 200, background: 'white' }}>
        <Button onClick={() => download!('testing.pdf')}>Download</Button>
        <Button onClick={() => zoomIn!()}>Zoom In</Button>
        <Button onClick={() => zoomOut!()}>Zoom Out</Button>
        <Button onClick={() => reset!()}>Reset</Button>

        {selectedAnnotation && (
          <Button onClick={() => setSelectedAnnotation(undefined)}>
            Unselect Annotation
          </Button>
        )}
        {selectedAnnotation &&
          `${selectedAnnotation.type}: ${selectedAnnotation.description}`}
        {selectedAnnotation && (
          <img
            style={{
              objectFit: 'contain',
              width: '100%',
            }}
            src={extract!(
              selectedAnnotation.box.xMin,
              selectedAnnotation.box.yMin,
              selectedAnnotation.box.xMax - selectedAnnotation.box.xMin,
              selectedAnnotation.box.yMax - selectedAnnotation.box.yMin
            )}
          />
        )}
      </div>
    );
  };
  return (
    <CogniteFileViewer.Provider sdk={pdfSdk}>
      <div style={{ height: '100%', width: '100%', display: 'flex' }}>
        <AnotherComponent />
        <CogniteFileViewer.FileViewer file={pdfFile} editable={true} />
      </div>
    </CogniteFileViewer.Provider>
  );
};

export const Playground = () => {
  return (
    <CogniteFileViewer
      sdk={pdfSdk}
      file={pdfFile}
      editable={boolean('Editable', false)}
      creatable={boolean('Creatable', false)}
      hideControls={boolean('Hide Controls', false)}
      hideLabel={boolean('Hide Label', false)}
      hoverable={boolean('Hoverable', false)}
      pagination={select('Pagination', ['small', 'normal', false], 'normal')}
      onAnnotationSelected={action('onAnnotationSelected')}
    />
  );
};
