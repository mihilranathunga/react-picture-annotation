export interface IAnnotationState {
  onMouseDown: (positionX: number, positionY: number) => boolean;
  onMouseMove: (positionX: number, positionY: number) => void;
  onMouseLeave: () => void;
  onMouseUp: () => void;
}
