from PIL import Image
from modules.faiss_utils import FAISS
from modules.firebase_utils import FirebaseDatabase
from modules.ml_utils import FaceRecognition
from typing import Tuple

import logging
import time
from collections import OrderedDict

# Initialize the cache and flush time
local_cache = OrderedDict()
last_flushed = time.time()

faiss = FAISS()
face_recognizer = FaceRecognition()

def process_image_and_mark_attendance(img:Image , firebase_db:FirebaseDatabase, session)->Tuple[bytes, dict]:
    """
    Processes the image and marks the attendance
    Arguments:
        img: PIL.Image
        firebase_db: FirebaseDB
        session: dict
    Returns:
        processed_frame_data: bytes
        attendance_status: dict
    """
    
    boxes, embeddings = face_recognizer.get_face_location_and_embeddings(img)

    # Get largest face location and embedding
    largest_box, largest_embedding = face_recognizer.get_largest_face_location_and_embedding(boxes, embeddings)
    
    # Get perosn id (email) from faiss index
    person_recognized = faiss.get_person_id(largest_embedding, 1, 0.8)
    
    # Select highest confidence person
    person = person_recognized[0] if person_recognized else None
    person_email = person.id if person else ""

    response = check_in_local_cache(person_email)
    
    # Mark Attendance
    if not response:
        response = firebase_db.mark_attendance_by_email(student_email=person_email, teacher_id=session['user_id'])
    if response['status'] == True:
        # Green box
        img = face_recognizer.draw_bounding_boxes(img, [largest_box],(0, 255, 0), 4)
        attendance_status = {response['name']: response['message']}
        update_local_cache(person_email, response['name'])
    elif response['status'] == False and largest_box is not None:
        # Red box
        img = face_recognizer.draw_bounding_boxes(img, [largest_box],(0, 0, 255), 4)
        attendance_status = {"Person": "Unknown"}
    else:
        attendance_status = {"Person": "Unknown"}
    
    # Convert the processed image to bytes
    processed_frame_data = face_recognizer.convert_rgb_to_binary(img)

    return processed_frame_data, attendance_status


def check_in_local_cache(person_email: str) -> dict:
    """
    Checks if the person is in the local cache.
    Arguments:
        person_email: str
    Returns:
        response: dict
    """
    global last_flushed
    print(f"Checking in local cache: {person_email}")
    # Check if the current time exceeds the flush duration
    if time.time() - last_flushed > 60 * 10:
        local_cache.clear()  # Clear the cache
        last_flushed = time.time()  # Update last flushed time


    # Check if the person_email is already in the cache
    if person_email in local_cache:
        print(f"Found in local cache name: {local_cache[person_email]}")
        return {"status": True, "message": "Marked", "name": local_cache[person_email]}

    print("Not found in local cache return None")
    return None  # Not marked yet

def update_local_cache(person_email: str, student_name: str) -> None:
    """
    Updates the local cache.
    Arguments:
        person_email: str
        student_name: str
    Returns:
        None
    """
    global last_flushed
    
    # Update the cache with the new email and student name
    local_cache[person_email] = student_name
    print(f"Added to local cache name: {student_name}")

    # Maintain only the last 10 unique entries
    if len(local_cache) > 10:
        local_cache.popitem(last=False)  # Remove the oldest entry

def clear_cache():
    """
    Clears the local cache.
    Arguments:
        None
    Returns:
        None
    """
    global local_cache
    local_cache.clear()

def register_face(user_id, image: Image,):
    print("registering face now")
    boxes, embeddings = face_recognizer.get_face_location_and_embeddings(image)
    # Get largest face location and embedding
    largest_box, largest_embedding = face_recognizer.get_largest_face_location_and_embedding(boxes, embeddings)
    if largest_embedding is None:
        print("largest_embedding is None")
        return None
    # Save the updated index and IDs
    faiss.update_index([largest_embedding], [user_id])
    return True