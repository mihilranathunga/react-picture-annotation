import { ReactPictureAnnotation } from "index";
import { IAnnotationState } from "./AnnotationState";
import { DefaultAnnotationState } from "./DefaultAnnotationState";

export default class DraggingAnnotationState implements IAnnotationState {
  private hasMoved: boolean;
  private context: ReactPictureAnnotation;
  constructor(context: ReactPictureAnnotation) {
    this.context = context;
    this.hasMoved = false;
  }
  public onMouseDown = () => undefined;
  public onMouseMove = (positionX: number, positionY: number) => {
    const { shapes, selectedId } = this.context;
    const currentShape = shapes.find(
      el => el.getAnnotationData().id === selectedId
    );
    this.hasMoved = true;
    currentShape!.onDrag(positionX, positionY);
  };

  public onMouseUp = () => {
    const {
      shapes,
      setAnnotationState,
      selectedId,
      props: { onAnnotationUpdate }
    } = this.context;
    setAnnotationState(new DefaultAnnotationState(this.context));
    if (onAnnotationUpdate && this.hasMoved) {
      const currentShape = shapes.find(
        el => el.getAnnotationData().id === selectedId
      );
      onAnnotationUpdate(currentShape!.getAnnotationData());
    }
  };

  public onMouseLeave = () => this.onMouseUp();
}
