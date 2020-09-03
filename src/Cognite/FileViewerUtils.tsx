import {
  PendingCogniteAnnotation,
  getPnIDAnnotationType,
  CogniteAnnotation,
} from '@cognite/annotations';
import { Colors } from '@cognite/cogs.js';
import { IAnnotation, IRectShapeData } from '..';
import { CogniteClient as CogniteClientV2 } from 'cognite-sdk-v2';
import { CogniteClient as CogniteClientV3, FileInfo } from 'cognite-sdk-v3';

export interface ProposedCogniteAnnotation extends PendingCogniteAnnotation {
  id: string;
}

export const selectAnnotationColor = <T extends PendingCogniteAnnotation>(
  annotation: T,
  isSelected = false
) => {
  if (isSelected) {
    return Colors.midblue.hex();
  }
  // Assets are purple
  if (annotation.resourceType === 'asset') {
    if (getPnIDAnnotationType(annotation).includes('Model')) {
      return Colors['purple-3'].hex();
    }
    return Colors['purple-2'].hex();
  }

  // Files are orange
  if (annotation.resourceType === 'file') {
    if (getPnIDAnnotationType(annotation).includes('Model')) {
      return Colors['midorange-3'].hex();
    }
    return Colors['midorange-2'].hex();
  }

  // TS are light blue
  if (annotation.resourceType === 'timeSeries') {
    if (getPnIDAnnotationType(annotation).includes('Model')) {
      return Colors['lightblue-3'].hex();
    }
    return Colors['lightblue-2'].hex();
  }

  // Sequences are yellow
  if (annotation.resourceType === 'sequence') {
    if (getPnIDAnnotationType(annotation).includes('Model')) {
      return Colors['yellow-3'].hex();
    }
    return Colors['yellow-2'].hex();
  }

  // Events are pink
  if (annotation.resourceType === 'event') {
    if (getPnIDAnnotationType(annotation).includes('Model')) {
      return Colors['pink-3'].hex();
    }
    return Colors['pink-2'].hex();
  }

  // Undefined are secondary
  return Colors['text-color-secondary'].hex();
};

export const convertCogniteAnnotationToIAnnotation = (
  el: CogniteAnnotation | ProposedCogniteAnnotation,
  isSelected = false
) => {
  const isPending = typeof el.id === 'string';
  return {
    id: `${el.id}`,
    comment: el.label || 'No Label',
    page: el.page,
    mark: {
      type: 'RECT',
      x: el.box.xMin,
      y: el.box.yMin,
      width: el.box.xMax - el.box.xMin,
      height: el.box.yMax - el.box.yMin,
      strokeWidth: 2,
      strokeColor: isPending ? 'yellow' : selectAnnotationColor(el, isSelected),
    },
  } as IAnnotation<IRectShapeData>;
};

export const isSameResource = (
  a: CogniteAnnotation | ProposedCogniteAnnotation | PendingCogniteAnnotation,
  b: CogniteAnnotation | ProposedCogniteAnnotation | PendingCogniteAnnotation
) => {
  return (
    a.resourceType === b.resourceType &&
    !!(
      (a.resourceExternalId && a.resourceExternalId === b.resourceExternalId) ||
      (a.resourceId && a.resourceId === b.resourceId)
    )
  );
};

export const isPreviewableImage = (file: FileInfo) => {
  const { mimeType = '' } = file;
  return ['png', 'jpeg', 'jpg', 'svg'].some((el) => mimeType.includes(el));
};

export const retrieveDownloadUrl = async (
  client: CogniteClientV2 | CogniteClientV3,
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
export const retrieveOCRResults = async (
  client: CogniteClientV2 | CogniteClientV3,
  fileId: number
) => {
  try {
    const {
      data: {
        items: { annotations },
      },
    } = await client.post<{ items: { annotations: TextBox[] } }>(
      `/api/playground/projects/${client.project}/context/pnid/ocr`,
      { data: { fileId } }
    );
    return annotations;
  } catch (e) {
    return [];
  }
};
export interface TextBox {
  text: string;
  boundingBox: { xMin: number; xMax: number; yMin: number; yMax: number };
}
