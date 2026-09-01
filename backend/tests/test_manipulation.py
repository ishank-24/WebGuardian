from backend.guardians.manipulation import analyze_manipulation


def test_fake_urgency():
    text = "Hurry! Offer expires in 5 minutes!"
    result = analyze_manipulation(text)

    assert result["score"] > 0
    assert any(signal["type"] == "urgency" for signal in result["signals"])


def test_fake_scarcity():
    text = "Only 2 items left!"
    result = analyze_manipulation(text)

    assert result["score"] > 0
    assert any(signal["type"] == "scarcity" for signal in result["signals"])


def test_confirmshaming():
    text = "No thanks, I don't want to save money."
    result = analyze_manipulation(text)

    assert result["score"] > 0
    assert any(
        signal["type"] == "confirmshaming"
        for signal in result["signals"]
    )


def test_clean_text():
    text = "Welcome to our website. Learn more about our products."
    result = analyze_manipulation(text)

    assert result["score"] == 0
    assert result["signals"] == []