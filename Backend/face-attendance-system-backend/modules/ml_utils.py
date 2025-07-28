from PIL import Image
from facenet_pytorch import InceptionResnetV1, MTCNN
from io import BytesIO

import cv2
import numpy as np
import torch



class FaceRecognition:
    def __init__(self):
        self.device = None
        self.check_gpu()
        self.mtcnn = MTCNN(keep_all=True, device=self.device)
        self.face_recognition_model = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)

    def check_gpu(self):
        if torch.cuda.is_available():
            self.device = torch.device('cuda')
            print(f"Using device: {self.device}")
        else:
            self.device = torch.device('cpu')
            print("CUDA is not available, using CPU.")


    def detect_face_locations_mtcnn(self, image):
        """ Detects faces in an image using MTCNN
        Arguments:
            image: PIL.Image
        Returns:
            boxes: list of bounding boxes of detected faces
        """
        img = np.array(image)
        boxes, _ = self.mtcnn.detect(img)
        return boxes

    def convert_binary_to_rgb(self, data):
        img = Image.open(BytesIO(data))
        img = np.array(img)
        # Convert the image from BGR to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        return img
    
    def convert_rgb_to_binary(self, img):
        _, buffer = cv2.imencode('.jpg', img)
        return buffer.tobytes()
    
    def get_embeddings(self, img, boxes):
        embeddings = []
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
                    .to(self.device)
                )

                # Get the embedding using the FaceNet model
                with torch.no_grad():
                    embedding = self.face_recognition_model(face_tensor).cpu().numpy()
                embeddings.append(embedding)

        return embeddings


    def get_face_location_and_embeddings(self, img):
        boxes = self.detect_face_locations_mtcnn(img)
        embeddings = self.get_embeddings(img, boxes)
        return boxes, embeddings
    
    def get_largest_face_location_and_embedding(self, boxes, embeddings):
        if boxes is not None and len(boxes) > 0 and embeddings is not None:
            # Find the index of the largest box
            largest_box_index = np.argmax((boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1]))

            # Get the largest box and its embedding
            largest_box = boxes[largest_box_index]
            largest_box_embedding = embeddings[largest_box_index]

            return largest_box, largest_box_embedding
        print("Boxes or embeddings are None")
        return None, None
    
    def draw_bounding_boxes(self, img, boxes, color = (0, 255, 0), thickness = 2):
        if boxes is None:
            print(f"Boxes are none")
        for (x1, y1, x2, y2) in boxes:
            cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)
        return img
    
    
        