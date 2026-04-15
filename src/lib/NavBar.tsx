import {
  NavBar,
  NavButton,
  LoadButton,
  Input,
  GlobalChannelContainer,
  GlobalChannelLabel,
  GlobalChannelSelect,
} from "../styles/components";
import { Label } from "../styles/GlobalStyles";

interface NavigationProps {
  handleAddCCInput: () => void;
  handleAddPCInput: () => void;
  savePreset: () => void;
  handleLoadPreset: (event: React.ChangeEvent<HTMLInputElement>) => void;
  globalMidiChannel: number | null;
  handleGlobalMidiChannelChange: (channel: number) => void;
}

const Navigation = ({
  handleAddCCInput,
  handleAddPCInput,
  savePreset,
  handleLoadPreset,
  globalMidiChannel,
  handleGlobalMidiChannelChange,
}: NavigationProps) => {
  return (
    <NavBar>
      <NavButton onClick={handleAddCCInput}>Add CC Input</NavButton>
      <NavButton onClick={handleAddPCInput}>Add PC Input</NavButton>
      <NavButton onClick={savePreset}>Save Preset</NavButton>
      <LoadButton>
        Upload Preset
        <Label htmlFor="upload">Upload Preset</Label>
        <Input
          id="upload"
          type="file"
          accept=".json"
          onChange={handleLoadPreset}
          value=""
        />
      </LoadButton>
      <GlobalChannelContainer>
        <GlobalChannelLabel htmlFor="global-select">
          Global MIDI Channel:
        </GlobalChannelLabel>
        <GlobalChannelSelect
          id="global-select"
          value={globalMidiChannel ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val) handleGlobalMidiChannelChange(Number(val));
          }}
        >
          <option value="">—</option>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((channel) => (
            <option key={channel} value={channel}>
              {channel}
            </option>
          ))}
        </GlobalChannelSelect>
      </GlobalChannelContainer>
    </NavBar>
  );
};

export default Navigation;
