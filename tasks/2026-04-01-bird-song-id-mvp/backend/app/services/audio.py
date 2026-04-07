from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path


SUPPORTED_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
}

SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".mp4", ".aac"}


def validate_audio_upload(filename: str, content_type: str | None, file_size_bytes: int, max_mb: int) -> None:
    if not filename:
        raise ValueError("Missing filename.")

    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Use wav, mp3, webm, ogg, m4a, mp4, or aac.")

    if content_type and content_type not in SUPPORTED_CONTENT_TYPES:
        raise ValueError(f"Unsupported content type: {content_type}")

    if file_size_bytes <= 0:
        raise ValueError("Uploaded file is empty.")

    if file_size_bytes > max_mb * 1024 * 1024:
        raise ValueError(f"File too large. Max upload is {max_mb} MB.")


def write_upload_to_temp(audio_bytes: bytes, filename: str) -> Path:
    suffix = Path(filename).suffix.lower() or ".bin"
    temp_dir = Path(tempfile.mkdtemp(prefix="birdsong-upload-"))
    input_path = temp_dir / f"input{suffix}"
    input_path.write_bytes(audio_bytes)
    return input_path


def normalize_audio_for_birdnet(input_path: Path) -> Path:
    if shutil.which("ffmpeg") is None:
        raise NotImplementedError("ffmpeg is required for the BirdNET provider but is not installed.")

    output_path = input_path.parent / "normalized.wav"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-ac",
        "1",
        "-ar",
        "48000",
        "-vn",
        str(output_path),
    ]

    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise ValueError(f"Audio normalization failed: {result.stderr.strip() or 'ffmpeg error'}")

    return output_path
