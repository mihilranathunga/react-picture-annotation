import React from "react";
import DeleteButton from "./DeleteButton";

export interface IDefaultInputSection {
  editable: boolean;
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export default ({
  editable,
  value,
  onChange,
  onDelete
}: IDefaultInputSection) => {
  return (
    <div className="rp-default-input-section">
      <input
        className="rp-default-input-section_input"
        placeholder="INPUT TAG HERE"
        value={value}
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
