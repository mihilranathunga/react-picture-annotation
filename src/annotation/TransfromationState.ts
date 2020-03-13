import { ReactPictureAnnotation } from "index";
import { IAnnotationState } from "./AnnotationState";
import { DefaultAnnotationState } from "./DefaultAnnotationState";

export default class TransformationState implements IAnnotationState {
  private context: ReactPictureAnnotation;
  constructor(context: ReactPictureAnnotation) {
    this.context = context;
  }
  public onMouseDown = () => undefined;
  public onMouseMove = (positionX: number, positionY: number) => {
    const { currentTransformer } = this.context;
    if (currentTransformer) {
      currentTransformer.onTransformation(positionX, positionY);
    }
  };

  public onMouseUp = () => {
    const {
      shapes,
      setAnnotationState,
      selectedId,
      props: { onAnnotationUpdate }
    } = this.context;
    setAnnotationState(new DefaultAnnotationState(this.context));
    if (onAnnotationUpdate) {
      const currentShape = shapes.find(
        el => el.getAnnotationData().id === selectedId
      );
      if (currentShape) {
        onAnnotationUpdate(currentShape.getAnnotationData());
      }
    }
  };

  public onMouseLeave = () => this.onMouseUp();
}
