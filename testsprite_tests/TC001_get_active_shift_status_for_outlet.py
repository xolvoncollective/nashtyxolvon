import requests

BASE_URL = "http://localhost:3099"
TIMEOUT = 30

def test_get_active_shift_status_for_outlet():
    # Step 1: Get the list of active outlets to obtain a valid outletId
    outlets_resp = requests.get(f"{BASE_URL}/api/auth/outlets", timeout=TIMEOUT)
    assert outlets_resp.status_code == 200
    outlets_json = outlets_resp.json()
    assert isinstance(outlets_json, dict)
    assert "outlets" in outlets_json and isinstance(outlets_json["outlets"], list)
    # If no outlets available, test cannot proceed
    assert len(outlets_json["outlets"]) > 0
    outletId = outlets_json["outlets"][0].get("id") or outlets_json["outlets"][0].get("_id") or outlets_json["outlets"][0].get("outletId")
    assert outletId is not None

    # Step 2: Ensure no active shift exists by closing any active shift (if any) - optional cleanup
    # Fetch active shift to check if any exists
    active_shift_resp = requests.get(f"{BASE_URL}/api/shifts/active/{outletId}", timeout=TIMEOUT)
    assert active_shift_resp.status_code == 200
    active_shift_json = active_shift_resp.json()
    # The key with shift data is unknown, try common keys 
    shift_data = None
    for key in active_shift_json:
        if key not in ("message", "error"):
            shift_data = active_shift_json[key]
            break

    # If an active shift exists, close it first
    shift_id = None
    if shift_data:
        if isinstance(shift_data, dict) and shift_data.get("status") == "active":
            shift_id = shift_data.get("id") or shift_data.get("_id") or shift_data.get("shiftId")
        elif isinstance(shift_data, list) and len(shift_data) > 0:
            # Considering first shift active
            if isinstance(shift_data[0], dict) and shift_data[0].get("status") == "active":
                shift_id = shift_data[0].get("id") or shift_data[0].get("_id") or shift_data[0].get("shiftId")
    if shift_id:
        # Close the shift with some closingCash (minimum 0)
        close_resp = requests.put(
            f"{BASE_URL}/api/shifts/{shift_id}/close",
            json={"closingCash": 0},
            timeout=TIMEOUT
        )
        # Closing could fail if already closed, but try to ensure no active shift remains
        assert close_resp.status_code in (200, 404, 409)

    # Step 3: Confirm no active shift now exists
    active_shift_resp = requests.get(f"{BASE_URL}/api/shifts/active/{outletId}", timeout=TIMEOUT)
    assert active_shift_resp.status_code == 200
    no_active_shift_json = active_shift_resp.json()
    # Validate that no active shift is present. The shift data should be empty or null or indicate no active shift.
    no_active_shift_data = None
    for key in no_active_shift_json:
        if key not in ("message", "error"):
            no_active_shift_data = no_active_shift_json[key]
            break
    assert no_active_shift_data in (None, [], {}, False) or str(no_active_shift_data).lower() in ("", "null", "no active shift")

    # Step 4: Open a new shift and verify active shift is returned with correct calculations
    # To open a shift we need outletId, userId, openingCash
    # Get a staff userId from /api/auth/staff/:outletId
    staff_resp = requests.get(f"{BASE_URL}/api/auth/staff/{outletId}", timeout=TIMEOUT)
    assert staff_resp.status_code == 200
    staff_json = staff_resp.json()
    assert "staff" in staff_json and isinstance(staff_json["staff"], list)
    assert len(staff_json["staff"]) > 0
    userId = staff_json["staff"][0].get("id") or staff_json["staff"][0].get("_id") or staff_json["staff"][0].get("userId")
    assert userId is not None

    # Open shift POST /api/shifts with outletId, userId, openingCash
    opening_cash = 5000  # arbitrary positive cash value
    shift_open_resp = requests.post(
        f"{BASE_URL}/api/shifts",
        json={
            "outletId": outletId,
            "userId": userId,
            "openingCash": opening_cash
        },
        timeout=TIMEOUT
    )
    assert shift_open_resp.status_code == 200
    shift_open_json = shift_open_resp.json()
    # The active shift details should be inside something like "shift" or first key other than message/error
    shift_info = None
    for key in shift_open_json:
        if key not in ("message", "error"):
            # Accept any key holding shift info
            shift_info = shift_open_json[key]
            break
    assert shift_info is not None
    opened_shift_id = shift_info.get("id") or shift_info.get("_id") or shift_info.get("shiftId")
    assert opened_shift_id is not None
    assert shift_info.get("status") == "active"

    try:
        # Step 5: GET active shift again, verify correct active shift data returned
        active_shift_resp2 = requests.get(f"{BASE_URL}/api/shifts/active/{outletId}", timeout=TIMEOUT)
        assert active_shift_resp2.status_code == 200
        active_shift_json2 = active_shift_resp2.json()
        active_shift_data2 = None
        for key in active_shift_json2:
            if key not in ("message", "error"):
                active_shift_data2 = active_shift_json2[key]
                break
        assert active_shift_data2 is not None
        # Validate shift id and status
        if isinstance(active_shift_data2, list) and len(active_shift_data2) > 0:
            relevant_shift = active_shift_data2[0]
        elif isinstance(active_shift_data2, dict):
            relevant_shift = active_shift_data2
        else:
            relevant_shift = None
        assert relevant_shift is not None
        assert relevant_shift.get("id") == opened_shift_id or relevant_shift.get("_id") == opened_shift_id or relevant_shift.get("shiftId") == opened_shift_id
        assert relevant_shift.get("status") == "active"

        # Step 6: Validate business rules for price calculation placeholders if present
        # The active shift endpoint may include summary or sales data with keys:
        # subtotal, disc, base, tax, sc, total
        # Validate tax = 11% of base, sc = 5% of base, disc <= subtotal

        subtotal = relevant_shift.get("subtotal")
        disc = relevant_shift.get("disc")
        base = relevant_shift.get("base")
        tax = relevant_shift.get("tax")
        sc = relevant_shift.get("sc")
        total = relevant_shift.get("total")

        # If any of these fields exist, validate them
        if None not in (subtotal, disc, base, tax, sc, total):
            assert isinstance(subtotal, (int, float))
            assert isinstance(disc, (int, float))
            assert isinstance(base, (int, float))
            assert isinstance(tax, (int, float))
            assert isinstance(sc, (int, float))
            assert isinstance(total, (int, float))

            # Discount limit
            assert disc <= subtotal

            # Tax calculation ~ 11% of base, allow small floating point tolerance
            assert abs(tax - (base * 0.11)) < 0.01*max(1, base)

            # Service charge calculation ~ 5% of base
            assert abs(sc - (base * 0.05)) < 0.01*max(1, base)

            # total approximately equals base + tax + sc - disc (or subtotal - disc + tax + sc depending on logic)
            computed_total = base + tax + sc - disc
            assert abs(total - computed_total) < 0.01*max(1, total)

    finally:
        # Step 7: Cleanup - close the opened active shift to leave backend clean
        if opened_shift_id:
            requests.put(
                f"{BASE_URL}/api/shifts/{opened_shift_id}/close",
                json={"closingCash": opening_cash},
                timeout=TIMEOUT
            )

test_get_active_shift_status_for_outlet()
