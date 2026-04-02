import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Upload } from "lucide-react";
import { createUser } from "../services/api";
import "./RegisterPage.css";

const TEAMS = [
  "",
  "BNI Azpire",
  "BNI Benchmark",
  "BNI Champions",
  "BNI Dynamic",
  "BNI Emperor",
  "BNI Fortune",
  "BNI Gladiators",
  "BNI Harmony",
  "BNI Icons",
  "BNI Jaaguar",
  "BNI Kings",
  "BNI Legends",
  "BNI Millionaire",
  "BNI Nest",
  "BNI Prince",
  "BNI Sparkp",
  "Trichy A",
  "Trichy B",
  "PD A",
  "PD B",
] as const;

const ROLES = ["", "Batsman", "Bowler", "All Rounder"] as const;
const PHONE_RE = /^\d{7,14}$/;
const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type FormState = {
  name: string;
  photo: File | null;
  business: string;
  category: string;
  phone: string;
  team: string;
  role: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: "",
  photo: null,
  business: "",
  category: "",
  phone: "",
  team: "",
  role: "",
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.photo) errors.photo = "Profile photo is required.";
  if (!form.business.trim()) errors.business = "Business is required.";
  if (!form.category.trim()) errors.category = "Category is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  else if (!PHONE_RE.test(form.phone.replace(/\s/g, ""))) {
    errors.phone = "Enter digits only (7-14 digits).";
  }
  return errors;
}

const RegisterPage = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const setPhoto = (file: File) => {
    if (!ACCEPTED_MIME.has(file.type)) {
      setErrors((previous) => ({ ...previous, photo: "Only JPG, PNG, or WEBP allowed." }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors((previous) => ({ ...previous, photo: "Max file size is 5MB." }));
      return;
    }
    setField("photo", file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setPhoto(selectedFile);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    setPhoto(droppedFile);
  };

  const submit = async () => {
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("business", form.business.trim());
      payload.append("category", form.category.trim());
      payload.append("phone_no", `+91${form.phone.replace(/\s/g, "")}`);
      if (form.team) payload.append("team_name", form.team);
      if (form.role) payload.append("role", form.role);
      if (form.photo) payload.append("photo", form.photo);

      await createUser(payload);
      setDone(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register player.";
      window.alert(message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rp-wrap">
        <div className="rp-card fade-up success-card">
          <div className="success-icon">
            <CheckCircle2 size={52} />
          </div>
          <h2 className="rp-title">Player Registered!</h2>
          <p className="success-sub">The player has been added to the registry.</p>
          <div className="success-btns">
            <button
              className="ghost-btn"
              onClick={() => {
                setForm(initialForm);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                setErrors({});
                setDone(false);
              }}
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-wrap">
      <div className="rp-card fade-up">
        <h1 className="rp-title">Player Registration</h1>

        <div className="field">
          <label className="field-label">FULL NAME</label>
          <input
            className={`input${errors.name ? " error" : ""}`}
            placeholder="Enter your full name"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
          />
          {errors.name && <p className="err-msg">{errors.name}</p>}
        </div>

        <div className="field">
          <label className="field-label">PROFILE PHOTO</label>
          <div className="photo-row">
            <div className="avatar-circle" onClick={() => photoInputRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="preview" className="avatar-img" />
              ) : (
                <Upload size={26} strokeWidth={1.5} color="var(--gold)" />
              )}
            </div>

            <div
              className={`dropzone${dragActive ? " drag" : ""}${errors.photo ? " error" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => photoInputRef.current?.click()}
            >
              <input
                ref={photoInputRef}
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileInput}
                hidden
              />
              {preview ? (
                <span className="drop-change">Click or drop to change photo</span>
              ) : (
                <>
                  <p className="drop-title">{dragActive ? "Drop it here" : "Drag & drop your photo"}</p>
                  <p className="drop-sub">or click to browse files</p>
                </>
              )}
            </div>
          </div>
          {errors.photo && <p className="err-msg">{errors.photo}</p>}
        </div>

        <div className="field-grid3">
          <div className="field">
            <label className="field-label">BUSINESS</label>
            <input
              className={`input${errors.business ? " error" : ""}`}
              placeholder="Enter business"
              value={form.business}
              onChange={(event) => setField("business", event.target.value)}
            />
            {errors.business && <p className="err-msg">{errors.business}</p>}
          </div>

          <div className="field">
            <label className="field-label">CATEGORY</label>
            <div className="select-wrap">
              <input
                type="text"
                className={`input select-input${errors.category ? " error" : ""}`}
                value={form.category}
                placeholder="Enter category"
                onChange={(event) => setField("category", event.target.value)}
              />
            </div>
            {errors.category && <p className="err-msg">{errors.category}</p>}
          </div>

          <div className="field">
            <label className="field-label">PHONE NUMBER</label>
            <div className="phone-wrap">
              <span className="phone-prefix">+91</span>
              <input
                className={`input phone-input${errors.phone ? " error" : ""}`}
                placeholder="1234567890"
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value.replace(/\D/g, ""))}
                maxLength={14}
                type="tel"
              />
            </div>
            {errors.phone && <p className="err-msg">{errors.phone}</p>}
          </div>
        </div>

        <div className="field-grid2">
          <div className="field">
            <label className="field-label">TEAM NAME</label>
            <div className="select-wrap">
              <select
                className="input select-input"
                value={form.team}
                onChange={(event) => setField("team", event.target.value)}
              >
                {TEAMS.map((team) => (
                  <option key={team} value={team}>
                    {team || "Search and select team"}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">ROLE</label>
            <div className="select-wrap">
              <select
                className="input select-input"
                value={form.role}
                onChange={(event) => setField("role", event.target.value)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role || "Select role"}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </div>
        </div>

        <button className={`reg-btn${busy ? " busy" : ""}`} onClick={submit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={18} className="spin" /> REGISTERING...
            </>
          ) : (
            "REGISTER PLAYER"
          )}
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
