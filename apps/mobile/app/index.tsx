import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { streamMobileAI, type MobileMessage, type MobileProvider, type MobileSettings } from '../lib/ai';

type Mode = 'vent' | 'debate' | 'listen' | 'wellness';
type Screen = 'home' | 'setup' | 'call' | 'summary';
type Voice = 'system' | 'masculine' | 'feminine';
type CallState = 'ready' | 'listening' | 'thinking' | 'speaking';

const modes: Array<[Mode, string, string]> = [
  ['vent', 'Vent', 'Say what you need to say. I’ll listen and reflect.'],
  ['debate', 'Debate', 'Practice an idea or sharpen your thinking.'],
  ['listen', 'Listen', 'Choose a topic and let Hush Companion talk.'],
  ['wellness', 'Wellness check-in', 'Reflect, ground yourself, or choose one healthy next step.'],
];
const emotions = ['Sad', 'Angry', 'Anxious', 'Lonely', 'Frustrated', 'Overwhelmed', 'Calm', 'Excited'];
const styles: Record<Mode, string[]> = {
  vent: ['Just listen', 'Help me feel understood', 'Help me think it through'],
  debate: ['Gentle', 'Balanced', 'Challenging'],
  listen: ['Calm explanation', 'Storytelling', 'News-style overview', 'Two sides'],
  wellness: ['Mood check-in', 'Grounding exercise', 'Workday reset', 'Reflect and journal', 'Prepare for a conversation'],
};
const initialSettings: Omit<MobileSettings, 'mode' | 'responseStyle' | 'topic'> = {
  provider: 'gemini',
  geminiModel: 'gemini-2.5-flash',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'gemma3:4b',
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<Mode>('vent');
  const [emotion, setEmotion] = useState('Sad');
  const [style, setStyle] = useState(styles.vent[0]);
  const [topic, setTopic] = useState('');
  const [voice, setVoice] = useState<Voice>('system');
  const [dark, setDark] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [callState, setCallState] = useState<CallState>('ready');
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const activeRef = useRef(false);
  const messagesRef = useRef<MobileMessage[]>([]);

  const colors = dark ? palette.dark : palette.light;
  const conversationSettings = useMemo<MobileSettings>(() => ({ ...settings, mode, emotion: mode === 'vent' || mode === 'wellness' ? emotion : undefined, responseStyle: style, topic: topic || undefined }), [settings, mode, emotion, style, topic]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    if (screen !== 'call' || !activeRef.current) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [screen]);
  useEffect(() => () => { activeRef.current = false; ExpoSpeechRecognitionModule.abort(); Speech.stop(); }, []);
  useEffect(() => {
    if (screen === 'call' && mode === 'listen' && messagesRef.current.length === 0) {
      void sendMessage(`Begin a short spoken ${style.toLowerCase()} about ${topic || 'the selected topic'}.`);
    }
  }, [screen, mode]);

  useSpeechRecognitionEvent('start', () => setCallState('listening'));
  useSpeechRecognitionEvent('end', () => { if (activeRef.current && callState !== 'thinking' && !speaking) setCallState('ready'); });
  useSpeechRecognitionEvent('error', (event) => {
    if (activeRef.current && event.error !== 'aborted') Alert.alert('Microphone unavailable', event.message || 'Speech recognition could not start. You can type instead.');
    setCallState('ready');
  });
  useSpeechRecognitionEvent('result', (event) => {
    if (!event.isFinal) return;
    const text = event.results[0]?.transcript?.trim();
    ExpoSpeechRecognitionModule.stop();
    if (text) void sendMessage(text);
  });

  const beginConversation = () => {
    activeRef.current = true;
    setMessages([]);
    setElapsed(0);
    setScreen('call');
    setCallState('ready');
  };
  const speakText = async (text: string) => {
    if (muted || !text.trim()) return;
    setSpeaking(true);
    setCallState('speaking');
    await new Promise<void>((resolve) => Speech.speak(text, {
      rate: voice === 'system' ? 0.95 : 0.9,
      pitch: voice === 'masculine' ? 0.85 : voice === 'feminine' ? 1.12 : 1,
      onDone: resolve,
      onStopped: resolve,
      onError: resolve,
    }));
    setSpeaking(false);
    if (activeRef.current) setCallState('ready');
  };
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeRef.current) return;
    ExpoSpeechRecognitionModule.stop();
    Speech.stop();
    setSpeaking(false);
    setCallState('thinking');
    const next = [...messagesRef.current, { role: 'user' as const, content: content.trim() }];
    messagesRef.current = next;
    setMessages(next);
    let answer = '';
    try {
      for await (const chunk of streamMobileAI(conversationSettings, next)) {
        answer += chunk;
        const updated = [...next, { role: 'assistant' as const, content: answer }];
        messagesRef.current = updated;
        setMessages(updated);
      }
      if (answer) await speakText(answer);
      else setCallState('ready');
    } catch {
      setCallState('ready');
    }
  };
  const startListening = async () => {
    if (muted || speaking) return;
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission needed', 'Allow microphone and speech recognition access in Settings, or type your message below.');
        return;
      }
      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: false });
    } catch {
      Alert.alert('Voice input unavailable', 'You can still type a message below.');
    }
  };
  const stopAll = () => {
    activeRef.current = false;
    ExpoSpeechRecognitionModule.abort();
    Speech.stop();
    setSpeaking(false);
    setCallState('ready');
  };
  const leaveConversation = () => {
    if (messagesRef.current.length > 0) {
      Alert.alert('Leave this conversation?', 'Your current conversation will be cleared.', [{ text: 'Stay here', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: finishConversation }]);
    } else finishConversation();
  };
  const finishConversation = () => {
    stopAll();
    setScreen('summary');
  };
  const reset = () => {
    stopAll();
    setMessages([]);
    messagesRef.current = [];
    setElapsed(0);
    setScreen('home');
  };
  const shareTranscript = async () => {
    if (!messages.length) return;
    await Share.share({ message: messages.map((message) => `${message.role === 'user' ? 'You' : 'Hush Companion'}: ${message.content}`).join('\n\n') });
  };

  return <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
    {screen === 'home' && <HomeScreen colors={colors} dark={dark} mode={mode} voice={voice} onDark={setDark} onMode={(next) => { setMode(next); setStyle(styles[next][0]); setScreen('setup'); }} onVoice={setVoice} onSettings={() => setShowSettings(true)} />}
    {screen === 'setup' && <SetupScreen colors={colors} mode={mode} emotion={emotion} style={style} topic={topic} onBack={() => setScreen('home')} onEmotion={setEmotion} onStyle={setStyle} onTopic={setTopic} onContinue={beginConversation} />}
    {screen === 'call' && <CallScreen colors={colors} mode={mode} elapsed={elapsed} callState={callState} speaking={speaking} muted={muted} messages={messages} onMute={() => { const next = !muted; setMuted(next); if (next) { ExpoSpeechRecognitionModule.abort(); Speech.stop(); setSpeaking(false); setCallState('ready'); } }} onListen={startListening} onStopSpeaking={() => { Speech.stop(); setSpeaking(false); setCallState('ready'); }} onSend={sendMessage} onLeave={leaveConversation} />}
    {screen === 'summary' && <SummaryScreen colors={colors} elapsed={elapsed} messages={messages} onAgain={() => { setMessages([]); messagesRef.current = []; setScreen('setup'); }} onHome={reset} onShare={shareTranscript} />}
    <SettingsModal visible={showSettings} colors={colors} settings={settings} onClose={() => setShowSettings(false)} onSave={(next) => { setSettings(next); setShowSettings(false); }} />
  </SafeAreaView>;
}

function Header({ colors, dark, onDark, onSettings }: { colors: Palette; dark?: boolean; onDark?: (value: boolean) => void; onSettings?: () => void }) {
  return <View style={styles.header}><Text style={[styles.logo, { color: colors.ink }]}>hush companion<Text style={{ color: colors.coral }}>.</Text></Text><View style={styles.headerActions}>{onSettings && <Pressable onPress={onSettings}><Text style={[styles.headerButton, { color: colors.ink }]}>AI</Text></Pressable>}{onDark && <Pressable onPress={() => onDark(!dark)}><Text style={[styles.headerButton, { color: colors.ink }]}>{dark ? '☀' : '◐'}</Text></Pressable>}</View></View>;
}
function HomeScreen({ colors, dark, mode, voice, onDark, onMode, onVoice, onSettings }: { colors: Palette; dark: boolean; mode: Mode; voice: Voice; onDark: (value: boolean) => void; onMode: (mode: Mode) => void; onVoice: (voice: Voice) => void; onSettings: () => void }) {
  return <ScrollView contentContainerStyle={styles.container}><Header colors={colors} dark={dark} onDark={onDark} onSettings={onSettings} /><Text style={[styles.eyebrow, { color: colors.coral }]}>A LITTLE ROOM TO BREATHE</Text><Text style={[styles.title, { color: colors.ink }]}>A voice that <Text style={styles.italic}>stays.</Text></Text><Text style={[styles.subtitle, { color: colors.muted }]}>Talk it out. Think it through. No judgment, no typing required.</Text><Text style={[styles.label, { color: colors.muted }]}>CHOOSE YOUR SPACE</Text>{modes.map(([id, title, description]) => <Pressable key={id} onPress={() => onMode(id)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }, mode === id && { backgroundColor: colors.coralSoft, borderColor: colors.coral }]}><Text style={[styles.cardTitle, { color: colors.ink }]}>{title}</Text><Text style={[styles.cardText, { color: colors.muted }]}>{description}</Text></Pressable>)}<Text style={[styles.label, { color: colors.muted }]}>VOICE PREFERENCE</Text><View style={styles.voiceRow}>{(['system', 'masculine', 'feminine'] as Voice[]).map((item) => <Pressable key={item} onPress={() => onVoice(item)} style={[styles.voice, { backgroundColor: colors.card, borderColor: colors.line }, voice === item && { backgroundColor: colors.ink, borderColor: colors.ink }]}><Text style={[styles.voiceText, { color: voice === item ? colors.bg : colors.muted }]}>{item === 'system' ? 'System' : item === 'masculine' ? 'Man' : 'Woman'}</Text></Pressable>)}</View><Text style={[styles.note, { color: colors.muted }]}>Private by design · AI, not a therapist</Text></ScrollView>;
}
function SetupScreen({ colors, mode, emotion, style, topic, onBack, onEmotion, onStyle, onTopic, onContinue }: { colors: Palette; mode: Mode; emotion: string; style: string; topic: string; onBack: () => void; onEmotion: (value: string) => void; onStyle: (value: string) => void; onTopic: (value: string) => void; onContinue: () => void }) {
  const isTopic = mode === 'listen' || mode === 'debate';
  return <ScrollView contentContainerStyle={styles.container}><Pressable onPress={onBack}><Text style={[styles.back, { color: colors.muted }]}>‹  Change mode</Text></Pressable><Text style={[styles.eyebrow, { color: colors.coral }]}>STEP 2 OF 3 · {mode.toUpperCase()}</Text><Text style={[styles.sectionTitle, { color: colors.ink }]}>{mode === 'listen' ? 'What should I\ntalk about?' : mode === 'vent' ? 'What’s weighing\non you?' : mode === 'wellness' ? 'How do you want to\nfeel today?' : 'What are you\ntesting?'}</Text><Text style={[styles.subtitleSmall, { color: colors.muted }]}>{mode === 'listen' ? 'Pick a topic and simply listen.' : mode === 'wellness' ? 'Choose a gentle starting point for an everyday wellness check-in.' : 'Choose how Hush Companion should support you.'}</Text>{isTopic ? <><Text style={[styles.inputLabel, { color: colors.ink }]}>{mode === 'debate' ? 'What should we work through?' : 'Topic'}</Text><TextInput value={topic} onChangeText={onTopic} placeholder={mode === 'debate' ? 'Should I ask for a promotion?' : 'The history of space exploration'} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.card, borderColor: colors.line }]} /></> : <View style={styles.emotionGrid}>{emotions.map((item) => <Pressable key={item} onPress={() => onEmotion(item)} style={[styles.emotion, { backgroundColor: colors.card, borderColor: colors.line }, emotion === item && { backgroundColor: colors.coralSoft, borderColor: colors.coral }]}><Text style={{ color: emotion === item ? colors.ink : colors.muted }}>{item}</Text></Pressable>)}</View>}<Text style={[styles.label, { color: colors.muted }]}>HOW SHOULD HUSH COMPANION RESPOND?</Text>{styles[mode].map((item) => <Pressable key={item} onPress={() => onStyle(item)} style={[styles.choice, { backgroundColor: colors.card, borderColor: colors.line }, style === item && { backgroundColor: colors.coralSoft, borderColor: colors.coral }]}><View style={[styles.radio, { borderColor: colors.muted }, style === item && { borderColor: colors.coral }]}>{style === item && <View style={[styles.radioDot, { backgroundColor: colors.coral }]} />}</View><Text style={[styles.choiceText, { color: colors.ink }]}>{item}</Text></Pressable>)}<Pressable onPress={onContinue} style={[styles.start, { backgroundColor: colors.ink }]}><Text style={[styles.startText, { color: colors.bg }]}>Continue  →</Text></Pressable></ScrollView>;
}
function CallScreen({ colors, mode, elapsed, callState, speaking, muted, messages, onMute, onListen, onStopSpeaking, onSend, onLeave }: { colors: Palette; mode: Mode; elapsed: number; callState: CallState; speaking: boolean; muted: boolean; messages: MobileMessage[]; onMute: () => void; onListen: () => void; onStopSpeaking: () => void; onSend: (text: string) => void; onLeave: () => void }) {
  const [draft, setDraft] = useState('');
  const stateText = callState === 'listening' ? 'Listening to you' : callState === 'thinking' ? 'Thinking…' : callState === 'speaking' ? 'Hush Companion is speaking' : 'Ready when you are';
  return <View style={styles.call}><View style={styles.callTop}><Text style={[styles.callMeta, { color: colors.muted }]}>{mode.toUpperCase()} MODE</Text><Text style={[styles.callMeta, { color: colors.muted }]}>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</Text></View><View style={styles.callCenter}><View style={[styles.orb, { backgroundColor: colors.coral }, speaking && styles.orbSpeaking]}><Text style={styles.orbText}>〰</Text></View><Text style={[styles.callState, { color: colors.ink }]}>{stateText}</Text>{messages.length > 0 && <ScrollView style={[styles.transcript, { backgroundColor: colors.card, borderColor: colors.line }]}>{messages.slice(-4).map((message, index) => <Text key={`${message.role}-${index}`} style={[styles.message, { color: colors.muted }]}><Text style={{ color: message.role === 'assistant' ? colors.coral : colors.ink }}>{message.role === 'assistant' ? 'Hush Companion: ' : 'You: '}</Text>{message.content}</Text>)}</ScrollView>}</View><View style={styles.callControls}><Pressable onPress={onMute} style={styles.control}><Text style={{ color: muted ? colors.coral : colors.muted, fontSize: 22 }}>{muted ? '◼' : '⌕'}</Text><Text style={[styles.controlText, { color: colors.muted }]}>{muted ? 'Unmute' : 'Mute'}</Text></Pressable><Pressable onPress={onLeave} style={styles.end}><Text style={styles.endText}>■</Text></Pressable><Pressable onPress={speaking ? onStopSpeaking : onListen} style={styles.control}><Text style={{ color: colors.muted, fontSize: 22 }}>↻</Text><Text style={[styles.controlText, { color: colors.muted }]}>{speaking ? 'Stop' : 'Repeat'}</Text></Pressable></View><View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Type instead…" placeholderTextColor={colors.muted} style={[styles.composerInput, { color: colors.ink, backgroundColor: colors.card, borderColor: colors.line }]} onSubmitEditing={() => { if (draft.trim()) { onSend(draft); setDraft(''); } }} returnKeyType="send" /><Pressable onPress={() => { if (draft.trim()) { onSend(draft); setDraft(''); } }} style={[styles.send, { backgroundColor: colors.coral }]}><Text style={styles.sendText}>↑</Text></Pressable></View><Pressable onPress={onListen} disabled={muted || speaking} style={[styles.micAction, { backgroundColor: colors.ink }, (muted || speaking) && { opacity: .5 }]}><Text style={[styles.micActionText, { color: colors.bg }]}>{callState === 'listening' ? 'Listening…' : 'Speak with Hush Companion'}</Text></Pressable><Pressable onPress={onLeave}><Text style={[styles.leave, { color: colors.muted }]}>Leave conversation</Text></Pressable></View>;
}
function SummaryScreen({ colors, elapsed, messages, onAgain, onHome, onShare }: { colors: Palette; elapsed: number; messages: MobileMessage[]; onAgain: () => void; onHome: () => void; onShare: () => void }) {
  return <ScrollView contentContainerStyle={[styles.container, styles.summary]}><Text style={[styles.eyebrow, { color: colors.coral }]}>CONVERSATION COMPLETE · {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</Text><Text style={[styles.sectionTitle, { color: colors.ink }]}>You showed up{`\n`}<Text style={styles.italic}>for yourself.</Text></Text><Text style={[styles.subtitleSmall, { color: colors.muted }]}>Thanks for spending this time with Hush Companion.</Text><Pressable onPress={onShare} disabled={!messages.length} style={[styles.secondary, { borderColor: colors.line }, !messages.length && { opacity: .45 }]}><Text style={{ color: colors.ink }}>Share transcript</Text></Pressable><Pressable onPress={onAgain} style={[styles.start, { backgroundColor: colors.ink }]}><Text style={[styles.startText, { color: colors.bg }]}>Talk again</Text></Pressable><Pressable onPress={onHome}><Text style={[styles.back, { color: colors.muted }]}>Back to home</Text></Pressable></ScrollView>;
}
function SettingsModal({ visible, colors, settings, onClose, onSave }: { visible: boolean; colors: Palette; settings: typeof initialSettings; onClose: () => void; onSave: (settings: typeof initialSettings) => void }) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.card }]}><ScrollView><Text style={[styles.eyebrow, { color: colors.coral }]}>HUSH COMPANION · AI</Text><Text style={[styles.sectionTitleSmall, { color: colors.ink }]}>Choose your engine.</Text><Text style={[styles.subtitleSmall, { color: colors.muted }]}>Use Google Gemini with your own key, or a local Ollama server.</Text><View style={styles.providerRow}>{(['gemini', 'ollama'] as MobileProvider[]).map((provider) => <Pressable key={provider} onPress={() => setDraft({ ...draft, provider })} style={[styles.provider, { borderColor: colors.line }, draft.provider === provider && { backgroundColor: colors.coralSoft, borderColor: colors.coral }]}><Text style={{ color: colors.ink }}>{provider === 'gemini' ? 'Google Gemini' : 'Ollama'}</Text></Pressable>)}</View>{draft.provider === 'gemini' ? <><TextInput value={draft.geminiApiKey ?? ''} onChangeText={(value) => setDraft({ ...draft, geminiApiKey: value })} placeholder="Paste Gemini API key" placeholderTextColor={colors.muted} secureTextEntry style={[styles.input, { color: colors.ink, backgroundColor: colors.bg, borderColor: colors.line }]} /><TextInput value={draft.geminiModel} onChangeText={(value) => setDraft({ ...draft, geminiModel: value })} placeholder="gemini-2.5-flash" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.bg, borderColor: colors.line }]} /></> : <><TextInput value={draft.ollamaBaseUrl} onChangeText={(value) => setDraft({ ...draft, ollamaBaseUrl: value })} placeholder="http://192.168.1.10:11434" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.bg, borderColor: colors.line }]} /><TextInput value={draft.ollamaModel} onChangeText={(value) => setDraft({ ...draft, ollamaModel: value })} placeholder="gemma3:4b" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.bg, borderColor: colors.line }]} /><Text style={[styles.note, { color: colors.muted }]}>A phone cannot reach your computer through localhost. Use your computer’s LAN IP or an HTTPS endpoint.</Text></>}<Text style={[styles.note, { color: colors.muted }]}>Mobile API keys can be extracted from an installed app. Use a restricted personal key and monitor its quota.</Text><View style={styles.modalActions}><Pressable onPress={onClose}><Text style={[styles.back, { color: colors.muted }]}>Cancel</Text></Pressable><Pressable onPress={() => onSave(draft)} style={[styles.startSmall, { backgroundColor: colors.ink }]}><Text style={{ color: colors.bg, fontWeight: '600' }}>Save</Text></Pressable></View></ScrollView></View></View></Modal>;
}

type Palette = typeof palette.light;
const palette = { light: { bg: '#f7f5f2', card: '#fffdfa', ink: '#292725', muted: '#817b75', line: '#e8e3dc', coral: '#da745e', coralSoft: '#f8e7e2' }, dark: { bg: '#211f1e', card: '#2d2a28', ink: '#f7f2eb', muted: '#b6aea5', line: '#48423e', coral: '#f0a08c', coralSoft: '#4a302b' } };
const styles = StyleSheet.create({ safe: { flex: 1 }, container: { padding: 26, paddingBottom: 60 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 66 }, headerActions: { flexDirection: 'row', gap: 16 }, logo: { fontSize: 22, fontWeight: '700', letterSpacing: -0.8 }, headerButton: { fontSize: 13, fontWeight: '600' }, eyebrow: { fontSize: 10, letterSpacing: 1.4, marginBottom: 17 }, title: { fontSize: 48, lineHeight: 53, fontWeight: '600', letterSpacing: -2 }, italic: { fontStyle: 'italic', fontWeight: '400' }, subtitle: { fontSize: 16, lineHeight: 24, marginTop: 18, marginBottom: 40 }, label: { fontSize: 10, letterSpacing: 1.2, marginTop: 18, marginBottom: 12 }, card: { borderWidth: 1, borderRadius: 13, padding: 18, marginBottom: 10 }, cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 5 }, cardText: { fontSize: 13, lineHeight: 19 }, voiceRow: { flexDirection: 'row', gap: 8, marginBottom: 22 }, voice: { flex: 1, paddingVertical: 13, borderWidth: 1, borderRadius: 9, alignItems: 'center' }, voiceText: { fontSize: 12 }, note: { textAlign: 'center', fontSize: 10, lineHeight: 16, marginTop: 22 }, back: { fontSize: 13, marginBottom: 34 }, sectionTitle: { fontSize: 40, lineHeight: 44, fontWeight: '600', letterSpacing: -1.5, marginBottom: 14 }, sectionTitleSmall: { fontSize: 29, fontWeight: '600', marginBottom: 12 }, subtitleSmall: { fontSize: 14, lineHeight: 21, marginBottom: 25 }, inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 }, input: { borderWidth: 1, borderRadius: 9, padding: 13, fontSize: 14, marginBottom: 16 }, emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 22 }, emotion: { width: '23%', minWidth: 70, paddingVertical: 14, borderWidth: 1, borderRadius: 9, alignItems: 'center' }, choice: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 10, padding: 16, marginBottom: 9 }, radio: { width: 17, height: 17, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 9, height: 9, borderRadius: 5 }, choiceText: { fontSize: 13, fontWeight: '600', flex: 1 }, start: { padding: 17, borderRadius: 9, alignItems: 'center', marginTop: 27 }, startText: { fontSize: 14, fontWeight: '600' }, call: { flex: 1, padding: 26, paddingBottom: 20 }, callTop: { flexDirection: 'row', justifyContent: 'space-between' }, callMeta: { fontSize: 11, letterSpacing: 1 }, callCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' }, orb: { width: 145, height: 145, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: 26 }, orbSpeaking: { transform: [{ scale: 1.08 }] }, orbText: { color: '#fff', fontSize: 43 }, callState: { fontSize: 16, marginBottom: 18 }, transcript: { width: '100%', maxHeight: 170, borderWidth: 1, borderRadius: 12, padding: 12 }, message: { fontSize: 12, lineHeight: 18, marginBottom: 8 }, callControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 35, marginBottom: 18 }, control: { alignItems: 'center', gap: 4 }, controlText: { fontSize: 10 }, end: { width: 61, height: 61, borderRadius: 32, backgroundColor: '#bd5c50', alignItems: 'center', justifyContent: 'center' }, endText: { color: '#fff', fontSize: 18 }, composer: { flexDirection: 'row', gap: 8, marginBottom: 10 }, composerInput: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 }, send: { width: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, sendText: { color: '#fff', fontSize: 20 }, micAction: { borderRadius: 9, padding: 16, alignItems: 'center' }, micActionText: { fontSize: 14, fontWeight: '600' }, leave: { textAlign: 'center', fontSize: 11, marginTop: 17 }, summary: { flexGrow: 1, justifyContent: 'center' }, secondary: { borderWidth: 1, borderRadius: 9, padding: 15, alignItems: 'center', marginBottom: 10 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' }, modal: { maxHeight: '90%', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 26 }, providerRow: { flexDirection: 'row', gap: 9, marginBottom: 16 }, provider: { flex: 1, padding: 13, borderWidth: 1, borderRadius: 9, alignItems: 'center' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18, marginTop: 8 }, startSmall: { paddingVertical: 12, paddingHorizontal: 19, borderRadius: 8 } });
