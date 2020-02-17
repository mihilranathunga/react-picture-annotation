import React, { MouseEventHandler, TouchEventHandler } from "react";
import { IAnnotation } from "./Annotation";
import { IAnnotationState } from "./annotation/AnnotationState";
import CreatingAnnotationState from "./annotation/CreatingAnnotationState";
import { DefaultAnnotationState } from "./annotation/DefaultAnnotationState";
import DefaultInputSection from "./DefaultInputSection";
// import DeleteButton from "./DeleteButton";
import { IShape, IShapeBase, RectShape, shapeStyle } from "./Shape";
import Transformer, { ITransformer } from "./Transformer";
import randomId from "./utils/randomId";

interface IReactPictureAnnotationProps {
  annotationData?: IAnnotation[];
  selectedId?: string | null;
  onChange: (annotationData: IAnnotation[]) => void;
  onSelect: (id: string | null) => void;
  width: number;
  height: number;
  image: string;
  editable: boolean;
  inputElement: (
    value: string,
    onChange: (value: string) => void,
    onDelete: () => void
  ) => React.ReactElement;
}

interface IStageState {
  scale: number;
  originX: number;
  originY: number;
}

const defaultState: IStageState = {
  scale: 1,
  originX: 0,
  originY: 0
};

export default class ReactPictureAnnotation extends React.Component<
  IReactPictureAnnotationProps
> {
  set selectedId(value: string | null) {
    const { onSelect } = this.props;
    this.selectedIdTrueValue = value;
    onSelect(value);
  }

  get selectedId() {
    return this.selectedIdTrueValue;
  }
  public static defaultProps = {
    inputElement: (
      value: string,
      onChange: (value: string) => void,
      onDelete: () => void
    ) => (
      <DefaultInputSection
        value={value}
        onChange={onChange}
        onDelete={onDelete}
      />
    ),
    editable: false
  };

  public shapes: IShape[] = [];
  public currentTransformer: ITransformer;

  public state = {
    inputPosition: {
      left: 0,
      top: 0
    },
    showInput: false,
    inputComment: ""
  };
  private currentAnnotationData: IAnnotation[] = [];
  private selectedIdTrueValue: string | null;
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private canvas2D?: CanvasRenderingContext2D | null;
  private imageCanvasRef = React.createRef<HTMLCanvasElement>();
  private imageCanvas2D?: CanvasRenderingContext2D | null;
  private currentImageElement?: HTMLImageElement;
  private currentAnnotationState: IAnnotationState = new DefaultAnnotationState(
    this
  );
  private scaleState = defaultState;
  private startDrag?: {
    x: number;
    y: number;
    originX: number;
    originY: number;
  } = undefined;
  private lastPinchLength?: number;

  public componentDidMount = () => {
    const currentCanvas = this.canvasRef.current;
    const currentImageCanvas = this.imageCanvasRef.current;
    if (currentCanvas && currentImageCanvas) {
      this.setCanvasDPI();

      this.canvas2D = currentCanvas.getContext("2d");
      this.imageCanvas2D = currentImageCanvas.getContext("2d");
      this.onImageChange();
    }

    this.syncAnnotationData();
    this.syncSelectedId();
  };

  public componentDidUpdate = (preProps: IReactPictureAnnotationProps) => {
    const { width, height, image } = this.props;
    if (preProps.width !== width || preProps.height !== height) {
      this.setCanvasDPI();
      this.onShapeChange();
      this.onImageChange();
    }
    if (preProps.image !== image) {
      this.cleanImage();
      if (this.currentImageElement) {
        this.currentImageElement.src = image;
      } else {
        this.onImageChange();
      }
    }

    this.syncAnnotationData();
    this.syncSelectedId();
  };

  public calculateMousePosition = (positionX: number, positionY: number) => {
    const { originX, originY, scale } = this.scaleState;
    return {
      positionX: (positionX - originX) / scale,
      positionY: (positionY - originY) / scale
    };
  };

  public calculateShapePosition = (shapeData: IShapeBase): IShapeBase => {
    const { originX, originY, scale } = this.scaleState;
    const { x, y, width, height } = shapeData;
    return {
      x: x * scale + originX,
      y: y * scale + originY,
      width: width * scale,
      height: height * scale
    };
  };

  public render() {
    const { width, height, inputElement } = this.props;
    const { showInput, inputPosition, inputComment } = this.state;
    return (
      <div className="rp-stage">
        <canvas
          style={{ width, height }}
          className="rp-image"
          ref={this.imageCanvasRef}
          width={width * 2}
          height={height * 2}
        />
        <canvas
          className="rp-shapes"
          style={{ width, height }}
          ref={this.canvasRef}
          width={width * 2}
          height={height * 2}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          onMouseLeave={this.onMouseLeave}
          onTouchStart={this.onTouchStart}
          onTouchEnd={this.onTouchEnd}
          onTouchMove={this.onTouchMove}
          onWheel={this.onWheel}
        />
        {showInput && (
          <div className="rp-selected-input" style={inputPosition}>
            {inputElement(
              inputComment,
              this.onInputCommentChange,
              this.onDelete
            )}
          </div>
        )}
      </div>
    );
  }

  public setAnnotationState = (annotationState: IAnnotationState) => {
    this.currentAnnotationState = annotationState;
  };

  public onShapeChange = () => {
    if (this.canvas2D && this.canvasRef.current) {
      this.canvas2D.clearRect(
        0,
        0,
        this.canvasRef.current.width,
        this.canvasRef.current.height
      );

      let hasSelectedItem = false;

      for (const item of this.shapes) {
        const isSelected = item.getAnnotationData().id === this.selectedId;
        const { x, y, height } = item.paint(
          this.canvas2D,
          this.calculateShapePosition,
          isSelected
        );

        if (isSelected) {
          if (!this.currentTransformer) {
            this.currentTransformer = new Transformer(item);
          }

          hasSelectedItem = true;

          this.currentTransformer.paint(
            this.canvas2D,
            this.calculateShapePosition
          );

          this.setState({
            showInput: true,
            inputPosition: {
              left: x,
              top: y + height + shapeStyle.margin
            },
            inputComment: item.getAnnotationData().comment || ""
          });
        }
      }

      if (!hasSelectedItem) {
        this.setState({
          showInput: false,
          inputComment: ""
        });
      }
    }

    this.currentAnnotationData = this.shapes.map(item =>
      item.getAnnotationData()
    );
    const { onChange } = this.props;
    onChange(this.currentAnnotationData);
  };

  private syncAnnotationData = () => {
    const { annotationData } = this.props;
    if (annotationData) {
      const refreshShapesWithAnnotationData = () => {
        this.selectedId = null;
        const nextShapes = annotationData.map(
          eachAnnotationData =>
            new RectShape(eachAnnotationData, this.onShapeChange)
        );
        this.shapes = nextShapes;
        this.onShapeChange();
      };

      if (annotationData.length !== this.shapes.length) {
        refreshShapesWithAnnotationData();
      } else {
        for (const annotationDataItem of annotationData) {
          const targetShape = this.shapes.find(
            item => item.getAnnotationData().id === annotationDataItem.id
          );
          if (targetShape && targetShape.equal(annotationDataItem)) {
            continue;
          } else {
            refreshShapesWithAnnotationData();
            break;
          }
        }
      }
    }
  };

  private syncSelectedId = () => {
    const { selectedId } = this.props;

    if (selectedId && selectedId !== this.selectedId) {
      this.selectedId = selectedId;
      this.onShapeChange();
    }
  };

  private onDelete = () => {
    const deleteTarget = this.shapes.findIndex(
      shape => shape.getAnnotationData().id === this.selectedId
    );
    if (deleteTarget >= 0) {
      this.shapes.splice(deleteTarget, 1);
      this.onShapeChange();
    }
  };

  private setCanvasDPI = () => {
    const currentCanvas = this.canvasRef.current;
    const currentImageCanvas = this.imageCanvasRef.current;
    if (currentCanvas && currentImageCanvas) {
      const currentCanvas2D = currentCanvas.getContext("2d");
      const currentImageCanvas2D = currentImageCanvas.getContext("2d");
      if (currentCanvas2D && currentImageCanvas2D) {
        currentCanvas2D.scale(2, 2);
        currentImageCanvas2D.scale(2, 2);
      }
    }
  };

  private onInputCommentChange = (comment: string) => {
    const selectedShapeIndex = this.shapes.findIndex(
      item => item.getAnnotationData().id === this.selectedId
    );
    this.shapes[selectedShapeIndex].setComment(comment);
    this.setState({ inputComment: comment });
  };

  private cleanImage = () => {
    if (this.imageCanvas2D && this.imageCanvasRef.current) {
      this.imageCanvas2D.clearRect(
        0,
        0,
        this.imageCanvasRef.current.width,
        this.imageCanvasRef.current.height
      );
    }
  };

  private onImageChange = () => {
    this.cleanImage();
    if (this.imageCanvas2D && this.imageCanvasRef.current) {
      if (this.currentImageElement) {
        const { originX, originY, scale } = this.scaleState;
        this.imageCanvas2D.drawImage(
          this.currentImageElement,
          originX,
          originY,
          this.currentImageElement.width * scale,
          this.currentImageElement.height * scale
        );
      } else {
        const nextImageNode = document.createElement("img");
        nextImageNode.addEventListener("load", () => {
          this.currentImageElement = nextImageNode;
          const { width, height } = nextImageNode;
          const imageNodeRatio = height / width;
          const { width: canvasWidth, height: canvasHeight } = this.props;
          const canvasNodeRatio = canvasHeight / canvasWidth;
          if (!isNaN(imageNodeRatio) && !isNaN(canvasNodeRatio)) {
            if (imageNodeRatio < canvasNodeRatio) {
              const scale = canvasWidth / width;
              this.scaleState = {
                originX: 0,
                originY: (canvasHeight - scale * height) / 2,
                scale
              };
            } else {
              const scale = canvasHeight / height;
              this.scaleState = {
                originX: (canvasWidth - scale * width) / 2,
                originY: 0,
                scale
              };
            }
          }
          this.onImageChange();
          this.onShapeChange();
        });
        nextImageNode.alt = "";
        nextImageNode.src = this.props.image;
      }
    }
  };

  private onMouseDown: MouseEventHandler<HTMLCanvasElement> = event => {
    const { editable } = this.props;
    const { offsetX, offsetY } = event.nativeEvent;
    const { positionX, positionY } = this.calculateMousePosition(
      offsetX,
      offsetY
    );
    const hasHighlightedShape = this.currentAnnotationState.onMouseDown(
      positionX,
      positionY
    );
    if (editable) {
      if (!hasHighlightedShape) {
        this.createNewAnnotation(positionX, positionY);
      }
    } else {
      const { originX, originY } = this.scaleState;
      this.startDrag = { x: offsetX, y: offsetY, originX, originY };
    }
  };

  private onMouseMove: MouseEventHandler<HTMLCanvasElement> = event => {
    const { editable } = this.props;
    const { offsetX, offsetY } = event.nativeEvent;
    const { positionX, positionY } = this.calculateMousePosition(
      offsetX,
      offsetY
    );
    if (editable) {
      this.currentAnnotationState.onMouseMove(positionX, positionY);
    } else if (this.startDrag) {
      this.scaleState.originX =
        this.startDrag.originX + (offsetX - this.startDrag.x);
      this.scaleState.originY =
        this.startDrag.originY + (offsetY - this.startDrag.y);

      this.setState({ imageScale: this.scaleState });

      requestAnimationFrame(() => {
        this.onShapeChange();
        this.onImageChange();
      });
    }
  };

  private onMouseUp: MouseEventHandler<HTMLCanvasElement> = () => {
    this.currentAnnotationState.onMouseUp();
    this.startDrag = undefined;
  };

  private onTouchStart: TouchEventHandler<HTMLCanvasElement> = event => {
    const { editable } = this.props;
    const { clientX, clientY } = event.touches[0];
    const { positionX, positionY } = this.calculateMousePosition(
      clientX,
      clientY
    );

    const hasHighlightedShape = this.currentAnnotationState.onMouseDown(
      positionX,
      positionY
    );
    if (editable) {
      if (!hasHighlightedShape && editable) {
        this.createNewAnnotation(positionX, positionY);
      }
    } else {
      const { touches } = event;
      if (touches.length === 2) {
        this.lastPinchLength = getPinchLength(touches);
      } else if (touches.length === 1) {
        this.lastPinchLength = undefined;
        const { originX, originY } = this.scaleState;
        this.startDrag = { x: clientX, y: clientY, originX, originY };
      }
    }

    // suppress viewport scaling on iOS
    tryCancelEvent(event);
  };

  private onTouchMove: TouchEventHandler<HTMLCanvasElement> = event => {
    const { editable } = this.props;
    const { clientX, clientY } = event.touches[0];
    const { positionX, positionY } = this.calculateMousePosition(
      clientX,
      clientY
    );
    if (editable) {
      this.currentAnnotationState.onMouseMove(positionX, positionY);
    } else {
      const { touches } = event;
      if (touches.length === 2) {
        this.handlePinchChange(touches);
      } else if (touches.length === 1) {
        if (this.startDrag) {
          this.scaleState.originX =
            this.startDrag.originX + (clientX - this.startDrag.x);
          this.scaleState.originY =
            this.startDrag.originY + (clientY - this.startDrag.y);

          this.setState({ imageScale: this.scaleState });

          requestAnimationFrame(() => {
            this.onShapeChange();
            this.onImageChange();
          });
        }
      }
    }

    // suppress viewport scaling on iOS
    tryCancelEvent(event);
  };

  private onTouchEnd: TouchEventHandler<HTMLCanvasElement> = () => {
    this.currentAnnotationState.onMouseUp();
    this.startDrag = undefined;
  };

  private handlePinchChange = (touches: React.TouchList) => {
    const length = getPinchLength(touches);
    const midpoint = getPinchMidpoint(touches);
    let scale = this.lastPinchLength
      ? (this.scaleState.scale * length) / this.lastPinchLength // sometimes we get a touchchange before a touchstart when pinching
      : this.scaleState.scale;

    if (scale > 10) {
      scale = 10;
    }
    if (scale < 0.1) {
      scale = 0.1;
    }

    const { originX, originY } = this.scaleState;

    this.scaleState.originX =
      midpoint.x - ((midpoint.x - originX) / this.scaleState.scale) * scale;
    this.scaleState.originY =
      midpoint.y - ((midpoint.y - originY) / this.scaleState.scale) * scale;
    this.scaleState.scale = scale;

    this.setState({ imageScale: this.scaleState });

    requestAnimationFrame(() => {
      this.onShapeChange();
      this.onImageChange();
    });
  };

  private onMouseLeave: MouseEventHandler<HTMLCanvasElement> = () => {
    this.currentAnnotationState.onMouseLeave();
  };

  private onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    // https://stackoverflow.com/a/31133823/9071503
    const { clientHeight, scrollTop, scrollHeight } = event.currentTarget;
    if (clientHeight + scrollTop + event.deltaY > scrollHeight) {
      // event.preventDefault();
      event.currentTarget.scrollTop = scrollHeight;
    } else if (scrollTop + event.deltaY < 0) {
      // event.preventDefault();
      event.currentTarget.scrollTop = 0;
    }

    const { scale: preScale } = this.scaleState;
    this.scaleState.scale += event.deltaY * 0.005;
    if (this.scaleState.scale > 10) {
      this.scaleState.scale = 10;
    }
    if (this.scaleState.scale < 0.1) {
      this.scaleState.scale = 0.1;
    }

    const { originX, originY, scale } = this.scaleState;
    const { offsetX, offsetY } = event.nativeEvent;
    this.scaleState.originX =
      offsetX - ((offsetX - originX) / preScale) * scale;
    this.scaleState.originY =
      offsetY - ((offsetY - originY) / preScale) * scale;

    this.setState({ imageScale: this.scaleState });

    requestAnimationFrame(() => {
      this.onShapeChange();
      this.onImageChange();
    });
  };

  private createNewAnnotation = (positionX: number, positionY: number) => {
    this.shapes.push(
      new RectShape(
        {
          id: randomId(),
          mark: {
            x: positionX,
            y: positionY,
            width: 0,
            height: 0,
            type: "RECT"
          }
        },
        this.onShapeChange
      )
    );

    this.setAnnotationState(new CreatingAnnotationState(this.context));
  };
}

export const getPinchMidpoint = (touches: React.TouchList) => {
  const touch1 = touches[0];
  const touch2 = touches[1];
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
};

export const getPinchLength = (touches: React.TouchList) => {
  const touch1 = touches[0];
  const touch2 = touches[1];
  return Math.sqrt(
    Math.pow(touch1.clientY - touch2.clientY, 2) +
      Math.pow(touch1.clientX - touch2.clientX, 2)
  );
};

export const tryCancelEvent = (event: React.TouchEvent) => {
  if (event.cancelable === false) {
    return false;
  }

  event.preventDefault();
  return true;
};
