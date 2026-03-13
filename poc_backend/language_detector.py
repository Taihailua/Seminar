def detect_language(headers: dict, ip_addr: str) -> str:
    """
    Automated Region-based Language Detection (Cascade logic).
    Returns the language code suitable for the TTS engine.
    """
    # 1. Browser Locale Analysis (Accept-Language parsing)
    accept_lang = headers.get("accept-language", "")
    if accept_lang:
        # Example: 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7' -> pick first part
        primary_lang = accept_lang.split(",")[0].strip().split(";")[0]
        if "vi" in primary_lang.lower():
            return "vi"
        elif "en" in primary_lang.lower():
            return "en"
            
    # 2. IP Geolocation Fallback
    # In a full app, this would query a GeoIP database. For the POC, we mock specific IPs.
    if ip_addr.startswith("103.") or ip_addr.startswith("113."): # Common VN IPs
        return "vi"
        
    # 3. Geo-Coordinate Context Fallback
    # If all else fails, assume user is at Vinh Khanh (VN default)
    # The default is Vietnamese for locals, English for unidentified foreigners.
    return "en" # Fallback to English if not explicitly detected as Vietnamese
