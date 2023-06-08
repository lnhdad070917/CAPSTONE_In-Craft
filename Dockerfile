FROM node:18.12.1

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install Python 3 and its dependencies
RUN apt-get update && apt-get install -y python3 python3-pip

# Upgrade pip for Python 3
RUN python3 -m pip install --no-cache-dir --upgrade pip

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy all files to the working directory
COPY . .

# Expose the port
EXPOSE 5000

# Start the application
CMD [ "npm", "run", "start" ]
