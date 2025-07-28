# firebase_utils_2.py
import firebase_admin
from firebase_admin import credentials, db, storage
from typing import List, Union, Optional, Dict
from datetime import datetime
import hashlib
from modules.collections_format import User, Subject, AttendanceSession, AttendanceRecord
import logging
class FirebaseDatabase:
    def __init__(self):
        self.cred = credentials.Certificate("Data/service_account.json")
        firebase_admin.initialize_app(self.cred, {
            'databaseURL': "https://face-attendance-system-b763a-default-rtdb.firebaseio.com",
            'storageBucket': "gs://face-attendance-system-c3383.appspot.com"
        })

    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    # User-related functions
    def register_user(self, name: str, email: str, password: str, role: str, subjects: Optional[List[str]] = None):
        user = User(
            name=name, email=email, 
            password=self.hash_password(password), 
            role=role, subjects=subjects or [], registeredAt=datetime.now().isoformat()
        )
        user_ref = db.reference("users").push()
        user_ref.set(user.to_dict())

    def login(self, email: str, password: str) -> Optional[dict]:
        users_ref = db.reference("users").order_by_child("email").equal_to(email).get()
        for user_id, user in users_ref.items():
            if user['password'] == self.hash_password(password):
                user['id'] = user_id
                return user
        return None

    def add_subject(self, name: str, teacher_id: str, email:str):
        print(f"Adding subject: {name} for teacher ID: {teacher_id}")
        subject = Subject(name=name, teacherId=teacher_id, teacherMail=email)
        subject_ref = db.reference("subjects").push()
        subject_ref.set(subject.to_dict())

        # Update the teacher's subjects in the users database
        teacher_ref = db.reference(f"users").order_by_child("email").equal_to(email).get()
        print(f"Retrieved teacher ref: {teacher_ref}")
        if teacher_ref:
            for user_id, user in teacher_ref.items():   
                print(f"Updating user {user_id} with subjects: {user.get('subjects', [])}")
                current_subjects = user.get('subjects', [])
                if name not in current_subjects:
                    current_subjects.append(name)
                    db.reference(f"users/{user_id}").update({'subjects': current_subjects})
                    print(f"Updated subjects for {user_id}: {current_subjects}")
                    break  # No need to keep looping since we found the teacher
        else:
            print(f"No teacher found with email {email}")

    def remove_subject(self, subject_name: str):
        subjects_ref = db.reference("subjects").order_by_child("name").equal_to(subject_name).get()
        if not subjects_ref:
            raise ValueError("Subject not found")

        for key, subject in subjects_ref.items():
            db.reference(f"subjects/{key}").delete() 
            teacher_mail = subject.get('teacherMail') 
            teacher_ref = db.reference("users").get()
            if teacher_ref:
                for user_id, user in teacher_ref.items():
                    current_subjects = user.get('subjects', [])
                    if subject_name in current_subjects:
                        current_subjects.remove(subject_name)
                        db.reference(f"users/{user_id}").update({'subjects': current_subjects})
                        print(f"Removed {subject_name} from {teacher_mail}'s subjects.")
            else:
                print(f"No teacher found with email {teacher_mail}")


    def remove_subject_from_student(self, student_email: str, subject_name: str):
        users_ref = db.reference("users").order_by_child("email").equal_to(student_email).get()

        if not users_ref:
            raise ValueError("Student not found")

        for user_id, user_data in users_ref.items():
            if 'subjects' in user_data and subject_name in user_data['subjects']:
                updated_subjects = [subject for subject in user_data['subjects'] if subject != subject_name]
                db.reference(f"users/{user_id}").update({'subjects': updated_subjects})
                print(f"Subject '{subject_name}' removed from student '{student_email}'")
            else:
                print(f"Subject '{subject_name}' not found for student '{student_email}'")

        subjects_ref = db.reference("subjects").order_by_child("name").equal_to(subject_name).get()

        if not subjects_ref:
            raise ValueError("Subject not found")

        for subject_id, subject_data in subjects_ref.items():
            if 'students' in subject_data and student_email in subject_data['students']:
                updated_students = [student for student in subject_data['students'] if student != student_email]
                db.reference(f"subjects/{subject_id}").update({'students': updated_students})
                print(f"Student '{student_email}' removed from subject '{subject_name}'")
            else:
                print(f"Student '{student_email}' not found in subject '{subject_name}'")

    def get_subjects(self) -> List[dict]:
        subjects_ref = db.reference("subjects").get()
        subjects_list = []

        for subject_id, subject_data in subjects_ref.items():
            subject_data['id'] = subject_id  # Include the subject ID in the result
            subjects_list.append(subject_data)

        return subjects_list

    def get_subjects_for_teacher(self, teacher_id:str) -> List[dict]:
        subjects_ref = db.reference("subjects").order_by_child("teacherId").equal_to(teacher_id).get()
        subjects_list = []

        for subject_id, subject_data in subjects_ref.items():
            subject_data['id'] = subject_id  # Include the subject ID in the result
            subjects_list.append(subject_data)

        return subjects_list

    def get_subjects_for_student(self, student_id:str):
        student_ref = db.reference("users").order_by_child("email").equal_to(student_id).get()
        subjects_enrolled = []
        for _, student_data in student_ref.items():
            subjects_enrolled = student_data.get('subjects', [])
        return {
        "subjectsEnrolled": subjects_enrolled
    }

    def get_teachers(self) -> List[dict]:
        users_ref = db.reference("users").order_by_child("role").equal_to("teacher").get()
        return self.parse_realtime_db_docs(users_ref)
    
    def remove_teacher(self, teacher_email: str):
        # Step 1: Find and remove all subjects taught by the teacher
        subjects_ref = db.reference("subjects").order_by_child("teacherMail").equal_to(teacher_email).get()
        
        if subjects_ref:
            subject_names = []  # List to store the names of subjects to be removed from students
            for subject_id, subject_data in subjects_ref.items():
                subject_names.append(subject_data.get('name'))
                db.reference(f"subjects/{subject_id}").delete()  # Remove each subject
                print(f"Subject '{subject_data.get('name')}' has been removed from the subjects database.")

            # Step 2: Remove the subjects from all students in the users database
            students_ref = db.reference("users").order_by_child("role").equal_to("student").get()
            for student_id, student_data in students_ref.items():
                if 'subjects' in student_data:
                    updated_subjects = [subj for subj in student_data['subjects'] if subj not in subject_names]
                    db.reference(f"users/{student_id}").update({'subjects': updated_subjects})
                    print(f"Updated subjects for student '{student_data.get('email')}' after removing teacher's subjects.")

        # Step 3: Now, remove the teacher from the users database
        users_ref = db.reference("users").order_by_child("email").equal_to(teacher_email).get()
        if not users_ref:
            raise ValueError("Teacher not found")

        for user_id in users_ref.keys():
            db.reference(f"users/{user_id}").delete()  # Remove the teacher from the database
            print(f"Teacher with email '{teacher_email}' and their subjects have been removed from the database.")

    def get_students(self) -> List[dict]:
        users_ref = db.reference("users").order_by_child("role").equal_to("student").get()
        return self.parse_realtime_db_docs(users_ref)

    def remove_student(self, student_email: str):
        users_ref = db.reference("users").order_by_child("email").equal_to(student_email).get()

        if not users_ref:
            raise ValueError("Student not found")

        for user_id in users_ref.keys():
            db.reference(f"users/{user_id}").delete()  # Remove the student from the database
            print(f"Student with email '{student_email}' has been removed from the database.")

        subjects_ref = db.reference("subjects").get()

        for subject_id, subject_data in subjects_ref.items():
            if 'students' in subject_data and student_email in subject_data['students']:
                updated_students = [student for student in subject_data['students'] if student != student_email]
                db.reference(f"subjects/{subject_id}").update({'students': updated_students})
                print(f"Student '{student_email}' removed from subject '{subject_data['name']}'")

    def enroll_student_in_subject(self, student_email: str, subject_name: str):
        student_ref = db.reference(f"users").order_by_child("email").equal_to(student_email).get()
        print(f"Retrieved student ref: {student_ref}")
        if student_ref:
            for user_id, user in student_ref.items():   
                print(f"Updating user {user_id} with subjects: {user.get('subjects', [])}")
                current_subjects = user.get('subjects', [])
                if subject_name not in current_subjects:
                    current_subjects.append(subject_name)
                    db.reference(f"users/{user_id}").update({'subjects': current_subjects})
                    print(f"Updated subjects for {user_id}: {current_subjects}")
                    break  # No need to keep looping since we found the teacher
        else:
            print(f"No teacher found with email {student_email}")

        # Fetch subject reference
        subjects_ref = db.reference("subjects").order_by_child("name").equal_to(subject_name).get()
        if not subjects_ref:
            print(f"Subject {subject_name} does not exist.")
            return False  # Subject not found

        for key, subject in subjects_ref.items():
            existing_students = subject.get('students', [])

            # Append student email if not already present
            if student_email not in existing_students:
                existing_students.append(student_email)
                db.reference(f"subjects/{key}").update({'students': existing_students})

        return True  # Enrollment successful

    # Attendance functions
    def start_attendance_session(self, subject_id: str, teacher_id: str, email: str):
        today = datetime.now().strftime('%Y-%m-%d')
        session = AttendanceSession(subjectId=subject_id, teacherId=teacher_id, teacherMail=email)
        session_ref = db.reference("attendance_sessions").push()
        session_ref.set(session.to_dict())
        return session_ref.key

    def mark_attendance(self, session_id: str, student_id: str):
        session_ref = db.reference(f"attendance_sessions/{session_id}")
        session = session_ref.get()
        if session and session.get('active'):
            record = AttendanceRecord(sessionId=session_id, studentId=student_id)
            record_ref = db.reference("attendance_records").push()
            record_ref.set(record.to_dict())

    def get_active_session_id(self,teacher_id):
        try:
            sessions_ref = db.reference("attendance_sessions").order_by_child("teacherId").equal_to(teacher_id).get()
            for key, session in sessions_ref.items():
                if session.get('active', False):
                    return key  
            return None

        except Exception as e:
            print(f"Error fetching active session ID: {e}")
            return None

    def end_attendance_session(self, session_id: str):
        session_ref = db.reference(f"attendance_sessions/{session_id}")
        session_ref.update({'active': False})

    def get_attendance_summary(self, student_id: str, student_email: str):
        # Fetch the subjects the student is enrolled in
        student_ref = db.reference("users").order_by_child("email").equal_to(student_email).get()
        subjects_enrolled = []
        
        for _, student_data in student_ref.items():
            subjects_enrolled = student_data.get('subjects', [])

        # Initialize a dictionary to store attendance summary
        attendance_summary = {}

        for subject in subjects_enrolled:
            # Get the total number of classes for the subject
            sessions_ref = db.reference("attendance_sessions").order_by_child('subjectId').equal_to(subject).get()
            session_ids = [session_key for session_key in sessions_ref.keys()]
            total_classes = len(session_ids)

            # Get the number of classes the student has attended for the subject
            attendance_records = db.reference("attendance_records").order_by_child('studentId').equal_to(student_id).get()
            attended_classes = sum(1 for record in attendance_records.values() if record['sessionId'] in session_ids)

            # Calculate the attendance percentage
            attendance_percentage = (attended_classes / total_classes) * 100 if total_classes > 0 else 0

            # Store detailed information in the attendance summary
            attendance_summary[subject] = {
                'attendancePercentage': attendance_percentage,
                'totalClasses': total_classes,
                'attendedClasses': attended_classes,
            }

        return attendance_summary, subjects_enrolled

    def mark_attendance_by_email(self, student_email: str, teacher_id: str)-> Dict[bool, str]:
        """
        Mark attendance for a student by email
        :param student_email: The email of the student
        :param teacher_id: The ID of the teacher
        :return: A dictionary containing the status and message
        """
        # Fetch the student ID using the email
        print("Checking on Firebase")
        if not student_email:
            print("No student email provided")
            return {"status":False, "message":"Email Not Found", "name":"Unknown"}
        students_ref = db.reference("users").order_by_child("email").equal_to(student_email).get()
        student_id = None
        student_name = "Unknown"
        if students_ref:
            for user_id, user_data in students_ref.items():
                student_id = user_id  # Get the student ID
                student_subjects = user_data.get('subjects', [])  # Get the student's subjects
                student_name = user_data.get('name', '')
                print(f"Student found with email '{student_email}' and ID '{student_id}'")
                break  # No need to continue since we found the student

        else:
            print(f"No student found with email '{student_email}'")
            return {"status":False, "message":"Email Not Found", "name":student_name}

        if not student_subjects:
            print(f"No subjects found for student '{student_email}'")
            return {"status":False, "message":"Subject Not Found", "name":student_name}

        # Check each subject for an active attendance session
        for subject_name in student_subjects:
            # Fetch the active session for the subject
            active_session_id = self.get_active_session_id(teacher_id)
            
            if active_session_id:
                # Mark the attendance for the found student in the active session
                if self.mark_attendance(active_session_id, student_id):
                    print(f"Attendance marked for student '{student_email}' in subject '{subject_name}' with session '{active_session_id}'")
                    return {"status":True, "message":"Marked", "name":student_name}  # Attendance marked successfully
                else :
                    print(f"Attendance already marked for student '{student_email}' in subject '{subject_name}' with session '{active_session_id}'")
                    return {"status":True, "message":"Already Marked", "name":student_name}

        print("No active attendance session found for any of the student's subjects.")
        return {"status":False, "message":"No Active Session", "name":student_name}

    def parse_realtime_db_docs(self, docs):
        return [{"id": key, **value} for key, value in docs.items()]
