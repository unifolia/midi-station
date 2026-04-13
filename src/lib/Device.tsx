import { GlobalChannelSelect } from "../styles/components";

interface DeviceProps {
  device: string;
  deviceList: string[];
  setDevice: (deviceName: string) => void;
}

const Device = ({ device, deviceList, setDevice }: DeviceProps) => {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
      <h3 id="device-heading" style={{ margin: 0 }}>MIDI Device:</h3>
      <GlobalChannelSelect
        id="midi-device"
        aria-labelledby="device-heading"
        value={device}
        onChange={(e) => setDevice(e.target.value)}
      >
        <option value="">Select Device...</option>
        {deviceList.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </GlobalChannelSelect>
    </div>
  );
};

export default Device;
