from pathlib import Path

import faiss
import numpy as np
from typing import List 
# Initialize FAISS index
dimension = 512  # Face encoding dimension
default_faiss_idx = Path("data/faiss/face_index.index")
default_faiss_ids = Path("data/faiss/face_ids.npy")


class Person:
    def __init__(self, id, embedding, distance):
        self.id = id
        self.embedding = embedding
        self.distance = distance


class FAISS:
    def __init__(self):
        self.index = self.load_faiss_index()
        self.ids = self.load_face_ids()

    # Function to load FAISS index
    def load_faiss_index(self, index_file = default_faiss_idx):
        # Check and create the parent directory if not present
        if not index_file.parent.exists():
            index_file.parent.mkdir(parents=True)
        if index_file.exists():
            return faiss.read_index(str(index_file))
        else:
            # Initialize a new FAISS index if it does not exist
            return faiss.IndexFlatL2(dimension)

    # Function to load face IDs
    def load_face_ids(self, ids_file = default_faiss_ids):
        if ids_file.exists():
            return np.load(ids_file).tolist()  # Load as list for easy appending
        else:
            return []  # Return empty list if file does not exist


    def update_index(self, encodings: List[np.ndarray], ids: List[int]):
        """
        Update the FAISS faiss_index with the provided encodings and IDs.
        args:
            encodings: list of face encodings
            ids: list of corresponding IDs
        """
        
        # Convert to the correct format and add to the faiss_index
        encodings = encodings[0]
        encodings = np.array(encodings).astype('float32')
        self.index.add(encodings)

        # Append new IDs to existing IDs list
        self.ids.extend(ids)

        # Save the updated faiss_index and IDs
        faiss.write_index(self.index, str(default_faiss_idx))
        np.save(str(default_faiss_ids), np.array(self.ids))
    
    def get_person_id(self, embedding: np.ndarray, number_of_results: int = 1, distance_threshold: float = 0.6) -> List[Person]:
        """
        Get the ID of the person with the given embedding in the FAISS index.
        args:
            embedding: face embedding
            number_of_results: number of results to return
            distance_threshold: distance threshold for considering a face as a match. Faces having lesser distance will
            be matched.
        returns:
            distance: distance between the embedding and the closest face in the index
            person_id: ID of the person
        """
        if embedding is None:
            return []
        person_recognized = []
        print("Embedding shape", embedding[0].shape)
        print(f"len embedding {len(embedding)} dimensions {embedding.ndim}")
        if embedding.ndim == 1:
            embedding = np.expand_dims(embedding, axis=0)
            print(f"New :: len embedding {len(embedding)} dimensions {embedding.ndim}")
        # face_encoding = np.expand_dims(embedding, axis=0)
        distances, indices = self.index.search(embedding, number_of_results)
        for distance, index in zip(distances, indices):
            print(f"Distance: {distance[0]}")
            if distance[0] > distance_threshold:
                continue
            person_id = self.ids[index[0]]
            person_recognized.append(Person(person_id, embedding, distance[0]))
            print(f"Person Recognized: {len(person_recognized)} {person_id}")
        return person_recognized



# Example usage:
# encode_and_store_faces("John Doe", 12345, ["path/to/image1.jpg", "path/to/image2.jpg"])