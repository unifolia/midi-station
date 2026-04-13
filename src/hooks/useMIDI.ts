import { useState, useEffect, useRef, useCallback } from "react";

interface UseMIDIOptions {
  onCC?: (channel: number, cc: number, value: number) => void;
}

interface UseMIDIReturn {
  deviceList: string[];
  device: string;
  setDevice: (device: string) => void;
  isMidiOutput: boolean;
  sendCC: (channel: number, cc: number, value: number) => void;
  sendPC: (channel: number, program: number) => void;
}

export default function useMIDI({ onCC }: UseMIDIOptions = {}): UseMIDIReturn {
  const [deviceList, setDeviceList] = useState<string[]>([]);
  const [device, setDevice] = useState("");
  const [isMidiOutput, setIsMidiOutput] = useState(false);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const deviceRef = useRef(device);
  const onCCRef = useRef(onCC);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useEffect(() => {
    onCCRef.current = onCC;
  }, [onCC]);

  const updateDeviceList = useCallback((midiAccess: MIDIAccess) => {
    const outputs = Array.from(midiAccess.outputs.values());

    if (outputs.length === 0) {
      setIsMidiOutput(false);
      setDeviceList([]);
      setDevice("");
      return;
    }

    setIsMidiOutput(true);

    const names = [
      ...new Set(
        outputs
          .map((output) => output.name)
          .filter((name): name is string => name !== null && name !== "")
      ),
    ];
    setDeviceList(names);

    if (!names.includes(deviceRef.current)) {
      setDevice("");
    }
  }, []);

  const attachInputListeners = useCallback((midiAccess: MIDIAccess) => {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        if (event.target && (event.target as MIDIInput).name !== deviceRef.current) {
          return;
        }

        if (!event.data || event.data.length < 3) return;

        const [status, data1, data2] = event.data;
        const command = status >> 4;

        if (command === 11) {
          const channel = (status & 0x0f) + 1;
          onCCRef.current?.(channel, data1, data2);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.error("MIDI is not supported on this browser :(");
      return;
    }

    navigator.requestMIDIAccess().then(
      (midiAccess) => {
        midiAccessRef.current = midiAccess;
        updateDeviceList(midiAccess);
        attachInputListeners(midiAccess);

        midiAccess.onstatechange = () => {
          updateDeviceList(midiAccess);
          attachInputListeners(midiAccess);
        };
      },
      () => console.error("Failed to access MIDI devices.")
    );
  }, [updateDeviceList, attachInputListeners]);

  const sendCC = useCallback(
    (channel: number, cc: number, value: number) => {
      const midiAccess = midiAccessRef.current;
      if (!midiAccess) return;

      const outputs = Array.from(midiAccess.outputs.values());
      const output = outputs.find((o) => o.name === deviceRef.current);

      if (output) {
        const message = [0xb0 + channel - 1, cc, value];
        output.send(message);
      }
    },
    []
  );

  const sendPC = useCallback(
    (channel: number, program: number) => {
      const midiAccess = midiAccessRef.current;
      if (!midiAccess) return;

      const outputs = Array.from(midiAccess.outputs.values());
      const output = outputs.find((o) => o.name === deviceRef.current);

      if (output) {
        const message = [0xc0 + channel - 1, program];
        output.send(message);
      }
    },
    []
  );

  return { deviceList, device, setDevice, isMidiOutput, sendCC, sendPC };
}
