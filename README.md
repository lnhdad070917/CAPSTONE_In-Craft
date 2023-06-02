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

