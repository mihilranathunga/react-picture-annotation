import ReactPictureAnnotation from "../ReactPictureAnnotation";
import Transformer from "../Transformer";
import { IAnnotationState } from "./AnnotationState";
import DraggingAnnotationState from "./DraggingAnnotationState";
import TransformationState from "./TransfromationState";

export class DefaultAnnotationState implements IAnnotationState {
  private context: ReactPictureAnnotation;
  constructor(context: ReactPictureAnnotation) {
    this.context = context;
  }
  public onMouseMove = () => undefined;
  public onMouseUp = () => undefined;

  public onMouseLeave = () => undefined;

  public onMouseDown = (positionX: number, positionY: number) => {
    const {
      shapes,
      currentTransformer,
      onShapeChange,
      setAnnotationState: setState
    } = this.context;

    if (
      currentTransformer &&
      currentTransformer.checkBoundary(positionX, positionY)
    ) {
      currentTransformer.startTransformation(positionX, positionY);
      setState(new TransformationState(this.context));
      return true;
    }

    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].checkBoundary(positionX, positionY)) {
        this.context.selectedId = shapes[i].getAnnotationData().id;
        this.context.currentTransformer = new Transformer(shapes[i]);
        const [selectedShape] = shapes.splice(i, 1);
        shapes.push(selectedShape);
        selectedShape.onDragStart(positionX, positionY);
        onShapeChange();
        setState(new DraggingAnnotationState(this.context));
        return true;
      }
    }
    return false;
  };
}
