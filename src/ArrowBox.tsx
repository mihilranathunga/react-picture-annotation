import React, { MouseEventHandler } from "react";
import styled from "styled-components";
import { ArcherContainer, ArcherElement } from "react-archer";

interface ArrowPosition {
  arrowPosition: any;
}
interface ArrowBoxEvents {
  onMouseDown: MouseEventHandler;
  onMouseMove: MouseEventHandler;
  onMouseUp: MouseEventHandler;
}
interface ArrowBoxProps extends ArrowPosition, ArrowBoxEvents {
  annotation: any;
  renderArrowWithBox: any;
  changeBoxPosition: any;
}

const SourcePoint = styled.div.attrs((props: ArrowPosition) => ({
  style: {
    left: `${props.arrowPosition.x + props.arrowPosition.offsetX}px`,
    top: `${props.arrowPosition.y - props.arrowPosition.offsetY}px`,
  },
}))<ArrowPosition>`
  position: absolute;
  pointer-events: auto;
  cursor: grab;
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
// TODO remove !important
const StyledArcherContainer = styled(ArcherContainer)`
  width: 100%;
  height: 100%;
  pointer-events: none;
  position: absolute !important;
`;

export default class ArrowBox extends React.Component<ArrowBoxProps> {
  public state = {
    dragged: false,
    offsetStartX: 0,
    offsetStartY: 0,
    offsetEndX: 0,
    offsetEndY: 0,
  };

  private onMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    this.setState({
      dragged: true,
      offsetStartX: event.nativeEvent.x,
      offsetStartY: event.nativeEvent.y,
    });
  };

  private onMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    // TODO needs to be global - callback?
    if (this.state.dragged) {
      const offsetX = event.nativeEvent.x;
      const offsetY = event.nativeEvent.y;
      this.setState({
        offsetEndX: offsetX,
        offsetEndY: offsetY,
      });
    }
  };

  private onMouseUp: MouseEventHandler<HTMLDivElement> = (_event) => {
    if (this.state.dragged) {
      this.props.changeBoxPosition(
        this.props.annotation,
        this.state.offsetStartX - this.state.offsetEndX,
        this.state.offsetStartY - this.state.offsetEndY
      );
      this.setState({ dragged: false });
    }
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
        >
          <SourcePoint
            arrowPosition={arrowPosition}
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onMouseMove}
            onMouseUp={this.onMouseUp}
          >
            {renderArrowWithBox(annotation)}
          </SourcePoint>
        </ArcherElement>
        <ArcherElement id={`${annotation.id}-target`}>
          <TargetPoint arrowPosition={arrowPosition}>
            <Dummy />
          </TargetPoint>
        </ArcherElement>
      </StyledArcherContainer>
    );
  }
}
