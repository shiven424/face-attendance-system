from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from flask_socketio import SocketIO
from modules.firebase_utils import FirebaseDatabase
from modules.utils import process_image_and_mark_attendance, face_recognizer, register_face, clear_cache
from modules.camera_selection import video_path
from pyngrok import ngrok
from threading import Lock
import os
import logging
import time
import cv2

FILE_STORAGE_DIR = 'documents'

class Config:
    SECRET_KEY = 'supersecretkey'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'None'
    FILE_STORAGE_DIR = FILE_STORAGE_DIR
    SESSION_TYPE = 'filesystem'
    SECRET_KEY = 'your_secret_key_here'
    SESSION_PERMANENT = True
    SESSION_USE_SIGNER = True
    PERMANENT_SESSION_LIFETIME = 3600

app = Flask(__name__)
CORS(app, supports_credentials=True,origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])
app.config.from_object(Config)
app.config['PERMANENT_SESSION_LIFETIME'] = 3600
Session(app)  # Initialize session management

# Initialize Firebase Database
firebase_db = FirebaseDatabase()

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

# @app.before_request
# def log_session_data():
#     print("Session data before request:", session)

@app.route('/')
def index():
    return "Backend Server is running!"

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
        
        session['user_id'] = user['id']
        session['email'] = user['email']
        session['role'] = user['role']
        user_id = session['user_id']
        email = session['email']
        role = session['role']
        session.permanent = True
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

@app.route('/subjects/student', methods=['GET'])
def get_subjects_for_student():
    student_id = session['email']
    subjects = firebase_db.get_subjects_for_student(student_id=student_id)
    print("Fetching subjects for teacher ID:", student_id)

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

def save_image_locally(image, filename):
    try:
        image_path = os.path.join(FILE_STORAGE_DIR, filename)
        with open(image_path, 'wb') as f:
            f.write(image)
        return image_path
    except Exception as e:
        raise Exception(f"Error saving image: {e}")
    

# Route to capture face images
@app.route('/face-registration/capture', methods=['POST'])
def capture_face_image():
    app.logger.debug(f"Request files: {request.files}")
    app.logger.debug(f"Request form: {request.form}")
    if 'email' not in session:
        return jsonify({"error": "User not logged in"}), 401
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        image = request.files['image']
        subject = request.form.get('subject', 'unknown_subject')
        step = request.form.get('step', 'unknown_step')
        # Construct a unique filename based on user_id, subject, and step
        email = session['email']
        filename = f"{email}_{subject}_step{step}.jpg"
        image_path = save_image_locally(image.read(), filename)
        # Save the image to the database
        if image_path.split("_")[-1] == "step0.jpg":
            # Read image from path in bgr
            try:
                print("Processing image...")
                image = cv2.imread(image_path)
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                print("registering face now")
                if register_face(session['email'],image) is None:
                    return jsonify({"error": "Could Not register Face"}), 400
                else:
                    print("Image captured successfully")
                    return jsonify({"message": "Image captured successfully", "path": image_path}), 201
            except Exception as e:
                print(f"Error processing image: {e}")   
                return jsonify({"error": "Error processing image: " + str(e)}), 400
        else:
            print("no last part match")
            return jsonify({"message": "Image captured successfully", "path": image_path}), 201
    except Exception as e:
        print(f"Error capturing image: {e}")
        return jsonify({"error": str(e)}), 500


# 7. End Attendance Session
@app.route('/attendance/end', methods=['POST'])
def end_attendance():
    session_id = session['AttendanceSessionId']
    firebase_db.end_attendance_session(session_id=session_id)
    session.pop('AttendanceSessionId',None)
    clear_cache()
    return jsonify({"message": "Attendance session ended"}), 200

@app.route('/attendance/student', methods=['GET'])
def get_attendance_summary():
    student_id = session['user_id']
    student_email = session['email']
    print(student_id)
    if not student_id:
        return jsonify({"error": "student_id parameter is required"}), 400

    try:
        attendance_summary, subjects_enrolled = firebase_db.get_attendance_summary(student_id=student_id, student_email=student_email)
        print(attendance_summary)
        print(subjects_enrolled)
        return jsonify({"attendanceData": attendance_summary, "subjectsEnrolled": subjects_enrolled}), 200
    except Exception as e:
        print(f"Error fetching attendance data: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()  # Clear all session data
    return jsonify({"message": "Successfully logged out"}), 200

########################### SocketIO Code ############################



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
    img = face_recognizer.convert_binary_to_rgb(data)

    # Process the frame
    processed_frame_data, attendance_status = process_image_and_mark_attendance(img, firebase_db, session)
    
    # Send the processed frame and embeddings to the client
    socketio.emit('processed_frame', {'frame': processed_frame_data, 'attendance_status': attendance_status})
    
    # Increment the frame count
    with lock:
        frame_count += 1

# @socketio.on('ip_cam_frame')
# def handle_opencv_frame():
#     global frame_count
    
#     # Capture frame from OpenCV camera stream
#     ret, frame = cv2.VideoCapture(video_path).read()
    
#     if not ret:
#         print("Failed to capture frame from camera")
#         return
    
#     # Process the frame (assuming it's in BGR format, so we need to convert to RGB)
#     img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
#     # Process the frame
#     processed_frame_data, attendance_status = process_image_and_mark_attendance(img, firebase_db, session)
    
#     # Send the processed frame and attendance status to the client
#     socketio.emit('processed_frame', {'frame': processed_frame_data, 'attendance_status': attendance_status})
    
#     # Increment the frame count
#     with lock:
#         frame_count += 1



# Run the Flask app
if __name__ == '__main__':
    
    # Check whether deployed on colab
    ngrok_auth_token = os.getenv("NGROK_AUTH_TOKEN")
    subdomain = os.getenv("NGROK_SUBDOMAIN",None)
    deployed_on_colab = ngrok_auth_token is not None
    if deployed_on_colab:
        ngrok.set_auth_token(ngrok_auth_token)
        if subdomain:
            public_url = ngrok.connect(5001, subdomain = subdomain)
        else:
            public_url = ngrok.connect(5001)
        print("Public URL: ", public_url)
    else:
        print("localhost:5001")

    socketio.run(app, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)
