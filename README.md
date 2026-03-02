# Seminar Audio Guide POC

This repository contains the backend and frontend components for the Audio Guide Proof of Concept.

## Running the Application Locally

### 1. Backend (FastAPI)
1. Open a terminal and navigate to the backend directory:
   ```cmd
   cd "d:\Work Programs\Seminar Chuyên Đề\Seminar\poc_backend"
   ```
2. Activate the pre-configured virtual environment:
   ```cmd
   .\venv\Scripts\activate
   ```
   
   *Note: If you get an error that `Activate.ps1 cannot be loaded because running scripts is disabled`, run this command first to allow scripts in your current session:*
   ```cmd
   Set-ExecutionPolicy Bypass -Scope Process -Force
   ```
   *Then try activating again.*

3. Start the server:
   ```cmd
   python main.py
   ```
   *The API will start running on `http://localhost:8000`.*

### 2. Frontend (HTML/JS)
1. Open a **new** terminal window and navigate to the frontend directory:
   ```cmd
   cd "d:\Work Programs\Seminar Chuyên Đề\Seminar\poc_frontend"
   ```
2. Start Python's built-in HTTP server:
   ```cmd
   python -m http.server 8080
   ```
3. Open your web browser and navigate to: [http://localhost:8080](http://localhost:8080)

### 3. Usage
- Click anywhere on the map to mock your GPS coordinates.
- Clicking inside the shaded **Oc Oanh** polygon will trigger the backend `/scan` and stream the audio walkthrough.