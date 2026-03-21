import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

const RECORDING_AUDIO_MODE = {
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
  staysActiveInBackground: false,
};

const PLAYBACK_AUDIO_MODE = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
  staysActiveInBackground: false,
};

export async function ensureMicrophonePermission() {
  const current = await Audio.getPermissionsAsync();
  if (current.granted) {
    return current;
  }

  if (!current.canAskAgain) {
    return current;
  }

  return Audio.requestPermissionsAsync();
}

export async function startMicrophoneRecording() {
  const permission = await ensureMicrophonePermission();

  if (!permission.granted) {
    const error = new Error('Microphone permission was denied.');
    error.code = 'MICROPHONE_PERMISSION_DENIED';
    error.canAskAgain = permission.canAskAgain;
    throw error;
  }

  await Audio.setAudioModeAsync(RECORDING_AUDIO_MODE);

  try {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    return recording;
  } catch (error) {
    await resetAudioMode();
    throw error;
  }
}

export async function stopMicrophoneRecording(recording) {
  if (!recording) {
    return { uri: null, mimeType: 'audio/m4a' };
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    return {
      uri,
      mimeType: inferAudioMimeType(uri),
    };
  } finally {
    await resetAudioMode();
  }
}

export async function cancelMicrophoneRecording(recording) {
  if (!recording) {
    await resetAudioMode();
    return;
  }

  try {
    await recording.stopAndUnloadAsync();
  } catch {
    // Ignore teardown errors if recording never fully started.
  } finally {
    await resetAudioMode();
  }
}

export async function resetAudioMode() {
  try {
    await Audio.setAudioModeAsync(PLAYBACK_AUDIO_MODE);
  } catch {
    // Best effort cleanup.
  }
}

export function inferAudioMimeType(uri = '') {
  const normalizedUri = uri.toLowerCase();

  if (normalizedUri.endsWith('.caf')) {
    return 'audio/x-caf';
  }

  if (normalizedUri.endsWith('.3gp')) {
    return 'audio/3gpp';
  }

  if (normalizedUri.endsWith('.aac')) {
    return 'audio/aac';
  }

  if (normalizedUri.endsWith('.wav')) {
    return 'audio/wav';
  }

  return 'audio/m4a';
}

export function inferAudioFileName(mimeType = 'audio/m4a') {
  switch (mimeType) {
    case 'audio/x-caf':
      return 'audio_note.caf';
    case 'audio/3gpp':
      return 'audio_note.3gp';
    case 'audio/aac':
      return 'audio_note.aac';
    case 'audio/wav':
      return 'audio_note.wav';
    default:
      return 'audio_note.m4a';
  }
}
