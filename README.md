# CAPSTONE_In-Craft

Humankind has gained a great deal of flexibility because of inorganic waste. On the other hand, inorganic waste has created new difficulties for waste management. Inorganic waste can take hundreds of years to decompose, creating unsightly and potentially hazardous accumulations in the environment. The products made using inorganic items have improved daily life's comfort and ease. However, inorganic wastes do not break down over time and have a longer-lasting impact on both people and the environment as a whole. Additionally, inorganic waste pollution can result in the release of toxic chemicals into the soil and water, which can harm plant and animal life. Usually, most people throw away inorganic items without thinking that it can be made into something more useful. With our app, we hope we can address the problem of reducing the amount of unused inorganic waste. Here, the users can easily recycle their trash into a great and creative hand craft and get the tutorial of it. The tutorials are displayed in the form of text, images, and even videos that make it easy for users to create them. Users can access our app via mobile devices. Then, users have to login with their account and scan the trash. The app will display the classification of the inorganic wastes (such as bottle, straw, styrofoam, etc.) and then the users have the options of several crafts along with its tutorial that they can make with the trash they scanned.

___
## Installation

1. Clone this repository to your local machine: 
```
https://github.com/lnhdad070917/CAPSTONE_In-Craft.git
```
2. Install the dependencies by running the following command:
```
npm install
```
3. Make sure you have Node.js and npm installed on your computer.
4. Obtain the service account key from Firebase and save it as '**serviceAccountKey.json**' in the root directory of the application.
6. Make sure you have Python and pip installed on your computer.
7. Install the Python dependencies by running the following command:
```
pip install -r requirements.txt
```

___
## Usage

1. Run the application with the following command:
```
node server.js
``` 
The application will run on http://localhost:5000.

2. Upload an image using the '**/upload**' endpoint with the '**POST**' method. You can use Postman or similar applications to send the request. Make sure you include the image as a file using the '**image**' key in form-data.

3. The application will upload the image to Firebase Storage, compress the image, and perform prediction using the Python model.

4. You can access the prediction results and image data through the '**/upload**' endpoint with the '**POST**' method. The prediction result will be sent in the response.

5. You can also use other endpoints such as '**/jenis**' to get data from the "Jenis" collection in Firestore, or '**/jenis/:id**' to get specific jenis data based on the ID.

___
## Deployment

1. Build your Docker image locally: Ensure that you have Docker installed on your local machine. In the directory where your Dockerfile is located, open a terminal or command prompt and run the following command to build the Docker image:
```
docker build -t <image-name> .
``` 
Replace <image-name> with a suitable name for your Docker image.
  
2. Tag the Docker image: Before pushing the Docker image to a container registry on GCP, you need to tag it with the registry's URL. GCP provides a container registry called Google Container Registry (GCR). Tag your image using the following command:
```
docker tag <image-name> gcr.io/<project-id>/<image-name>
``` 
Replace <project-id> with your GCP project ID, and <image-name> with the same name you used in step 1.
  
3. Push the Docker image to GCR: To push the Docker image to GCR, run the following command:
```
docker push gcr.io/<project-id>/<image-name>
```
This command will upload your Docker image to the container registry associated with your GCP project.

4. Deploy the Docker container: Once your Docker image is in the GCR, you can deploy it to GCP. There are multiple options available depending on your use case. Here, we'll use Cloud Run to deploy the container to your cluster. Run the following command to deploy the container:
```
gcloud run deploy --image gcr.io/<project-id>/<image-name> --platform managed
```
