import ReactPictureAnnotation from "../ReactPictureAnnotation";
import { RectShape } from "../Shape";
import Transformer from "../Transformer";
import randomId from "../utils/randomId";
import { IAnnotationState } from "./AnnotationState";
import CreatingAnnotationState from "./CreatingAnnotationState";
import DraggingAnnotationState from "./DraggingAnnotationState";
import TransformationState from "./TransfromationState";

export class DefaultAnnotationState implements IAnnotationState {
  private context: ReactPictureAnnotation;
  private hasMoved = false;
  private hasClicked = false;

  constructor(context: ReactPictureAnnotation) {
    this.context = context;
    this.hasMoved = false;
    this.hasClicked = false;
  }
  public onMouseMove = (positionX: number, positionY: number) => {
    if (this.hasClicked) {
      this.hasMoved = true;
    }
    if (this.context.props.hoverable) {
      this.checkSelectedId(positionX, positionY);
    }
  };
  public onMouseUp = () => {
    if (!this.hasMoved && this.hasClicked) {
      this.context.selectedId = null;
    }
    this.context.onShapeChange();
    this.hasMoved = false;
    this.hasClicked = false;
  };

  public onMouseLeave = () => {
    this.hasClicked = false;
    this.hasMoved = false;
  };

  public onMouseDown = (positionX: number, positionY: number) => {
    this.hasClicked = true;
    const {
      shapes,
      currentTransformer,
      onShapeChange,
      setAnnotationState: setState,
      props: { editable }
    } = this.context;

    if (
      currentTransformer &&
      currentTransformer.checkBoundary(positionX, positionY)
    ) {
      currentTransformer.startTransformation(positionX, positionY);
      setState(new TransformationState(this.context));
      return;
    }

    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].checkBoundary(positionX, positionY)) {
        this.context.selectedId = shapes[i].getAnnotationData().id;
        this.context.currentTransformer = new Transformer(shapes[i], editable);
        const [selectedShape] = shapes.splice(i, 1);
        shapes.push(selectedShape);
        selectedShape.onDragStart(positionX, positionY);
        onShapeChange();
        setState(new DraggingAnnotationState(this.context));
        return;
      }
    }
    if (editable) {
      const newShapeId = randomId();
      this.context.shapes.push(
        new RectShape(
          {
            id: newShapeId,
            mark: {
              x: positionX,
              y: positionY,
              width: 0,
              height: 0,
              type: "RECT"
            }
          },
          onShapeChange
        )
      );

      this.context.pendingShapeId = newShapeId;

      setState(new CreatingAnnotationState(this.context));
    }
  };

  private checkSelectedId = (positionX: number, positionY: number) => {
    const { shapes, onShapeChange } = this.context;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (
        shapes[i].checkBoundary(
          positionX,
          positionY,
          (shapes[i].getAnnotationData().mark.strokeWidth || 4) + 10
        )
      ) {
        const { id } = shapes[i].getAnnotationData();
        if (this.context.selectedId !== id) {
          this.context.selectedId = id;
          onShapeChange();
        }
        return;
      }
    }
    if (this.context.selectedId) {
      this.context.selectedId = null;
      onShapeChange();
    }
  };
}
