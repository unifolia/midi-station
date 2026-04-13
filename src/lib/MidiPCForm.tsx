import { useState, useRef, useCallback, useEffect, memo } from "react";
import { HexColorPicker } from "react-colorful";
import {
  MidiFormContainer,
  FormHeader,
  FormHeaderContent,
  FormTitleDisplay,
  FormTitleInput,
  FormGroup,
  FormLabel,
  Select,
  SendButton,
  ColorPicker,
  ColorSwatch,
  ColorPopover,
} from "../styles/components";
import labelHandler from "../util/labelHandler";

interface MidiPCFormProps {
  midiChannel: number;
  setMidiChannel: (channel: number) => void;
  program: number;
  setProgram: (program: number) => void;
  label: string;
  setLabel: (label: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  sendPC: (channel: number, program: number) => void;
}

const MidiPCForm = memo(
  ({
    midiChannel,
    setMidiChannel,
    program,
    setProgram,
    label,
    setLabel,
    backgroundColor,
    setBackgroundColor,
    sendPC,
  }: MidiPCFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const closePicker = useCallback((e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }, []);

    useEffect(() => {
      if (isPickerOpen) {
        document.addEventListener("mousedown", closePicker);
        return () => document.removeEventListener("mousedown", closePicker);
      }
    }, [isPickerOpen, closePicker]);

    const {
      handleLabelClick,
      handleLabelChange,
      handleLabelBlur,
      handleLabelKeyDown,
    } = labelHandler;

    return (
      <MidiFormContainer
        style={{ background: backgroundColor + "55" }}
        role="group"
        aria-label={label}
      >
        <FormHeader>
          <FormHeaderContent>
            {isEditing ? (
              <FormTitleInput
                type="text"
                value={label}
                aria-label="Control block name"
                onChange={(e) => handleLabelChange(setLabel, e)}
                onBlur={() => handleLabelBlur(setIsEditing, label, setLabel)}
                onKeyDown={(e) => handleLabelKeyDown(setIsEditing, e)}
                autoFocus
              />
            ) : (
              <FormTitleDisplay
                role="button"
                tabIndex={0}
                onClick={() => handleLabelClick(setIsEditing)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLabelClick(setIsEditing);
                  }
                }}
                aria-label={`${label} — click to rename`}
              >
                {label}
              </FormTitleDisplay>
            )}
          </FormHeaderContent>
        </FormHeader>

        <FormGroup>
          <FormLabel htmlFor="pc-midi-channel">MIDI Channel:</FormLabel>
          <Select
            id="pc-midi-channel"
            value={midiChannel}
            onChange={(e) => setMidiChannel(Number(e.target.value))}
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="pc-program">Program:</FormLabel>
          <Select
            id="pc-program"
            value={program}
            onChange={(e) => setProgram(Number(e.target.value))}
          >
            {Array.from({ length: 128 }, (_, i) => i).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </FormGroup>

        <SendButton
          type="button"
          onClick={() => sendPC(midiChannel, program)}
        >
          Send
        </SendButton>

        <ColorPicker ref={pickerRef}>
          <FormLabel>Background:</FormLabel>
          <ColorSwatch
            type="button"
            style={{ background: backgroundColor }}
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            aria-label="Choose background color"
          />
          {isPickerOpen && (
            <ColorPopover>
              <HexColorPicker
                color={backgroundColor}
                onChange={setBackgroundColor}
              />
            </ColorPopover>
          )}
        </ColorPicker>
      </MidiFormContainer>
    );
  }
);

export default MidiPCForm;
