"""Original score + SFX for the VeriFi AI launch film "The Instruction".

D minor, 90 BPM (1 beat = 0.667 s, 1 bar = 2.667 s), 61.33 s, 48 kHz stereo.
Music and effects share one key and one reverb so the SFX sit inside the track.
Every cue time below matches composition.html. Writes score.wav next to this file.
"""
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 61.33
N = int(SR * DUR)
BEAT = 60 / 90
BAR = 4 * BEAT
rng = np.random.default_rng(11)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def T(n):
    return np.arange(n) / SR


def env(n, a=0.005, d=0.1, s=0.0, r=0.05):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    h_n = max(n - a_n - d_n - r_n, 0)
    e = np.concatenate([np.linspace(0, 1, a_n, endpoint=False), np.linspace(1, s, d_n, endpoint=False),
                        np.full(h_n, s), np.linspace(s, 0, r_n)])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f, SR / 2 - 100) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def saw(f, n, detune=0.0):
    ph = np.cumsum(np.full(n, f * (1 + detune) / SR)) + rng.random()
    return 2 * (ph % 1) - 1


def bus():
    return np.zeros((N, 2))


drums, bass, music, sfx, send = bus(), bus(), bus(), bus(), bus()


def add(b, t0, x, gain=1.0, pan=0.0, rev=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    x = x[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    b[i:i + len(x), 0] += x * l
    b[i:i + len(x), 1] += x * r
    if rev:
        send[i:i + len(x), 0] += x * l * rev
        send[i:i + len(x), 1] += x * r * rev


# ── instruments ────────────────────────────────────────────
def kick(level=1.0):
    n = int(0.5 * SR); t = T(n)
    f = 44 + 105 * np.exp(-t * 26)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5) + lp(rng.standard_normal(n), 3000) * np.exp(-t * 180) * 0.2) * level


def clap():
    n = int(0.35 * SR); t = T(n)
    nz = bp(rng.standard_normal(n), 900, 5000)
    e = np.exp(-t * 20) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 26) * (t > 0.012)
    return nz * e * 0.45 + np.sin(2 * np.pi * 196 * t) * np.exp(-t * 28) * 0.2


def hat():
    n = int(0.06 * SR); t = T(n)
    return hp(rng.standard_normal(n), 7000) * np.exp(-t * 60) * 0.35


def tick():
    n = int(0.05 * SR); t = T(n)
    return (np.sin(2 * np.pi * 1760 * t) * 0.6 + hp(rng.standard_normal(n), 3000) * 0.4) * np.exp(-t * 120)


def key_click():
    n = int(0.06 * SR); t = T(n)
    return (bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t * 160) + np.sin(2 * np.pi * 320 * t) * np.exp(-t * 90) * 0.4)


def bass_note(m, dur):
    n = int(dur * SR)
    x = saw(hz(m), n) * 0.6 + np.sin(2 * np.pi * hz(m) * T(n)) * 0.8
    return lp(x, 400) * env(n, 0.006, 0.1, 0.7, 0.06)


def pad(ms, dur, cutoff=1400, a=0.4, r=0.6):
    n = int(dur * SR)
    x = sum(saw(hz(m), n, d) for m in ms for d in (-0.004, 0.0, 0.005)) / (3 * len(ms))
    return lp(x, cutoff, 2) * env(n, a, 0.3, 0.85, r)


def pluck(m, dur=0.5, bright=3000):
    n = int(dur * SR); t = T(n)
    return lp(saw(hz(m), n) * 0.5 + np.sin(2 * np.pi * hz(m) * t), bright) * np.exp(-t * 7)


def piano(m, dur=2.0):
    n = int(dur * SR); t = T(n); f = hz(m)
    x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.2 + k * 0.9)) / k for k in range(1, 6))
    return x * env(n, 0.004, 0.02, 1, 0.2)


def bell(m, dur=1.8):
    n = int(dur * SR); t = T(n); f = hz(m)
    x = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6))
    return x * np.exp(-t * 2.4) * env(n, 0.002, 0.01, 1, 0.05)


def thud(level=1.0):
    n = int(0.6 * SR); t = T(n)
    f = 48 + 80 * np.exp(-t * 20)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) + bp(rng.standard_normal(n), 300, 2500) * np.exp(-t * 40) * 0.5) * level


def whoosh(dur=0.6, lo=300, hi=4000):
    n = int(dur * SR); t = T(n)
    nz = rng.standard_normal(n + 2048)
    out = np.zeros(n); blk = 1024
    for k in range(0, n, blk):
        c = lo * (hi / lo) ** (k / n)
        seg = bp(nz[k:k + blk + 1024], c * 0.7, c * 1.4)[:len(out[k:k + blk])]
        out[k:k + blk] = seg
    return out * np.sin(np.pi * t / dur) ** 2


def impact():
    n = int(2.6 * SR); t = T(n)
    f = 34 + 40 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.5) * 1.1 + lp(rng.standard_normal(n), 2500) * np.exp(-t * 9) * 0.7


def mouse_click():
    n = int(0.03 * SR); t = T(n)
    one = hp(rng.standard_normal(n), 2000) * np.exp(-t * 400) * 0.6 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 300) * 0.3
    out = np.zeros(int(0.12 * SR)); out[:n] += one; out[int(0.07 * SR):int(0.07 * SR) + n] += one * 0.6
    return out


def riser(dur, lo=200, hi=8000, cut=0.03):
    n = int(dur * SR); t = T(n)
    x = whoosh(dur, lo, hi) * (t / dur) ** 1.6 * 2.2
    x += np.sin(2 * np.pi * np.cumsum(hz(50) * 2 ** (t / dur * 2)) / SR) * (t / dur) ** 2 * 0.25
    return x * (t < dur - cut)


# ── harmony ────────────────────────────────────────────────
CH = {'Dm': (62, 65, 69), 'Bb': (58, 62, 65), 'F': (60, 65, 69), 'C': (60, 64, 67), 'Gm': (62, 67, 70), 'A': (61, 64, 69)}
ROOT = {'Dm': 38, 'Bb': 34, 'F': 41, 'C': 36, 'Gm': 43, 'A': 45}
BARS = ['Dm', 'Dm', 'Bb', 'Dm', 'Dm', 'Bb', 'Gm', 'A',            # 0–7   · 0–21.33 s  tension
        'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm',          # 8–16  · groove, steps
        'F', 'C', 'Bb', 'A', 'Dm', 'Dm']                           # 17–22 · lift, breakdown, final
bar = lambda t: BARS[min(int(t // BAR), len(BARS) - 1)]
kicks = []

# ── 0–21.33 s · tension ────────────────────────────────────
n = int(21.4 * SR); t = T(n)
drone = (np.sin(2 * np.pi * hz(26) * t) * 0.9 + np.sin(2 * np.pi * hz(38) * t) * 0.5 + saw(hz(45), n) * 0.1)
drone = lp(drone, 280) * np.minimum(1, t / 2) * (0.5 + 0.5 * t / 21.4) * (1 - np.clip((t - 21.3) / 0.03, 0, 1))
add(music, 0, drone, 0.22, 0, 0.15)
for b in range(8):
    add(music, b * BAR, pad(CH[BARS[b]], BAR, 650 + b * 90, 0.8 if b == 0 else 0.15, 0.25), 0.15, 0, 0.45)
for b in range(6):                                          # sparse low piano
    add(music, b * BAR, piano(ROOT[BARS[b]] + 12, 2.5), 0.16, -0.2, 0.5)
    add(music, b * BAR + 2 * BEAT, piano(CH[BARS[b]][2] - 12, 2.0), 0.08, 0.2, 0.5)
for k in range(32):                                          # heartbeat → build
    tk = k * BEAT
    if (k < 16 and k % 4 == 0) or (16 <= k < 24 and k % 2 == 0) or k >= 24:
        add(drums, tk, kick(0.55 + 0.25 * (k >= 24)), 0.6); kicks.append(tk)
        if k < 16:
            add(drums, tk + 0.2, kick(0.3), 0.5)
    if k >= 8:
        add(sfx, tk, tick(), 0.06 + 0.03 * (k >= 24), 0.35 if k % 2 else -0.35, 0.2)
for k in range(24, 32):
    add(bass, k * BEAT + BEAT / 2, bass_note(ROOT[bar(k * BEAT)] + 12, 0.28), 0.28)

# slip arrives, fields type themselves
add(sfx, 0.5, thud(0.35), 0.2, 0, 0.2)
for a, b, text in [(.8, 1.5, 21), (1.6, 2.2, 12), (2.3, 3.0, 22), (6.6, 7.6, 31)]:
    for i in range(text):
        add(sfx, a + (b - a) * (i + 1) / text, key_click(), 0.07, 0.15 * np.sin(i), 0.1)
add(sfx, 5.6, bell(81, 0.5), 0.07, 0.2, 0.3); add(sfx, 5.72, bell(86, 0.6), 0.07, 0.2, 0.3)   # call connects
n = int(0.6 * SR); t = T(n)                                   # glitch 8.35
sh = np.repeat(rng.standard_normal(n // 600 + 1), 600)[:n]
sq = np.sign(np.sin(2 * np.pi * (220 + 300 * (np.floor(t * 24) % 3)) * t))
add(sfx, 8.35, (bp(sh, 400, 6000) * 0.5 + sq * 0.12) * (np.sin(2 * np.pi * 12 * t) > -0.2) * np.exp(-t * 1.5), 0.26, 0, 0.25)
n = int(0.7 * SR); t = T(n)
add(sfx, 8.4, np.sin(2 * np.pi * np.cumsum(hz(62) * np.exp(-t * 3)) / SR) * np.exp(-t * 3), 0.14, 0, 0.3)
n = int(1.3 * SR); t = T(n)                                   # detector needle sweep
add(sfx, 11.5, bp(rng.standard_normal(n), 600, 2200) * np.sin(np.pi * t / 1.3) * 0.25, 0.12, -0.3, 0.2)
add(sfx, 13.2, tick(), 0.12, 0.3, 0.2)                        # tag pinned
add(sfx, 16.5, whoosh(0.8, 300, 3000), 0.08, 0.3, 0.3)       # bank door
add(sfx, 18.45, mouse_click(), 0.3, 0.2, 0.05)
add(sfx, 18.5, riser(21.33 - 18.5), 0.24, 0.2, 0.3)

# ── 21.33 s · gate slam + HELD ─────────────────────────────
add(sfx, 21.33, impact(), 0.75, 0, 0.5)
add(drums, 21.33, thud(1.0), 0.55, 0, 0.3); kicks.append(21.33)
add(sfx, 21.5, thud(0.8), 0.35, 0.2, 0.3)
n = int(0.5 * SR); t = T(n)                                   # pen strike through the detector tag
add(sfx, 25.6, bp(rng.standard_normal(n), 1500, 7000) * np.sin(np.pi * t / 0.5) ** 0.5 * 0.4, 0.12, -0.3, 0.15)

# ── 21.33–50.67 s · groove, one layer per step ─────────────
t0, t1 = 8 * BAR, 19 * BAR
for k in range(int(round(t0 / BEAT)), int(round(t1 / BEAT))):
    tk = k * BEAT
    if tk > 21.4:
        add(drums, tk, kick(0.85), 0.75); kicks.append(tk)
    ch = bar(tk)
    add(bass, tk + BEAT / 2, bass_note(ROOT[ch] + 12, 0.3), 0.45)
    if k % 2 == 0:
        add(bass, tk, bass_note(ROOT[ch], 0.3), 0.3)
    if tk >= 29.33:                                           # 01 Trace · hats
        add(drums, tk + BEAT / 2, hat(), 0.26, 0.25)
    if tk >= 34.67 and k % 2 == 1:                            # 02 Confirm · clap on 2 & 4
        add(drums, tk, clap(), 0.36, 0, 0.25)
    if tk >= 40.0:                                            # 03 Respond · 16th hats
        add(drums, tk + BEAT / 4, hat(), 0.1, -0.3); add(drums, tk + 3 * BEAT / 4, hat(), 0.1, -0.3)
for b in range(8, 19):
    add(music, b * BAR, pad(CH[BARS[b]], BAR, 1300 + 60 * (b - 8), 0.08, 0.25), 0.2, 0, 0.4)
# arp (8ths) from Confirm onward; brighter in the lift
pat = [0, 1, 2, 1, 2, 0, 1, 2]
s0, s1 = int(round(34.67 / (BEAT / 2))), int(round(50.67 / (BEAT / 2)))
for s_ in range(s0, s1):
    ts = s_ * BEAT / 2
    m = CH[bar(ts)][pat[s_ % 8]] + 12
    p = pluck(m, 0.4, 2400 if ts < 45.33 else 3600)
    add(music, ts, p, 0.08, 0.3 if s_ % 2 else -0.3, 0.3)
    add(music, ts + 0.5, p, 0.025, -0.5 if s_ % 2 else 0.5, 0.2)

# step SFX
for tw in (29.3, 34.7, 40.0, 45.3):
    add(sfx, tw - 0.3, whoosh(0.7, 400, 6000), 0.08, 0, 0.3)
for i, a in enumerate([30.2, 30.9, 31.6]):                    # pins
    add(music, a, pluck([74, 77, 81][i], 0.8), 0.17, -0.4 + 0.2 * i, 0.5)
n = int(2.0 * SR); t = T(n)                                   # string being pulled
add(sfx, 30.4, bp(rng.standard_normal(n), 2500, 6000) * np.sin(np.pi * t / 2.0) * 0.15, 0.1, -0.2, 0.2)
add(sfx, 32.7, thud(0.5), 0.25, 0.3, 0.3)                    # risk tag
add(sfx, 37.6, mouse_click()[: int(0.04 * SR)], 0.22, -0.2, 0.1)   # tap Deny
n = int(0.9 * SR); t = T(n)
add(sfx, 37.8, np.sin(2 * np.pi * hz(81) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * env(n, 0.05, 0.1, 0.6, 0.1), 0.035, 0, 0.2)
add(sfx, 38.7, bell(74, 2.0), 0.15, -0.1, 0.5); add(sfx, 38.82, bell(81, 2.0), 0.12, 0.1, 0.5)   # signed
add(sfx, 40.9, thud(1.0), 0.42, 0.2, 0.3)                    # HELD FOR REVIEW
add(sfx, 41.8, whoosh(0.9, 200, 2500), 0.12, 0, 0.3)          # folder rises
add(sfx, 43.5, thud(0.5), 0.2, 0.3, 0.3); add(sfx, 43.5, bell(86, 1.2), 0.07, 0.3, 0.4)   # seal
for i, a in enumerate([46.4, 47.4, 48.4]):                    # everyday slips
    add(sfx, a, whoosh(2.2, 250, 2500), 0.06, -0.6 + 0.6 * i, 0.2)
    add(sfx, a + 1.1, bell([81, 84, 89][i], 1.2), 0.08, 0.3, 0.4)

# ── 50.67–61.33 s · breakdown, final hit at 56.0, ring-out ─
add(music, 19 * BAR, pad(CH['Bb'], BAR, 900, 0.3, 0.2), 0.22, 0, 0.5)
add(music, 20 * BAR, pad(CH['A'], BAR, 1100, 0.2, 0.05), 0.22, 0, 0.5)
add(bass, 19 * BAR, bass_note(34, BAR), 0.28); add(bass, 20 * BAR, bass_note(33, BAR), 0.28)
add(music, 19 * BAR, piano(62, 3.0), 0.12, -0.2, 0.6); add(music, 20 * BAR, piano(61, 3.0), 0.12, -0.2, 0.6)
add(sfx, 54.0, riser(2.0, 300, 7000), 0.2, 0, 0.3)
add(sfx, 56.0, impact(), 0.68, 0, 0.6)
add(drums, 56.0, kick(1.0), 0.85); kicks.append(56.0)
add(music, 56.0, pad((50, 57, 62, 65, 69, 74, 76), DUR - 56.0, 2400, 0.005, 3.0), 0.32, 0, 0.6)
add(bass, 56.0, bass_note(26, 5.0) + bass_note(38, 5.0) * 0.5, 0.45)
for i, m in enumerate([74, 77, 81, 86]):
    add(music, 56.5 + i * BEAT / 2, bell(m, 2.2), 0.08, -0.3 + 0.2 * i, 0.6)

# ── sidechain + reverb + master ────────────────────────────
tt = T(N)
duck = np.ones(N)
for tk in kicks:
    i = int(tk * SR); m = min(N - i, int(0.45 * SR))
    duck[i:i + m] = np.minimum(duck[i:i + m], 1 - 0.5 * np.exp(-np.arange(m) / (0.12 * SR)))
music *= duck[:, None]; bass *= duck[:, None]


def ir(sec=2.4):
    n = int(sec * SR); t = T(n)
    chans = []
    for _ in range(2):
        chans.append(lp(hp(rng.standard_normal(n) * np.exp(-t * 2.8), 200), 6000))
    pre = int(0.02 * SR)
    return [np.concatenate([np.zeros(pre), c]) / np.sqrt(np.sum(c ** 2)) for c in chans]


IR = ir()
wet = np.stack([signal.fftconvolve(send[:, c], IR[c])[:N] for c in range(2)], axis=1)
mix = drums * 0.9 + bass * 0.85 + music + sfx * 0.85 + wet * 0.55
mix = np.stack([hp(mix[:, c], 28) for c in range(2)], axis=1)
mix *= (np.clip(tt / 0.3, 0, 1) * np.clip((DUR - tt) / 1.2, 0, 1))[:, None]
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
wavfile.write('score.wav', SR, (mix * 32767).astype(np.int16))
for a, b in [(0, 16), (16, 21.3), (21.33, 22), (22, 29.3), (29.3, 40), (40, 50.6), (50.7, 55.9), (56, 57), (57, 61)]:
    seg = mix[int(a * SR):int(b * SR)].mean(1)
    print(f'{a:5.1f}-{b:5.1f}s  rms {20 * np.log10(np.sqrt(np.mean(seg ** 2))):6.1f} dBFS')
