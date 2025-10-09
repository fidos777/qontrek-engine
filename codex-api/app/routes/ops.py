from fastapi import APIRouter

router = APIRouter(prefix="/ops", tags=["ops"])

@router.get("/parity")
def get_parity():
    return {
        "status": "OK",
        "drift_percentage": 0.003,  # 0.3% as decimal
        "can_flip": True
    }

@router.get("/ready")
def get_ready():
    return {
        "overall_status": "GREEN",
        "lights": {
            "infrastructure": "GREEN",
            "data": "GREEN",
            "story": "GREEN",
            "governance": "GREEN"
        }
    }

@router.get("/topup/status")
def get_topup_status():
    return {
        "current_rate": 0.79,
        "target_rate": 0.85,
        "gap_rm": 2180,
        "eligible_leads": 47,
        "suggested_nudge_count": 12,
        "last_updated": "2025-10-07T09:00:00"
    }

@router.post("/topup/nudge")
def send_topup_nudge():
    return {
        "success": True,
        "message": "Nudge sent",
        "nudges_sent": 5,
        "estimated_recovery_rm": 1090
    }

