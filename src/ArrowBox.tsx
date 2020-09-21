import React, { MouseEventHandler, TouchEventHandler } from "react";
import styled from "styled-components";
import { ArcherContainer, ArcherElement } from "react-archer";

interface ArrowPosition {
  arrowPosition: any;
}
interface ArrowBoxProps extends ArrowPosition {
  annotation: any;
  renderArrowWithBox: any;
}

const SourcePoint = styled.div.attrs((props: ArrowPosition) => ({
  style: {
    left: `${props.arrowPosition.x + props.arrowPosition.offsetX}px`,
    top: `${props.arrowPosition.y - props.arrowPosition.offsetY}px`,
  },
}))<ArrowPosition>`
  position: absolute;
  z-index: 1000;
`;
const TargetPoint = styled.div.attrs((props: ArrowPosition) => ({
  style: {
    left: `${props.arrowPosition.x}px`,
    top: `${props.arrowPosition.y}px`,
  },
}))<ArrowPosition>`
  position: absolute;
`;
const Dummy = styled.div`
  width: 1px;
  height: 1px;
`;
const StyledArcherContainer = styled(ArcherContainer)`
  width: 100%;
  height: 100%;
  position: absolute !important;
  z-index: -1;
`;

export default class ArrowBox extends React.Component<ArrowBoxProps> {
  private onMouseDown: MouseEventHandler<HTMLCanvasElement> = (event) => {
    // const { offsetX, offsetY } = event.nativeEvent;
    // const { positionX, positionY } = this.calculateMousePosition(
    //   offsetX,
    //   offsetY
    // );
    // this.currentAnnotationState.onMouseDown(positionX, positionY);
    // if (!(creatable || editable) || event.shiftKey) {
    //   const { originX, originY } = this.scaleState;
    //   this.startDrag = { x: offsetX, y: offsetY, originX, originY };
    // };
  };

  private onMouseMove: MouseEventHandler<HTMLCanvasElement> = (event) => {
    // const { offsetX, offsetY } = event.nativeEvent;
    // const { positionX, positionY } = this.calculateMousePosition(
    //   offsetX,
    //   offsetY
    // );
    // this.currentAnnotationState.onMouseMove(positionX, positionY);
    // if (this.startDrag) {
    //   this.scaleState.originX =
    //     this.startDrag.originX + (offsetX - this.startDrag.x);
    //   this.scaleState.originY =
    //     this.startDrag.originY + (offsetY - this.startDrag.y);
    //   this.setState({ imageScale: this.scaleState, hideArrowPreview: true });
    //   requestAnimationFrame(() => {
    //     this.onShapeChange();
    //     this.onImageChange();
    //   });
    // }
  };

  private onMouseUp: MouseEventHandler<HTMLCanvasElement> = () => {
    // this.currentAnnotationState.onMouseUp();
    // this.startDrag = undefined;
    // this.setState({ hideArrowPreview: false });
  };

  render() {
    const { annotation, arrowPosition, renderArrowWithBox } = this.props;
    return (
      <StyledArcherContainer strokeColor="orange" strokeWidth={1}>
        <ArcherElement
          id={`${annotation.id}-source`}
          relations={[
            {
              targetId: `${annotation.id}-target`,
              targetAnchor: "top",
              sourceAnchor: "bottom",
            },
          ]}
          className="archerSource"
        >
          <SourcePoint
            arrowPosition={arrowPosition}
            // onMouseDown={this.onMouseDown}
            // onMouseMove={this.onMouseMove}
            // onMouseUp={this.onMouseUp}
          >
            {renderArrowWithBox(annotation)}
          </SourcePoint>
        </ArcherElement>
        <ArcherElement id={`${annotation.id}-target`} className="archertarget">
          <TargetPoint arrowPosition={arrowPosition}>
            <Dummy />
          </TargetPoint>
        </ArcherElement>
      </StyledArcherContainer>
    );
  }
}
