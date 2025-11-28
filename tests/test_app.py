import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_root_redirect():
    response = client.get("/")
    # Deve essere un redirect verso /static/index.html
    assert response.status_code == 200 or response.status_code == 307
    # Verifica che venga restituita la pagina HTML
    assert "<!DOCTYPE html>" in response.text

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data

def test_signup_for_activity_success():
    email = "testuser@mergington.edu"
    activity = "Chess Club"
    # Assicurati che l'utente non sia già iscritto
    client.delete(f"/activities/{activity}/participants/{email}")
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert f"Signed up {email} for {activity}" in response.json()["message"]

def test_signup_for_activity_already_signed_up():
    email = "testuser2@mergington.edu"
    activity = "Programming Class"
    # Iscrivi l'utente
    client.post(f"/activities/{activity}/signup?email={email}")
    # Prova a iscriverlo di nuovo
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up"

def test_signup_for_activity_not_found():
    response = client.post("/activities/NonExistent/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

def test_remove_participant_success():
    email = "removeuser@mergington.edu"
    activity = "Art Club"
    # Iscrivi l'utente
    client.post(f"/activities/{activity}/signup?email={email}")
    # Rimuovi l'utente
    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 200
    assert f"Removed {email} from {activity}" in response.json()["message"]

def test_remove_participant_not_found():
    email = "notfound@mergington.edu"
    activity = "Art Club"
    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"

def test_remove_participant_activity_not_found():
    email = "someone@mergington.edu"
    response = client.delete(f"/activities/NonExistent/participants/{email}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
