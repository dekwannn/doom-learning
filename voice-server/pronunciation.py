"""
Pronunciation check for Lingo (English).

What was said:      Whisper base.en (faster-whisper)
Which sounds:       wav2vec2 phoneme recognizer (facebook/wav2vec2-lv-60-espeak-cv-ft), heard as eSpeak IPA
Correct sounds:     eSpeak (the same phonemizer Kokoro uses), so both sides use the same symbols

Only well-known mistakes that matter (and that Indonesian speakers often make) are reported as corrections,
each with a short tip in Indonesian. Other small differences lower the score a little but are not corrections,
so Lingo does not scold pronunciation that is actually fine.
"""

import os
import re

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault("HF_HOME", os.path.join(HERE, "models", "hf"))

import espeakng_loader  # noqa: E402  (installed with kokoro-onnx)
import torch  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402
from phonemizer.backend import EspeakBackend  # noqa: E402
from phonemizer.backend.espeak.wrapper import EspeakWrapper  # noqa: E402
from phonemizer.separator import Separator  # noqa: E402
from transformers import AutoProcessor, Wav2Vec2ForCTC  # noqa: E402

PHONEME_MODEL = "facebook/wav2vec2-lv-60-espeak-cv-ft"
WHISPER_MODEL = "base.en"

# Sounds that are the same for our purpose (accent variants, length marks, unstressed vowels, American flap t)
SAME = {"ɐ": "ə", "ʌ": "ə", "ɝ": "ɚ", "ɜ": "ɚ", "ᵻ": "ɪ", "ɾ": "t", "ʔ": "t", "o": "oʊ", "e": "eɪ",
        "r": "ɹ", "ɫ": "l", "n̩": "n", "l̩": "l", "ɑ": "ɔ", "əl": "l"}
CONSONANTS = set("p b t d k ɡ f v θ ð s z ʃ ʒ h tʃ dʒ m n ŋ l ɹ w j".split())

# expected sound -> (sounds it is often replaced with, tip in Indonesian)
KNOWN_MISTAKES = {
    "θ": ({"t", "s", "f", "d"}, 'Bunyi "th" seperti di three: ujung lidah di antara gigi, lalu tiup udara pelan.'),
    "ð": ({"d", "z", "v", "t"}, 'Bunyi "th" seperti di this: ujung lidah di antara gigi, dan pita suara bergetar.'),
    "v": ({"f", "b", "w", "p"}, 'Bunyi "v": gigi atas menyentuh bibir bawah dan bergetar, bukan "f".'),
    "z": ({"s"}, 'Bunyi "z": seperti "s" tapi bergetar, seperti suara lebah.'),
    "ʃ": ({"s", "tʃ"}, 'Bunyi "sh": bibir sedikit maju, seperti "sy".'),
    "ʒ": ({"z", "ʃ", "dʒ"}, 'Bunyi "zh" seperti di vision: seperti "sh" tapi bergetar.'),
    "iː": ({"ɪ"}, 'Vokal panjang "ee" seperti di sheep: tarik lebih panjang sambil tersenyum.'),
    "ɪ": ({"iː", "i"}, 'Vokal pendek "i" seperti di ship: lebih pendek dan santai.'),
    "æ": ({"ɛ", "eɪ", "ə", "a"}, 'Bunyi "a" seperti di cat: buka mulut lebih lebar, antara "a" dan "e".'),
}


def norm(phone: str) -> str:
    if phone != "iː":
        phone = phone.replace("ː", "")
    return SAME.get(phone, phone)


class Checker:
    def __init__(self):
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        self.espeak = EspeakBackend("en-us", preserve_punctuation=False, with_stress=False)
        torch.set_num_threads(max(1, os.cpu_count() or 1))
        self.whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8",
                                    download_root=os.path.join(HERE, "models", "whisper"))
        self.proc = AutoProcessor.from_pretrained(PHONEME_MODEL)
        self.w2v = Wav2Vec2ForCTC.from_pretrained(PHONEME_MODEL).eval()
        self.check(np.zeros(16000, dtype=np.float32), "warm up")  # first real request is then fast

    def heard_phones(self, audio16k: np.ndarray) -> list[str]:
        inputs = self.proc(audio16k, sampling_rate=16000, return_tensors="pt")
        with torch.no_grad():
            ids = torch.argmax(self.w2v(inputs.input_values).logits, dim=-1)
        return self.proc.batch_decode(ids)[0].split()

    def expected_words(self, text: str) -> list[tuple[str, list[str]]]:
        words = re.findall(r"[A-Za-z']+", text)
        if not words:
            return []
        phones = self.espeak.phonemize(words, separator=Separator(phone=" ", word="", syllable=""), strip=True)
        return [(w, p.split()) for w, p in zip(words, phones)]

    def check(self, audio16k: np.ndarray, target: str | None = None) -> dict:
        segments, _ = self.whisper.transcribe(audio16k, language="en", beam_size=1)
        said = " ".join(s.text for s in segments).strip()
        heard = self.heard_phones(audio16k)
        words = self.expected_words(target or said)

        flat, owner, last = [], [], set()
        for wi, (_, phones) in enumerate(words):
            for pi, p in enumerate(phones):
                flat.append(p)
                owner.append(wi)
                if pi == len(phones) - 1:
                    last.add(len(flat) - 1)

        exp_n = [norm(p) for p in flat]
        heard_n = [norm(p) for p in heard]
        per_word = [{"word": w, "expected": "".join(p), "heard": [], "issues": [], "minor": 0} for w, p in words]
        major = minor = 0
        for ei, h in align(exp_n, heard_n):
            if ei is None:
                minor += 0.5  # an extra sound
                continue
            item = per_word[owner[ei]]
            if h is not None:
                item["heard"].append(h)
            e = exp_n[ei]
            if h == e:
                continue
            known = KNOWN_MISTAKES.get(flat[ei]) or KNOWN_MISTAKES.get(e)
            if known and h in known[0]:
                item["issues"].append({"expected": flat[ei], "heard": h, "tip": known[1]})
                major += 1
            elif h is None and ei in last and e in CONSONANTS:
                item["issues"].append({"expected": flat[ei], "heard": None,
                                       "tip": f'Jangan lupa bunyi akhir "{flat[ei]}" di kata ini.'})
                major += 1
            else:
                item["minor"] += 1
                minor += 1

        score = 100.0 if not flat else max(0.0, 100.0 * (1 - (major + 0.3 * minor) / len(flat)))
        return {
            "said": said,
            "target": target,
            "heard": " ".join(heard),
            "score": round(score),
            "words": [
                {"word": w["word"], "ok": not w["issues"], "expected": w["expected"],
                 "heard": "".join(w["heard"]), "issues": w["issues"]}
                for w in per_word
            ],
        }


def align(a: list[str], b: list[str]) -> list[tuple[int | None, str | None]]:
    """Levenshtein alignment of expected (a) and heard (b): (index in a or None, phone from b or None)"""
    n, m = len(a), len(b)
    d = np.zeros((n + 1, m + 1), dtype=int)
    d[:, 0] = range(n + 1)
    d[0, :] = range(m + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (a[i - 1] != b[j - 1]))
    i, j, path = n, m, []
    while i or j:
        if i and j and d[i, j] == d[i - 1, j - 1] + (a[i - 1] != b[j - 1]):
            path.append((i - 1, b[j - 1]))
            i, j = i - 1, j - 1
        elif i and d[i, j] == d[i - 1, j] + 1:
            path.append((i - 1, None))
            i -= 1
        else:
            path.append((None, b[j - 1]))
            j -= 1
    return path[::-1]
