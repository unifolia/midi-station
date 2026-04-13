import { useState, useCallback, useRef } from "react";
import MidiCCForm from "./lib/MidiCCForm";
import MidiPCForm from "./lib/MidiPCForm";
import Header from "./lib/Header";
import { FormsContainer } from "./styles/components";
import { Title } from "./styles/GlobalStyles";
import Navigation from "./lib/NavBar";
import Device from "./lib/Device";
import useMIDI from "./hooks/useMIDI";
import type { MidiCCFormData } from "./types";

const DEFAULT_BG = "#909090";

const App = () => {
  const [forms, setForms] = useState({
    name: "Untitled Preset",
    inputs: [
      {
        id: 1,
        midiChannel: 1,
        midiCC: 1,
        value: 64,
        label: "MIDI Control Block",
        backgroundColor: DEFAULT_BG,
      },
    ],
  });
  const nextIdRef = useRef(2);
  const [globalMidiChannel, setGlobalMidiChannel] = useState<number | null>(
    null
  );

  const [pcForm, setPcForm] = useState({
    midiChannel: 1,
    program: 0,
    label: "Program Change",
    backgroundColor: DEFAULT_BG,
  });

  const onCC = useCallback((channel: number, cc: number, value: number) => {
    setForms((prev) => ({
      ...prev,
      inputs: prev.inputs.map((form) =>
        form.midiChannel === channel && form.midiCC === cc
          ? { ...form, value }
          : form
      ),
    }));
  }, []);

  const { deviceList, device, setDevice, isMidiOutput, sendCC, sendPC } =
    useMIDI({ onCC });

  const handleGlobalMidiChannelChange = (newGlobalChannel: number) => {
    setGlobalMidiChannel(newGlobalChannel);
    if (newGlobalChannel !== null) {
      setForms((prev) => ({
        ...prev,
        inputs: prev.inputs.map((form) => ({
          ...form,
          midiChannel: newGlobalChannel,
        })),
      }));
      setPcForm((prev) => ({ ...prev, midiChannel: newGlobalChannel }));
    }
  };

  const handleAddCCInput = () => {
    if (forms.inputs.length < 50) {
      const id = nextIdRef.current++;
      const lastColor =
        forms.inputs[forms.inputs.length - 1]?.backgroundColor || DEFAULT_BG;
      setForms((prev) => ({
        ...prev,
        inputs: [
          ...prev.inputs,
          {
            id,
            midiChannel: globalMidiChannel || 1,
            midiCC: 1,
            value: 64,
            label: "MIDI Control Block",
            backgroundColor: lastColor,
          },
        ],
      }));
    }
  };

  const handleRemoveCCForm = useCallback((id: number) => {
    setForms((prev) => ({
      ...prev,
      inputs: prev.inputs.filter((form) => form.id !== id),
    }));
  }, []);

  const updateCCFormField = useCallback(
    (id: number, field: keyof MidiCCFormData, value: string | number) => {
      setForms((prev) => ({
        ...prev,
        inputs: prev.inputs.map((form) =>
          form.id === id ? { ...form, [field]: value } : form
        ),
      }));
    },
    []
  );

  const savePreset = async () => {
    const preset = {
      name: forms.name,
      timestamp: new Date().toISOString(),
      forms: forms.inputs,
      pcForm,
      globalMidiChannel,
    };

    const dataStr = JSON.stringify(preset, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const suggestedName = `${preset.name.replace(/[^a-z0-9]/gi, "_")}`;

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${suggestedName}.json`,
        });
        const writable = await handle.createWritable();
        await writable.write(dataBlob);
        await writable.close();
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error("Save failed:", error);
        }
      }
    } else {
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${suggestedName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleLoadPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const result = event.target?.result as string;
          const preset = JSON.parse(result);
          if (!preset.forms || !Array.isArray(preset.forms)) {
            alert("Invalid preset file");
            return;
          }

          const validForms = preset.forms.filter(
            (f: Record<string, unknown>) =>
              typeof f.id === "number" &&
              typeof f.midiChannel === "number" &&
              typeof f.midiCC === "number" &&
              typeof f.value === "number" &&
              typeof f.label === "string" &&
              typeof f.backgroundColor === "string"
          ) as MidiCCFormData[];

          if (validForms.length === 0) {
            alert("No valid CC forms found in preset file");
            return;
          }

          setForms({
            name: typeof preset.name === "string" ? preset.name : "Untitled Preset",
            inputs: validForms,
          });

          const maxId = Math.max(...validForms.map((f) => f.id), 0);
          nextIdRef.current = maxId + 1;

          if (
            preset.pcForm &&
            typeof preset.pcForm.midiChannel === "number" &&
            typeof preset.pcForm.program === "number" &&
            typeof preset.pcForm.label === "string" &&
            typeof preset.pcForm.backgroundColor === "string"
          ) {
            setPcForm(preset.pcForm);
          }

          if (typeof preset.globalMidiChannel === "number") {
            setGlobalMidiChannel(preset.globalMidiChannel);
          }
        } catch (error) {
          alert("Invalid preset file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <main>
      <Title>Messenger</Title>

      {isMidiOutput ? (
        <Device device={device} deviceList={deviceList} setDevice={setDevice} />
      ) : (
        <h3>No Midi Devices Connected</h3>
      )}

      <Navigation
        handleAddCCInput={handleAddCCInput}
        savePreset={savePreset}
        handleLoadPreset={handleLoadPreset}
        globalMidiChannel={globalMidiChannel}
        handleGlobalMidiChannelChange={handleGlobalMidiChannelChange}
      />

      <Header
        name={forms.name}
        setName={(value: string) =>
          setForms((prev) => ({ ...prev, name: value }))
        }
      />

      <FormsContainer>
        {forms.inputs.map((form) => (
          <MidiCCForm
            key={form.id}
            id={form.id}
            onRemove={handleRemoveCCForm}
            updateCCFormField={updateCCFormField}
            midiChannel={form.midiChannel}
            midiCC={form.midiCC}
            value={form.value}
            label={form.label}
            backgroundColor={form.backgroundColor}
            sendCC={sendCC}
          />
        ))}
        <MidiPCForm
          midiChannel={pcForm.midiChannel}
          setMidiChannel={(ch) => setPcForm((prev) => ({ ...prev, midiChannel: ch }))}
          program={pcForm.program}
          setProgram={(p) => setPcForm((prev) => ({ ...prev, program: p }))}
          label={pcForm.label}
          setLabel={(l) => setPcForm((prev) => ({ ...prev, label: l }))}
          backgroundColor={pcForm.backgroundColor}
          setBackgroundColor={(c) => setPcForm((prev) => ({ ...prev, backgroundColor: c }))}
          sendPC={sendPC}
        />
      </FormsContainer>
      <footer>
        <p style={{ fontSize: "1.25rem" }}>
          𐙦 Midi Engineering
        </p>
      </footer>
    </main>
  );
};

export default App;
