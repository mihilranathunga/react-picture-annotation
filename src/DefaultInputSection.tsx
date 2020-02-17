import React from "react";
import { IAnnotation } from "./Annotation";
import DeleteButton from "./DeleteButton";

export interface IDefaultInputSection {
  editable: boolean;
  annotation: IAnnotation;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export default ({
  editable,
  annotation,
  onChange,
  onDelete
}: IDefaultInputSection) => {
  return (
    <div className="rp-default-input-section">
      <input
        className="rp-default-input-section_input"
        placeholder="INPUT TAG HERE"
        value={annotation.comment}
        disabled={!editable}
        onChange={e => onChange(e.target.value)}
      />
      {editable && (
        <a
          className="rp-default-input-section_delete"
          onClick={() => onDelete()}
        >
          <DeleteButton />
        </a>
      )}
    </div>
  );
};
