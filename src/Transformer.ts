import { IShape, IShapeBase } from "Shape";

const NODE_WIDTH = 10;

export interface ITransformer {
  id: string;
  checkBoundary: (positionX: number, positionY: number) => boolean;
  startTransformation: (positionX: number, positionY: number) => void;
  onTransformation: (positionX: number, positionY: number) => void;
  paint: (
    canvas2D: CanvasRenderingContext2D,
    calculateTruePosition: (shapeData: IShapeBase) => IShapeBase
  ) => void;
}

export default class Transformer implements ITransformer {
  public id: string;
  private shape: IShape;
  private editable: boolean;
  private currentNodeCenterIndex: number;
  private calculateTruePosition: (shapeData: IShapeBase) => IShapeBase;
  private getImageSize: () => { width: number; height: number };

  constructor(
    shape: IShape,
    editable: boolean,
    getImageSize: () => { width: number; height: number },
    calculateTruePosition: (shapeData: IShapeBase) => IShapeBase
  ) {
    this.shape = shape;
    this.editable = editable;
    this.id = shape.getAnnotationData().id;
    this.getImageSize = getImageSize;
    this.calculateTruePosition = calculateTruePosition;
  }
  public checkBoundary = (positionX: number, positionY: number) => {
    const currentCenterIndex = this.getCenterIndexByCursor(
      positionX,
      positionY
    );
    return currentCenterIndex >= 0;
  };

  public startTransformation = (positionX: number, positionY: number) => {
    const currentCenterIndex = this.getCenterIndexByCursor(
      positionX,
      positionY
    );
    this.currentNodeCenterIndex = currentCenterIndex;
  };

  public onTransformation = (positionX: number, positionY: number) => {
    const currentCentersTable = this.getAllCentersTable();
    currentCentersTable[this.currentNodeCenterIndex].adjust(
      positionX,
      positionY
    );
  };

  public paint = (
    canvas2D: CanvasRenderingContext2D,
    calculateTruePosition: (shapeData: IShapeBase) => IShapeBase
  ) => {
    const allCentersTable = this.getAllCentersTable();
    canvas2D.save();
    canvas2D.fillStyle = "#5c7cfa";
    if (this.editable) {
      for (const item of allCentersTable) {
        const { x, y, width, height } = calculateTruePosition({
          x: item.x - NODE_WIDTH / 2,
          y: item.y - NODE_WIDTH / 2,
          width: NODE_WIDTH,
          height: NODE_WIDTH,
        });
        canvas2D.fillRect(x, y, width, height);
      }
    }

    canvas2D.restore();
  };

  private getCenterIndexByCursor = (positionX: number, positionY: number) => {
    const allCentersTable = this.getAllCentersTable();
    return allCentersTable.findIndex((item) =>
      this.checkEachRectBoundary(item.x, item.y, positionX, positionY)
    );
  };

  private checkEachRectBoundary = (
    rectCenterX: number,
    rectCenterY: number,
    positionX: number,
    positionY: number
  ) => {
    if (
      Math.abs(positionX - rectCenterX) <= NODE_WIDTH / 2 &&
      Math.abs(positionY - rectCenterY) <= NODE_WIDTH / 2
    ) {
      return true;
    }
    return false;
  };

  private getAllCentersTable = () => {
    const { shape } = this;
    const isPercentage =
      shape.getAnnotationData().mark.width < 1 &&
      shape.getAnnotationData().mark.height < 1;
    const {
      x: scaledX,
      y: scaledY,
      width: scaledWidth,
      height: scaledHeight,
    } = this.calculateTruePosition(shape.getAnnotationData().mark);
    const { x, y, width, height } = shape.getAnnotationData().mark;
    const { width: imageWidth, height: imageHeight } = this.getImageSize();
    return [
      {
        x: scaledX,
        y: scaledY,
        adjust: (positionX: number, positionY: number) => {
          if (isPercentage) {
            positionX = positionX / imageWidth;
            positionY = positionY / imageHeight;
          }
          shape.adjustMark({
            x: positionX,
            y: positionY,
            width: width + x - positionX,
            height: height + y - positionY,
          });
        },
      },
      {
        x: scaledX + scaledWidth / 2,
        y: scaledY,
        adjust: (_: number, positionY: number) => {
          if (isPercentage) {
            positionY = positionY / imageHeight;
          }
          shape.adjustMark({
            y: positionY,
            height: height + y - positionY,
          });
        },
      },
      {
        x: scaledX + scaledWidth,
        y: scaledY,
        adjust: (positionX: number, positionY: number) => {
          if (isPercentage) {
            positionX = positionX / imageWidth;
            positionY = positionY / imageHeight;
          }
          shape.adjustMark({
            x,
            y: positionY,
            width: positionX - x,
            height: y + height - positionY,
          });
        },
      },
      {
        x: scaledX,
        y: scaledY + scaledHeight / 2,
        adjust: (positionX: number) => {
          if (isPercentage) {
            positionX = positionX / imageWidth;
          }
          shape.adjustMark({
            x: positionX,
            width: width + x - positionX,
          });
        },
      },
      {
        x: scaledX + scaledWidth,
        y: scaledY + scaledHeight / 2,
        adjust: (positionX: number) => {
          if (isPercentage) {
            positionX = positionX / imageWidth;
          }
          shape.adjustMark({ width: positionX - x });
        },
      },
      {
        x: scaledX,
        y: scaledY + scaledHeight,
        adjust: (positionX: number, positionY: number) => {
          if (isPercentage) {
            positionX = positionX / imageWidth;
            positionY = positionY / imageHeight;
          }
          shape.adjustMark({
            x: positionX,
            width: width + x - positionX,
            height: positionY - y,
          });
        },
      },
      {
        x: scaledX + scaledWidth / 2,
        y: scaledY + scaledHeight,
        adjust: (_: number, positionY: number) => {
          if (isPercentage) {
            positionY = positionY / imageHeight;
          }
          shape.adjustMark({
            height: positionY - y,
          });
        },
      },
      {
        x: scaledX + scaledWidth,
        y: scaledY + scaledHeight,
        adjust: (positionX: number, positionY: number) => {
          if (isPercentage) {
            positionX = positionX / imageWidth;
            positionY = positionY / imageHeight;
          }
          shape.adjustMark({
            width: positionX - x,
            height: positionY - y,
          });
        },
      },
    ];
  };
}
