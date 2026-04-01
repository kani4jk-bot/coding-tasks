from pathlib import Path


SUPPORTED_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",
}


def validate_audio_upload(filename: str, content_type: str | None, file_size_bytes: int, max_mb: int) -> None:
    if not filename:
        raise ValueError("Missing filename.")

    extension = Path(filename).suffix.lower()
    if extension not in {".wav", ".mp3", ".webm", ".ogg", ".m4a", ".mp4", ".aac"}:
        raise ValueError("Unsupported file type. Use wav, mp3, webm, ogg, m4a, mp4, or aac.")

    if content_type and content_type not in SUPPORTED_CONTENT_TYPES:
        raise ValueError(f"Unsupported content type: {content_type}")

    if file_size_bytes <= 0:
        raise ValueError("Uploaded file is empty.")

    if file_size_bytes > max_mb * 1024 * 1024:
        raise ValueError(f"File too large. Max upload is {max_mb} MB.")
