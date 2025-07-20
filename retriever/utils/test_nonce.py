from nonce_checker import validate_nonce

payload = {
    "agent": "Zamer",
    "lead_id": "2201",
    "message": "Saya nak tahu lebih lanjut",
    "nonce": "letak_nonce_di_sini"
}

if validate_nonce(payload):
    print("✅ Payload verified.")
else:
    print("❌ Invalid nonce — rejected.")

