import { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Image, Modal,
  ActivityIndicator, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  Camera, Wine, Compass, X, ChevronRight, ArrowLeft, Trash2, Search,
  Sparkles, MapPin, Grape, Check, Award, Images,
} from "lucide-react-native";

import { C, serif, BANDS, SENT_ORDER, TYPES, TYPE_COLOR, recompute } from "./src/theme";
import { loadIndex, saveIndex } from "./src/storage";
import { identifyWine, suggestWines, readPalate } from "./src/api";

/* ---------- image pipeline ---------- */
async function pickImage(fromCamera) {
  if (fromCamera) {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return null;
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    return r.canceled ? null : r.assets[0].uri;
  }
  const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!p.granted) return null;
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
  return r.canceled ? null : r.assets[0].uri;
}
async function processImage(uri) {
  const big = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1100 } }], {
    compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true,
  });
  const thumb = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 240 } }], {
    compress: 0.55, format: ImageManipulator.SaveFormat.JPEG, base64: true,
  });
  return { apiBase64: big.base64, thumbUri: "data:image/jpeg;base64," + thumb.base64 };
}
function fmtDate(ms) {
  const M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date(ms);
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ================= app ================= */
export default function App() {
  const [tab, setTab] = useState("cellar");
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [flow, setFlow] = useState(null);
  const [sourcePick, setSourcePick] = useState(false);

  useEffect(() => {
    (async () => {
      setWines(await loadIndex());
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    const scored = recompute(next);
    setWines(scored);
    await saveIndex(scored);
    return scored;
  };

  const capture = async (fromCamera) => {
    setSourcePick(false);
    let uri;
    try {
      uri = await pickImage(fromCamera);
    } catch (e) {
      console.warn(e);
    }
    if (!uri) return;
    setTab("cellar");
    setFlow({ step: "identifying" });
    try {
      const { apiBase64, thumbUri } = await processImage(uri);
      let info = null;
      try { info = await identifyWine(apiBase64); } catch (e) { console.warn(e); }
      const draft = {
        name: info?.name || "", producer: info?.producer || "", vintage: info?.vintage || "",
        type: info?.type && TYPES.includes(info.type) ? info.type : "Red",
        grapes: Array.isArray(info?.grapes) ? info.grapes : [],
        region: info?.region || "", country: info?.country || "",
        grapeOrigin: info?.grapeOrigin || "", winemaking: info?.winemaking || "",
        profile: info?.profile || "", thumb: thumbUri, notes: "",
      };
      setFlow({ step: "confirm", draft, recognized: !!info, failed: !info });
    } catch (e) {
      console.warn(e);
      setFlow({
        step: "confirm", failed: true, recognized: false,
        draft: { name: "", producer: "", vintage: "", type: "Red", grapes: [], region: "", country: "", grapeOrigin: "", winemaking: "", profile: "", thumb: null, notes: "" },
      });
    }
  };

  const finalize = async (draft, sentiment, lo) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const bumped = wines.map((w) =>
      w.sentiment === sentiment && w.bandRank >= lo ? { ...w, bandRank: w.bandRank + 1 } : w
    );
    const entry = { ...draft, id, sentiment, bandRank: lo, score: 0, createdAt: Date.now() };
    const scored = await persist([...bumped, entry]);
    const finalScore = scored.find((w) => w.id === id)?.score ?? 0;
    setFlow({ step: "done", draft: entry, sentiment, score: finalScore });
  };

  const sorted = [...wines].sort((a, b) => b.score - a.score);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Header />
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator color={C.brass} size="large" />
          </View>
        ) : tab === "cellar" ? (
          <Cellar wines={sorted} onOpen={setDetail} onAdd={() => setSourcePick(true)} />
        ) : (
          <Discover wines={wines} />
        )}
        <Nav tab={tab} setTab={setTab} onAdd={() => setSourcePick(true)} />
      </View>

      {/* source picker */}
      <Modal visible={sourcePick} transparent animationType="fade" onRequestClose={() => setSourcePick(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setSourcePick(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 34, borderTopWidth: 1, borderColor: C.border }}>
            <Text style={{ fontFamily: serif, fontSize: 20, color: C.text, marginBottom: 16, textAlign: "center" }}>Add a wine</Text>
            <SheetBtn icon={<Camera size={20} color={C.brass} />} label="Take a photo" onPress={() => capture(true)} />
            <SheetBtn icon={<Images size={20} color={C.brass} />} label="Choose from library" onPress={() => capture(false)} />
            <TouchableOpacity onPress={() => setSourcePick(false)} style={{ padding: 14, marginTop: 4 }}>
              <Text style={{ color: C.muted, textAlign: "center", fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* detail */}
      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        {detail && (
          <Detail
            wine={wines.find((w) => w.id === detail.id) || detail}
            onClose={() => setDetail(null)}
            onSave={async (patch) => { await persist(wines.map((w) => (w.id === detail.id ? { ...w, ...patch } : w))); }}
            onDelete={async () => { await persist(wines.filter((w) => w.id !== detail.id)); setDetail(null); }}
          />
        )}
      </Modal>

      {/* add flow */}
      <Modal visible={!!flow} animationType="slide" onRequestClose={() => setFlow(null)}>
        {flow && (
          <AddFlow flow={flow} setFlow={setFlow} wines={wines} onCancel={() => setFlow(null)} onFinalize={finalize} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
      <Text style={{ fontFamily: serif, fontSize: 30, color: C.text, letterSpacing: 0.5 }}>Cellar</Text>
      <Text style={{ fontSize: 12, color: C.faint, letterSpacing: 1.5 }}>TASTING JOURNAL</Text>
    </View>
  );
}

function SheetBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface2, borderRadius: 13, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border }}>
      {icon}
      <Text style={{ color: C.text, fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- score disc (signature element) ---------- */
function ScoreDisc({ score, size = 56 }) {
  const stroke = Math.max(3, size * 0.07);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.brass} strokeWidth={stroke} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontFamily: serif, color: C.brass, fontSize: size * 0.32 }}>{score.toFixed(1)}</Text>
    </View>
  );
}

function TypeChip({ type, small }) {
  const col = TYPE_COLOR[type] || C.muted;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: small ? 2 : 3, paddingHorizontal: small ? 8 : 10, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: col }} />
      <Text style={{ color: C.text, fontSize: small ? 11 : 12.5 }}>{type}</Text>
    </View>
  );
}

function Thumb({ wine, size }) {
  if (wine?.thumb) {
    return <Image source={{ uri: wine.thumb }} style={{ width: size, height: size, borderRadius: 10, borderWidth: 1, borderColor: C.border }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }}>
      <Wine size={size * 0.4} color={C.faint} />
    </View>
  );
}

function Pill({ icon, children }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4, paddingHorizontal: 11, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}>
      {icon}
      <Text style={{ color: C.muted, fontSize: 12.5 }}>{children}</Text>
    </View>
  );
}

/* ---------- cellar ---------- */
function Cellar({ wines, onOpen, onAdd }) {
  const [q, setQ] = useState("");
  const filtered = wines.filter((w) => {
    const s = `${w.name} ${w.producer} ${w.region} ${w.country} ${(w.grapes || []).join(" ")}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  if (wines.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Wine size={34} color={C.burgundy} />
        </View>
        <Text style={{ fontFamily: serif, fontSize: 23, color: C.text, marginBottom: 8 }}>Your cellar is empty</Text>
        <Text style={{ color: C.muted, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 300, marginBottom: 26 }}>
          Photograph a bottle and rank it against the wines you've tasted. Each one earns a score out of ten.
        </Text>
        <TouchableOpacity onPress={onAdd} style={btn.primary}>
          <Camera size={18} color="#fff" />
          <Text style={btn.primaryText}>Add your first wine</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 4, marginBottom: 14 }}>
        <Search size={17} color={C.faint} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search your cellar" placeholderTextColor={C.faint}
          style={{ flex: 1, color: C.text, fontSize: 15, paddingVertical: 8 }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={{ color: C.faint, fontSize: 12, letterSpacing: 1 }}>{wines.length} {wines.length === 1 ? "WINE" : "WINES"}</Text>
        <Text style={{ color: C.faint, fontSize: 12, letterSpacing: 1 }}>RANKED BY SCORE</Text>
      </View>

      {filtered.map((w) => (
        <TouchableOpacity key={w.id} onPress={() => onOpen(w)}
          style={{ flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 11 }}>
          <Thumb wine={w} size={54} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontFamily: serif, fontSize: 17, color: C.text }}>
              {(w.name || "Unnamed wine") + (w.vintage ? ` ’${String(w.vintage).slice(-2)}` : "")}
            </Text>
            <Text numberOfLines={1} style={{ color: C.muted, fontSize: 13.5, marginTop: 2 }}>{w.producer || "—"}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 }}>
              <TypeChip type={w.type} small />
              {!!w.region && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <MapPin size={11} color={C.faint} />
                  <Text numberOfLines={1} style={{ color: C.faint, fontSize: 12, maxWidth: 120 }}>{w.region}</Text>
                </View>
              )}
            </View>
          </View>
          <ScoreDisc score={w.score} size={50} />
        </TouchableOpacity>
      ))}
      {filtered.length === 0 && <Text style={{ color: C.faint, textAlign: "center", padding: 30 }}>No matches.</Text>}
    </ScrollView>
  );
}

/* ---------- detail ---------- */
function Detail({ wine, onClose, onSave, onDelete }) {
  const [notes, setNotes] = useState(wine.notes || "");
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}><ArrowLeft size={22} color={C.text} /></TouchableOpacity>
        <Text style={{ color: C.faint, fontSize: 12, letterSpacing: 1 }}>{(BANDS[wine.sentiment]?.label || "").toUpperCase()}</Text>
        <TouchableOpacity onPress={() => setConfirmDel(true)} style={{ padding: 6 }}><Trash2 size={19} color={C.faint} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <Thumb wine={wine} size={92} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: serif, fontSize: 23, color: C.text }}>{wine.name || "Unnamed wine"}</Text>
            <Text style={{ color: C.muted, fontSize: 15, marginTop: 3 }}>{wine.producer}{wine.vintage ? ` · ${wine.vintage}` : ""}</Text>
          </View>
          <ScoreDisc score={wine.score} size={64} />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          <TypeChip type={wine.type} />
          {!!wine.region && <Pill icon={<MapPin size={12} color={C.muted} />}>{wine.region}{wine.country ? `, ${wine.country}` : ""}</Pill>}
          {(wine.grapes || []).map((g, i) => <Pill key={i} icon={<Grape size={12} color={C.muted} />}>{g}</Pill>)}
        </View>

        {!!wine.grapeOrigin && <Section title="Where the grapes come from">{wine.grapeOrigin}</Section>}
        {!!wine.winemaking && <Section title="How it's made">{wine.winemaking}</Section>}
        {!!wine.profile && <Section title="Tasting profile">{wine.profile}</Section>}

        <Text style={txt.sectionTitle}>YOUR NOTES</Text>
        <TextInput
          value={notes} onChangeText={setNotes} onBlur={() => onSave({ notes })} multiline
          placeholder="What did you taste? Where were you?" placeholderTextColor={C.faint}
          style={{ minHeight: 84, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.text, fontSize: 15, padding: 12, textAlignVertical: "top", lineHeight: 22 }}
        />
        <Text style={{ color: C.faint, fontSize: 12.5, marginTop: 16 }}>Tasted {fmtDate(wine.createdAt)}</Text>
      </ScrollView>

      {confirmDel && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: C.surface2, borderTopWidth: 1, borderColor: C.border, padding: 18 }}>
          <Text style={{ color: C.text, fontSize: 15, marginBottom: 12 }}>Remove this wine from your cellar?</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={() => setConfirmDel(false)} style={[btn.ghost, { flex: 1, justifyContent: "center" }]}>
              <Text style={{ color: C.text, fontSize: 15 }}>Keep it</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.burgundy, borderRadius: 12, padding: 13 }}>
              <Trash2 size={16} color="#fff" /><Text style={{ color: "#fff", fontSize: 15 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={txt.sectionTitle}>{title.toUpperCase()}</Text>
      <Text style={{ color: C.text, opacity: 0.92, fontSize: 15, lineHeight: 24 }}>{children}</Text>
    </View>
  );
}

/* ---------- add flow ---------- */
function AddFlow({ flow, setFlow, wines, onCancel, onFinalize }) {
  if (flow.step === "identifying") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 30 }}>
        <ActivityIndicator color={C.brass} size="large" />
        <Text style={{ fontFamily: serif, fontSize: 21, color: C.text, marginTop: 22 }}>Reading the label…</Text>
        <Text style={{ color: C.muted, fontSize: 14, marginTop: 8, textAlign: "center" }}>Identifying the wine, region, and grapes.</Text>
      </SafeAreaView>
    );
  }
  if (flow.step === "confirm") return <Confirm flow={flow} setFlow={setFlow} onCancel={onCancel} />;
  if (flow.step === "sentiment") return <Sentiment flow={flow} setFlow={setFlow} wines={wines} onCancel={onCancel} onFinalize={onFinalize} />;
  if (flow.step === "compare") return <Compare flow={flow} setFlow={setFlow} wines={wines} onCancel={onCancel} onFinalize={onFinalize} />;
  if (flow.step === "done") return <Done flow={flow} onClose={onCancel} />;
  return null;
}

function FlowHead({ title, onClose, back, right }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 }}>
      <TouchableOpacity onPress={back || onClose} style={{ padding: 6, minWidth: 40 }}>
        {back ? <ArrowLeft size={22} color={C.text} /> : <X size={22} color={C.text} />}
      </TouchableOpacity>
      <Text style={{ fontFamily: serif, fontSize: 18, color: C.text }}>{title}</Text>
      <View style={{ minWidth: 40, alignItems: "flex-end" }}>{right || <View style={{ width: 40 }} />}</View>
    </View>
  );
}

function Confirm({ flow, setFlow, onCancel }) {
  const [d, setD] = useState(flow.draft);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const ok = ((d.name || "") + (d.producer || "")).trim().length > 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <FlowHead title="Confirm the wine" onClose={onCancel}
        right={
          <TouchableOpacity disabled={!ok} onPress={() => setFlow({ ...flow, step: "sentiment", draft: d })}>
            <Text style={{ color: ok ? C.brass : C.faint, fontSize: 16 }}>Next</Text>
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {flow.failed && <Notice>The label couldn't be read automatically. Enter the details by hand — everything else still works.</Notice>}
          {flow.recognized && <Notice good>Identified from the label. Adjust anything that looks off.</Notice>}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8, marginBottom: 18 }}>
            <Thumb wine={d} size={70} />
            <Text style={{ color: C.muted, fontSize: 13.5, flex: 1, lineHeight: 20 }}>Tap any field to edit before scoring.</Text>
          </View>
          <Field label="Wine name" value={d.name} onChange={(v) => set("name", v)} placeholder="e.g. Barolo, Cuvée name" />
          <Field label="Producer" value={d.producer} onChange={(v) => set("producer", v)} placeholder="Winery" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ width: 110 }}>
              <Field label="Vintage" value={d.vintage} onChange={(v) => set("vintage", v)} placeholder="Year" keyboardType="number-pad" />
            </View>
          </View>
          <Text style={txt.fieldLabel}>TYPE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {TYPES.map((t) => {
              const on = d.type === t;
              return (
                <TouchableOpacity key={t} onPress={() => set("type", t)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: on ? C.brass : C.border, backgroundColor: on ? C.surface2 : "transparent" }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: TYPE_COLOR[t] }} />
                  <Text style={{ color: on ? C.text : C.muted, fontSize: 13.5 }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Field label="Grapes" value={(d.grapes || []).join(", ")} onChange={(v) => set("grapes", v.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="Comma separated" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Region" value={d.region} onChange={(v) => set("region", v)} placeholder="e.g. Piedmont" /></View>
            <View style={{ flex: 1 }}><Field label="Country" value={d.country} onChange={(v) => set("country", v)} placeholder="e.g. Italy" /></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Sentiment({ flow, setFlow, wines, onCancel, onFinalize }) {
  const choose = (sentiment) => {
    const band = wines.filter((w) => w.sentiment === sentiment).sort((a, b) => a.bandRank - b.bandRank);
    if (band.length === 0) { onFinalize(flow.draft, sentiment, 0); return; }
    const lo = 0, hi = band.length, mid = (lo + hi) >> 1;
    setFlow({ ...flow, step: "compare", sentiment, lo, hi, mid });
  };
  const opts = [
    { key: "loved", desc: "A wine you'd seek out again", col: C.brass },
    { key: "good", desc: "Pleasant and worth a pour", col: C.text },
    { key: "pass", desc: "Wouldn't choose it again", col: C.faint },
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <FlowHead title="First impression" onClose={onCancel} back={() => setFlow({ ...flow, step: "confirm" })} />
      <View style={{ paddingHorizontal: 18, alignItems: "center" }}>
        <Thumb wine={flow.draft} size={78} />
        <Text style={{ fontFamily: serif, fontSize: 22, color: C.text, marginTop: 14, textAlign: "center" }}>{flow.draft.name || flow.draft.producer || "This wine"}</Text>
        <Text style={{ color: C.muted, fontSize: 14.5, marginTop: 8, marginBottom: 26 }}>How did it sit with you?</Text>
        <View style={{ width: "100%", gap: 12 }}>
          {opts.map((o) => (
            <TouchableOpacity key={o.key} onPress={() => choose(o.key)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18 }}>
              <View>
                <Text style={{ fontFamily: serif, fontSize: 19, color: o.col }}>{BANDS[o.key].label}</Text>
                <Text style={{ color: C.muted, fontSize: 13.5, marginTop: 2 }}>{o.desc}</Text>
              </View>
              <ChevronRight size={20} color={C.faint} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Compare({ flow, setFlow, wines, onCancel, onFinalize }) {
  const band = wines.filter((w) => w.sentiment === flow.sentiment).sort((a, b) => a.bandRank - b.bandRank);
  const opponent = band[flow.mid];

  useEffect(() => {
    if (!opponent) onFinalize(flow.draft, flow.sentiment, flow.lo);
  }, []);
  if (!opponent) return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} />;

  const pick = (preferNew) => {
    let { lo, hi } = flow;
    if (preferNew) hi = flow.mid; else lo = flow.mid + 1;
    if (lo < hi) setFlow({ ...flow, lo, hi, mid: (lo + hi) >> 1 });
    else onFinalize(flow.draft, flow.sentiment, lo);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <FlowHead title="Which did you prefer?" onClose={onCancel} />
      <Text style={{ textAlign: "center", color: C.faint, fontSize: 12, letterSpacing: 1, marginBottom: 6 }}>
        {BANDS[flow.sentiment].label.toUpperCase()} · PLACING
      </Text>
      <View style={{ paddingHorizontal: 18, gap: 14, marginTop: 10 }}>
        <Duel wine={flow.draft} tag="The new pour" onPick={() => pick(true)} accent={C.brass} />
        <Text style={{ textAlign: "center", fontFamily: serif, fontSize: 15, color: C.faint }}>or</Text>
        <Duel wine={opponent} tag={`In your cellar · ${opponent.score.toFixed(1)}`} onPick={() => pick(false)} accent={C.burgundy} />
      </View>
      <Text style={{ textAlign: "center", color: C.faint, fontSize: 12.5, marginTop: 18, paddingHorizontal: 30 }}>
        A few quick comparisons place it precisely.
      </Text>
    </SafeAreaView>
  );
}

function Duel({ wine, tag, onPick, accent }) {
  return (
    <TouchableOpacity onPress={onPick}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16 }}>
      <Thumb wine={wine} size={66} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: accent, letterSpacing: 1, marginBottom: 4 }}>{tag.toUpperCase()}</Text>
        <Text numberOfLines={1} style={{ fontFamily: serif, fontSize: 19, color: C.text }}>
          {(wine.name || "Unnamed") + (wine.vintage ? ` ’${String(wine.vintage).slice(-2)}` : "")}
        </Text>
        <Text numberOfLines={1} style={{ color: C.muted, fontSize: 13.5, marginTop: 2 }}>{wine.producer || "—"}</Text>
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: accent, alignItems: "center", justifyContent: "center" }}>
        <Check size={17} color={accent} />
      </View>
    </TouchableOpacity>
  );
}

function Done({ flow, onClose }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 28 }}>
      <ScoreDisc score={flow.score} size={108} />
      <Text style={{ fontFamily: serif, fontSize: 24, color: C.text, marginTop: 22, textAlign: "center" }}>{flow.draft.name || "Added to cellar"}</Text>
      <Text style={{ color: C.muted, fontSize: 15, marginTop: 6 }}>Scored {flow.score.toFixed(1)} · {BANDS[flow.sentiment].label}</Text>
      <Text style={{ color: C.faint, fontSize: 13.5, marginTop: 10, maxWidth: 300, textAlign: "center", lineHeight: 20 }}>
        Scores shift as your cellar grows and each wine finds its place.
      </Text>
      <TouchableOpacity onPress={onClose} style={[btn.primary, { marginTop: 26 }]}>
        <Text style={btn.primaryText}>Back to cellar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------- discover ---------- */
function Discover({ wines }) {
  const [sugg, setSugg] = useState(null);
  const [palate, setPalate] = useState(null);
  const [busy, setBusy] = useState("");

  const top = [...wines].sort((a, b) => b.score - a.score);
  const liked = top.filter((w) => w.sentiment !== "pass");

  const stats = () => {
    const region = {}, grape = {};
    wines.forEach((w) => {
      if (w.region) region[w.region] = (region[w.region] || 0) + 1;
      (w.grapes || []).forEach((g) => (grape[g] = (grape[g] || 0) + 1));
    });
    const topOf = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
    return {
      grapes: topOf(grape), regions: topOf(region),
      avg: wines.length ? (wines.reduce((s, w) => s + w.score, 0) / wines.length).toFixed(1) : "0.0",
    };
  };

  const runSuggest = async () => {
    setBusy("suggest"); setSugg(null);
    try { setSugg(await suggestWines(liked)); } catch (e) { setSugg({ error: true }); }
    setBusy("");
  };
  const runPalate = async () => {
    setBusy("palate"); setPalate(null);
    try { setPalate(await readPalate(stats(), top.slice(0, 5).map((w) => w.name))); }
    catch (e) { setPalate("Couldn't generate insights just now. Try again in a moment."); }
    setBusy("");
  };

  if (wines.length < 1) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }}>
        <Compass size={34} color={C.burgundy} style={{ marginBottom: 18 }} />
        <Text style={{ fontFamily: serif, fontSize: 22, color: C.text, marginBottom: 8 }}>Nothing to go on yet</Text>
        <Text style={{ color: C.muted, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 300 }}>
          Add a few wines and this becomes a guide — bottles to seek out and a read on your palate.
        </Text>
      </View>
    );
  }

  const s = stats();
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        <Stat label="WINES" value={wines.length} />
        <Stat label="AVG SCORE" value={s.avg} />
        <Stat label="LOVED" value={wines.filter((w) => w.sentiment === "loved").length} />
      </View>

      {s.grapes.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <Text style={txt.sectionTitle}>YOU KEEP RETURNING TO</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {s.grapes.map((g) => <Pill key={g} icon={<Grape size={12} color={C.muted} />}>{g}</Pill>)}
            {s.regions.map((r) => <Pill key={r} icon={<MapPin size={12} color={C.muted} />}>{r}</Pill>)}
          </View>
        </View>
      )}

      <DiscoverCard icon={<Sparkles size={18} color={C.brass} />} title="Wines to seek out"
        sub="Recommendations drawn from your highest scores" busy={busy === "suggest"} onRun={runSuggest} cta="Suggest wines">
        {sugg?.error && <Text style={{ color: C.muted, fontSize: 14 }}>Couldn't fetch suggestions. Try again.</Text>}
        {sugg?.discover && (
          <View style={{ gap: 12 }}>
            {sugg.discover.map((x, i) => (
              <View key={i} style={{ borderTopWidth: i ? 1 : 0, borderColor: C.border, paddingTop: i ? 12 : 0 }}>
                <Text style={{ fontFamily: serif, fontSize: 16.5, color: C.text }}>{x.name}</Text>
                <Text style={{ color: C.muted, fontSize: 13, marginTop: 1 }}>{[x.producer, x.region, x.grape].filter(Boolean).join(" · ")}</Text>
                <Text style={{ color: C.text, opacity: 0.85, fontSize: 13.5, marginTop: 5, lineHeight: 20 }}>{x.reason}</Text>
              </View>
            ))}
            {sugg.revisit?.length > 0 && (
              <View style={{ borderTopWidth: 1, borderColor: C.border, paddingTop: 12 }}>
                <Text style={{ fontSize: 11, color: C.brass, letterSpacing: 1, marginBottom: 8 }}>WORTH REVISITING</Text>
                {sugg.revisit.map((x, i) => (
                  <Text key={i} style={{ fontSize: 13.5, marginBottom: 6, lineHeight: 20, color: C.muted }}>
                    <Text style={{ fontFamily: serif, fontSize: 15, color: C.text }}>{x.name}</Text>
                    {`  — ${x.reason}`}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </DiscoverCard>

      <DiscoverCard icon={<Award size={18} color={C.brass} />} title="Your palate"
        sub="What your cellar reveals about your taste" busy={busy === "palate"} onRun={runPalate} cta="Read my palate">
        {!!palate && <Text style={{ color: C.text, opacity: 0.9, fontSize: 14.5, lineHeight: 23 }}>{palate}</Text>}
      </DiscoverCard>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingVertical: 14, alignItems: "center" }}>
      <Text style={{ fontFamily: serif, fontSize: 26, color: C.brass }}>{value}</Text>
      <Text style={{ fontSize: 11, color: C.faint, letterSpacing: 1, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function DiscoverCard({ icon, title, sub, busy, onRun, cta, children }) {
  const hasContent = Array.isArray(children) ? children.some(Boolean) : !!children;
  return (
    <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 3 }}>
        {icon}<Text style={{ fontFamily: serif, fontSize: 19, color: C.text }}>{title}</Text>
      </View>
      <Text style={{ color: C.muted, fontSize: 13.5, marginBottom: 14 }}>{sub}</Text>
      {hasContent && <View style={{ marginBottom: 14 }}>{children}</View>}
      <TouchableOpacity onPress={onRun} disabled={!!busy} style={[btn.ghost, { opacity: busy ? 0.6 : 1, alignSelf: "flex-start" }]}>
        {busy ? <ActivityIndicator color={C.brass} size="small" /> : <Sparkles size={15} color={C.brass} />}
        <Text style={{ color: C.text, fontSize: 14.5 }}>{busy ? "Thinking…" : cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- nav ---------- */
function Nav({ tab, setTab, onAdd }) {
  const item = (key, Icon, label) => {
    const on = tab === key;
    return (
      <TouchableOpacity onPress={() => setTab(key)} style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 6 }}>
        <Icon size={22} color={on ? C.brass : C.faint} />
        <Text style={{ fontSize: 11, color: on ? C.text : C.faint }}>{label}</Text>
      </TouchableOpacity>
    );
  };
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.border, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 26 }}>
      {item("cellar", Wine, "Cellar")}
      <TouchableOpacity onPress={onAdd}
        style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: C.burgundy, alignItems: "center", justifyContent: "center", marginHorizontal: 8, marginTop: -18, shadowColor: C.burgundy, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
        <Camera size={26} color="#fff" />
      </TouchableOpacity>
      {item("discover", Compass, "Discover")}
    </View>
  );
}

/* ---------- small bits ---------- */
function Field({ label, value, onChange, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={txt.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.faint}
        keyboardType={keyboardType || "default"}
        style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 11, color: C.text, fontSize: 15.5, paddingHorizontal: 13, paddingVertical: 12 }} />
    </View>
  );
}
function Notice({ children, good }) {
  return (
    <View style={{ backgroundColor: good ? "#2A2417" : C.surface2, borderWidth: 1, borderColor: good ? C.brassDim : C.border, borderRadius: 11, padding: 12, marginBottom: 6 }}>
      <Text style={{ fontSize: 13.5, color: good ? C.brass : C.muted, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

const btn = {
  primary: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.burgundy, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 24 },
  primaryText: { color: "#fff", fontSize: 15.5 },
  ghost: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
};
const txt = {
  sectionTitle: { fontSize: 12, color: C.faint, letterSpacing: 1.2, marginBottom: 8 },
  fieldLabel: { fontSize: 12, color: C.faint, letterSpacing: 0.5, marginBottom: 6 },
};
