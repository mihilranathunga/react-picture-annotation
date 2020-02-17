import { ReactPictureAnnotation } from "index";
import { IAnnotationState } from "./AnnotationState";
import { DefaultAnnotationState } from "./DefaultAnnotationState";

export default class CreatingAnnotationState implements IAnnotationState {
  private context: ReactPictureAnnotation;
  constructor(context: ReactPictureAnnotation) {
    this.context = context;
  }
  public onMouseDown = () => undefined;
  public onMouseMove = (positionX: number, positionY: number) => {
    const { shapes } = this.context;
    if (shapes.length > 0) {
      const currentShape = shapes.find(
        el => el.getAnnotationData().id === this.context.pendingShapeId
      );
      if (currentShape) {
        const {
          mark: { x, y }
        } = currentShape.getAnnotationData();
        currentShape.adjustMark({
          width: positionX - x,
          height: positionY - y
        });
      }
    }
  };

  public onMouseUp = () => {
    const { shapes, onShapeChange, setAnnotationState } = this.context;
    const data = shapes.find(
      el => el.getAnnotationData().id === this.context.pendingShapeId
    );
    if (data) {
      if (
        data &&
        data.getAnnotationData().mark.width !== 0 &&
        data.getAnnotationData().mark.height !== 0
      ) {
        this.context.selectedId = data.getAnnotationData().id;
      } else {
        this.context.selectedId = null;
      }
    } else {
      this.context.pendingShapeId = null;
      this.context.selectedId = null;
    }
    setAnnotationState(new DefaultAnnotationState(this.context));
    onShapeChange();
  };

  public onMouseLeave = () => this.onMouseUp();
}
