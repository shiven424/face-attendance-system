from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from flask_socketio import SocketIO
from pyngrok import ngrok
from io import BytesIO
from PIL import Image
import numpy as np
import cv2
import torch
from facenet_pytorch import InceptionResnetV1, MTCNN
import time
from threading import Lock
from modules.firebase_utils import FirebaseDatabase
import os
from modules.faiss_utils import FAISS
# Check if CUDA is available and set the device
if torch.cuda.is_available():
    device = torch.device('cuda')
    print(f"Using device: {device}")
else:
    device = torch.device('cpu')
    print("CUDA is not available, using CPU.")

app = Flask(__name__)
CORS(app, supports_credentials=True,origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])

FILE_STORAGE_DIR = 'documents'

class Config:
    SECRET_KEY = 'supersecretkey'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'None'
    FILE_STORAGE_DIR = FILE_STORAGE_DIR
    SESSION_TYPE = 'filesystem'
    SECRET_KEY = 'your_secret_key_here'

app.config.from_object(Config)
Session(app)  # Initialize session management

# Initialize Firebase Database
firebase_db = FirebaseDatabase()
faiss = FAISS()


connected_clients = set()

frame_count = 0
lock = Lock()
def reset_frame_count():
    global frame_count
    while True:
        time.sleep(60)  # Wait for one minute
        with lock:
            print(f"Frames processed in the last minute: {frame_count}")
            frame_count = 0  # Reset the count

# Start the frame count reset thread
import threading
threading.Thread(target=reset_frame_count, daemon=True).start()



# 1. Register User
@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    firebase_db.register_user(
        name=data['name'], 
        email=data['email'], 
        password=data['password'], 
        role=data['role'], 
        subjects=data.get('subjects')
    )
    return jsonify({"message": f"{data['role']} registered successfully"}), 201

# 2. Login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = firebase_db.login(email=data['email'], password=data['password'])
    if user:
        session.permanent = True
        session['user_id'] = user['id']
        session['email'] = user['email']
        session['role'] = user['role']
        user_id = session['user_id']
        email = session['email']
        role = session['role']
        print(f"User ID: {user_id}")
        print(f"email: {email}")
        print(f"role: {role}")
        print("Session data after login:", session)
        return jsonify(user), 200
    return jsonify({"error": "Invalid credentials"}), 401

# 3. Create Subject
@app.route('/subjects', methods=['POST'])
def create_subject():
    print("Session data:", session)  # Debugging line to inspect the session contents
    
    if 'user_id' not in session:
        return jsonify({"error": "User not logged in"}), 401
    teacher_id = session['user_id']
    email = session['email']
    data = request.json
    firebase_db.add_subject(name=data['name'], teacher_id=teacher_id, email=email)
    return jsonify({"message": "Subject created successfully"}), 201

@app.route('/subjects/remove', methods=['POST'])
def remove_subject():
    data = request.json
    subject_name = data.get('name')
    
    if not subject_name:
        return jsonify({"error": "Subject name is required"}), 400

    try:
        firebase_db.remove_subject(subject_name)
        return jsonify({"message": "Subject removed successfully"}), 200
    except Exception as e:
        # Print the error message to the console for debugging
        print(f"Error removing subject: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/students/<string:student_email>/remove-subject', methods=['PUT'])
def remove_subject_from_student(student_email):
    try:
        data = request.json
        subject_name = data.get('subject')

        if not subject_name:
            return jsonify({"error": "Subject name is required"}), 400

        firebase_db.remove_subject_from_student(student_email, subject_name)
        return jsonify({"message": f"Subject '{subject_name}' removed from student '{student_email}' successfully."}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Failed to remove subject from student"}), 500

@app.route('/subjects/students', methods=['GET'])
def get_subjects():
    user_id = session['user_id']
    subjects = firebase_db.get_subjects()
    print("Fetching subjects for User ID:", user_id)

    return jsonify(subjects), 200

@app.route('/subjects/teachers', methods=['GET'])
def get_subjects_for_teacher():
    teacher_id = session['user_id']
    subjects = firebase_db.get_subjects_for_teacher(teacher_id=teacher_id)
    print("Fetching subjects for teacher ID:", teacher_id)

    return jsonify(subjects), 200

# Fetch all teachers
@app.route('/teachers', methods=['GET'])
def get_teachers():
    teachers = firebase_db.get_teachers()
    return jsonify(teachers), 200

@app.route('/teachers/remove', methods=['POST'])
def remove_teacher():
    try:
        data = request.json
        teacher_email = data.get('email')

        if not teacher_email:
            return jsonify({"error": "Teacher email is required"}), 400

        firebase_db.remove_teacher(teacher_email)
        return jsonify({"message": f"Teacher with email '{teacher_email}' and all their subjects have been removed successfully."}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        print(f"Error removing teacher: {e}")
        return jsonify({"error": "Failed to remove teacher and subjects from the database"}), 500


# Fetch all students
@app.route('/students', methods=['GET'])
def get_students():
    students = firebase_db.get_students()
    return jsonify(students), 200

@app.route('/students/remove', methods=['POST'])
def remove_student():
    try:
        data = request.json
        student_email = data.get('email')

        if not student_email:
            return jsonify({"error": "Student email is required"}), 400

        firebase_db.remove_student(student_email)
        return jsonify({"message": f"Student with email '{student_email}' has been removed successfully."}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        print(f"Error removing student: {e}")
        return jsonify({"error": "Failed to remove student from the database"}), 500

# 4. Enroll Student in Subject
@app.route('/enroll', methods=['POST'])
def enroll_student():
    data = request.json
    subject_name = data.get('subject')
    student_email = session['email']
    if not student_email or not subject_name:
        return jsonify({"error": "No subjects provided"}), 400

    try:
        firebase_db.enroll_student_in_subject(student_email=student_email, subject_name=data['subject'])
        return jsonify({"message": f"Subjects added to {student_email} successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# 5. Start Attendance Session
@app.route('/attendance/start', methods=['POST'])
def start_attendance():
    data = request.json
    teacher_id = session['user_id']
    email = session['email']
    attendance_session_id = firebase_db.start_attendance_session(subject_id=data['subjectId'], teacher_id=teacher_id, email=email)
    session['AttendanceSessionId'] = attendance_session_id
    return jsonify({"message": "Attendance session started"}), 201

# 6. Mark Attendance
@app.route('/attendance/mark', methods=['POST'])
def mark_attendance():
    data = request.json
    firebase_db.mark_attendance(session_id=data['sessionId'], student_id=data['studentId'])
    return jsonify({"message": "Attendance marked"}), 201

# 7. End Attendance Session
@app.route('/attendance/end', methods=['POST'])
def end_attendance():
    session_id = session['AttendanceSessionId']
    firebase_db.end_attendance_session(session_id=session_id)
    session.pop('AttendanceSessionId',None)
    return jsonify({"message": "Attendance session ended"}), 200

# 8. Get Attendance Records
@app.route('/attendance/<student_id>', methods=['GET'])
def get_attendance(student_id):
    records = firebase_db.get_attendance_records(student_id=student_id)
    return jsonify(records), 200
    
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()  # Clear all session data
    return jsonify({"message": "Successfully logged out"}), 200

@app.route('/')
def index():
    return "Server is running!"


@socketio.on('connect', namespace='/stream')
def handle_stream_connect():
    global connected_clients
    connected_clients.add(request.sid)
    print(f'Client connected to /stream with SID: {request.sid}')  # Log the client SID

@socketio.on('disconnect', namespace='/stream')
def handle_stream_disconnect():
    global connected_clients
    connected_clients.discard(request.sid) 
    print(f'Client disconnected from /stream with SID: {request.sid}')  # Log the client SID on disconnec


@socketio.on('binary_frame')
def handle_frame(data):
    global frame_count
    # print("Frame received from frontend")

    # Convert binary data to image
    img = Image.open(BytesIO(data))
    img = np.array(img)

    # Convert the image from BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Detect faces using MTCNN
    boxes, _ = mtcnn.detect(img)

    # Initialize an array to store embeddings
    embeddings = []
    attendance_statuses = {"Person": "Unknown"}
    if boxes is not None:

        for (x1, y1, x2, y2) in boxes:
            # Extract and resize the face to 160x160
            face = img[int(y1):int(y2), int(x1):int(x2)]
            face = cv2.resize(face, (160, 160))

            # Convert the face to a tensor, normalize, and move it to GPU
            face_tensor = (
                torch.tensor(face)
                .permute(2, 0, 1)
                .unsqueeze(0)
                .float()
                .div(255.0)
                .to(device)
            )

            # Get the embedding using the FaceNet model
            with torch.no_grad():
                embedding = face_recognition_model(face_tensor).cpu().numpy()
            embeddings.append(embedding)

            person_obj_list = faiss.get_person_id(embedding, 1, 0.6)
            student_email = None
            local_name = "Unknown"
            attendance_status = "Unknown"
            person_id = "Unknown"
            # Mark Attendance
            if person_obj_list:
                person_id = person_obj_list[0].id
                # student = firebase_db.mark_attendance_by_email(person_id)
                # if student:
                #     student_email = student.get('email')  # Assuming you have the email in the student record
                #     local_name = student.get('name', "Unknown")

                #     print(f"Student detected: id:{person_id}, email: {student_email}")

                    # Mark attendance for the student by email
                # attendance_status = firebase_db.mark_attendance_by_email(person_id, session['user_id'])
                # print(f"Attendance status: {attendance_status}")
            

            # Draw a rectangle around the detected face
            cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            attendance_statuses["Person"] = person_id

    # Convert the processed image back to BGR before encoding
    # img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # Convert the processed image to bytes
    _, buffer = cv2.imencode('.jpg', img)
    processed_frame = buffer.tobytes()

    # Send the processed frame and embeddings to the client
    socketio.emit('processed_frame', {'frame': processed_frame, 'attendance_statuses': attendance_statuses})

    # Increment the frame count
    with lock:
        frame_count += 1



# Run the Flask app
if __name__ == '__main__':

    # Initialize MTCNN for face detection on GPU
    mtcnn = MTCNN(keep_all=True, device=device)

    # Load InceptionResnetV1 model for face recognition and move it to GPU
    face_recognition_model = InceptionResnetV1(pretrained='vggface2').eval().to(device)

    ngrok_auth_token = os.getenv("NGROK_AUTH_TOKEN")
    subdomain = os.getenv("NGROK_SUBDOMAIN",None)
    deployed_on_colab = ngrok_auth_token is not None
    if deployed_on_colab:
        ngrok.set_auth_token(ngrok_auth_token)
        if subdomain:
            public_url = ngrok.connect(5000, subdomain = subdomain)
        else:
            public_url = ngrok.connect(5000)
        print("Public URL: ", public_url)
    else:
        print("localhost:5000")

    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
