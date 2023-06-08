import tensorflow as tf
import numpy as np
from PIL import Image
import requests
from io import BytesIO

model_path = "model/81.tflite"  # Ubah sesuai dengan path model Anda

interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

input_shape = input_details[0]["shape"]
output_shape = output_details[0]["shape"]

# Daftar label kelas
class_labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

def preprocess_image(image_url):
    response = requests.get(image_url)
    if response.status_code == 200:
        image = Image.open(BytesIO(response.content)).convert("RGB")
        image = image.resize((input_shape[1], input_shape[2]))
        image = np.array(image)
        image = image / 255.0
        image = np.expand_dims(image, axis=0)
        image = image.astype(np.float32)
        return image
    else:
        raise ValueError("Failed to fetch image from the provided URL.")

def postprocess_output(output):
    predicted_index = np.argmax(output)
    predicted_class = class_labels[predicted_index]
    return predicted_class

def predict(image_url):
    image = preprocess_image(image_url)

    interpreter.set_tensor(input_details[0]['index'], image)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    output = postprocess_output(output)

    return output

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python model_loader.py <image_url>")
        sys.exit(1)

    image_url = sys.argv[1]
    prediction = predict(image_url)

    print(prediction)
