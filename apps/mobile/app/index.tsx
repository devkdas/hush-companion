import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const modes = [
  ['vent', 'Vent', 'Say what you need to say. I’ll listen.'],
  ['debate', 'Debate', 'Practice ideas and sharpen your thinking.'],
  ['listen', 'Listen', 'Choose a topic and let Hush Companion talk.'],
  ['wellness', 'Wellness check-in', 'Reflect, ground yourself, or choose one healthy next step.'],
] as const;

export default function Home() {
  const [mode, setMode] = useState('vent');
  const [voice, setVoice] = useState('system');
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.logo}>hush companion<Text style={styles.dot}>.</Text></Text>
    <Text style={styles.eyebrow}>A LITTLE ROOM TO BREATHE</Text>
    <Text style={styles.title}>A voice that <Text style={styles.italic}>stays.</Text></Text>
    <Text style={styles.subtitle}>Talk it out. Think it through. No judgment, no typing required.</Text>
    <Text style={styles.label}>CHOOSE YOUR SPACE</Text>
    {modes.map(([id, title, description]) => <Pressable key={id} onPress={() => setMode(id)} style={[styles.card, mode === id && styles.selected]}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardText}>{description}</Text></Pressable>)}
    <Text style={styles.label}>VOICE PREFERENCE</Text>
    <View style={styles.voiceRow}>{[['system', 'System'], ['masculine', 'Man'], ['feminine', 'Woman']].map(([id, title]) => <Pressable key={id} onPress={() => setVoice(id)} style={[styles.voice, voice === id && styles.voiceSelected]}><Text style={[styles.voiceText, voice === id && styles.voiceTextSelected]}>{title}</Text></Pressable>)}</View>
    <Pressable style={styles.start}><Text style={styles.startText}>Start {mode} conversation  →</Text></Pressable>
    <Text style={styles.note}>Private by design · AI, not a therapist</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#f7f5f2' }, container: { padding: 28, paddingBottom: 50 }, logo: { fontSize: 23, fontWeight: '700', color: '#292725', marginBottom: 70 }, dot: { color: '#da745e' }, eyebrow: { color: '#da745e', fontSize: 10, letterSpacing: 1.4, marginBottom: 18 }, title: { color: '#292725', fontSize: 49, lineHeight: 53, fontWeight: '600', letterSpacing: -2 }, italic: { fontStyle: 'italic', fontWeight: '400' }, subtitle: { color: '#817b75', fontSize: 16, lineHeight: 24, marginTop: 18, marginBottom: 42 }, label: { color: '#817b75', fontSize: 10, letterSpacing: 1.3, marginBottom: 12, marginTop: 12 }, card: { backgroundColor: '#fffdfa', borderWidth: 1, borderColor: '#e8e3dc', borderRadius: 13, padding: 19, marginBottom: 10 }, selected: { backgroundColor: '#f8e7e2', borderColor: '#da745e' }, cardTitle: { color: '#292725', fontSize: 17, fontWeight: '600', marginBottom: 5 }, cardText: { color: '#817b75', fontSize: 13, lineHeight: 19 }, voiceRow: { flexDirection: 'row', gap: 8, marginBottom: 30 }, voice: { flex: 1, paddingVertical: 13, borderRadius: 9, borderWidth: 1, borderColor: '#e8e3dc', alignItems: 'center', backgroundColor: '#fffdfa' }, voiceSelected: { backgroundColor: '#292725', borderColor: '#292725' }, voiceText: { color: '#817b75', fontSize: 12 }, voiceTextSelected: { color: '#fffdfa' }, start: { backgroundColor: '#292725', padding: 17, borderRadius: 9, alignItems: 'center' }, startText: { color: '#f7f5f2', fontSize: 14, fontWeight: '600' }, note: { color: '#817b75', textAlign: 'center', fontSize: 10, marginTop: 25 } });
