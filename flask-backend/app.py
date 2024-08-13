import os
import numpy as np
from tensorflow.keras.models import model_from_json, load_model
from tensorflow.keras.initializers import Orthogonal
from tensorflow.keras.losses import MeanSquaredError
from flask import Flask, request, render_template, jsonify
from PIL import Image, ImageOps
import h5py
from werkzeug.utils import secure_filename
import tensorflow as tf
from tensorflow.keras.utils import get_custom_objects
import re
import matplotlib.pyplot as plt
import io
from scipy.signal import savgol_filter
import base64
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Setup logging
logging.basicConfig(level=logging.DEBUG)

print(tf.__version__)

def register_custom_objects():
    class CustomFunctional(tf.keras.Model):
        pass

    get_custom_objects().update({"Functional": CustomFunctional})

def custom_load_model(model_path, custom_objects=None):
    register_custom_objects()

    with h5py.File(model_path, 'r') as f:
        model_config = f.attrs.get('model_config')
        if model_config is None:
            raise ValueError('No model found in config.')

        model_config = model_config.decode('utf-8') if isinstance(model_config, bytes) else model_config
        
        # Remove the unsupported arguments from the model configuration
        model_config = re.sub(r'\"time_major\":\s?false,?\s?', '', model_config)
        model_config = re.sub(r'\"implementation\":\s?2,?\s?', '', model_config)

        model = model_from_json(model_config, custom_objects=custom_objects)

        for layer in model.layers:
            if hasattr(layer, 'cell') and hasattr(layer.cell, 'config'):
                layer.cell.config.pop('time_major', None)
                layer.cell.config.pop('implementation', None)

        model.load_weights(model_path)
    return model

# Load autoencoder model
autoencoder_path = r'C:\Users\Abdul Wahab\Downloads\Janeddition_solarmodelnw.hdf5'
custom_objects = {'Orthogonal': Orthogonal}

try:
    autoencoder = custom_load_model(autoencoder_path, custom_objects=custom_objects)
except RuntimeError as e:
    print(e)
    autoencoder = None

# Load the model with custom objects
model_trans_path = 'C:/Users/Abdul Wahab/Downloads/24march_amplitude_forwardmodel_2.hdf5'
model_trans_custom_objects = {'mse': MeanSquaredError()}

try:
    model_trans = load_model(model_trans_path, custom_objects=model_trans_custom_objects)
except RuntimeError as e:
    print(e)
    model_trans = None

def process_image(image):
    try:
        image = ImageOps.grayscale(image)
        is_binary = np.all(np.isin(np.array(image), [0, 255]))
        image = image.convert('RGB')
        image = image.resize((100, 100))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        return image_array, bool(is_binary)  
    except Exception as e:
        raise RuntimeError(f"Error processing image: {e}")

def create_graph(prediction):
    # Apply Savitzky-Golay filter for smoothing
    smoothed_prediction = savgol_filter(prediction, window_length=51, polyorder=3)

    fig, ax = plt.subplots()
    ax.plot(smoothed_prediction)
    ax.set(xlabel='Wavelength', ylabel='Absorbtion', title='Prediction Result')
    ax.grid()
    
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close(fig)
    return img

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        image = Image.open(file_path)
        processed_image, is_binary = process_image(image)

        prediction = autoencoder.predict(processed_image)
        prediction = prediction.reshape(1000)

        img = create_graph(prediction)

        buffered = io.BytesIO()
        Image.open(img).save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return jsonify({"img_data": img_str, "is_binary": bool(is_binary)})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        height = float(data['height'])
        length = float(data['length'])
        width = float(data['width'])
        period = float(data['period'])
        n = float(data['n'])
        k = float(data['k'])
        lamda = float(data['lambda'])

        input_data = np.array([[height, length, width, period, n, k, lamda]])
        prediction = model_trans.predict(input_data).flatten()

        # Create a line plot for the prediction
        plt.figure()
        plt.plot(prediction, color='blue')
        plt.xlabel('Index')
        plt.ylabel('Value')
        plt.title('Transmission Model Prediction')
        plt.yticks([0.1, 0.15, 0.2, 0.25, 0.3])
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plot_url = base64.b64encode(img.getvalue()).decode('utf8')

        return jsonify({
            'plot_url': plot_url
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 400

    
if __name__ == '__main__':
    app.run(debug=True)

